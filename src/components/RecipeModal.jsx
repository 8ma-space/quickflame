import { useEffect } from 'react'

function ScoreBadge({ score }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${score === 'High' ? 'bg-sage-100 text-sage-700' : 'bg-turmeric-100 text-turmeric-600'}`}>
      {score === 'High' ? '🌿' : '⭐'} {score} AI Score
    </span>
  )
}

export default function RecipeModal({ recipe, calMode, onClose }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', esc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', esc)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in no-print" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto z-10 slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative">
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-64 object-cover rounded-t-3xl"
            onError={e => {
              e.target.style.display = 'none'
              e.target.parentElement.style.background = 'linear-gradient(135deg, #7c9a6e, #d4a843)'
              e.target.parentElement.style.height = '16rem'
            }}
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-stone-600 hover:bg-white transition-colors shadow-lg font-bold"
          >
            ✕
          </button>
          <div className="absolute bottom-4 left-4 flex gap-2 flex-wrap">
            <ScoreBadge score={recipe.score} />
            <span className="bg-white/90 backdrop-blur text-xs font-semibold px-2 py-0.5 rounded-full text-stone-700">
              ⏱ {recipe.prepTime} min
            </span>
            {calMode && (
              <span className="bg-turmeric-400 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                🔥 {recipe.calories} cal
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <h2 className="text-2xl font-bold text-stone-800 mb-1">{recipe.name}</h2>
          <p className="text-sage-500 font-medium capitalize mb-6">{recipe.type}</p>

          {/* Ingredients */}
          <div className="mb-6">
            <h3 className="font-bold text-stone-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-sage-100 rounded-full flex items-center justify-center text-xs text-sage-600 font-bold">1</span>
              Ingredients
            </h3>
            <ul className="space-y-2">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-start gap-2 text-stone-600 text-sm">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sage-400 flex-shrink-0" />
                  {ing}
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="font-bold text-stone-700 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-turmeric-100 rounded-full flex items-center justify-center text-xs text-turmeric-600 font-bold">2</span>
              Instructions
            </h3>
            <ol className="space-y-3">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-stone-600">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-coral-100 text-coral-600 font-bold text-xs flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
