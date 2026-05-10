import { useState, useEffect } from 'react'

const LINKS = [
  { id: 'planner',  label: 'Meal Planner' },
  { id: 'scanner',  label: 'My Groceries' },
  { id: 'recipes',  label: 'Recipes' },
  { id: 'approved', label: 'Approved Foods' },
]

export default function Navbar({ active, scrollTo }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 no-print ${scrolled ? 'bg-white/95 backdrop-blur shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => scrollTo('hero')} className="flex items-center gap-2 font-black text-xl">
          <span className="w-8 h-8 bg-gradient-to-br from-coral-400 to-turmeric-400 rounded-lg flex items-center justify-center text-white text-sm">🔥</span>
          <span className={scrolled ? 'text-stone-800' : 'text-white'}>QuickFlame</span>
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {LINKS.map(l => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                active === l.id
                  ? 'bg-sage-400 text-white'
                  : scrolled
                  ? 'text-stone-600 hover:bg-stone-100'
                  : 'text-white/90 hover:bg-white/20'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Mobile links */}
        <div className="md:hidden flex gap-1">
          {LINKS.map(l => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className={`p-2 rounded-lg text-xs font-semibold transition-colors ${scrolled ? 'text-stone-600' : 'text-white/90'}`}
            >
              {l.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
