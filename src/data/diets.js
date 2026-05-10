const MEAT       = ['chicken', 'turkey', 'beef', 'pork', 'lamb', 'processed meat', 'chicken breast', 'turkey breast']
const FISH       = ['salmon', 'wild salmon', 'tuna', 'sardines', 'mackerel', 'fish', 'seafood', 'shrimp']
const EGGS       = ['eggs', 'egg']
const DAIRY      = ['dairy', 'milk', 'cheese', 'yogurt', 'butter', 'cream', 'whey']
const HONEY      = ['honey']
const RED_MEAT   = ['beef', 'pork', 'lamb', 'processed meat']
const GLUTEN     = ['wheat', 'barley', 'rye', 'bread', 'pasta', 'flour', 'seitan']
const HIGH_CARB  = ['quinoa', 'brown rice', 'oats', 'farro', 'buckwheat', 'banana', 'mango', 'pineapple', 'lentils', 'black beans', 'chickpeas', 'edamame']

export const DIETS = [
  {
    id: 'no-limit',
    label: 'No Limit / Standard',
    emoji: '🍽',
    group: 'No Limit & Specialized',
    description: 'No restrictions — all foods included',
    excludes: [],
  },
  {
    id: 'vegan',
    label: 'Vegan',
    emoji: '🌱',
    group: 'Plant-Based & Vegetarian',
    description: 'Excludes all animal-derived foods',
    excludes: [...MEAT, ...FISH, ...EGGS, ...DAIRY, ...HONEY],
  },
  {
    id: 'lacto-ovo-vegetarian',
    label: 'Lacto-Ovo Vegetarian',
    emoji: '🥚',
    group: 'Plant-Based & Vegetarian',
    description: 'No meat or fish; includes dairy and eggs',
    excludes: [...MEAT, ...FISH],
  },
  {
    id: 'lacto-vegetarian',
    label: 'Lacto Vegetarian',
    emoji: '🧀',
    group: 'Plant-Based & Vegetarian',
    description: 'No meat, fish or eggs; includes dairy',
    excludes: [...MEAT, ...FISH, ...EGGS],
  },
  {
    id: 'ovo-vegetarian',
    label: 'Ovo Vegetarian',
    emoji: '🥚',
    group: 'Plant-Based & Vegetarian',
    description: 'No meat, fish or dairy; includes eggs',
    excludes: [...MEAT, ...FISH, ...DAIRY],
  },
  {
    id: 'fruitarian',
    label: 'Fruitarian',
    emoji: '🍎',
    group: 'Plant-Based & Vegetarian',
    description: 'Primarily raw fruit',
    excludes: [...MEAT, ...FISH, ...EGGS, ...DAIRY, ...HONEY, 'quinoa', 'brown rice', 'oats', 'farro', 'buckwheat'],
  },
  {
    id: 'pescatarian',
    label: 'Pescatarian',
    emoji: '🐟',
    group: 'Pescatarian & Flexible',
    description: 'Plant-based + fish and seafood; no meat',
    excludes: [...MEAT],
  },
  {
    id: 'flexitarian',
    label: 'Flexitarian / Semi-Vegetarian',
    emoji: '🥗',
    group: 'Pescatarian & Flexible',
    description: 'Primarily plant-based, occasionally includes meat',
    excludes: [],
  },
  {
    id: 'pollotarian',
    label: 'Pollotarian',
    emoji: '🍗',
    group: 'Pescatarian & Flexible',
    description: 'Poultry only — no red meat or fish',
    excludes: [...FISH, ...RED_MEAT],
  },
  {
    id: 'beegan',
    label: 'Beegan',
    emoji: '🍯',
    group: 'Plant-Based & Vegetarian',
    description: 'Vegan diet that includes honey',
    excludes: [...MEAT, ...FISH, ...EGGS, ...DAIRY],
  },
  {
    id: 'mediterranean',
    label: 'Mediterranean',
    emoji: '🫒',
    group: 'No Limit & Specialized',
    description: 'Plant-forward with fish, olive oil, nuts; low red meat',
    excludes: [...RED_MEAT],
  },
  {
    id: 'no-dairy',
    label: 'No Dairy / Dairy-Free',
    emoji: '🚫',
    group: 'No Limit & Specialized',
    description: 'Avoids all milk-based products',
    excludes: [...DAIRY],
  },
  {
    id: 'gluten-free',
    label: 'Gluten-Free',
    emoji: '🌾',
    group: 'No Limit & Specialized',
    description: 'Eliminates wheat, barley, and rye',
    excludes: [...GLUTEN],
  },
  {
    id: 'keto',
    label: 'Keto',
    emoji: '🥑',
    group: 'No Limit & Specialized',
    description: 'Low-carb, high-fat — designed to induce ketosis',
    excludes: [...HIGH_CARB],
  },
  {
    id: 'vegan-before-6',
    label: 'Vegan Before 6 PM',
    emoji: '⏰',
    group: 'Lifestyle / Time-Based',
    description: 'Vegan until 6 PM, unrestricted after',
    excludes: [],
  },
  {
    id: 'raw-food',
    label: 'Raw Food Diet',
    emoji: '🥦',
    group: 'Lifestyle / Time-Based',
    description: 'Unprocessed raw plant foods only',
    excludes: [...MEAT, ...FISH, ...EGGS, ...DAIRY],
  },
]

export const DIET_GROUPS = [
  'Plant-Based & Vegetarian',
  'Pescatarian & Flexible',
  'No Limit & Specialized',
  'Lifestyle / Time-Based',
]

// Returns true if a recipe passes the diet + allergy filter
export function recipeMatchesPreferences(recipe, dietId, allergies) {
  const diet = DIETS.find(d => d.id === dietId) || DIETS[0]
  const ingredientText = recipe.ingredients.join(' ').toLowerCase()

  // Check diet exclusions
  for (const excluded of diet.excludes) {
    if (ingredientText.includes(excluded.toLowerCase())) return false
  }

  // Check user allergies
  if (allergies && allergies.trim()) {
    const allergens = allergies.split(/[,;\n]+/).map(s => s.trim().toLowerCase()).filter(Boolean)
    for (const allergen of allergens) {
      if (allergen && ingredientText.includes(allergen)) return false
    }
  }

  return true
}
