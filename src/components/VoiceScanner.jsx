import { useState, useEffect, useRef } from 'react'
import { ALL_APPROVED_FLAT, INFLAMMATORY } from '../data/foods.js'
import { useLanguage } from '../context/LanguageContext.jsx'

const normalize = (s) => s.toLowerCase().replace(/[^a-z\s]/g, '').trim()

function classify(name) {
  const n = normalize(name)
  if (ALL_APPROVED_FLAT.some(f => n.includes(normalize(f)) || normalize(f).includes(n))) return 'approved'
  if (INFLAMMATORY.some(f => n.includes(normalize(f)) || normalize(f).includes(n))) return 'inflammatory'
  return 'unknown'
}

// Split a spoken sentence into individual food items
function parseSpokenItems(text) {
  return text
    .toLowerCase()
    .replace(/\b(i have|i've got|we have|also|plus|and then|and|,|\.)\b/g, ',')
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 1)
}

const SUPPORTED = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

export default function VoiceScanner({ onAddItems, onClose }) {
  const { t } = useLanguage()
  const recognitionRef = useRef(null)

  const [phase, setPhase]             = useState('listening') // listening | review
  const [interim, setInterim]         = useState('')          // live partial transcript
  const [finalText, setFinalText]     = useState('')          // accumulated final transcript
  const [editText, setEditText]       = useState('')          // editable list in review
  const [listening, setListening]     = useState(false)
  const [error, setError]             = useState(null)

  // Build recognised items from accumulated final text
  const recognisedItems = parseSpokenItems(finalText)

  useEffect(() => {
    if (!SUPPORTED) { setError('not-supported'); return }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.continuous      = true
    rec.interimResults  = true
    rec.lang            = 'en-US'
    recognitionRef.current = rec

    rec.onstart  = () => setListening(true)
    rec.onend    = () => setListening(false)
    rec.onerror  = (e) => {
      if (e.error === 'not-allowed') setError('permission')
      else if (e.error !== 'no-speech') setError('error')
    }

    rec.onresult = (e) => {
      let interimBuf = ''
      let finalBuf   = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) finalBuf += ' ' + t
        else interimBuf += t
      }
      if (finalBuf) setFinalText(prev => prev + finalBuf)
      setInterim(interimBuf)
    }

    rec.start()

    return () => { try { rec.stop() } catch {} }
  }, [])

  const toggleMic = () => {
    const rec = recognitionRef.current
    if (!rec) return
    if (listening) {
      rec.stop()
    } else {
      setError(null)
      rec.start()
    }
  }

  const stopAndReview = () => {
    try { recognitionRef.current?.stop() } catch {}
    const all = parseSpokenItems(finalText + ' ' + interim)
    setEditText(all.join('\n'))
    setPhase('review')
  }

  const confirmList = () => {
    const items = editText.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
    if (!items.length) return
    onAddItems(items)
    onClose()
  }

  const restart = () => {
    setFinalText('')
    setInterim('')
    setEditText('')
    setPhase('listening')
    setError(null)
    try {
      recognitionRef.current?.start()
    } catch {}
  }

  // ── Review screen ────────────────────────────────────────────────────────────
  if (phase === 'review') {
    const lines = editText.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 fade-in">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg slide-up">
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
            <div>
              <h2 className="font-black text-stone-800 text-lg">{t('voice.reviewTitle')}</h2>
              <p className="text-stone-400 text-sm mt-0.5">{t('voice.reviewSub')}</p>
            </div>
            <button onClick={onClose} className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-500 font-bold transition-colors">✕</button>
          </div>

          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-sage-100 text-sage-700 text-xs font-bold px-2.5 py-1 rounded-full">
                {lines.length} {lines.length !== 1 ? t('voice.itemsRecognised') : t('voice.itemRecognised')}
              </span>
              {lines.length === 0 && (
                <span className="text-stone-400 text-xs">{t('voice.nothingHeard')}</span>
              )}
            </div>

            <textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              placeholder={t('voice.textareaPlaceholder')}
              className="w-full h-52 rounded-2xl border border-stone-200 p-4 text-stone-700 placeholder-stone-300 resize-none focus:outline-none focus:ring-2 focus:ring-sage-300 text-sm leading-relaxed"
              autoFocus
            />
            <p className="text-xs text-stone-400 mt-2">{t('voice.textareaHint')}</p>

            {lines.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {lines.map((item, i) => {
                  const c = classify(item)
                  return (
                    <span key={i} className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                      c === 'approved'     ? 'bg-sage-100 text-sage-700 border border-sage-200' :
                      c === 'inflammatory' ? 'bg-coral-100 text-coral-700 border border-coral-200' :
                                            'bg-stone-100 text-stone-500 border border-stone-200'
                    }`}>
                      {item}
                    </span>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={restart}
              className="flex-1 border border-stone-200 text-stone-600 font-semibold py-3 rounded-xl hover:bg-stone-50 transition-colors text-sm"
            >
              {t('voice.speakAgain')}
            </button>
            <button
              onClick={confirmList}
              disabled={lines.length === 0}
              className="flex-1 bg-gradient-to-r from-sage-400 to-sage-500 text-white font-bold py-3 rounded-xl hover:from-sage-500 hover:to-sage-600 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {t('voice.addToList')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Listening screen ─────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 fade-in">
      {/* Close */}
      <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold">✕</button>

      {/* Not supported */}
      {error === 'not-supported' && (
        <div className="text-center text-white">
          <div className="text-5xl mb-4">🎙️</div>
          <p className="font-bold text-lg mb-2">{t('voice.notSupported')}</p>
          <p className="text-white/60 text-sm max-w-xs">{t('voice.notSupportedSub')}</p>
          <button onClick={onClose} className="mt-6 bg-white/10 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors">{t('voice.close')}</button>
        </div>
      )}

      {/* Permission denied */}
      {error === 'permission' && (
        <div className="text-center text-white">
          <div className="text-5xl mb-4">🔇</div>
          <p className="font-bold text-lg mb-2">{t('voice.permissionDenied')}</p>
          <p className="text-white/60 text-sm max-w-xs">{t('voice.permissionSub')}</p>
          <button onClick={onClose} className="mt-6 bg-white/10 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors">{t('voice.close')}</button>
        </div>
      )}

      {/* Listening UI */}
      {!error && (
        <>
          {/* Animated mic */}
          <div className="relative mb-8">
            {listening && (
              <>
                <div className="absolute inset-0 rounded-full bg-sage-400/30 animate-ping" />
                <div className="absolute inset-0 scale-110 rounded-full bg-sage-400/20 animate-ping" style={{ animationDelay: '0.3s' }} />
              </>
            )}
            <button
              onClick={toggleMic}
              className={`relative w-24 h-24 rounded-full flex items-center justify-center text-4xl transition-all shadow-lg ${
                listening
                  ? 'bg-sage-500 hover:bg-sage-600 scale-110'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {listening ? '🎙️' : '🎤'}
            </button>
          </div>

          <p className="text-white font-bold text-xl mb-1">
            {listening ? t('voice.listening') : t('voice.tapToStart')}
          </p>
          <p className="text-white/50 text-sm mb-8 text-center max-w-xs">
            {t('voice.instruction')}
          </p>

          {/* Live transcript */}
          <div className="w-full max-w-md bg-white/10 rounded-2xl p-4 min-h-24 mb-6">
            {(finalText || interim) ? (
              <p className="text-white text-sm leading-relaxed">
                {finalText}
                {interim && <span className="text-white/50 italic"> {interim}</span>}
              </p>
            ) : (
              <p className="text-white/30 text-sm italic text-center mt-4">{t('voice.transcript')}</p>
            )}
          </div>

          {/* Recognised item chips */}
          {recognisedItems.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center mb-6 max-w-md">
              {recognisedItems.map((item, i) => {
                const c = classify(item)
                return (
                  <span key={i} className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                    c === 'approved'     ? 'bg-sage-400/30 text-sage-200 border border-sage-400/40' :
                    c === 'inflammatory' ? 'bg-coral-400/30 text-coral-200 border border-coral-400/40' :
                                          'bg-white/20 text-white/70 border border-white/20'
                  }`}>
                    {item}
                  </span>
                )
              })}
            </div>
          )}

          {/* Stop & review button */}
          <button
            onClick={stopAndReview}
            className="bg-gradient-to-r from-turmeric-400 to-coral-400 text-white font-bold px-8 py-3.5 rounded-xl hover:from-turmeric-500 hover:to-coral-500 transition-all shadow-lg text-sm"
          >
            {t('voice.stopBtn')}
          </button>

          <p className="text-white/20 text-xs mt-4">{t('voice.onDevice')}</p>
        </>
      )}
    </div>
  )
}
