import { useState, useMemo } from 'react'
import { APPROVED, APPROVED_CATEGORIES } from '../data/foods.js'

export default function ApprovedFoods() {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return APPROVED
    const q = search.toLowerCase()
    const result = {}
    Object.entries(APPROVED).forEach(([key, items]) => {
      const hits = items.filter(i => i.toLowerCase().includes(q))
      if (hits.length) result[key] = hits
    })
    return result
  }, [search])

  const totalVisible = Object.values(filtered).flat().length

  return (
    <section id="approved" className="py-20 px-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-sage-100 text-sage-700 rounded-full px-4 py-1.5 text-sm font-semibold mb-4">
          ✅ The Green List
        </div>
        <h2 className="text-4xl font-black text-stone-800 mb-3">Approved Anti-Inflammatory Foods</h2>
        <p className="text-stone-500 max-w-lg mx-auto">
          Every item here actively reduces inflammation. Shop this list, eat from this list, heal from this list.
        </p>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center mb-8">
        <div className="relative w-full max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search foods..."
            className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sage-300"
          />
        </div>
        {search && (
          <button onClick={() => setSearch('')} className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
            Clear
          </button>
        )}
        <div className="text-sm text-stone-400 font-medium whitespace-nowrap">{totalVisible} foods</div>
      </div>

      {/* No results */}
      {totalVisible === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <div className="text-5xl mb-4">🔍</div>
          <p className="font-medium">No foods match "{search}"</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {APPROVED_CATEGORIES.map(cat => {
            const items = filtered[cat.key]
            if (!items || items.length === 0) return null
            return (
              <div key={cat.key} className={`slide-up rounded-2xl border p-5 ${cat.color}`}>
                <div className={`flex items-center gap-2 mb-4 ${cat.text}`}>
                  <span className="text-2xl">{cat.emoji}</span>
                  <div>
                    <h3 className="font-bold text-sm leading-tight">{cat.label}</h3>
                    <span className="text-xs opacity-60">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((food, i) => (
                    <span key={i} className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${cat.badge}`}>
                      {food}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pro tip */}
      <div className="mt-10 bg-gradient-to-r from-sage-50 to-turmeric-50 border border-sage-200 rounded-2xl p-6 text-center">
        <p className="text-stone-600 text-sm max-w-2xl mx-auto">
          <strong className="text-stone-800">Pro tip:</strong> Build your plate around the proteins and vegetables first, then add a grain or healthy fat. Herbs and spices aren't just flavor — they're medicine. Turmeric + black pepper together are especially powerful.
        </p>
      </div>
    </section>
  )
}
