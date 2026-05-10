import { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'

export default function Navbar({ active, scrollTo }) {
  const [scrolled, setScrolled] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const dropRef = useRef(null)
  const { t, lang, changeLang, languages } = useLanguage()

  const LINKS = [
    { id: 'planner',  label: t('nav.planner') },
    { id: 'recipes',  label: t('nav.recipes') },
    { id: 'approved', label: t('nav.approvedFoods') },
  ]

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setLangOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const currentLang = languages.find(l => l.code === lang)

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 no-print ${scrolled ? 'bg-white/95 backdrop-blur shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => scrollTo('hero')} className="flex items-center gap-2 font-black text-xl">
          <span className="w-8 h-8 bg-gradient-to-br from-coral-400 to-turmeric-400 rounded-lg flex items-center justify-center text-white text-sm">🔥</span>
          <span className={scrolled ? 'text-stone-800' : 'text-white'}>QuickFlame</span>
        </button>

        <div className="flex items-center gap-1">
          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 mr-2">
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

          {/* Mobile nav links */}
          <div className="md:hidden flex gap-1 mr-2">
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

          {/* Language selector */}
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setLangOpen(o => !o)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors border ${
                scrolled
                  ? 'border-stone-200 text-stone-700 hover:bg-stone-50 bg-white'
                  : 'border-white/30 text-white hover:bg-white/20 bg-white/10'
              }`}
            >
              <span>{currentLang?.flag}</span>
              <span className="hidden sm:inline">{currentLang?.native}</span>
              <span className={`text-xs transition-transform ${langOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-stone-100 overflow-hidden z-50 min-w-44 slide-up">
                {languages.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { changeLang(l.code); setLangOpen(false) }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-sage-50 ${
                      lang === l.code ? 'bg-sage-50 text-sage-700 font-bold' : 'text-stone-700'
                    }`}
                  >
                    <span className="text-lg">{l.flag}</span>
                    <div>
                      <div className="font-semibold leading-tight">{l.native}</div>
                      <div className="text-xs text-stone-400">{l.label}</div>
                    </div>
                    {lang === l.code && <span className="ml-auto text-sage-500">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
