import { useState, useEffect, useCallback } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import MealPlanGenerator from './components/MealPlanGenerator.jsx'
import GroceryScanner from './components/GroceryScanner.jsx'
import RecipeBrowser from './components/RecipeBrowser.jsx'
import EducationStrip from './components/EducationStrip.jsx'
import ApprovedFoods from './components/ApprovedFoods.jsx'

const defaultPrefs = { dietId: 'no-limit', allergies: '' }

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem('qf_prefs')) || defaultPrefs } catch { return defaultPrefs }
}

export default function App() {
  const [active, setActive]   = useState('hero')
  const [prefs, setPrefs]     = useState(loadPrefs)

  const scrollTo = useCallback((id) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActive(id)
  }, [])

  useEffect(() => {
    const sections = ['hero', 'planner', 'scanner', 'recipes', 'approved']
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }),
      { threshold: 0.3 }
    )
    sections.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const savePrefs = useCallback((newPrefs) => {
    setPrefs(newPrefs)
    localStorage.setItem('qf_prefs', JSON.stringify(newPrefs))
  }, [])

  const addToast = useCallback((msg, type = 'success') => {
    const styles = {
      success: { style: { background: '#7c9a6e', color: 'white', fontWeight: '600' }, iconTheme: { primary: 'white', secondary: '#7c9a6e' } },
      warning: { icon: '⚠️', style: { background: '#d4a843', color: 'white', fontWeight: '600' } },
    }
    if (type === 'success') toast.success(msg, styles.success)
    else toast(msg, styles.warning)
  }, [])

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <Toaster position="bottom-right" toastOptions={{ duration: 3500 }} />
      <Navbar active={active} scrollTo={scrollTo} />
      <Hero scrollTo={scrollTo} />
      <MealPlanGenerator addToast={addToast} prefs={prefs} onPrefsChange={savePrefs} />
      <EducationStrip />
      <GroceryScanner addToast={addToast} prefs={prefs} onPrefsChange={savePrefs} />
      <RecipeBrowser />
      <ApprovedFoods />
      <footer className="bg-sage-900 text-white/60 text-center py-10 text-sm">
        <div className="flex items-center justify-center gap-2 text-white font-bold text-lg mb-2">
          <span>🔥</span> QuickFlame
        </div>
        <p>Eat to Heal. Fast. — Anti-inflammatory meals in 30 minutes or less.</p>
        <p className="mt-1 text-xs text-white/30">Based on Cleveland Clinic anti-inflammatory dietary guidelines.</p>
      </footer>
    </div>
  )
}
