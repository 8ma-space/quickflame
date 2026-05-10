import { useState } from 'react'
import { DIETS, DIET_GROUPS } from '../data/diets.js'

export default function DietPreferences({ dietId, allergies, onChange }) {
  const [open, setOpen] = useState(false)
  const [localDiet, setLocalDiet]         = useState(dietId)
  const [localAllergies, setLocalAllergies] = useState(allergies)

  const selected = DIETS.find(d => d.id === localDiet) || DIETS[0]

  const save = () => {
    onChange({ dietId: localDiet, allergies: localAllergies })
    setOpen(false)
  }

  return (
    <div className="mb-6">
      {/* Collapsed pill */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-white border border-stone-200 rounded-2xl px-5 py-3.5 hover:border-sage-300 transition-colors shadow-sm"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{selected.emoji}</span>
          <div className="text-left">
            <div className="text-xs text-stone-400 font-semibold uppercase tracking-wide">Diet & Allergies</div>
            <div className="text-stone-800 font-bold text-sm">
              {selected.label}
              {localAllergies?.trim() && (
                <span className="ml-2 text-coral-500 font-normal">· Allergies set</span>
              )}
            </div>
          </div>
        </div>
        <span className={`text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {/* Expanded panel */}
      {open && (
        <div className="mt-2 bg-white border border-stone-200 rounded-2xl shadow-sm p-5 slide-up">

          {/* Diet selector */}
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-3">Your Diet Type</p>
          <div className="space-y-4 mb-6">
            {DIET_GROUPS.map(group => (
              <div key={group}>
                <p className="text-xs font-semibold text-stone-400 mb-2">{group}</p>
                <div className="flex flex-wrap gap-2">
                  {DIETS.filter(d => d.group === group).map(diet => (
                    <button
                      key={diet.id}
                      onClick={() => setLocalDiet(diet.id)}
                      title={diet.description}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold border transition-all ${
                        localDiet === diet.id
                          ? 'bg-sage-500 text-white border-sage-500 shadow-sm'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-sage-300 hover:bg-sage-50'
                      }`}
                    >
                      <span>{diet.emoji}</span>
                      {diet.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Description of selected diet */}
          <div className="bg-sage-50 border border-sage-200 rounded-xl px-4 py-2.5 mb-5 text-sm text-sage-700">
            <strong>{selected.emoji} {selected.label}:</strong> {selected.description}
          </div>

          {/* Allergy input */}
          <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">Allergies / Intolerances</p>
          <textarea
            value={localAllergies}
            onChange={e => setLocalAllergies(e.target.value)}
            placeholder="e.g. peanuts, tree nuts, shellfish, soy, sesame..."
            className="w-full h-20 rounded-xl border border-stone-200 p-3 text-sm text-stone-700 placeholder-stone-300 resize-none focus:outline-none focus:ring-2 focus:ring-sage-300"
          />
          <p className="text-xs text-stone-400 mt-1 mb-4">Separate with commas. Any recipe containing these will be removed.</p>

          {/* Save */}
          <div className="flex justify-end gap-3">
            <button onClick={() => setOpen(false)} className="text-sm text-stone-400 hover:text-stone-600 px-4 py-2">
              Cancel
            </button>
            <button
              onClick={save}
              className="bg-gradient-to-r from-sage-400 to-sage-500 text-white font-bold px-6 py-2.5 rounded-xl hover:from-sage-500 hover:to-sage-600 transition-all shadow-sm"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
