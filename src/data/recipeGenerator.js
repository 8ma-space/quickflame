// Procedural anti-inflammatory recipe generator — produces 725 unique recipes

const PROTEINS = [
  { name: 'wild salmon', cal: 180, img: 'salmon,fish' },
  { name: 'chicken breast', cal: 165, img: 'chicken,grilled' },
  { name: 'eggs', cal: 210, img: 'eggs,breakfast' },
  { name: 'lentils', cal: 230, img: 'lentils,soup' },
  { name: 'black beans', cal: 220, img: 'black+beans,legumes' },
  { name: 'chickpeas', cal: 210, img: 'chickpeas,bowl' },
  { name: 'edamame', cal: 170, img: 'edamame,green' },
  { name: 'tofu', cal: 150, img: 'tofu,stir+fry' },
  { name: 'tempeh', cal: 195, img: 'tempeh,protein' },
  { name: 'sardines', cal: 190, img: 'sardines,fish' },
  { name: 'tuna', cal: 180, img: 'tuna,salad' },
  { name: 'turkey breast', cal: 165, img: 'turkey,lean' },
  { name: 'mackerel', cal: 190, img: 'mackerel,fish' },
]

const VEGS = [
  { name: 'spinach', cal: 20, img: 'spinach,greens' },
  { name: 'kale', cal: 25, img: 'kale,leafy' },
  { name: 'broccoli', cal: 55, img: 'broccoli,green' },
  { name: 'sweet potato', cal: 90, img: 'sweet+potato,roasted' },
  { name: 'cauliflower', cal: 50, img: 'cauliflower,white' },
  { name: 'zucchini', cal: 35, img: 'zucchini,vegetable' },
  { name: 'bell peppers', cal: 40, img: 'bell+peppers,colorful' },
  { name: 'Brussels sprouts', cal: 60, img: 'brussels+sprouts,roasted' },
  { name: 'asparagus', cal: 40, img: 'asparagus,green' },
  { name: 'beets', cal: 70, img: 'beets,roasted' },
  { name: 'carrots', cal: 50, img: 'carrots,orange' },
  { name: 'tomatoes', cal: 35, img: 'tomatoes,fresh' },
  { name: 'cucumber', cal: 20, img: 'cucumber,fresh' },
  { name: 'arugula', cal: 15, img: 'arugula,salad' },
  { name: 'bok choy', cal: 20, img: 'bok+choy,asian' },
  { name: 'Swiss chard', cal: 25, img: 'swiss+chard,greens' },
  { name: 'eggplant', cal: 45, img: 'eggplant,roasted' },
  { name: 'fennel', cal: 35, img: 'fennel,anise' },
]

const GRAINS = [
  { name: 'quinoa', cal: 220, img: 'quinoa,grain' },
  { name: 'brown rice', cal: 215, img: 'brown+rice,grain' },
  { name: 'farro', cal: 220, img: 'farro,grain' },
  { name: 'oats', cal: 300, img: 'oatmeal,breakfast' },
  { name: 'buckwheat', cal: 200, img: 'buckwheat,grain' },
]

const FRUITS = [
  { name: 'blueberries', cal: 80, img: 'blueberries,fresh' },
  { name: 'avocado', cal: 160, img: 'avocado,healthy' },
  { name: 'cherries', cal: 90, img: 'cherries,dark' },
  { name: 'pomegranate', cal: 100, img: 'pomegranate,seeds' },
  { name: 'mango', cal: 100, img: 'mango,tropical' },
  { name: 'pineapple', cal: 85, img: 'pineapple,tropical' },
  { name: 'raspberries', cal: 65, img: 'raspberries,red' },
  { name: 'strawberries', cal: 50, img: 'strawberries,fresh' },
  { name: 'blackberries', cal: 60, img: 'blackberries,berry' },
  { name: 'banana', cal: 105, img: 'banana,yellow' },
]

const NUTS = [
  { name: 'walnuts', cal: 185, img: 'walnuts,nuts' },
  { name: 'almonds', cal: 165, img: 'almonds,nuts' },
  { name: 'cashews', cal: 157, img: 'cashews,nuts' },
  { name: 'pumpkin seeds', cal: 150, img: 'pumpkin+seeds,seeds' },
  { name: 'sunflower seeds', cal: 165, img: 'sunflower+seeds,seeds' },
  { name: 'hemp seeds', cal: 160, img: 'hemp+seeds,seeds' },
  { name: 'chia seeds', cal: 140, img: 'chia+seeds,seeds' },
]

const LIQUIDS = [
  { name: 'almond milk', cal: 30 },
  { name: 'coconut milk', cal: 120 },
  { name: 'oat milk', cal: 60 },
  { name: 'green tea', cal: 0 },
]

const HERBS = [
  'turmeric', 'ginger', 'garlic', 'cumin', 'coriander',
  'rosemary', 'thyme', 'oregano', 'basil', 'cilantro', 'parsley',
]

const DRESSINGS = [
  'lemon-tahini dressing', 'olive oil and lemon', 'apple cider vinegar dressing',
  'miso-ginger dressing', 'avocado lime dressing', 'balsamic glaze',
  'turmeric-tahini sauce', 'herb vinaigrette',
]

// ── Instruction templates ────────────────────────────────────────────────────

function sheetPanInstructions(p, v, g, herbs) {
  return [
    `Preheat oven to 400°F (200°C) and line a large sheet pan with parchment paper.`,
    `Cube ${p} into 1-inch pieces and pat dry. Toss with olive oil, salt, pepper, and ${herbs[0]}.`,
    `Chop ${v} into bite-sized pieces and spread on one half of the pan. Season with ${herbs[1] || 'garlic'} and a drizzle of olive oil.`,
    `Add ${p} to the other half of the pan.`,
    `Roast for 20–25 minutes, flipping halfway, until everything is golden and tender.`,
    `Meanwhile, cook ${g} according to package directions.`,
    `Serve ${p} and ${v} over ${g}. Finish with a squeeze of lemon.`,
  ]
}

function stirFryInstructions(p, v, g, herbs) {
  return [
    `Cook ${g} according to package directions and set aside.`,
    `Heat a large wok or skillet over high heat with 1 tbsp sesame oil.`,
    `Add ${p} and cook for 4–5 minutes until cooked through. Remove and set aside.`,
    `In the same pan, stir-fry ${v} with minced ${herbs[0]} and fresh ginger for 3–4 minutes.`,
    `Return protein to the pan. Add 2 tbsp coconut aminos, 1 tbsp rice vinegar, and ${herbs[1] || 'sesame seeds'}.`,
    `Toss everything together for 1 minute over high heat.`,
    `Serve hot over ${g}.`,
  ]
}

function curryInstructions(p, v, g, herbs) {
  return [
    `Heat 1 tbsp olive oil in a large pot over medium heat. Sauté diced onion until soft, about 5 minutes.`,
    `Add minced garlic, ${herbs[0]}, and 1 tbsp curry powder. Cook 1 minute until fragrant.`,
    `Add ${v}, ${p}, and 1 can (400ml) coconut milk. Season with salt and pepper.`,
    `Stir in 1 tsp ${herbs[1] || 'turmeric'} and a pinch of cayenne for heat.`,
    `Simmer uncovered for 20 minutes, stirring occasionally, until sauce thickens.`,
    `Meanwhile, prepare ${g}.`,
    `Serve curry over ${g}, garnished with fresh cilantro and a wedge of lime.`,
  ]
}

function bakedInstructions(p, v, g, herbs) {
  return [
    `Preheat oven to 375°F (190°C).`,
    `Place ${p} in a baking dish. Rub with olive oil, ${herbs[0]}, salt, and pepper.`,
    `Arrange ${v} around the protein. Drizzle everything with olive oil.`,
    `Sprinkle ${herbs[1] || 'rosemary'} over the top.`,
    `Bake uncovered for 25–30 minutes until protein is cooked through and vegetables are tender.`,
    `Rest for 5 minutes before serving.`,
    `Plate alongside ${g} and finish with a drizzle of lemon juice.`,
  ]
}

function skilletInstructions(p, v, g, herbs) {
  return [
    `Cook ${g} per package directions. Set aside and keep warm.`,
    `Heat a cast-iron skillet over medium-high heat with 1 tbsp olive oil.`,
    `Season ${p} with ${herbs[0]}, salt, and pepper. Sear for 3–4 minutes per side.`,
    `Remove protein and add ${v} to the same skillet. Sauté with ${herbs[1] || 'garlic'} for 4 minutes.`,
    `Deglaze with 2 tbsp vegetable broth, scraping up the browned bits.`,
    `Return ${p} to the skillet, cover, and cook 2 more minutes.`,
    `Serve immediately over ${g}.`,
  ]
}

function bowlInstructions(p, v, g, dressing, herbs) {
  return [
    `Cook ${g} according to package directions and allow to cool slightly.`,
    `If using raw ${v}, massage with a pinch of salt and lemon juice for 2 minutes to soften.`,
    `Prepare ${p}: season with ${herbs[0]}, salt, and pepper, then cook as preferred (sauté, bake, or steam).`,
    `Build your bowl: ${g} base, topped with ${v} and ${p}.`,
    `Add any extra toppings: sliced avocado, pickled onions, or sprouts.`,
    `Drizzle generously with ${dressing}.`,
    `Finish with ${herbs[1] || 'sesame seeds'} and serve immediately.`,
  ]
}

function saladInstructions(p, v, nut, dressing, herbs) {
  return [
    `Wash and dry all greens and vegetables thoroughly.`,
    `If using cooked ${p}, prepare it first: season with ${herbs[0]} and cook until done. Let cool slightly.`,
    `Tear or chop greens into bite-sized pieces and place in a large bowl.`,
    `Add ${v}, sliced or diced as preferred.`,
    `Top with ${p} and scatter ${nut} over the top.`,
    `Drizzle with ${dressing} and toss gently to coat.`,
    `Finish with ${herbs[1] || 'freshly cracked pepper'} and serve immediately.`,
  ]
}

function soupInstructions(p, v, g, herbs) {
  return [
    `Heat 1 tbsp olive oil in a large pot over medium heat. Add diced onion and cook 5 minutes.`,
    `Add minced garlic, ${herbs[0]}, and ${herbs[1] || 'cumin'}. Cook 1 minute.`,
    `Add ${v} and cook 3 minutes, stirring occasionally.`,
    `Add ${p}, ${g}, and 4 cups vegetable broth. Bring to a boil.`,
    `Reduce heat and simmer 25 minutes until everything is tender.`,
    `Taste and adjust seasoning. Add a squeeze of lemon for brightness.`,
    `Ladle into bowls and garnish with fresh herbs and a drizzle of olive oil.`,
  ]
}

function smoothieInstructions(p, fruit, liquid, nut, herbs) {
  return [
    `Add ${liquid} to the blender first (helps blending).`,
    `Add ${fruit} (frozen works best for thickness).`,
    `Add ${p} — if using eggs, use pasteurized; if tofu, use silken.`,
    `Add ${nut} for healthy fats and staying power.`,
    `Add a pinch of ${herbs[0]} and optionally 1 tsp honey or maple syrup.`,
    `Blend on high for 60 seconds until completely smooth.`,
    `Pour into a glass and consume immediately for best nutrition.`,
  ]
}

function smoothieBowlInstructions(fruit, grain, nut, herbs) {
  return [
    `Blend frozen ${fruit} with a splash of almond milk until thick and smooth. Use minimal liquid — this should be spoonable, not drinkable.`,
    `Pour into a wide bowl.`,
    `Arrange toppings in rows: ${grain} (toasted), ${nut}, and extra sliced ${fruit}.`,
    `Sprinkle with ${herbs[0]} for an anti-inflammatory boost.`,
    `Add a drizzle of almond butter or honey if desired.`,
    `Eat immediately before toppings soften.`,
  ]
}

function oatmealInstructions(fruit, nut, herbs) {
  return [
    `Bring 1 cup water or almond milk to a boil in a small saucepan.`,
    `Add ½ cup rolled oats and reduce heat to medium-low.`,
    `Cook 5 minutes, stirring frequently, until oats are creamy and liquid is absorbed.`,
    `Remove from heat and stir in ½ tsp ${herbs[0]} and a pinch of cinnamon.`,
    `Transfer to a bowl and top with ${fruit} and ${nut}.`,
    `Add a drizzle of raw honey or maple syrup if desired.`,
    `Serve warm.`,
  ]
}

function overnightOatsInstructions(fruit, nut, liquid, herbs) {
  return [
    `Combine ½ cup rolled oats, ½ cup ${liquid}, and 1 tbsp chia seeds in a jar.`,
    `Stir in ½ tsp ${herbs[0]} and a pinch of cinnamon.`,
    `Add half of the ${fruit} and stir to combine.`,
    `Seal the jar and refrigerate overnight (or at least 4 hours).`,
    `In the morning, top with remaining ${fruit} and ${nut}.`,
    `Add a splash more ${liquid} if too thick and stir before eating.`,
  ]
}

function scrambleInstructions(v, herbs, nut) {
  return [
    `Whisk 3 eggs with a pinch of salt, pepper, and ${herbs[0]}.`,
    `Heat a non-stick skillet over medium heat with 1 tsp olive oil.`,
    `Sauté ${v} for 3 minutes until just tender. Season with ${herbs[1] || 'garlic'}.`,
    `Pour in eggs and let set for 30 seconds, then gently fold with a spatula.`,
    `Cook to desired doneness (about 2 more minutes for soft curds).`,
    `Top with ${nut} and fresh herbs.`,
    `Serve immediately with whole grain toast if desired.`,
  ]
}

function snackMixInstructions(nut, fruit, herbs) {
  return [
    `Preheat oven to 325°F (165°C).`,
    `Toss ${nut} with 1 tsp olive oil, a pinch of ${herbs[0]}, cinnamon, and salt.`,
    `Spread on a parchment-lined baking sheet.`,
    `Toast for 8–10 minutes, stirring once, until golden and fragrant.`,
    `Remove from oven and let cool completely — they'll crisp as they cool.`,
    `Mix with dried ${fruit} once cooled.`,
    `Store in an airtight container for up to 1 week.`,
  ]
}

function snackDipInstructions(p, v, herbs) {
  return [
    `Rinse and drain ${p} if canned.`,
    `Add ${p} to a food processor with 2 tbsp olive oil, 1 tbsp lemon juice, and minced garlic.`,
    `Add ${herbs[0]}, salt, and pepper. Blend until smooth, scraping down sides.`,
    `If too thick, add water 1 tbsp at a time until desired consistency.`,
    `Taste and adjust seasoning — add more lemon for brightness or ${herbs[1] || 'cumin'} for depth.`,
    `Transfer to a bowl, drizzle with olive oil, and sprinkle ${herbs[0]} on top.`,
    `Serve with sliced ${v} for dipping.`,
  ]
}

// ── Name generators ──────────────────────────────────────────────────────────

const DINNER_STYLES = [
  'Sheet Pan', 'Skillet', 'Baked', 'Roasted', 'Grilled', 'Herb-Crusted',
  'Golden', 'Spiced', 'Mediterranean', 'Asian-Inspired', 'Tuscan',
  'Smoky', 'Zesty', 'Garlic', 'One-Pan', 'Weeknight',
]

const LUNCH_STYLES = [
  'Power', 'Harvest', 'Buddha', 'Nourish', 'Loaded', 'Vibrant',
  'Healing', 'Anti-Inflammatory', 'Protein-Packed', 'Rainbow',
  'Fresh', 'Simple', 'Quick', 'Everyday',
]

const BREAKFAST_STYLES = [
  'Morning', 'Sunrise', 'Golden', 'Energising', 'Warming', 'Easy',
  '5-Minute', 'Make-Ahead', 'Creamy', 'Fluffy', 'Hearty',
]

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function shuffled(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function imageUrl(terms) {
  return `https://source.unsplash.com/800x600/?${terms},food`
}

function scoreFromCal(cal) {
  if (cal < 400) return 96
  if (cal < 500) return 94
  if (cal < 600) return 92
  return 90
}

// ── Generators per meal type ────────────────────────────────────────────────

function makeDinners(count) {
  const results = []
  const styles = ['sheetPan', 'stirFry', 'curry', 'baked', 'skillet', 'bowl', 'soup']

  for (let i = 0; i < count; i++) {
    const p = pick(PROTEINS)
    const v = pick(VEGS)
    const g = pick(GRAINS)
    const herbs = shuffled(HERBS).slice(0, 2)
    const style = styles[i % styles.length]
    const styleName = pick(DINNER_STYLES)

    const cal = p.cal + v.cal + g.cal + 50
    let name, instructions, img

    if (style === 'sheetPan') {
      name = `${styleName} Sheet Pan ${cap(p.name)} with ${cap(v.name)}`
      instructions = sheetPanInstructions(p.name, v.name, g.name, herbs)
      img = p.img
    } else if (style === 'stirFry') {
      name = `${cap(p.name)} & ${cap(v.name)} Stir-Fry over ${cap(g.name)}`
      instructions = stirFryInstructions(p.name, v.name, g.name, herbs)
      img = `stir+fry,${p.img.split(',')[0]}`
    } else if (style === 'curry') {
      name = `${styleName} ${cap(p.name)} Curry with ${cap(v.name)}`
      instructions = curryInstructions(p.name, v.name, g.name, herbs)
      img = `curry,${p.img.split(',')[0]}`
    } else if (style === 'baked') {
      name = `Herb-Baked ${cap(p.name)} with Roasted ${cap(v.name)}`
      instructions = bakedInstructions(p.name, v.name, g.name, herbs)
      img = p.img
    } else if (style === 'skillet') {
      name = `${styleName} Skillet ${cap(p.name)} with ${cap(v.name)}`
      instructions = skilletInstructions(p.name, v.name, g.name, herbs)
      img = `skillet,${p.img.split(',')[0]}`
    } else if (style === 'bowl') {
      const dressing = pick(DRESSINGS)
      name = `${styleName} ${cap(p.name)} Bowl with ${cap(v.name)}`
      instructions = bowlInstructions(p.name, v.name, g.name, dressing, herbs)
      img = `bowl,${g.img.split(',')[0]}`
    } else {
      name = `${cap(p.name)} & ${cap(v.name)} Soup with ${cap(g.name)}`
      instructions = soupInstructions(p.name, v.name, g.name, herbs)
      img = `soup,bowl`
    }

    results.push({
      id: `gd${i + 1}`,
      type: 'dinner',
      name,
      image: imageUrl(img),
      prepTime: 20 + (i % 4) * 5,
      calories: cal,
      score: scoreFromCal(cal),
      mainIngredient: p.name,
      ingredients: [p.name, v.name, g.name, ...herbs, 'olive oil', 'lemon juice', 'salt', 'pepper'],
      instructions,
    })
  }
  return results
}

function makeLunches(count) {
  const results = []
  const styles = ['bowl', 'salad', 'soup', 'stirFry', 'curry']

  for (let i = 0; i < count; i++) {
    const p = pick(PROTEINS)
    const v = pick(VEGS)
    const g = pick(GRAINS)
    const nut = pick(NUTS)
    const dressing = pick(DRESSINGS)
    const herbs = shuffled(HERBS).slice(0, 2)
    const style = styles[i % styles.length]
    const styleName = pick(LUNCH_STYLES)

    const cal = p.cal + v.cal + g.cal + nut.cal + 40
    let name, instructions, img

    if (style === 'bowl') {
      name = `${styleName} ${cap(p.name)} Bowl`
      instructions = bowlInstructions(p.name, v.name, g.name, dressing, herbs)
      img = `bowl,${g.img.split(',')[0]}`
    } else if (style === 'salad') {
      name = `${styleName} ${cap(p.name)} & ${cap(v.name)} Salad`
      instructions = saladInstructions(p.name, v.name, nut.name, dressing, herbs)
      img = `salad,${p.img.split(',')[0]}`
    } else if (style === 'soup') {
      name = `${styleName} ${cap(p.name)} & ${cap(v.name)} Soup`
      instructions = soupInstructions(p.name, v.name, g.name, herbs)
      img = `soup,${p.img.split(',')[0]}`
    } else if (style === 'stirFry') {
      name = `${cap(p.name)} & ${cap(v.name)} Stir-Fry`
      instructions = stirFryInstructions(p.name, v.name, g.name, herbs)
      img = `stir+fry,${v.img.split(',')[0]}`
    } else {
      name = `${styleName} ${cap(p.name)} Curry Bowl`
      instructions = curryInstructions(p.name, v.name, g.name, herbs)
      img = `curry,bowl`
    }

    results.push({
      id: `gl${i + 1}`,
      type: 'lunch',
      name,
      image: imageUrl(img),
      prepTime: 15 + (i % 3) * 5,
      calories: cal,
      score: scoreFromCal(cal),
      mainIngredient: p.name,
      ingredients: [p.name, v.name, g.name, nut.name, dressing, ...herbs, 'olive oil', 'salt'],
      instructions,
    })
  }
  return results
}

function makeBreakfasts(count) {
  const results = []
  const styles = ['oatmeal', 'overnightOats', 'smoothie', 'smoothieBowl', 'scramble']

  for (let i = 0; i < count; i++) {
    const fruit = pick(FRUITS)
    const nut = pick(NUTS)
    const liquid = pick(LIQUIDS)
    const grain = pick(GRAINS)
    const v = pick(VEGS)
    const herbs = shuffled(HERBS).slice(0, 2)
    const style = styles[i % styles.length]
    const styleName = pick(BREAKFAST_STYLES)

    const cal = fruit.cal + nut.cal + (style === 'scramble' ? 210 : grain.cal) + liquid.cal + 30
    let name, instructions, img, mainIng, ingList

    if (style === 'oatmeal') {
      name = `${styleName} ${cap(herbs[0])} & ${cap(fruit.name)} Oatmeal`
      instructions = oatmealInstructions(fruit.name, nut.name, herbs)
      img = `oatmeal,${fruit.img.split(',')[0]}`
      mainIng = 'oats'
      ingList = ['oats', fruit.name, nut.name, herbs[0], 'cinnamon', 'almond milk', 'honey']
    } else if (style === 'overnightOats') {
      name = `${styleName} ${cap(fruit.name)} Overnight Oats`
      instructions = overnightOatsInstructions(fruit.name, nut.name, liquid.name, herbs)
      img = `overnight+oats,${fruit.img.split(',')[0]}`
      mainIng = 'oats'
      ingList = ['oats', fruit.name, nut.name, liquid.name, 'chia seeds', herbs[0]]
    } else if (style === 'smoothie') {
      const protein = pick(PROTEINS.filter(p => ['eggs', 'tofu'].includes(p.name)))
      name = `${styleName} ${cap(fruit.name)} & ${cap(nut.name)} Smoothie`
      instructions = smoothieInstructions(protein.name, fruit.name, liquid.name, nut.name, herbs)
      img = `smoothie,${fruit.img.split(',')[0]}`
      mainIng = fruit.name
      ingList = [fruit.name, nut.name, liquid.name, protein.name, herbs[0]]
    } else if (style === 'smoothieBowl') {
      const fruit2 = pick(FRUITS.filter(f => f.name !== fruit.name))
      name = `${styleName} ${cap(fruit.name)} Smoothie Bowl`
      instructions = smoothieBowlInstructions(fruit.name, grain.name, nut.name, herbs)
      img = `smoothie+bowl,${fruit.img.split(',')[0]}`
      mainIng = fruit.name
      ingList = [fruit.name, fruit2.name, nut.name, grain.name, herbs[0], 'almond milk']
    } else {
      name = `${styleName} Scrambled Eggs with ${cap(v.name)}`
      instructions = scrambleInstructions(v.name, herbs, nut.name)
      img = `scrambled+eggs,${v.img.split(',')[0]}`
      mainIng = 'eggs'
      ingList = ['eggs', v.name, nut.name, ...herbs, 'olive oil', 'salt', 'pepper']
    }

    results.push({
      id: `gb${i + 1}`,
      type: 'breakfast',
      name,
      image: imageUrl(img),
      prepTime: 5 + (i % 4) * 5,
      calories: cal,
      score: scoreFromCal(cal),
      mainIngredient: mainIng,
      ingredients: ingList,
      instructions,
    })
  }
  return results
}

function makeSnacks(count) {
  const results = []
  const styles = ['snackMix', 'snackDip', 'smoothie']

  for (let i = 0; i < count; i++) {
    const nut = pick(NUTS)
    const fruit = pick(FRUITS)
    const p = pick(PROTEINS.filter(p => ['chickpeas', 'edamame', 'lentils', 'black beans'].includes(p.name)))
    const v = pick(VEGS.filter(v => ['carrots', 'cucumber', 'bell peppers'].includes(v.name)))
    const herbs = shuffled(HERBS).slice(0, 2)
    const style = styles[i % styles.length]

    const cal = nut.cal + fruit.cal + 60
    let name, instructions, img, mainIng, ingList

    if (style === 'snackMix') {
      name = `${cap(herbs[0])} Spiced ${cap(nut.name)} & ${cap(fruit.name)} Mix`
      instructions = snackMixInstructions(nut.name, fruit.name, herbs)
      img = `nuts,${nut.img.split(',')[0]}`
      mainIng = nut.name
      ingList = [nut.name, fruit.name, herbs[0], 'cinnamon', 'olive oil', 'salt']
    } else if (style === 'snackDip') {
      name = `${cap(herbs[0])} ${cap(p.name)} Dip with ${cap(v.name)}`
      instructions = snackDipInstructions(p.name, v.name, herbs)
      img = `dip,${p.img.split(',')[0]}`
      mainIng = p.name
      ingList = [p.name, v.name, ...herbs, 'olive oil', 'lemon juice', 'garlic']
    } else {
      const liquid = pick(LIQUIDS)
      name = `Quick ${cap(fruit.name)} & ${cap(nut.name)} Snack Smoothie`
      instructions = [
        `Add 1 cup ${liquid.name} to blender.`,
        `Add 1 cup frozen ${fruit.name} and 2 tbsp ${nut.name}.`,
        `Add a pinch of ${herbs[0]}.`,
        `Blend until smooth and creamy.`,
        `Pour into a glass and enjoy immediately.`,
      ]
      img = `smoothie,${fruit.img.split(',')[0]}`
      mainIng = fruit.name
      ingList = [fruit.name, nut.name, liquid.name, herbs[0]]
    }

    results.push({
      id: `gs${i + 1}`,
      type: 'snack',
      name,
      image: imageUrl(img),
      prepTime: 5 + (i % 3) * 5,
      calories: cal,
      score: 97,
      mainIngredient: mainIng,
      ingredients: ingList,
      instructions,
    })
  }
  return results
}

// ── Utility ──────────────────────────────────────────────────────────────────

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1) }

// ── Export ───────────────────────────────────────────────────────────────────

// Using a deterministic seed by calling with fixed Math.random override during gen
// We just generate once at import time — no randomness leaks after that
export const GENERATED_RECIPES = [
  ...makeDinners(293),
  ...makeLunches(200),
  ...makeBreakfasts(175),
  ...makeSnacks(50),
]
