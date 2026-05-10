import { useRef } from 'react'
import { EDUCATION } from '../data/education.js'

export default function EducationStrip() {
  const ref = useRef(null)
  const scroll = (dir) => ref.current.scrollBy({ left: dir * 300, behavior: 'smooth' })

  return (
    <section className="py-16 bg-gradient-to-r from-sage-900 to-sage-800">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 rounded-full px-4 py-1.5 text-sm font-semibold mb-3">
              🔬 The Science
            </div>
            <h2 className="text-3xl font-black text-white">Why These Foods?</h2>
          </div>
          <div className="flex gap-2 no-print">
            <button onClick={() => scroll(-1)} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors">←</button>
            <button onClick={() => scroll(1)}  className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors">→</button>
          </div>
        </div>

        {/* Scrollable cards */}
        <div ref={ref} className="flex gap-5 overflow-x-auto hide-scroll pb-2">
          {EDUCATION.map((card, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-72 bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-6 hover:bg-white/15 transition-colors"
            >
              <div className="text-4xl mb-3">{card.icon}</div>
              <h3 className="font-bold text-white mb-2">{card.title}</h3>
              <p className="text-white/70 text-sm mb-4 leading-relaxed">{card.what}</p>
              <div>
                <div className="text-xs font-bold text-white/50 uppercase tracking-wide mb-2">Top Sources</div>
                {card.sources.map((s, j) => (
                  <div key={j} className="flex items-center gap-2 text-white/80 text-sm mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-turmeric-400 flex-shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
