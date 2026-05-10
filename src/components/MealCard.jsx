function ScoreBadge({ score }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${score === 'High' ? 'bg-sage-100 text-sage-700' : 'bg-turmeric-100 text-turmeric-600'}`}>
      {score === 'High' ? '🌿' : '⭐'} {score}
    </span>
  )
}

export default function MealCard({ recipe, calMode, label, onExpand }) {
  return (
    <div
      className="meal-plan-print bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 cursor-pointer group"
      onClick={() => onExpand(recipe)}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={recipe.image}
          alt={recipe.name}
          className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
          onError={e => {
            e.target.style.display = 'none'
            e.target.parentElement.style.background = 'linear-gradient(135deg, #7c9a6e, #d4a843)'
            e.target.parentElement.style.height = '11rem'
            e.target.parentElement.innerHTML += '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:3rem">🥗</div>'
          }}
        />
        {label && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-xs font-bold px-2.5 py-1 rounded-full text-stone-700 uppercase tracking-wide">
            {label}
          </span>
        )}
        <div className="absolute bottom-3 right-3">
          <ScoreBadge score={recipe.score} />
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-bold text-stone-800 mb-1 leading-snug">{recipe.name}</h3>
        <div className="flex items-center gap-3 text-xs text-stone-500 mb-3">
          <span>⏱ {recipe.prepTime} min</span>
          {calMode && <span className="text-turmeric-500 font-semibold">🔥 {recipe.calories} cal</span>}
        </div>

        {/* Ingredient chips */}
        <div className="flex flex-wrap gap-1 mb-3">
          {recipe.ingredients.slice(0, 4).map((ing, i) => {
            const clean = ing.replace(/^\d[\d\s/]*(?:tbsp|tsp|cup|oz|lb|inch|g|ml)?\s*/i, '').split('(')[0].trim()
            return (
              <span key={i} className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
                {clean || ing}
              </span>
            )
          })}
        </div>

        <span className="text-xs text-sage-500 font-semibold">View full recipe →</span>
      </div>
    </div>
  )
}
