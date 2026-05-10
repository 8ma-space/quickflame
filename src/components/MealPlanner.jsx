import { useState, useEffect } from 'react'
import { ALL_APPROVED_FLAT, INFLAMMATORY } from '../data/foods.js'
import { RECIPES } from '../data/recipes.js'
import { recipeMatchesPreferences } from '../data/diets.js'
import MealCard from './MealCard.jsx'
import RecipeModal from './RecipeModal.jsx'
import CameraScanner from './CameraScanner.jsx'
import VoiceScanner from './VoiceScanner.jsx'
import DietPreferences from './DietPreferences.jsx'

const normalize = (s) => s.toLowerCase().replace(/[^a-z\s]/g, '').trim()
const shuffle   = (arr) => [...arr].sort(() => Math.random() - 0.5)

// ── Helpers ──────────────────────────────────────────────────────────────────

function classifyFoods(raw) {
  const tokens = raw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)
  const approved = [], inflammatory = [], unknown = []
  tokens.forEach(item => {
    const n = normalize(item)
    const isApproved     = ALL_APPROVED_FLAT.some(f => n.includes(normalize(f)) || normalize(f).includes(n))
    const isInflammatory = INFLAMMATORY.some(f => n.includes(normalize(f)) || normalize(f).includes(n))
    if (isApproved)          approved.push(item)
    else if (isInflammatory) inflammatory.push(item)
    else                     unknown.push(item)
  })
  return { approved, inflammatory, unknown }
}

function matchScore(recipe, normalizedHave) {
  const text = recipe.ingredients.join(' ').toLowerCase()
  return normalizedHave.filter(item =>
    text.includes(item) || item.split(' ').some(w => w.length > 3 && text.includes(w))
  ).length
}

// Pick best-matching recipe per meal type from user's groceries
function generatePlanFromGroceries(approvedItems, prefs, calMode) {
  const normalized = approvedItems.map(normalize)
  const eligible   = RECIPES.filter(r => recipeMatchesPreferences(r, prefs.dietId, prefs.allergies))

  const pickBest = (type) => {
    const pool = eligible.filter(r => r.type === type)
    if (!pool.length) return null
    if (!normalized.length) return shuffle(pool)[0]
    const scored = pool
      .map(r => ({ ...r, matchScore: matchScore(r, normalized) }))
      .sort((a, b) => b.matchScore - a.matchScore)
    // Pick randomly from top 5 so plan varies
    const top = scored.slice(0, 5)
    return shuffle(top)[0]
  }

  const breakfast = pickBest('breakfast')
  const lunch     = pickBest('lunch')
  const dinner    = pickBest('dinner')
  const snacks    = shuffle(
    eligible
      .filter(r => r.type === 'snack')
      .map(r => ({ ...r, matchScore: matchScore(r, normalized) }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10)
  ).slice(0, 2)

  let plan = [breakfast, lunch, dinner, ...snacks].filter(Boolean)

  // 1800 cal mode: trim snacks if over budget
  if (calMode) {
    let total = plan.reduce((s, r) => s + r.calories, 0)
    while (total > 1900 && plan.length > 3) {
      plan = plan.slice(0, -1)
      total = plan.reduce((s, r) => s + r.calories, 0)
    }
  }

  return plan
}

// Shopping list: foods not in user's list that unlock the most new recipes
function buildShoppingList(approvedItems, prefs) {
  const normalizedHave = new Set(approvedItems.map(normalize))
  const foodRecipeMap  = {}

  ALL_APPROVED_FLAT.forEach(food => {
    const fn = normalize(food)
    const alreadyHave = [...normalizedHave].some(h => h.includes(fn) || fn.includes(h))
    if (alreadyHave) return

    const matching = RECIPES.filter(recipe => {
      if (!recipeMatchesPreferences(recipe, prefs.dietId, prefs.allergies)) return false
      const text = recipe.ingredients.join(' ').toLowerCase()
      return fn.split(' ').every(w => w.length <= 2 ? true : text.includes(w)) || text.includes(fn)
    })
    if (matching.length > 0) foodRecipeMap[food] = matching
  })

  return Object.entries(foodRecipeMap)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 8)
    .map(([food, recipes]) => ({ food, count: recipes.length, recipes: recipes.slice(0, 3) }))
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Column({ title, icon, count, items, colorBorder, colorTitle, dotColor, strikethrough }) {
  return (
    <div className={`bg-white rounded-2xl border p-5 ${colorBorder}`}>
      <h3 className={`font-bold flex items-center gap-2 mb-4 ${colorTitle}`}>
        <span className="w-7 h-7 rounded-full bg-current/10 flex items-center justify-center text-sm">{icon}</span>
        {title}
        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-current/10">{count}</span>
      </h3>
      {items.length === 0
        ? <p className="text-stone-400 text-sm italic">None found</p>
        : (
          <ul className="space-y-1.5">
            {items.map((item, i) => (
              <li key={i} className={`flex items-center gap-2 text-sm ${strikethrough ? 'text-stone-400 line-through' : 'text-stone-700'}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
                {item}
              </li>
            ))}
          </ul>
        )}
    </div>
  )
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

const MEAL_LABELS = ['Breakfast', 'Lunch', 'Dinner', 'Snack 1', 'Snack 2']

// ── Main component ────────────────────────────────────────────────────────────

export default function MealPlanner({ addToast, prefs, onPrefsChange }) {
  const [groceries, setGroceries] = useState(() => localStorage.getItem('qf_groceries') || '')
  const [calMode, setCalMode]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [modal, setModal]         = useState(null)
  const [camera, setCamera]       = useState(false)
  const [voice, setVoice]         = useState(false)

  useEffect(() => { localStorage.setItem('qf_groceries', groceries) }, [groceries])

  const handleCameraItems = (items) => {
    setGroceries(prev => prev ? `${prev}, ${items.join(', ')}` : items.join(', '))
    setCamera(false)
  }
  const handleVoiceItems = (items) => {
    setGroceries(prev => prev ? `${prev}, ${items.join(', ')}` : items.join(', '))
    setVoice(false)
  }

  const generate = () => {
    setLoading(true)
    setResult(null)
    setTimeout(() => {
      const classified    = classifyFoods(groceries)
      const plan          = generatePlanFromGroceries(classified.approved, prefs, calMode)
      const shoppingList  = buildShoppingList(classified.approved, prefs)

      if (classified.inflammatory.length)
        addToast(`${classified.inflammatory.length} inflammatory item${classified.inflammatory.length > 1 ? 's' : ''} flagged`, 'warning')
      if (plan.length)
        addToast('Meal plan ready! ✨', 'success')
      else
        addToast('No recipes match — try adjusting preferences', 'warning')

      setResult({ classified, plan, shoppingList })
      setLoading(false)
    }, 1500)
  }

  const totalCal = result ? result.plan.reduce((s, r) => s + r.calories, 0) : 0

  return (
    <section id="planner" className="py-20 bg-gradient-to-b from-stone-50 to-sage-50/30">
      {modal  && <RecipeModal recipe={modal} calMode={calMode} onClose={() => setModal(null)} />}
      {camera && <CameraScanner onAddItems={handleCameraItems} onClose={() => setCamera(false)} />}
      {voice  && <VoiceScanner  onAddItems={handleVoiceItems}  onClose={() => setVoice(false)} />}

      <div className="max-w-5xl mx-auto px-4">

        {/* ── Header ── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-sage-100 text-sage-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
            🌿 Meal Planner
          </div>
          <h2 className="text-4xl font-black text-stone-800 mb-3">Your Healing Day, Planned.</h2>
          <p className="text-stone-500 max-w-lg mx-auto">
            Tell us what you eat and what's in your kitchen — we'll build a meal plan around what you already have and show you what to buy next.
          </p>
        </div>

        {/* ── Step 1: Preferences ── */}
        <div className="mb-2">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 px-1">Step 1 — Diet & Allergies</p>
          <DietPreferences dietId={prefs.dietId} allergies={prefs.allergies} onChange={onPrefsChange} />
        </div>

        {/* ── Step 2: Groceries ── */}
        <div className="mb-6">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 px-1">Step 2 — What's in Your Kitchen?</p>
          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-stone-700">
                Your groceries (one per line or comma-separated):
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setVoice(true)}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-sage-400 to-sage-500 text-white text-xs font-bold px-3 py-2 rounded-xl hover:from-sage-500 hover:to-sage-600 transition-all shadow-sm hover:-translate-y-0.5"
                >
                  🎤 Speak
                </button>
                <button
                  onClick={() => setCamera(true)}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-turmeric-400 to-coral-400 text-white text-xs font-bold px-3 py-2 rounded-xl hover:from-turmeric-500 hover:to-coral-500 transition-all shadow-sm hover:-translate-y-0.5"
                >
                  📷 Camera
                </button>
              </div>
            </div>
            <textarea
              value={groceries}
              onChange={e => setGroceries(e.target.value)}
              placeholder="e.g. wild salmon, spinach, blueberries, almond milk, eggs, walnuts, oats, garlic..."
              className="w-full h-32 rounded-xl border border-stone-200 p-4 text-stone-700 placeholder-stone-300 resize-none focus:outline-none focus:ring-2 focus:ring-sage-300 text-sm"
            />
            <div className="flex justify-between items-center mt-3">
              <button
                onClick={() => { setGroceries(''); setResult(null) }}
                className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
              >
                Clear
              </button>
              <p className="text-xs text-stone-400">Leave empty to get a random plan based on your diet</p>
            </div>
          </div>
        </div>

        {/* ── Step 3: Generate ── */}
        <div className="mb-10">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 px-1">Step 3 — Generate</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
              className="bg-gradient-to-r from-coral-400 to-coral-500 text-white font-bold px-8 py-3 rounded-xl hover:from-coral-500 hover:to-coral-600 transition-all shadow-md hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? '⚡ Generating...' : result ? '🔄 Regenerate Plan' : '✨ Generate My Meal Plan'}
            </button>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1,2,3,4,5].map(i => <Skeleton key={i} />)}
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {result && !loading && (
          <div className="space-y-10 slide-up">

            {/* Grocery classification */}
            {(result.classified.approved.length > 0 || result.classified.inflammatory.length > 0 || result.classified.unknown.length > 0) && (
              <div>
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 px-1">Your Kitchen — Classified</p>
                <div className="grid md:grid-cols-3 gap-5">
                  <Column title="Anti-Inflammatory" icon="✅" count={result.classified.approved.length} items={result.classified.approved}
                    colorBorder="border-sage-200" colorTitle="text-sage-700" dotColor="bg-sage-400" />
                  <Column title="Inflammatory" icon="❌" count={result.classified.inflammatory.length} items={result.classified.inflammatory}
                    colorBorder="border-coral-200" colorTitle="text-coral-600" dotColor="bg-coral-400" strikethrough />
                  <Column title="Unknown / Neutral" icon="⚪" count={result.classified.unknown.length} items={result.classified.unknown}
                    colorBorder="border-stone-200" colorTitle="text-stone-500" dotColor="bg-stone-300" />
                </div>
              </div>
            )}

            {/* Meal plan */}
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Today's Meal Plan</p>
                {calMode && result.plan.length > 0 && (
                  <span className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-1.5 text-sm font-semibold text-blue-700">
                    📊 {totalCal} calories {totalCal >= 1700 && totalCal <= 1900 && '✅'}
                  </span>
                )}
              </div>

              {result.plan.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <div className="text-5xl mb-3">🥗</div>
                  <p className="font-medium">No recipes match your diet and allergy settings.</p>
                  <p className="text-sm mt-1">Try adjusting your preferences above.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {result.plan.map((recipe, i) => (
                      <div key={recipe.id} className="slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                        <MealCard recipe={recipe} calMode={calMode} label={MEAL_LABELS[i]} onExpand={setModal} />
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-6 no-print">
                    <button onClick={() => window.print()} className="text-sm text-stone-400 hover:text-stone-600 transition-colors font-medium">
                      🖨 Print this plan
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Shopping list */}
            <div>
              <div className="flex items-center gap-3 mb-4 px-1">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Recommended Groceries to Buy</p>
                <span className="bg-turmeric-100 text-turmeric-700 text-xs font-bold px-2.5 py-1 rounded-full">{result.shoppingList.length} items</span>
              </div>

              <div className="bg-gradient-to-r from-turmeric-50 to-sage-50 border border-turmeric-200 rounded-2xl p-5 mb-6">
                <p className="text-stone-700 text-sm leading-relaxed">
                  <strong>Here's what to buy next.</strong> These ingredients unlock the most new recipes that match your diet — grab the ones at the top for maximum variety this week.
                </p>
              </div>

              {result.shoppingList.length === 0 ? (
                <div className="text-center py-10 text-stone-400">
                  <div className="text-5xl mb-3">🎉</div>
                  <p className="font-medium">You already have everything you need!</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {result.shoppingList.map((item, i) => (
                    <div key={i} className="slide-up" style={{ animationDelay: `${i * 60}ms` }}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-turmeric-100 text-turmeric-700 font-black text-sm flex-shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-black text-stone-800 capitalize text-lg leading-tight">{item.food}</h3>
                          <span className="text-sage-600 text-sm font-semibold">Unlocks {item.count} recipe{item.count !== 1 ? 's' : ''}</span>
                        </div>
                        <span className="bg-sage-100 text-sage-700 text-xs font-bold px-3 py-1 rounded-full">+{item.count} recipes</span>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-4">
                        {item.recipes.map((r, j) => (
                          <div key={r.id} className="slide-up" style={{ animationDelay: `${j * 80}ms` }}>
                            <MealCard recipe={r} calMode={false} onExpand={setModal} />
                          </div>
                        ))}
                      </div>
                      {i < result.shoppingList.length - 1 && <div className="mt-8 border-t border-stone-100" />}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-10 text-center no-print">
                <button onClick={() => window.print()} className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-600 transition-colors font-medium">
                  🖨 Print shopping list
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Empty state */}
        {!result && !loading && (
          <div className="text-center py-16 text-stone-400">
            <div className="text-6xl mb-4">🌱</div>
            <p className="font-medium">Add your groceries above and hit Generate</p>
            <p className="text-sm mt-1">Or leave groceries empty for a random diet-matched plan</p>
          </div>
        )}

      </div>
    </section>
  )
}
