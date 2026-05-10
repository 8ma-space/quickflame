import { useState, useMemo } from 'react'
import { RECIPES } from '../data/recipes.js'
import MealCard from './MealCard.jsx'
import RecipeModal from './RecipeModal.jsx'

const TYPE_FILTERS = ['all', 'breakfast', 'lunch', 'dinner', 'snack']
const TIME_FILTERS = [['all', 'Any Time'], ['10', '<10 min'], ['20', '<20 min'], ['30', '<30 min']]
const ING_FILTERS  = [['all', 'Any Ingredient'], ['protein', 'Protein'], ['vegetables', 'Veggies'], ['grain', 'Grains'], ['fruit', 'Fruit'], ['fats', 'Healthy Fats']]

function FilterBtn({ active, onClick, children, activeClass }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${active ? activeClass : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
    >
      {children}
    </button>
  )
}

export default function RecipeBrowser() {
  const [typeFilter, setTypeFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')
  const [ingFilter,  setIngFilter]  = useState('all')
  const [search,     setSearch]     = useState('')
  const [modal,      setModal]      = useState(null)

  const filtered = useMemo(() => RECIPES.filter(r => {
    if (typeFilter !== 'all' && r.type !== typeFilter) return false
    if (timeFilter !== 'all' && r.prepTime > parseInt(timeFilter)) return false
    if (ingFilter  !== 'all' && r.mainIngredient !== ingFilter) return false
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [typeFilter, timeFilter, ingFilter, search])

  const clearAll = () => { setTypeFilter('all'); setTimeFilter('all'); setIngFilter('all'); setSearch('') }

  return (
    <section id="recipes" className="py-20 px-4 max-w-6xl mx-auto">
      {modal && <RecipeModal recipe={modal} calMode={false} onClose={() => setModal(null)} />}

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-coral-100 text-coral-600 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
          📖 Recipe Library
        </div>
        <h2 className="text-4xl font-black text-stone-800 mb-3">All {RECIPES.length} Recipes</h2>
        <p className="text-stone-500">Every single one fights inflammation and takes under 30 minutes.</p>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-stone-100 p-4 mb-8 space-y-4">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search recipes..."
          className="w-full border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sage-300"
        />

        <div className="flex flex-wrap gap-3">
          {/* Type */}
          <div className="flex flex-wrap gap-1.5">
            {TYPE_FILTERS.map(t => (
              <FilterBtn key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)} activeClass="bg-sage-400 text-white">
                {t === 'all' ? 'All Types' : t}
              </FilterBtn>
            ))}
          </div>

          {/* Time */}
          <div className="flex flex-wrap gap-1.5">
            {TIME_FILTERS.map(([val, label]) => (
              <FilterBtn key={val} active={timeFilter === val} onClick={() => setTimeFilter(val)} activeClass="bg-turmeric-400 text-white">
                {label}
              </FilterBtn>
            ))}
          </div>

          {/* Ingredient */}
          <div className="flex flex-wrap gap-1.5">
            {ING_FILTERS.map(([val, label]) => (
              <FilterBtn key={val} active={ingFilter === val} onClick={() => setIngFilter(val)} activeClass="bg-coral-400 text-white">
                {label}
              </FilterBtn>
            ))}
          </div>
        </div>

        <p className="text-xs text-stone-400 font-medium">
          {filtered.length} recipe{filtered.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <div className="text-5xl mb-4">🔍</div>
          <p className="font-medium">No recipes match your filters</p>
          <button onClick={clearAll} className="mt-3 text-sage-500 font-semibold text-sm hover:underline">
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((r, i) => (
            <div key={r.id} className="slide-up" style={{ animationDelay: `${(i % 8) * 50}ms` }}>
              <MealCard recipe={r} calMode={false} onExpand={setModal} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
