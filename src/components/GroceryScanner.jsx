import { useState, useEffect } from 'react'
import { ALL_APPROVED_FLAT, INFLAMMATORY } from '../data/foods.js'
import { RECIPES } from '../data/recipes.js'
import MealCard from './MealCard.jsx'
import RecipeModal from './RecipeModal.jsx'
import CameraScanner from './CameraScanner.jsx'

const normalize = (s) => s.toLowerCase().replace(/[^a-z\s]/g, '').trim()

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

// Recipes the user can make right now (sorted by how many ingredients they have)
function recipesCanMake(approvedItems) {
  if (!approvedItems.length) return []
  const normalized = approvedItems.map(normalize)
  return RECIPES
    .map(r => ({ ...r, matchScore: matchScore(r, normalized) }))
    .filter(r => r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
}

// For each approved food NOT in the user's list, count how many recipes use it
function buildShoppingList(approvedItems) {
  const normalizedHave = new Set(approvedItems.map(normalize))

  const foodRecipeMap = {}   // food → [recipes]

  ALL_APPROVED_FLAT.forEach(food => {
    const fn = normalize(food)
    // Skip if user already has it
    const alreadyHave = [...normalizedHave].some(h => h.includes(fn) || fn.includes(h))
    if (alreadyHave) return

    const matching = RECIPES.filter(recipe => {
      const text = recipe.ingredients.join(' ').toLowerCase()
      return fn.split(' ').every(w => w.length <= 2 ? true : text.includes(w))
        || text.includes(fn)
    })
    if (matching.length > 0) foodRecipeMap[food] = matching
  })

  // Sort by recipes unlocked descending, take top 8
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

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${active ? 'bg-white shadow-sm text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}
    >
      {children}
    </button>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GroceryScanner({ addToast }) {
  const [input, setInput]     = useState(() => localStorage.getItem('qf_groceries') || '')
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)
  const [modal, setModal]     = useState(null)
  const [camera, setCamera]   = useState(false)
  const [tab, setTab]         = useState('recipes') // 'recipes' | 'shopping'

  useEffect(() => { localStorage.setItem('qf_groceries', input) }, [input])

  const handleCameraItems = (items) => {
    setInput(prev => prev ? `${prev}, ${items.join(', ')}` : items.join(', '))
    setCamera(false)
  }

  const scan = () => {
    if (!input.trim()) return
    setLoading(true)
    setResult(null)
    setTimeout(() => {
      const classified   = classifyFoods(input)
      const canMake      = recipesCanMake(classified.approved)
      const shoppingList = buildShoppingList(classified.approved)
      setResult({ ...classified, canMake, shoppingList })
      setTab('recipes')
      setLoading(false)
      if (classified.inflammatory.length)
        addToast(`${classified.inflammatory.length} inflammatory item${classified.inflammatory.length > 1 ? 's' : ''} flagged`, 'warning')
      if (classified.approved.length)
        addToast(`${classified.approved.length} great items found!`, 'success')
    }, 1200)
  }

  return (
    <section id="scanner" className="py-20 bg-gradient-to-b from-stone-50 to-sage-50/30">
      {modal  && <RecipeModal recipe={modal} calMode={false} onClose={() => setModal(null)} />}
      {camera && <CameraScanner onAddItems={handleCameraItems} onClose={() => setCamera(false)} />}

      <div className="max-w-5xl mx-auto px-4">

        {/* ── Header ── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-turmeric-100 text-turmeric-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
            🛒 Grocery Scanner
          </div>
          <h2 className="text-4xl font-black text-stone-800 mb-3">What's in Your Kitchen?</h2>
          <p className="text-stone-500 max-w-lg mx-auto">
            Submit your groceries to see what you can cook today — and exactly what to buy for a full week of anti-inflammatory meal prep.
          </p>
        </div>

        {/* ── Input card ── */}
        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-stone-700">
              Your groceries (one per line or comma-separated):
            </label>
            <button
              onClick={() => setCamera(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-turmeric-400 to-coral-400 text-white text-xs font-bold px-3 py-2 rounded-xl hover:from-turmeric-500 hover:to-coral-500 transition-all shadow-sm hover:-translate-y-0.5"
            >
              📷 Scan with Camera
            </button>
          </div>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="e.g. wild salmon, spinach, blueberries, almond milk, eggs, walnuts, oats, garlic..."
            className="w-full h-36 rounded-xl border border-stone-200 p-4 text-stone-700 placeholder-stone-300 resize-none focus:outline-none focus:ring-2 focus:ring-sage-300 text-sm"
          />
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => { setInput(''); setResult(null) }}
              className="text-sm text-stone-400 hover:text-stone-600 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={scan}
              disabled={!input.trim() || loading}
              className="bg-gradient-to-r from-sage-400 to-sage-500 text-white font-bold px-6 py-3 rounded-xl hover:from-sage-500 hover:to-sage-600 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '🔍 Analysing...' : '🔍 Scan My Groceries'}
            </button>
          </div>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 text-sage-600 font-semibold">
              <div className="w-5 h-5 border-2 border-sage-400 border-t-transparent rounded-full animate-spin" />
              Analysing your foods...
            </div>
          </div>
        )}

        {/* ── Results ── */}
        {result && !loading && (
          <div className="space-y-8 slide-up">

            {/* Classification columns */}
            <div className="grid md:grid-cols-3 gap-5">
              <Column title="Anti-Inflammatory" icon="✅" count={result.approved.length} items={result.approved}
                colorBorder="border-sage-200" colorTitle="text-sage-700" dotColor="bg-sage-400" />
              <Column title="Inflammatory" icon="❌" count={result.inflammatory.length} items={result.inflammatory}
                colorBorder="border-coral-200" colorTitle="text-coral-600" dotColor="bg-coral-400" strikethrough />
              <Column title="Unknown / Neutral" icon="⚪" count={result.unknown.length} items={result.unknown}
                colorBorder="border-stone-200" colorTitle="text-stone-500" dotColor="bg-stone-300" />
            </div>

            {/* ── Tab switcher ── */}
            <div className="bg-stone-100 rounded-2xl p-1.5 flex gap-1 overflow-x-auto hide-scroll">
              <TabBtn active={tab === 'recipes'}  onClick={() => setTab('recipes')}>
                🍽 Recipes I Can Make ({result.canMake.length})
              </TabBtn>
              <TabBtn active={tab === 'shopping'} onClick={() => setTab('shopping')}>
                🛒 Meal Prep Shopping List ({result.shoppingList.length} items)
              </TabBtn>
            </div>

            {/* ── Tab: Recipes I can make ── */}
            {tab === 'recipes' && (
              <div>
                {result.canMake.length === 0 ? (
                  <div className="text-center py-12 text-stone-400">
                    <div className="text-5xl mb-3">🥗</div>
                    <p className="font-medium">No recipe matches found.</p>
                    <p className="text-sm mt-1">Try adding more items to your list, or check the Shopping List tab.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-stone-500 text-sm mb-5">
                      Sorted by how many of your ingredients each recipe uses. Click any card to see the full recipe.
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {result.canMake.map((r, i) => (
                        <div key={r.id} className="slide-up" style={{ animationDelay: `${(i % 6) * 70}ms` }}>
                          {/* Match badge */}
                          <div className="relative">
                            <div className="absolute top-2 right-2 z-10 bg-sage-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              {r.matchScore} ingredient{r.matchScore !== 1 ? 's' : ''} matched
                            </div>
                            <MealCard recipe={r} calMode={false} onExpand={setModal} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Tab: Meal Prep Shopping List ── */}
            {tab === 'shopping' && (
              <div>
                <div className="bg-gradient-to-r from-turmeric-50 to-sage-50 border border-turmeric-200 rounded-2xl p-5 mb-6">
                  <p className="text-stone-700 text-sm leading-relaxed">
                    <strong>Here's your personalised meal prep list.</strong> These are the ingredients you don't have yet that unlock the most new recipes. Buy the ones at the top and you'll have full coverage for the week.
                  </p>
                </div>

                {result.shoppingList.length === 0 ? (
                  <div className="text-center py-12 text-stone-400">
                    <div className="text-5xl mb-3">🎉</div>
                    <p className="font-medium">You already have everything you need!</p>
                  </div>
                ) : (
                  <div className="space-y-10">
                    {result.shoppingList.map((item, i) => (
                      <div key={i} className="slide-up" style={{ animationDelay: `${i * 60}ms` }}>

                        {/* Item header */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-turmeric-100 text-turmeric-700 font-black text-sm flex-shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-black text-stone-800 capitalize text-lg leading-tight">{item.food}</h3>
                            <span className="text-sage-600 text-sm font-semibold">
                              Unlocks {item.count} recipe{item.count !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <span className="bg-sage-100 text-sage-700 text-xs font-bold px-3 py-1 rounded-full">
                            +{item.count} recipes
                          </span>
                        </div>

                        {/* Recipe preview cards */}
                        <div className="grid sm:grid-cols-3 gap-4">
                          {item.recipes.map((r, j) => (
                            <div key={r.id} className="slide-up" style={{ animationDelay: `${j * 80}ms` }}>
                              <MealCard recipe={r} calMode={false} onExpand={setModal} />
                            </div>
                          ))}
                        </div>

                        {/* Divider (except last) */}
                        {i < result.shoppingList.length - 1 && (
                          <div className="mt-8 border-t border-stone-100" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Print list button */}
                <div className="mt-10 text-center no-print">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-600 transition-colors font-medium"
                  >
                    🖨 Print shopping list
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </section>
  )
}
