import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
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

// Pick best-matching recipe per meal type — only picks recipes that use what the user has
function generatePlanFromGroceries(approvedItems, prefs, calMode) {
  const normalized = approvedItems.map(normalize)
  const eligible   = RECIPES.filter(r => recipeMatchesPreferences(r, prefs.dietId, prefs.allergies))

  const pickBest = (type) => {
    const pool = eligible.filter(r => r.type === type)
    if (!pool.length) return null
    if (!normalized.length) return shuffle(pool)[0]

    const scored = pool
      .map(r => ({ ...r, _ms: matchScore(r, normalized) }))
      .sort((a, b) => b._ms - a._ms)

    // Prefer recipes where user has at least one ingredient; fall back only if none match
    const withMatches = scored.filter(r => r._ms > 0)
    const candidates  = (withMatches.length > 0 ? withMatches : scored).slice(0, 5)
    return shuffle(candidates)[0]
  }

  const breakfast = pickBest('breakfast')
  const lunch     = pickBest('lunch')
  const dinner    = pickBest('dinner')

  const snackPool = eligible
    .filter(r => r.type === 'snack')
    .map(r => ({ ...r, _ms: matchScore(r, normalized) }))
    .sort((a, b) => b._ms - a._ms)
  const snackCandidates = normalized.length ? snackPool.filter(r => r._ms > 0).slice(0, 10) : snackPool.slice(0, 10)
  const snacks = shuffle(snackCandidates.length ? snackCandidates : snackPool.slice(0, 10)).slice(0, 2)

  let plan = [breakfast, lunch, dinner, ...snacks].filter(Boolean)

  if (calMode) {
    let total = plan.reduce((s, r) => s + r.calories, 0)
    while (total > 1900 && plan.length > 3) {
      plan = plan.slice(0, -1)
      total = plan.reduce((s, r) => s + r.calories, 0)
    }
  }

  return plan
}

// Strip quantity/unit prefix from an ingredient string
const UNIT_RE = /^\d[\d\s./]*(?:tbsp?|tsp?|cups?|oz|lbs?|g|ml|cloves?|slices?|pieces?|inch(?:es)?|cm|pinch(?:es)?|handful|dash|to\s+taste)\.?\s*/i

// Shopping list: every ingredient from the meal plan that the user doesn't already have
function buildShoppingList(plan, approvedItems) {
  const normalizedHave = approvedItems.map(normalize)
  const needed = new Map() // normalized key → { display, recipes }

  plan.forEach(recipe => {
    recipe.ingredients.forEach(ingRaw => {
      const clean = ingRaw
        .replace(UNIT_RE, '')
        .split('(')[0]
        .split(',')[0]
        .trim()
        .toLowerCase()
      if (clean.length < 2) return

      const cn = normalize(clean)
      const alreadyHave = normalizedHave.some(h =>
        cn.includes(h) || h.includes(cn) ||
        cn.split(' ').some(w => w.length > 3 && h.includes(w))
      )
      if (alreadyHave) return

      if (!needed.has(cn)) needed.set(cn, { display: clean, recipes: new Set() })
      needed.get(cn).recipes.add(recipe.name)
    })
  })

  return [...needed.values()]
    .map(({ display, recipes }) => ({ ingredient: display, recipes: [...recipes] }))
    .sort((a, b) => b.recipes.length - a.recipes.length)
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Column({ title, icon, count, items, colorBorder, colorTitle, dotColor, strikethrough, noneFound }) {
  return (
    <div className={`bg-white rounded-2xl border p-5 ${colorBorder}`}>
      <h3 className={`font-bold flex items-center gap-2 mb-4 ${colorTitle}`}>
        <span className="w-7 h-7 rounded-full bg-current/10 flex items-center justify-center text-sm">{icon}</span>
        {title}
        <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-current/10">{count}</span>
      </h3>
      {items.length === 0
        ? <p className="text-stone-400 text-sm italic">{noneFound}</p>
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
  const { t } = useLanguage()
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
      const shoppingList  = buildShoppingList(plan, classified.approved)

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
            {t('planner.badge')}
          </div>
          <h2 className="text-4xl font-black text-stone-800 mb-3">{t('planner.title')}</h2>
          <p className="text-stone-500 max-w-lg mx-auto">{t('planner.sub')}</p>
        </div>

        {/* ── Step 1: Preferences ── */}
        <div className="mb-2">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 px-1">{t('planner.step1')}</p>
          <DietPreferences dietId={prefs.dietId} allergies={prefs.allergies} onChange={onPrefsChange} />
        </div>

        {/* ── Step 2: Groceries ── */}
        <div className="mb-6">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 px-1">{t('planner.step2')}</p>
          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-stone-700">{t('planner.groceriesLabel')}</label>
              <div className="flex gap-2">
                <button onClick={() => setVoice(true)} className="flex items-center gap-1.5 bg-gradient-to-r from-sage-400 to-sage-500 text-white text-xs font-bold px-3 py-2 rounded-xl hover:from-sage-500 hover:to-sage-600 transition-all shadow-sm hover:-translate-y-0.5">
                  {t('planner.speak')}
                </button>
                <button onClick={() => setCamera(true)} className="flex items-center gap-1.5 bg-gradient-to-r from-turmeric-400 to-coral-400 text-white text-xs font-bold px-3 py-2 rounded-xl hover:from-turmeric-500 hover:to-coral-500 transition-all shadow-sm hover:-translate-y-0.5">
                  {t('planner.camera')}
                </button>
              </div>
            </div>
            <textarea
              value={groceries}
              onChange={e => setGroceries(e.target.value)}
              placeholder={t('planner.groceriesPlaceholder')}
              className="w-full h-32 rounded-xl border border-stone-200 p-4 text-stone-700 placeholder-stone-300 resize-none focus:outline-none focus:ring-2 focus:ring-sage-300 text-sm"
            />
            <div className="flex justify-between items-center mt-3">
              <button onClick={() => { setGroceries(''); setResult(null) }} className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
                {t('planner.clear')}
              </button>
              <p className="text-xs text-stone-400">{t('planner.emptyHint')}</p>
            </div>
          </div>
        </div>

        {/* ── Step 3: Generate ── */}
        <div className="mb-10">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 px-1">{t('planner.step3')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="bg-white rounded-2xl p-1.5 flex gap-1 shadow-sm border border-stone-100">
              <button onClick={() => setCalMode(false)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${!calMode ? 'bg-sage-400 text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
                {t('planner.unlimited')}
              </button>
              <button onClick={() => setCalMode(true)} className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${calMode ? 'bg-blue-500 text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
                {t('planner.calMode')}
              </button>
            </div>
            <button onClick={generate} disabled={loading} className="bg-gradient-to-r from-coral-400 to-coral-500 text-white font-bold px-8 py-3 rounded-xl hover:from-coral-500 hover:to-coral-600 transition-all shadow-md hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0">
              {loading ? t('planner.generating') : result ? t('planner.regenerate') : t('planner.generate')}
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
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 px-1">{t('planner.classifiedTitle')}</p>
                <div className="grid md:grid-cols-3 gap-5">
                  <Column title={t('planner.antiInflammatory')} icon="✅" count={result.classified.approved.length} items={result.classified.approved} noneFound={t('planner.noneFound')}
                    colorBorder="border-sage-200" colorTitle="text-sage-700" dotColor="bg-sage-400" />
                  <Column title={t('planner.inflammatory')} icon="❌" count={result.classified.inflammatory.length} items={result.classified.inflammatory} noneFound={t('planner.noneFound')}
                    colorBorder="border-coral-200" colorTitle="text-coral-600" dotColor="bg-coral-400" strikethrough />
                  <Column title={t('planner.unknown')} icon="⚪" count={result.classified.unknown.length} items={result.classified.unknown} noneFound={t('planner.noneFound')}
                    colorBorder="border-stone-200" colorTitle="text-stone-500" dotColor="bg-stone-300" />
                </div>
              </div>
            )}

            {/* Meal plan */}
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{t('planner.planTitle')}</p>
                {calMode && result.plan.length > 0 && (
                  <span className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-1.5 text-sm font-semibold text-blue-700">
                    📊 {totalCal} {t('planner.calories')} {totalCal >= 1700 && totalCal <= 1900 && '✅'}
                  </span>
                )}
              </div>

              {result.plan.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <div className="text-5xl mb-3">🥗</div>
                  <p className="font-medium">{t('planner.noMatch')}</p>
                  <p className="text-sm mt-1">{t('planner.noMatchSub')}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {result.plan.map((recipe, i) => (
                      <div key={recipe.id} className="slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                        <MealCard recipe={recipe} calMode={calMode} label={t('planner.mealLabels')[i]} onExpand={setModal} />
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-6 no-print">
                    <button onClick={() => window.print()} className="text-sm text-stone-400 hover:text-stone-600 transition-colors font-medium">
                      {t('planner.print')}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Shopping list */}
            <div>
              <div className="flex items-center gap-3 mb-4 px-1">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{t('planner.shopTitle')}</p>
                <span className="bg-turmeric-100 text-turmeric-700 text-xs font-bold px-2.5 py-1 rounded-full">{result.shoppingList.length} items</span>
              </div>

              <div className="bg-gradient-to-r from-turmeric-50 to-sage-50 border border-turmeric-200 rounded-2xl p-5 mb-6">
                <p className="text-stone-700 text-sm leading-relaxed">
                  <strong>{t('planner.shopTitle')}.</strong> {t('planner.shopDesc')}
                </p>
              </div>

              {result.shoppingList.length === 0 ? (
                <div className="text-center py-10 text-stone-400">
                  <div className="text-5xl mb-3">🎉</div>
                  <p className="font-medium">{t('planner.allGood')}</p>
                </div>
              ) : (
                <div className="bg-white border border-stone-100 rounded-2xl divide-y divide-stone-50 shadow-sm slide-up">
                  {result.shoppingList.map((item, i) => (
                    <div key={i} className="flex items-start gap-4 px-5 py-3.5">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-turmeric-300 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-stone-800 capitalize">{item.ingredient}</span>
                        <span className="ml-2 text-xs text-stone-400">
                          for: {item.recipes.join(', ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 text-center no-print">
                <button onClick={() => window.print()} className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-600 transition-colors font-medium">
                  {t('planner.printShop')}
                </button>
              </div>
            </div>

          </div>
        )}

        {/* Empty state */}
        {!result && !loading && (
          <div className="text-center py-16 text-stone-400">
            <div className="text-6xl mb-4">🌱</div>
            <p className="font-medium">{t('planner.emptyState')}</p>
            <p className="text-sm mt-1">{t('planner.emptyStateSub')}</p>
          </div>
        )}

      </div>
    </section>
  )
}
