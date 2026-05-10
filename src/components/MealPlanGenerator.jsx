import { useState } from 'react'
import { RECIPES } from '../data/recipes.js'
import { recipeMatchesPreferences } from '../data/diets.js'
import MealCard from './MealCard.jsx'
import RecipeModal from './RecipeModal.jsx'
import DietPreferences from './DietPreferences.jsx'

const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5)

function generatePlan(prefs) {
  const ok = (r) => recipeMatchesPreferences(r, prefs.dietId, prefs.allergies)
  const pick = (type) => shuffle(RECIPES.filter(r => r.type === type && ok(r)))[0]
  const b = pick('breakfast')
  const l = pick('lunch')
  const d = pick('dinner')
  const snacks = shuffle(RECIPES.filter(r => r.type === 'snack' && ok(r))).slice(0, 2)
  return [b, l, d, ...snacks].filter(Boolean)
}

function Skeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="shimmer h-44 w-full" />
      <div className="p-4 space-y-3">
        <div className="shimmer h-5 w-3/4 rounded-full" />
        <div className="shimmer h-4 w-1/2 rounded-full" />
        <div className="shimmer h-4 w-full rounded-full" />
      </div>
    </div>
  )
}

const LABELS = ['Breakfast', 'Lunch', 'Dinner', 'Snack 1', 'Snack 2']

export default function MealPlanGenerator({ addToast, prefs, onPrefsChange }) {
  const [calMode, setCalMode] = useState(false)
  const [plan, setPlan]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [modal, setModal]     = useState(null)

  const generate = () => {
    setLoading(true)
    setPlan(null)
    setTimeout(() => {
      const result = generatePlan(prefs)
      if (result.length < 3) {
        addToast('Not enough recipes match your diet — try adjusting preferences', 'warning')
      } else {
        addToast('Plan generated! ✨', 'success')
      }
      setPlan(result)
      setLoading(false)
    }, 1500)
  }

  const totalCal = plan ? plan.reduce((s, r) => s + r.calories, 0) : 0

  return (
    <section id="planner" className="py-20 px-4 max-w-6xl mx-auto">
      {modal && <RecipeModal recipe={modal} calMode={calMode} onClose={() => setModal(null)} />}

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-sage-100 text-sage-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
          🌿 Daily Meal Plan
        </div>
        <h2 className="text-4xl font-black text-stone-800 mb-3">Your Healing Day, Planned.</h2>
        <p className="text-stone-500 max-w-lg mx-auto">One click generates a full day of anti-inflammatory meals that taste as good as they make you feel.</p>
      </div>

      {/* Diet preferences */}
      <div className="max-w-2xl mx-auto">
        <DietPreferences dietId={prefs.dietId} allergies={prefs.allergies} onChange={onPrefsChange} />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
        <div className="bg-white rounded-2xl p-1.5 flex gap-1 shadow-sm border border-stone-100">
          <button
            onClick={() => setCalMode(false)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${!calMode ? 'bg-sage-400 text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            🟢 Unlimited Mode
          </button>
          <button
            onClick={() => setCalMode(true)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${calMode ? 'bg-blue-500 text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            🔵 1800 Cal Mode
          </button>
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="bg-gradient-to-r from-coral-400 to-coral-500 text-white font-bold px-6 py-3 rounded-xl hover:from-coral-500 hover:to-coral-600 transition-all shadow-md hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {loading ? '⚡ Generating...' : plan ? '🔄 Regenerate Plan' : '✨ Generate My Plan'}
        </button>
      </div>

      {/* Calorie total */}
      {calMode && plan && !loading && (
        <div className="flex justify-center mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-2.5 text-sm font-semibold text-blue-700">
            📊 Daily Total: <span className="text-blue-800 font-black">{totalCal} calories</span>
            {totalCal >= 1700 && totalCal <= 1900 && ' ✅'}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!plan && !loading && (
        <div className="text-center py-16 text-stone-400">
          <div className="text-6xl mb-4">🌱</div>
          <p className="font-medium">Hit generate to build your healing day</p>
        </div>
      )}

      {/* Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} />)}
        </div>
      )}

      {/* Plan cards */}
      {plan && !loading && (
        <>
          {plan.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <div className="text-5xl mb-3">🥗</div>
              <p className="font-medium">No recipes match your current diet and allergy settings.</p>
              <p className="text-sm mt-1">Try adjusting your preferences above.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {plan.map((recipe, i) => (
                  <div key={recipe.id} className="slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                    <MealCard recipe={recipe} calMode={calMode} label={LABELS[i]} onExpand={setModal} />
                  </div>
                ))}
              </div>
              <div className="text-center mt-8 no-print">
                <button onClick={() => window.print()} className="text-sm text-stone-400 hover:text-stone-600 transition-colors font-medium">
                  🖨 Print this plan
                </button>
              </div>
            </>
          )}
        </>
      )}
    </section>
  )
}
