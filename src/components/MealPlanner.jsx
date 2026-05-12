import { useState, useEffect, useMemo, useRef } from 'react'
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

// ── Instruction parser ────────────────────────────────────────────────────────

const KNOWN_PROTEINS = [
  'beef','chicken','turkey','fish','salmon','tuna','bison','lamb','pork',
  'shrimp','eggs','egg','cod','halibut','tilapia','sardines','anchovies',
  'tofu','tempeh','lentils','beans','chickpeas','duck','venison','crab',
  'lobster','scallops','trout','herring','mackerel',
]
const FREQ_WORDS = { once: 1, twice: 2, thrice: 3, daily: 7, everyday: 7 }

function parseInstructions(text) {
  if (!text.trim()) return []
  const lower = text.toLowerCase().replace(/every\s+day/g, '7 times a week').replace(/\bdaily\b/g, '7 times a week')
  const requirements = []

  // Match "N times a week", "once/twice/thrice a week", "N x a week"
  const freqRe = /\b(\d+|once|twice|thrice)\b\s*(?:times?|x)?\s*(?:a\s+|per\s+)?week/gi
  let m
  while ((m = freqRe.exec(lower)) !== null) {
    const raw = m[1].toLowerCase()
    const count = FREQ_WORDS[raw] ?? parseInt(m[1])
    if (isNaN(count) || count < 1 || count > 7) continue
    // Search 120 chars around the match for a protein name
    const start = Math.max(0, m.index - 120)
    const end   = Math.min(lower.length, m.index + m[0].length + 120)
    const ctx   = lower.substring(start, end)
    for (const protein of KNOWN_PROTEINS) {
      if (ctx.includes(protein)) {
        const existing = requirements.find(r => r.ingredient === protein)
        if (existing) existing.count = Math.max(existing.count, count)
        else requirements.push({ ingredient: protein, count })
        break
      }
    }
  }

  // Also scan the whole text for proteins not yet captured (no explicit frequency → count 1)
  for (const protein of KNOWN_PROTEINS) {
    if (lower.includes(protein) && !requirements.find(r => r.ingredient === protein)) {
      requirements.push({ ingredient: protein, count: 1 })
    }
  }

  return requirements
}

function findInflammatoryInText(text) {
  if (!text.trim()) return []
  const lower = text.toLowerCase()
  return INFLAMMATORY.filter(item => {
    const n = item.toLowerCase()
    // whole-word match to avoid false positives (e.g. "rice" inside "brown rice")
    const re = new RegExp(`\\b${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`)
    return re.test(lower)
  })
}

function buildDayTargets(requirements) {
  const targets = Array.from({ length: 7 }, () => [])
  requirements.forEach(({ ingredient, count }) => {
    shuffle([0, 1, 2, 3, 4, 5, 6]).slice(0, Math.min(count, 7)).forEach(d => targets[d].push(ingredient))
  })
  return targets
}

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

// Pick one recipe of a given type, excluding already-used IDs
function pickBest(type, eligible, normalized, usedIds, targetIngredients = []) {
  const pool     = eligible.filter(r => r.type === type && !usedIds.has(r.id))
  const fallback = eligible.filter(r => r.type === type)
  const source   = pool.length ? pool : fallback
  if (!source.length) return null

  // For lunch/dinner, try to honour target ingredients first
  if (targetIngredients.length > 0 && (type === 'lunch' || type === 'dinner')) {
    for (const target of targetIngredients) {
      const hits = source.filter(r => {
        const text = [r.name, ...r.ingredients].join(' ').toLowerCase()
        // "beef" matches "grass-fed beef", "beef sirloin", etc.
        return text.includes(target) || (target === 'fish' && /salmon|tuna|cod|halibut|tilapia|sardine|mackerel|trout|herring/.test(text))
      })
      if (hits.length > 0) {
        const r = shuffle(hits)[0]
        usedIds.add(r.id)
        return r
      }
    }
  }

  if (!normalized.length) {
    const r = shuffle(source)[0]
    usedIds.add(r.id)
    return r
  }
  const scored = source
    .map(r => ({ ...r, _ms: matchScore(r, normalized) }))
    .sort((a, b) => b._ms - a._ms)
  const withMatches = scored.filter(r => r._ms > 0)
  const candidates  = (withMatches.length > 0 ? withMatches : scored).slice(0, 8)
  const r = shuffle(candidates)[0]
  usedIds.add(r.id)
  return r
}

// Generate meals for one day
function generateDay(eligible, normalized, usedIds, calMode, targetIngredients = []) {
  const breakfast = pickBest('breakfast', eligible, normalized, usedIds)
  const lunch     = pickBest('lunch',     eligible, normalized, usedIds, targetIngredients)
  const dinner    = pickBest('dinner',    eligible, normalized, usedIds, targetIngredients)

  const snackPool = eligible
    .filter(r => r.type === 'snack' && !usedIds.has(r.id))
    .map(r => ({ ...r, _ms: matchScore(r, normalized) }))
    .sort((a, b) => b._ms - a._ms)
  const snackCandidates = normalized.length ? snackPool.filter(r => r._ms > 0).slice(0, 10) : snackPool.slice(0, 10)
  const snackSource = snackCandidates.length ? snackCandidates : snackPool
  const snack = snackSource.length ? shuffle(snackSource)[0] : null
  if (snack) usedIds.add(snack.id)

  let meals = [breakfast, lunch, dinner, snack].filter(Boolean)
  if (calMode) {
    let total = meals.reduce((s, r) => s + r.calories, 0)
    while (total > 1900 && meals.length > 3) {
      meals = meals.slice(0, -1)
      total = meals.reduce((s, r) => s + r.calories, 0)
    }
  }
  return meals
}

function generatePlan(approvedItems, prefs, calMode, weekMode, instructions = '') {
  const normalized   = approvedItems.map(normalize)
  const eligible     = RECIPES.filter(r => recipeMatchesPreferences(r, prefs.dietId, prefs.allergies))
  const usedIds      = new Set()
  const requirements = parseInstructions(instructions)
  const dayTargets   = requirements.length > 0 ? buildDayTargets(requirements) : []

  if (!weekMode) {
    const targets = dayTargets.length > 0 ? dayTargets[0] : []
    const meals = generateDay(eligible, normalized, usedIds, calMode, targets)
    return { week: [meals], single: true }
  }

  const week = []
  for (let d = 0; d < 7; d++) {
    const targets = dayTargets.length > 0 ? dayTargets[d] : []
    week.push(generateDay(eligible, normalized, usedIds, calMode, targets))
  }
  return { week, single: false }
}

// Strip quantity/unit prefix from an ingredient string
const UNIT_RE = /^\d[\d\s./]*(?:tbsp?|tsp?|cups?|oz|lbs?|g|ml|cloves?|slices?|pieces?|inch(?:es)?|cm|pinch(?:es)?|handful|dash|to\s+taste)\.?\s*/i

function buildShoppingList(week, approvedItems) {
  const normalizedHave = approvedItems.map(normalize)
  const needed = new Map()

  week.flat().forEach(recipe => {
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

function ShoppingListPanel({ title, desc, items, allGood, printLabel, onPrint, accentColor }) {
  const border  = accentColor === 'sage' ? 'border-sage-200'    : 'border-turmeric-200'
  const bg      = accentColor === 'sage' ? 'from-sage-50 to-turmeric-50' : 'from-turmeric-50 to-sage-50'
  const chip    = accentColor === 'sage' ? 'bg-sage-100 text-sage-700'   : 'bg-turmeric-100 text-turmeric-700'
  const checkbox= accentColor === 'sage' ? 'border-sage-400'    : 'border-turmeric-300'
  return (
    <div>
      <div className="flex items-center gap-3 mb-4 px-1">
        <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">{title}</p>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${chip}`}>{items.length} items</span>
      </div>
      <div className={`bg-gradient-to-r ${bg} border ${border} rounded-2xl p-5 mb-5`}>
        <p className="text-stone-700 text-sm leading-relaxed"><strong>{title}.</strong> {desc}</p>
      </div>
      {items.length === 0 ? (
        <div className="text-center py-10 text-stone-400">
          <div className="text-5xl mb-3">🎉</div>
          <p className="font-medium">{allGood}</p>
        </div>
      ) : (
        <div className="bg-white border border-stone-100 rounded-2xl divide-y divide-stone-50 shadow-sm slide-up">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-4 px-5 py-3.5">
              <span className={`flex-shrink-0 w-5 h-5 rounded border-2 ${checkbox} mt-0.5`} />
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-stone-800 capitalize">{item.ingredient}</span>
                <span className="ml-2 text-xs text-stone-400">
                  {item.recipes.slice(0, 3).join(', ')}{item.recipes.length > 3 ? ` +${item.recipes.length - 3}` : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-5 text-center no-print">
        <button onClick={onPrint} className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-600 transition-colors font-medium">
          {printLabel}
        </button>
      </div>
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

// ── Main component ────────────────────────────────────────────────────────────

export default function MealPlanner({ addToast, prefs, onPrefsChange }) {
  const { t } = useLanguage()
  const [groceries,      setGroceries]      = useState(() => localStorage.getItem('qf_groceries') || '')
  const [instructions,   setInstructions]   = useState(() => localStorage.getItem('qf_instructions') || '')
  const [instrListening, setInstrListening] = useState(false)
  const instrRecRef = useRef(null)
  const [calMode,   setCalMode]   = useState(false)
  const [weekMode,  setWeekMode]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState(null)
  const [activeDay, setActiveDay] = useState(0)
  const [modal,     setModal]     = useState(null)
  const [camera,    setCamera]    = useState(false)
  const [voice,     setVoice]     = useState(false)

  useEffect(() => { localStorage.setItem('qf_groceries',     groceries)    }, [groceries])
  useEffect(() => { localStorage.setItem('qf_instructions', instructions) }, [instructions])

  const toggleInstrMic = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    if (instrListening) {
      instrRecRef.current?.stop()
      return
    }
    const rec = new SR()
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript
      setInstructions(prev => prev ? prev + '. ' + text : text)
    }
    rec.onend = () => setInstrListening(false)
    rec.start()
    setInstrListening(true)
    instrRecRef.current = rec
  }

  const parsedRequirements  = useMemo(() => parseInstructions(instructions),        [instructions])
  const instrWarnings       = useMemo(() => findInflammatoryInText(instructions),    [instructions])

  const handleCameraItems = (items) => {
    setGroceries(prev => prev ? `${prev}, ${items.join(', ')}` : items.join(', '))
    setCamera(false)
  }
  const handleVoiceItems = (items) => {
    setGroceries(prev => prev ? `${prev}, ${items.join(', ')}` : items.join(', '))
    setVoice(false)
  }

  const printShoppingList = (shoppingList, week, title = t('planner.shopTitle')) => {
    const rows = shoppingList
      .map(item => `<tr><td style="padding:7px 16px 7px 0;border-bottom:1px solid #f0ede8;font-size:14px;text-transform:capitalize;vertical-align:top;">${item.ingredient}</td><td style="padding:7px 0;border-bottom:1px solid #f0ede8;font-size:12px;color:#888;vertical-align:top;">${item.recipes.join(', ')}</td></tr>`)
      .join('')
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;color:#1c1917;}h1{font-size:22px;font-weight:900;margin-bottom:4px;}p{font-size:12px;color:#888;margin:0 0 24px;}table{width:100%;border-collapse:collapse;}th{text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#a8a29e;padding-bottom:8px;border-bottom:2px solid #e7e5e4;}@media print{body{margin:20px;}}</style>
</head><body>
<h1>🛒 ${title}</h1>
<p>${shoppingList.length} items · ${week.flat().length} meals</p>
<table><thead><tr><th>Item</th><th>Used in</th></tr></thead><tbody>${rows}</tbody></table>
</body></html>`
    const w = window.open('', '_blank', 'width=700,height=600')
    w.document.write(html)
    w.document.close()
    w.focus()
    w.print()
  }

  const generate = () => {
    setLoading(true)
    setResult(null)
    setActiveDay(0)
    setTimeout(() => {
      const classified   = classifyFoods(groceries)
      const { week, single } = generatePlan(classified.approved, prefs, calMode, weekMode, instructions)
      const weekShoppingList = buildShoppingList(week, classified.approved)

      if (classified.inflammatory.length)
        addToast(`${classified.inflammatory.length} inflammatory item${classified.inflammatory.length > 1 ? 's' : ''} flagged`, 'warning')
      if (week.flat().length)
        addToast(weekMode ? 'Week plan ready! ✨' : 'Meal plan ready! ✨', 'success')
      else
        addToast('No recipes match — try adjusting preferences', 'warning')

      setResult({ classified, week, single, weekShoppingList, approvedItems: classified.approved })
      setLoading(false)
    }, 1500)
  }

  const dayMeals   = result ? result.week[activeDay] ?? [] : []
  const totalCal   = dayMeals.reduce((s, r) => s + r.calories, 0)
  const mealLabels = t('planner.mealLabels')
  const dayShort   = t('planner.dayShort')
  const dayNames   = t('planner.dayNames')

  // Recomputed whenever the active day tab changes
  const dayShoppingList = useMemo(
    () => result ? buildShoppingList([result.week[activeDay] ?? []], result.approvedItems) : [],
    [result, activeDay]
  )

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

        {/* ── Step 2.5: Meal Preferences ── */}
        <div className="mb-6">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-2 px-1">{t('planner.instrStep')}</p>
          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-stone-700">{t('planner.instrLabel')}</label>
              {('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) && (
                <button
                  onClick={toggleInstrMic}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-sm hover:-translate-y-0.5 ${
                    instrListening
                      ? 'bg-coral-500 text-white animate-pulse'
                      : 'bg-gradient-to-r from-sage-400 to-sage-500 text-white hover:from-sage-500 hover:to-sage-600'
                  }`}
                >
                  {instrListening ? '⏹ Stop' : '🎤 Speak'}
                </button>
              )}
            </div>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder={t('planner.instrPlaceholder')}
              className="w-full h-24 rounded-xl border border-stone-200 p-4 text-stone-700 placeholder-stone-300 resize-none focus:outline-none focus:ring-2 focus:ring-sage-300 text-sm"
            />
            {instrWarnings.length > 0 && (
              <div className="mt-3 bg-coral-50 border border-coral-200 rounded-xl px-4 py-3 flex items-start gap-3">
                <span className="text-lg flex-shrink-0">⚠️</span>
                <div>
                  <p className="text-coral-700 font-bold text-sm">Doesn't align with the anti-inflammatory program</p>
                  <p className="text-coral-600 text-xs mt-0.5">
                    These items are inflammatory and won't be included in your plan:{' '}
                    <span className="font-semibold capitalize">{instrWarnings.join(', ')}</span>.
                    Please remove them or choose approved alternatives.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-start mt-3 gap-4">
              <div className="flex-1">
                {parsedRequirements.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs text-stone-400 font-semibold self-center">{t('planner.instrParsed')}</span>
                    {parsedRequirements.map((req, i) => (
                      <span key={i} className="inline-flex items-center gap-1 bg-sage-100 text-sage-700 border border-sage-200 text-xs font-bold px-2.5 py-1 rounded-full capitalize">
                        {req.ingredient}
                        <span className="bg-sage-200 text-sage-800 rounded-full px-1.5 py-0.5 text-xs">{req.count}{t('planner.instrTimes')}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => setInstructions('')} className="text-sm text-stone-400 hover:text-stone-600 transition-colors flex-shrink-0">
                {t('planner.instrClear')}
              </button>
            </div>
            <p className="text-xs text-stone-400 mt-2">{t('planner.instrHint')}</p>
          </div>
        </div>

        {/* ── Step 3: Generate ── */}
        <div className="mb-10">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-3 px-1">{t('planner.step3')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 flex-wrap">

            {/* Duration toggle */}
            <div className="bg-white rounded-2xl p-1.5 flex gap-1 shadow-sm border border-stone-100">
              <button onClick={() => setWeekMode(false)} className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${!weekMode ? 'bg-stone-700 text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
                {t('planner.dayMode')}
              </button>
              <button onClick={() => setWeekMode(true)} className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${weekMode ? 'bg-stone-700 text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
                {t('planner.weekMode')}
              </button>
            </div>

            {/* Calorie toggle */}
            <div className="bg-white rounded-2xl p-1.5 flex gap-1 shadow-sm border border-stone-100">
              <button onClick={() => setCalMode(false)} className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${!calMode ? 'bg-sage-400 text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
                {t('planner.unlimited')}
              </button>
              <button onClick={() => setCalMode(true)} className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${calMode ? 'bg-blue-500 text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {[1,2,3,4].map(i => <Skeleton key={i} />)}
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

            {/* Meal plan + shopping lists */}
            <div>
              <div className="flex items-center justify-between mb-4 px-1">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                  {result.single ? t('planner.planTitle') : t('planner.weekTitle')}
                </p>
                {calMode && activeDay < 7 && dayMeals.length > 0 && (
                  <span className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-1.5 text-sm font-semibold text-blue-700">
                    📊 {totalCal} {t('planner.calories')} {totalCal >= 1700 && totalCal <= 1900 && '✅'}
                  </span>
                )}
              </div>

              {/* Tab bar — day tabs + 🛒 Week tab (week mode only) */}
              {!result.single && (
                <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 hide-scroll">
                  {result.week.map((dayMealsArr, d) => {
                    const dayCal = dayMealsArr.reduce((s, r) => s + r.calories, 0)
                    return (
                      <button
                        key={d}
                        onClick={() => setActiveDay(d)}
                        className={`flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                          activeDay === d
                            ? 'bg-sage-500 text-white shadow-md'
                            : 'bg-white border border-stone-100 text-stone-500 hover:border-sage-200 hover:text-sage-700'
                        }`}
                      >
                        <span className="text-xs font-semibold opacity-70">{dayShort[d]}</span>
                        <span className="text-base leading-tight">{dayNames[d].slice(0, 3)}</span>
                        {calMode && <span className="text-xs mt-0.5 opacity-60">{dayCal} cal</span>}
                      </button>
                    )
                  })}

                  {/* Week shopping list tab */}
                  <button
                    onClick={() => setActiveDay(7)}
                    className={`flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                      activeDay === 7
                        ? 'bg-turmeric-500 text-white shadow-md'
                        : 'bg-white border border-stone-100 text-stone-500 hover:border-turmeric-300 hover:text-turmeric-700'
                    }`}
                  >
                    <span className="text-lg leading-tight">🛒</span>
                    <span className="text-xs mt-0.5">{result.weekShoppingList.length} items</span>
                  </button>
                </div>
              )}

              {/* ── Week shopping list tab view ── */}
              {!result.single && activeDay === 7 ? (
                <ShoppingListPanel
                  title={t('planner.weekShopTitle')}
                  desc={t('planner.shopDesc')}
                  items={result.weekShoppingList}
                  allGood={t('planner.allGood')}
                  printLabel={t('planner.printShop')}
                  onPrint={() => printShoppingList(result.weekShoppingList, result.week, t('planner.weekShopTitle'))}
                  accentColor="turmeric"
                />
              ) : (
                /* ── Day meal cards ── */
                <>
                  {!result.single && (
                    <p className="text-sm font-bold text-stone-600 mb-4 px-1">{dayNames[activeDay]}</p>
                  )}

                  {dayMeals.length === 0 ? (
                    <div className="text-center py-12 text-stone-400">
                      <div className="text-5xl mb-3">🥗</div>
                      <p className="font-medium">{t('planner.noMatch')}</p>
                      <p className="text-sm mt-1">{t('planner.noMatchSub')}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {dayMeals.map((recipe, i) => (
                        <div key={recipe.id} className="slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                          <MealCard recipe={recipe} calMode={calMode} label={mealLabels[i]} onExpand={setModal} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Shopping list below meals */}
                  <div className="mt-10">
                    <ShoppingListPanel
                      title={result.single ? t('planner.shopTitle') : `${t('planner.dayShopTitle')} — ${dayNames[activeDay]}`}
                      desc={t('planner.shopDesc')}
                      items={result.single ? result.weekShoppingList : dayShoppingList}
                      allGood={t('planner.allGood')}
                      printLabel={t('planner.printShop')}
                      onPrint={() => result.single
                        ? printShoppingList(result.weekShoppingList, result.week, t('planner.shopTitle'))
                        : printShoppingList(dayShoppingList, [result.week[activeDay]], `${t('planner.dayShopTitle')} — ${dayNames[activeDay]}`)
                      }
                      accentColor="turmeric"
                    />
                  </div>
                </>
              )}
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
