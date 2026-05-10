import { useState, useEffect, useRef, useCallback } from 'react'
import { ALL_APPROVED_FLAT, INFLAMMATORY } from '../data/foods.js'

// COCO-SSD detectable food items mapped to our ingredient names
const COCO_FOOD_MAP = {
  banana:    'banana',
  apple:     'apples',
  orange:    'oranges',
  broccoli:  'broccoli',
  carrot:    'carrots',
  sandwich:  'whole grain bread',
  'hot dog': 'processed meat',
  pizza:     null,
  cake:      null,
  donut:     null,
  bowl:      null,
  bottle:    null,
  cup:       null,
}

const normalize = (s) => s.toLowerCase().replace(/[^a-z\s]/g, '').trim()

function isApproved(name) {
  return ALL_APPROVED_FLAT.some(f => normalize(f).includes(normalize(name)) || normalize(name).includes(normalize(f)))
}

function isInflammatory(name) {
  return INFLAMMATORY.some(f => normalize(f).includes(normalize(name)) || normalize(name).includes(normalize(f)))
}

function boxColor(foodName) {
  if (!foodName) return '#94a3b8'
  if (isApproved(foodName))      return '#7c9a6e'
  if (isInflammatory(foodName))  return '#e8836a'
  return '#d4a843'
}

export default function CameraScanner({ onAddItems, onClose }) {
  const videoRef   = useRef(null)
  const canvasRef  = useRef(null)
  const streamRef  = useRef(null)
  const rafRef     = useRef(null)
  const modelRef   = useRef(null)

  const [status, setStatus]               = useState('requesting')
  const [detectedItems, setDetectedItems] = useState(new Set())
  const [predictions, setPredictions]     = useState([])
  const [facingMode, setFacingMode]       = useState('environment')
  const [scanning, setScanning]           = useState(true)   // true = live, false = review
  const [editText, setEditText]           = useState('')      // editable list after stop

  // Load TF + model lazily
  const loadModel = useCallback(async () => {
    setStatus('loading')
    try {
      await import('@tensorflow/tfjs')
      const cocoSsd = await import('@tensorflow-models/coco-ssd')
      modelRef.current = await cocoSsd.load()
      setStatus('ready')
    } catch (err) {
      console.error('Model load error:', err)
      setStatus('error')
    }
  }, [])

  // Start camera
  const startCamera = useCallback(async (mode) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (err) {
      console.error('Camera error:', err)
      setStatus('error')
    }
  }, [])

  // Detection loop
  const detect = useCallback(async () => {
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !modelRef.current || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(detect)
      return
    }

    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight

    const preds = await modelRef.current.detect(video)
    setPredictions(preds)

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    preds.forEach(pred => {
      const [x, y, w, h] = pred.bbox
      const mapped = COCO_FOOD_MAP[pred.class]
      const color  = boxColor(mapped || pred.class)
      const label  = mapped || pred.class
      const score  = Math.round(pred.score * 100)

      ctx.strokeStyle = color
      ctx.lineWidth   = 3
      ctx.strokeRect(x, y, w, h)

      const text = `${label} ${score}%`
      ctx.font = 'bold 14px Inter, sans-serif'
      const tw = ctx.measureText(text).width
      ctx.fillStyle = color
      ctx.fillRect(x, y - 24, tw + 12, 24)
      ctx.fillStyle = 'white'
      ctx.fillText(text, x + 6, y - 7)

      if (COCO_FOOD_MAP[pred.class] && pred.score > 0.5) {
        const foodName = COCO_FOOD_MAP[pred.class]
        if (foodName) setDetectedItems(prev => new Set([...prev, foodName]))
      }
    })

    rafRef.current = requestAnimationFrame(detect)
  }, [])

  // Init
  useEffect(() => {
    const init = async () => {
      await startCamera(facingMode)
      await loadModel()
    }
    init()
    return () => {
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  // Start detection loop once model is ready
  useEffect(() => {
    if (status === 'ready' && scanning) {
      rafRef.current = requestAnimationFrame(detect)
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [status, detect, scanning])

  // Flip camera
  const flipCamera = async () => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    cancelAnimationFrame(rafRef.current)
    await startCamera(next)
    if (status === 'ready') rafRef.current = requestAnimationFrame(detect)
  }

  // Stop scanning — freeze camera, enter review mode
  const stopScanning = () => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    setScanning(false)
    // Pre-populate editable text with detected items
    setEditText([...detectedItems].join('\n'))
  }

  // Confirm edited list and add to grocery input
  const confirmList = () => {
    const items = editText.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
    if (items.length === 0) return
    onAddItems(items)
    onClose()
  }

  const foodPreds = predictions.filter(p => COCO_FOOD_MAP[p.class] && p.score > 0.4)

  // ── Review screen (after Stop Scanning) ─────────────────────────────────────
  if (!scanning) {
    const lines = editText.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 fade-in">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg slide-up">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
            <div>
              <h2 className="font-black text-stone-800 text-lg">Review Scanned Groceries</h2>
              <p className="text-stone-400 text-sm mt-0.5">Edit, add, or remove items before saving</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 font-bold transition-colors">
              ✕
            </button>
          </div>

          <div className="px-6 py-5">
            {/* Detected count */}
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-sage-100 text-sage-700 text-xs font-bold px-2.5 py-1 rounded-full">
                {lines.length} item{lines.length !== 1 ? 's' : ''} detected
              </span>
              {lines.length === 0 && (
                <span className="text-stone-400 text-xs">Nothing detected — type items manually below</span>
              )}
            </div>

            {/* Editable textarea */}
            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              placeholder="Type groceries here, one per line or comma-separated..."
              className="w-full h-52 rounded-2xl border border-stone-200 p-4 text-stone-700 placeholder-stone-300 resize-none focus:outline-none focus:ring-2 focus:ring-sage-300 text-sm leading-relaxed"
              autoFocus
            />
            <p className="text-xs text-stone-400 mt-2">
              One item per line, or comma-separated. You can type anything — items will be classified automatically.
            </p>

            {/* Preview chips */}
            {lines.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {lines.map((item, i) => (
                  <span
                    key={i}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                      isApproved(item)
                        ? 'bg-sage-100 text-sage-700 border border-sage-200'
                        : isInflammatory(item)
                        ? 'bg-coral-100 text-coral-700 border border-coral-200'
                        : 'bg-stone-100 text-stone-500 border border-stone-200'
                    }`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={() => { setScanning(true); setDetectedItems(new Set()); setPredictions([]) }}
              className="flex-1 border border-stone-200 text-stone-600 font-semibold py-3 rounded-xl hover:bg-stone-50 transition-colors text-sm"
            >
              📷 Scan Again
            </button>
            <button
              onClick={confirmList}
              disabled={lines.length === 0}
              className="flex-1 bg-gradient-to-r from-sage-400 to-sage-500 text-white font-bold py-3 rounded-xl hover:from-sage-500 hover:to-sage-600 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              ✅ Add to My List
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Live scanning screen ─────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col fade-in" onClick={e => e.target === e.currentTarget && onClose()}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-lg">📷 Fridge Scanner</span>
          {status === 'loading' && (
            <span className="flex items-center gap-1.5 text-turmeric-300 text-sm">
              <div className="w-4 h-4 border-2 border-turmeric-300 border-t-transparent rounded-full animate-spin" />
              Loading AI model...
            </span>
          )}
          {status === 'ready' && (
            <span className="text-sage-400 text-sm font-medium">● Live detection</span>
          )}
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors font-bold">
          ✕
        </button>
      </div>

      {/* Camera + canvas */}
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover" />

        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white p-6">
              <div className="text-5xl mb-3">📵</div>
              <p className="font-bold text-lg mb-1">Camera access denied</p>
              <p className="text-white/60 text-sm">Allow camera access in your browser settings and try again.</p>
            </div>
          </div>
        )}

        {status === 'loading' && (
          <div className="absolute bottom-4 left-4 right-4 bg-black/70 rounded-xl p-4 text-white text-sm text-center">
            <div className="w-6 h-6 border-2 border-turmeric-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading food recognition model... (~5 seconds first time)
          </div>
        )}

        {status === 'ready' && foodPreds.length > 0 && (
          <div className="absolute top-4 right-4 bg-black/70 backdrop-blur rounded-xl p-3 max-w-48">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-2">Detected</p>
            {foodPreds.map((p, i) => {
              const name = COCO_FOOD_MAP[p.class] || p.class
              const approved = isApproved(name)
              return (
                <div key={i} className="flex items-center gap-2 text-sm text-white mb-1">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${approved ? 'bg-sage-400' : 'bg-coral-400'}`} />
                  <span className="capitalize">{name}</span>
                  <span className="text-white/40 text-xs ml-auto">{Math.round(p.score * 100)}%</span>
                </div>
              )
            })}
          </div>
        )}

        {status === 'ready' && foodPreds.length === 0 && (
          <div className="absolute inset-0 flex items-end justify-center pb-32 pointer-events-none">
            <div className="bg-black/60 backdrop-blur rounded-xl px-5 py-3 text-white text-sm text-center">
              📦 Point the camera at your groceries or fridge
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="bg-black/90 px-4 py-4 space-y-3">
        {/* Detected items summary */}
        {detectedItems.size > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center">
            {[...detectedItems].map((item, i) => (
              <span key={i} className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${isApproved(item) ? 'bg-sage-400/20 text-sage-300 border border-sage-400/40' : 'bg-coral-400/20 text-coral-300 border border-coral-400/40'}`}>
                {item}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Flip camera */}
          <button onClick={flipCamera} className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors text-xl">
            🔄
          </button>

          {/* Stop scanning button */}
          <button
            onClick={stopScanning}
            disabled={status !== 'ready'}
            className="flex-1 bg-gradient-to-r from-turmeric-400 to-coral-400 text-white font-bold py-3 rounded-xl hover:from-turmeric-500 hover:to-coral-500 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ⏹ Stop & Review List
          </button>

          {/* Clear */}
          {detectedItems.size > 0 && (
            <button onClick={() => setDetectedItems(new Set())} className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors text-lg">
              🗑
            </button>
          )}
        </div>

        <p className="text-white/30 text-xs text-center">
          Uses on-device AI · nothing leaves your phone · powered by TensorFlow.js
        </p>
      </div>
    </div>
  )
}
