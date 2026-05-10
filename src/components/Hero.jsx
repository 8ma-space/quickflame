export default function Hero({ scrollTo }) {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-stone-900 via-sage-900/80 to-turmeric-900/60" />
        <img
          src="https://source.unsplash.com/1600x900/?anti-inflammatory,food,healthy"
          alt="Healthy anti-inflammatory food"
          className="w-full h-full object-cover"
          onError={e => { e.target.style.display = 'none' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/70 via-stone-900/50 to-stone-900/80" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2 mb-6 text-sm font-medium text-white/90">
          <span>🔥</span> Anti-Inflammatory · Under 30 Minutes · Always Delicious
        </div>

        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-none">
          Eat to Heal.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-turmeric-300 to-coral-300">
            Fast.
          </span>
        </h1>

        <p className="text-xl text-white/80 mb-10 max-w-xl mx-auto leading-relaxed">
          Every meal here fights inflammation, takes under 30 minutes, and actually tastes incredible.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => scrollTo('planner')}
            className="bg-gradient-to-r from-sage-400 to-sage-500 text-white font-bold px-8 py-4 rounded-2xl hover:from-sage-500 hover:to-sage-600 transition-all shadow-lg hover:shadow-sage-400/30 hover:-translate-y-0.5"
          >
            🌿 Generate My Meal Plan
          </button>
          <button
            onClick={() => scrollTo('scanner')}
            className="bg-white/10 backdrop-blur border border-white/30 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/20 transition-all"
          >
            🛒 Scan My Groceries
          </button>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-6 max-w-md mx-auto text-center">
          {[['75+', 'Quick recipes'], ['30', 'Min or less'], ['100%', 'Anti-inflammatory']].map(([n, l]) => (
            <div key={l}>
              <div className="text-2xl font-black text-white">{n}</div>
              <div className="text-xs text-white/60 font-medium">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <button
        onClick={() => scrollTo('planner')}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 animate-bounce"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </section>
  )
}
