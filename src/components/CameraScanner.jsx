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

  const [status, setStatus]           = useState('requesting') // requesting | loading | ready | error
  const [detectedItems, setDetectedItems] = useState(new Set())
  const [predictions, setPredictions] = useState([])
  const [facingMode, setFacingMode]   = useState('environment') // back camera by default

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

    // Draw bounding boxes
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    preds.forEach(pred => {
      const [x, y, w, h] = pred.bbox
      const mapped = COCO_FOOD_MAP[pred.class]
      const color  = boxColor(mapped || pred.class)
      const label  = mapped || pred.class
      const score  = Math.round(pred.score * 100)

      // Box
      ctx.strokeStyle = color
      ctx.lineWidth   = 3
      ctx.strokeRect(x, y, w, h)

      // Label background
      const text = `${label} ${score}%`
      ctx.font = 'bold 14px Inter, sans-serif'
      const tw = ctx.measureText(text).width
      ctx.fillStyle = color
      ctx.fillRect(x, y - 24, tw + 12, 24)

      // Label text
      ctx.fillStyle = 'white'
      ctx.fillText(text, x + 6, y - 7)

      // Add food items we actually care about
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
    if (status === 'ready') {
      rafRef.current = requestAnimationFrame(detect)
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [status, detect])

  // Flip camera
  const flipCamera = async () => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    cancelAnimationFrame(rafRef.current)
    await startCamera(next)
    if (status === 'ready') rafRef.current = requestAnimationFrame(detect)
  }

  // Take snapshot — freeze current detected items and add to list
  const addToList = () => {
    if (detectedItems.size === 0) return
    onAddItems([...detectedItems])
    onClose()
  }

  // All unique detected food labels for display
  const foodPreds = predictions.filter(p => COCO_FOOD_MAP[p.class] && p.score > 0.4)

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
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Error state */}
        {status === 'error' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center text-white p-6">
              <div className="text-5xl mb-3">📵</div>
              <p className="font-bold text-lg mb-1">Camera access denied</p>
              <p className="text-white/60 text-sm">Allow camera access in your browser settings and try again.</p>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {status === 'loading' && (
          <div className="absolute bottom-4 left-4 right-4 bg-black/70 rounded-xl p-4 text-white text-sm text-center">
            <div className="w-6 h-6 border-2 border-turmeric-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading food recognition model... (~5 seconds first time)
          </div>
        )}

        {/* Live detections overlay */}
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

        {/* Scan guide */}
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

          {/* Main action */}
          <button
            onClick={addToList}
            disabled={detectedItems.size === 0}
            className="flex-1 bg-gradient-to-r from-sage-400 to-sage-500 text-white font-bold py-3 rounded-xl hover:from-sage-500 hover:to-sage-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {detectedItems.size === 0
              ? 'Scan something first'
              : `✅ Add ${detectedItems.size} item${detectedItems.size > 1 ? 's' : ''} to my list`}
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
