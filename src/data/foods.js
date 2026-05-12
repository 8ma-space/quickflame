export const APPROVED = {
  proteins:    ['wild salmon','sardines','mackerel','tuna','chicken breast','turkey','eggs','lentils','black beans','chickpeas','edamame','tofu','tempeh','grass-fed beef','bison','lamb'],
  vegetables:  ['spinach','kale','arugula','broccoli','cauliflower','brussels sprouts','sweet potato','beets','carrots','celery','cucumber','zucchini','bell peppers','tomatoes','red onion','garlic','ginger','mushrooms','asparagus','artichoke','bok choy'],
  fruits:      ['blueberries','strawberries','raspberries','blackberries','cherries','pomegranate','oranges','lemon','lime','avocado','apples','pineapple','mango','banana'],
  grains:      ['quinoa','brown rice','oats','farro','buckwheat','whole grain bread'],
  fats:        ['extra virgin olive oil','avocado oil','coconut oil','walnuts','almonds','cashews','flaxseeds','chia seeds','hemp seeds','pumpkin seeds'],
  herbs:       ['turmeric','ginger','cinnamon','rosemary','thyme','oregano','basil','parsley','cilantro','black pepper','cayenne'],
  dairy_alt:   ['almond milk','oat milk','coconut milk','coconut yogurt','almond yogurt'],
  sweeteners:  ['raw honey','maple syrup','medjool dates'],
}

export const INFLAMMATORY = [
  'sugar','white flour','white bread','white rice','processed meat','deli meat','bacon','sausage',
  'vegetable oil','canola oil','corn oil','margarine','fast food','fried food','alcohol','soda',
  'artificial sweetener','chips','refined crackers','aged cheese','cow milk','ice cream',
  'refined pasta','corn syrup','candy','hot dog','salami','pepperoni','doritos','cheetos',
  'french fries','coca cola','pepsi','energy drink','red bull','beer','wine','whiskey','vodka',
  'butter','cream','mayonnaise',
]

export const ALL_APPROVED_FLAT = Object.values(APPROVED).flat()

export const APPROVED_CATEGORIES = [
  { key:'proteins',   label:'Proteins',           emoji:'🐟', color:'bg-blue-50 border-blue-200',   text:'text-blue-700',   badge:'bg-blue-100 text-blue-700' },
  { key:'vegetables', label:'Vegetables',          emoji:'🥦', color:'bg-sage-50 border-sage-200',   text:'text-sage-700',   badge:'bg-sage-100 text-sage-700' },
  { key:'fruits',     label:'Fruits',              emoji:'🫐', color:'bg-purple-50 border-purple-200',text:'text-purple-700', badge:'bg-purple-100 text-purple-700' },
  { key:'grains',     label:'Whole Grains',        emoji:'🌾', color:'bg-turmeric-50 border-turmeric-200', text:'text-turmeric-700', badge:'bg-turmeric-100 text-turmeric-700' },
  { key:'fats',       label:'Fats & Oils',         emoji:'🥑', color:'bg-green-50 border-green-200', text:'text-green-700',  badge:'bg-green-100 text-green-700' },
  { key:'herbs',      label:'Herbs & Spices',      emoji:'🌿', color:'bg-emerald-50 border-emerald-200', text:'text-emerald-700', badge:'bg-emerald-100 text-emerald-700' },
  { key:'dairy_alt',  label:'Dairy Alternatives',  emoji:'🥛', color:'bg-sky-50 border-sky-200',     text:'text-sky-700',    badge:'bg-sky-100 text-sky-700' },
  { key:'sweeteners', label:'Natural Sweeteners',  emoji:'🍯', color:'bg-amber-50 border-amber-200', text:'text-amber-700',  badge:'bg-amber-100 text-amber-700' },
]

export const SHOPPING_BOOSTS = [
  { emoji:'🐟', name:'Wild salmon (canned)',   price:'$3–5', unlocks:'Salmon bowls, poke, breakfast scrambles' },
  { emoji:'🫘', name:'Canned chickpeas',        price:'$1–2', unlocks:'Salads, curries, avocado smash bowls' },
  { emoji:'🌿', name:'Fresh ginger root',       price:'$1–2', unlocks:'Soups, stir-fries, smoothies, shots' },
  { emoji:'🧡', name:'Ground turmeric',         price:'$2–4', unlocks:'Golden milk, curries, egg scrambles' },
  { emoji:'🥑', name:'Avocado (2-pack)',         price:'$2–4', unlocks:'Toast, bowls, wraps, egg cups' },
  { emoji:'🫐', name:'Frozen blueberries',      price:'$3–5', unlocks:'Smoothie bowls, oats, chia pudding' },
  { emoji:'🌰', name:'Raw walnuts',             price:'$3–5', unlocks:'Trail mix, oatmeal, energy bites' },
  { emoji:'🌱', name:'Chia seeds',              price:'$3–5', unlocks:'Pudding, smoothies, overnight oats' },
]
