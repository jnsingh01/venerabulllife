/* Venerabull Life — the catalogue.

   Every fact here is transcribed from the package label as shown in the
   photos of the actual bag, or from the live eBay listing it links to. A price
   is the listed price on the date in `checked`; eBay shows the current one.
   Nothing here is a stock count. Where the label and this file ever differ,
   the label on the bag is right.

   A plain script (not JSON fetched at run time) so the site also works opened
   straight from the disk.

   `labels` holds what each label prints (its facts panel, ingredients and
   statements), and `pack` the packshot made from one of the photos. `free`
   lists what a package itself prints that it is free of, in the label's
   words (each one is found in a printed "No …", "… Free" or "Non-…" claim on
   that label; the site's checks verify it): it is all a free-from search goes
   by. `withheld` names, without quoting them, the label lines too blurred or
   folded in the photos to set out, so the page can say they exist.

   `checked` is the date the listings were checked. A product whose listing
   was replaced since (sold out, then relisted under a new item number) carries
   its own `ebay.checked`/`ebay.checkedText`: the date its new listing was
   checked, and `ebay.replaced`, the item number it replaced. */
window.LIFE = {
  checked: '2026-10-30',
  checkedText: '30 Oct 2026',

  /* The range. Only a category with items in it is shown as available; the
     others say plainly that nothing is listed there yet. */
  categories: [
    { id: 'protein',  name: 'Protein & nutrition',    blurb: 'Protein powders and nutrition shakes.' },
    { id: 'vitamins', name: 'Vitamins & supplements', blurb: 'Vitamins, minerals and supplements.' },
    { id: 'skin',     name: 'Skincare',               blurb: 'Cleansers, serums and moisturisers.' },
    { id: 'bath',     name: 'Bath & body',            blurb: 'Body wash, soaps and bath.' }
  ],

  /* Filter groups. A value appears only if a product carries it. Flavors and
     sources are alternatives: choosing two shows products with either. What the
     label says is not (`every`): choosing two shows only products whose labels
     print both, and none if no label does. */
  facets: [
    { id: 'flavor', name: 'Flavor' },
    { id: 'source', name: 'Protein from' },
    { id: 'label',  name: 'The label says', every: true }
  ],

  products: [
    {
      id: 'equip',
      category: 'protein',
      brand: 'Equip',
      name: 'Prime Protein',
      flavor: 'Chocolate',
      summary: 'Three ingredients and 21 g of protein per serving, made from grass-fed beef.',
      size: { text: '18.1 oz (514 g)', grams: 514 },
      servings: { n: 20, about: false },
      protein: 21,
      facts: [
        ['Protein', '21 g per serving'],
        ['Servings', '20 per bag'],
        ['Made from', 'Grass-fed beef protein']
      ],
      ingredients: ['Grass-fed beef protein', 'Cocoa powder', 'Stevia leaf extract'],
      label: ['Dairy free', 'Whey free'],
      notes: [],
      /* sort: a key for ordering only, never shown; month precision where the
         bag prints only a month. photographed: this date is known only for the
         bag in the photos; a bag bought through the current listing may carry
         another, which isn't recorded, so every page that shows the date says
         whose it is */
      date: { kind: 'Best by', text: 'July 2028', printed: '07/2028', sort: '2028-07', photographed: true },
      facet: { flavor: ['Chocolate'], source: ['Beef'], label: ['Dairy free'] },
      price: 29.99,
      /* 407326667373 sold out and ended on 30 Oct 2026, and was relisted as
         407327910990 the same evening; that listing sold out and ended in turn,
         and this relist of the same single-pouch product was verified on
         7 Nov 2026 at the same price */
      ebay: { item: '407346056487', url: 'https://www.ebay.com/itm/407346056487', replaced: '407327910990',
              checked: '2026-11-07', checkedText: '7 Nov 2026' },
      /* the label's "NO WHEY, DAIRY, SOY, ARTIFICIAL SWEETENERS, GLUTEN, OR SEED OILS." (photo 5) */
      free: ['whey', 'dairy', 'soy', 'artificial sweeteners', 'gluten', 'seed oils'],
      /* the packshot: this package lifted from photo 2 onto the plain ground, at
         its native size (516x645), colours as photographed (balanced: false; lit
         by the lamp on one side and cooler light on the other, any one matrix
         turned the shaded side blue) */
      pack: { photo: 2, w: 516, h: 645, balanced: false },
      /* panel: where a facts panel sits in that photo (x, y, w, h of the 720x1280
         original), so View photo N opens the viewer zoomed onto it */
      photos: [
        { n: 1, alt: 'Front of the Equip Prime Protein chocolate bag, close up' },
        { n: 2, alt: 'The Equip bag standing on a shelf' },
        { n: 3, alt: 'Back of the bag: “Timeless, real-food ingredients”' },
        { n: 4, alt: 'Supplement facts panel on the back of the bag', panel: [150, 470, 280, 340] },
        { n: 5, alt: 'Lower back panel of the bag, with the barcode' }
      ]
    },
    {
      id: 'rnwy',
      category: 'protein',
      brand: 'RNWY',
      name: 'Complete Protein',
      flavor: 'Chocolate',
      summary: 'Protein and creatine together: 25 g of vegan protein and 5 g of creatine monohydrate per serving.',
      size: { text: '31.9 oz (903 g)', grams: 903 },
      servings: { n: 21, about: true },
      protein: 25,
      facts: [
        ['Protein', '25 g vegan protein per serving'],
        ['Creatine', '5 g creatine monohydrate per serving'],
        ['Servings', 'About 21 per bag'],
        ['Made with', 'Fermented nutritional yeast protein'],
        ['On the front', '“Protein + Creatine Recovery Supplement”']
      ],
      ingredients: null,
      label: ['Naturally flavored'],
      /* the ingredients are in the label section, as printed, so not here too */
      notes: ['Scoop not included, as stated on the package.'],
      date: { kind: 'Expiration', text: 'March 2028', printed: '03/28', sort: '2028-03' },
      facet: { flavor: ['Chocolate'], source: ['Yeast'], label: ['Vegan protein', 'Creatine'] },
      price: 34.99,
      ebay: { item: '407326667809', url: 'https://www.ebay.com/itm/407326667809' },
      free: [],
      /* the three lines of photo 3 left out of the transcription as uncertain
         (left out of the verified transcription), named but never quoted */
      withheld: { items: ['a caution for anyone pregnant, nursing or with a medical condition', 'a note about a torn bag and silica packs', 'storage directions'],
                  photo: 3, why: 'too blurred at the bag’s curved edge in these photos to set out here' },
      /* the packshot: this package lifted from photo 2 onto the plain ground, at
         its native size (620x775), colours as photographed (balanced: false, for
         the same reason as Equip's) */
      pack: { photo: 2, w: 620, h: 775, balanced: false },
      photos: [
        { n: 1, alt: 'Front of the RNWY Complete Protein bag, close up' },
        { n: 2, alt: 'The RNWY bag standing on a shelf' },
        { n: 3, alt: 'Supplement facts and amino acid profile on the back of the bag', panel: [180, 130, 440, 540] },
        { n: 4, alt: 'Back of the bag: “Build & recover” and how to use it' }
      ]
    },
    {
      id: 'tejari',
      category: 'protein',
      brand: 'Tejari',
      name: 'Plant-Based Superfood Protein',
      flavor: 'Organic Vanilla',
      summary: 'Organic vanilla plant protein, sweetened with organic dates. Six ingredients.',
      size: { text: '23.8 oz (675 g)', grams: 675 },
      servings: { n: 15, about: false },
      protein: 21,
      facts: [
        ['Protein', '21 g per serving'],
        ['Fiber', '5 g per serving'],
        ['Servings', '15 per bag']
      ],
      ingredients: ['Organic pea protein', 'Organic date powder', 'Organic pumpkin protein powder',
                    'Organic vanilla', 'Organic cinnamon', 'Organic turmeric root powder'],
      label: ['USDA Organic', 'Vegan', 'Dairy free', 'Soy free'],
      notes: [],
      /* sort: a key for ordering only, never shown; month precision where the
         bag prints only a month */
      date: { kind: 'Best by', text: 'July 2028', printed: '07/2028', sort: '2028-07' },
      facet: { flavor: ['Vanilla'], source: ['Plant'], label: ['USDA Organic', 'Vegan protein', 'Dairy free'] },
      price: 34.99,
      ebay: { item: '407326668123', url: 'https://www.ebay.com/itm/407326668123' },
      /* the marks on the back (photo 5): Non-GMO, Gluten Free, Dairy Free, Nut Free, Soy Free */
      free: ['gmo', 'gluten', 'dairy', 'nut', 'soy'],
      withheld: { items: ['a facility statement'], photo: 5, why: 'on a folded corner these photos don’t show clearly' },
      /* the packshot: this package lifted from photo 1 onto the plain ground, at
         its native size (512x640); balanced: the lamp's cast reduced by one
         white-balance matrix measured on the bag's own white print, at 0.7
         strength) */
      pack: { photo: 1, w: 512, h: 640, balanced: true },
      photos: [
        { n: 1, alt: 'The Tejari Organic Vanilla bag standing on a shelf' },
        { n: 2, alt: 'Front of the Tejari bag, closer' },
        { n: 3, alt: 'Back of the Tejari bag' },
        { n: 4, alt: 'Nutrition facts panel on the back of the bag', panel: [122, 222, 296, 562] },
        { n: 5, alt: 'Back of the bag: “How to enjoy” and the dietary marks' }
      ]
    },
    {
      id: 'kachava',
      category: 'protein',
      brand: 'Ka’Chava',
      name: 'All-In-One Nutrition Shake',
      flavor: 'Vanilla',
      summary: 'A vanilla nutrition shake with 25 g of plant protein and 6 g of fiber per serving, in a 7-serving bag.',
      size: { text: '15.31 oz (434 g)', grams: 434 },
      servings: { n: 7, about: false },
      protein: 25,
      facts: [
        ['Protein', '25 g plant protein per serving'],
        ['Fiber', '6 g per serving'],
        ['Servings', '7 per bag'],
        ['Vitamins & minerals', '26 listed on the package']
      ],
      ingredients: null,
      label: [],
      /* the label's own words (photo 3): the earlier 'Contains coconut.' left out
         "tree nuts", the allergen class a reader looks for */
      notes: ['Allergens: Contains tree nuts (coconut).'],
      date: { kind: 'Best by', text: 'March 28, 2028', printed: '2028/03/28', sort: '2028-03-28' },
      /* Dairy free: the bag's own "No Dairy" mark (photo 1) */
      facet: { flavor: ['Vanilla'], source: ['Plant'], label: ['Dairy free'] },
      price: 32.99,
      /* 407326668618 sold out; relisted on 3 Nov 2026 with the same price,
         details and photos, and live-verified that evening */
      ebay: { item: '407338462009', url: 'https://www.ebay.com/itm/407338462009', replaced: '407326668618',
              checked: '2026-11-03', checkedText: '3 Nov 2026' },
      /* the marks on the front (photo 1): Non-GMO, No Gluten, No Dairy, No Soy,
         No Stevia, No Preservatives, No Artificial Flavors or Sweeteners. Never
         "sweeteners" alone: the bag has coconut nectar and monk fruit. */
      free: ['gmo', 'gluten', 'dairy', 'soy', 'stevia', 'preservatives', 'artificial flavors', 'artificial sweeteners'],
      /* the packshot: this package lifted from photo 2 onto the plain ground, at
         its native size (496x620), colours as photographed (balanced: false; the
         bag is printed peach-tan, which a matrix would misstate) */
      pack: { photo: 2, w: 496, h: 620, balanced: false },
      photos: [
        { n: 1, alt: 'Front of the Ka’Chava Vanilla bag, close up' },
        { n: 2, alt: 'The Ka’Chava bag standing on a shelf' },
        { n: 3, alt: 'Back of the bag: “Why we made Ka’Chava” and the ingredients' },
        { n: 4, alt: 'Nutrition facts panel on the back of the bag', panel: [25, 195, 330, 990] }
      ]
    },
    {
      id: 'ascent',
      category: 'protein',
      brand: 'Ascent',
      name: '100% Whey Native Whey Protein Blend',
      flavor: 'Chocolate',
      summary: 'Chocolate whey protein: 25 g of protein and 120 calories per serving, with no added sugars.',
      size: { text: '2 lb / 32 oz (907 g)', grams: 907 },
      servings: { n: 27, about: true },
      protein: 25,
      facts: [
        ['Protein', '25 g per serving'],
        ['Calories', '120 per serving'],
        ['Servings', 'About 27 per bag']
      ],
      ingredients: null,
      label: ['No added sugars', 'No artificial flavors or sweeteners'],
      notes: ['Contains milk and soy.'],
      date: { kind: 'Best by', text: 'March 6, 2027', printed: '03/06/2027', sort: '2027-03-06' },
      facet: { flavor: ['Chocolate'], source: ['Whey'], label: ['No added sugars'] },
      price: 39.99,
      ebay: { item: '407326666527', url: 'https://www.ebay.com/itm/407326666527' },
      /* the back (photo 2): its marks NO ADDED SUGARS and 0 ARTIFICIAL FLAVORS AND
         SWEETENERS (the label list above), and its line "GLUTEN FREE, rBST/rBGH FREE*" */
      free: ['added sugars', 'artificial flavors', 'artificial sweeteners', 'gluten', 'rbst', 'rbgh'],
      /* the packshot: this package lifted from photo 1 onto the plain ground, at
         its native size (636x795); balanced: the lamp's cast reduced by one
         white-balance matrix measured on the bag's own white type) */
      pack: { photo: 1, w: 636, h: 795, balanced: true },
      photos: [
        { n: 1, alt: 'Front of the Ascent 100% Whey chocolate bag on a shelf' },
        { n: 2, alt: 'Back of the bag: nutrition facts and mixing instructions', panel: [232, 192, 244, 482] }
      ]
    },
    {
      id: 'ji-french-vanilla',
      category: 'protein',
      brand: 'Just Ingredients',
      name: 'Protein + Creatine',
      flavor: 'French Vanilla',
      summary: 'Protein and creatine together: 22 g of protein per serving, 5 g of creatine monohydrate as the front states, and 0 g of added sugars.',
      size: { text: '35.8 oz (1,015 g)', grams: 1015 },
      servings: { n: 25, about: false },
      protein: 22,
      /* the creatine figure is the front's ("5g CREATINE MONOHYDRATE"); the
         Nutrition Facts panel doesn't list creatine */
      facts: [
        ['Protein', '22 g per serving'],
        ['Creatine', '5 g creatine monohydrate, as printed on the front'],
        ['Servings', '25 per bag'],
        ['First ingredient', '“Certified Grass-Fed Non-Denatured Whey Protein Concentrate”, as printed']
      ],
      ingredients: ['Certified Grass-Fed Non-Denatured Whey Protein Concentrate', 'Organic Coconut Milk*', 'Creatine Monohydrate (Pürest Creatine™)',
                    'Grass-Fed Collagen', 'Organic Pea Protein', 'Organic Vanilla Extract Powder*', 'Organic Monk Fruit Extract', 'Organic Chia Seed Protein',
                    'Sea Salt', 'Vanilla Bean'],
      /* the back's icon row (photo 4): GLUTEN FREE, EGG FREE, SOY FREE, NON GMO; and
         the left column's NO ARTIFICIAL FLAVORS */
      label: ['No artificial flavors', 'Gluten free', 'Egg free', 'Soy free', 'Non-GMO'],
      notes: ['Contains: dairy.'],
      /* printed on the bag in the photos (photos 3 and 4); a bag bought through
         the listing may carry another date, which isn't recorded */
      date: { kind: 'Best by', text: 'August 17, 2028', printed: '08/17/2028', sort: '2028-08-17', photographed: true },
      /* Creatine: the front's "5g CREATINE MONOHYDRATE" and the ingredient
         "Creatine Monohydrate". Not "No added sugars": the label prints "0g ADDED
         SUGAR", not those words (the free-from search still reads its 0g claim) */
      facet: { flavor: ['Vanilla'], source: ['Whey'], label: ['Creatine'] },
      /* whey is the first ingredient, not the only protein: the back prints "PROTEIN
         FROM REAL FOOD SOURCES –BOTH PLANT AND ANIMAL" */
      sourceNote: 'listed first; the label says its protein is from both plant and animal sources',
      price: 49.99,
      /* its own listing: the price checked on 6 Nov 2026; its condition and shipping
         seen when it was published, on 3 Nov 2026 (location and returns are the store's) */
      ebay: { item: '407335491695', url: 'https://www.ebay.com/itm/407335491695', checked: '2026-11-06', checkedText: '6 Nov 2026',
              termsChecked: '2026-11-03', termsCheckedText: '3 Nov 2026' },
      /* each printed on this label: "NO ARTIFICIAL FLAVORS", "NO SUGAR ALCOHOLS OR
         ARTIFICIAL SWEETENERS LIKE SUCRALOSE", "NO SYNTHETIC GUMS, FILLERS, OR
         EMULSIFIERS" (read as all three synthetic), "0g ADDED SUGAR", and GLUTEN
         FREE, EGG FREE, SOY FREE, NON GMO */
      free: ['artificial flavors', 'sugar alcohols', 'artificial sweeteners', 'synthetic gums', 'synthetic fillers', 'synthetic emulsifiers', 'added sugars', 'gluten', 'egg', 'soy', 'gmo'],
      withheld: { items: ['the maker’s details under the ingredients', 'the small print beside the QR code'],
                  photo: 3, why: 'too creased or too small in these photos to set out here' },
      /* the packshot: this package lifted from photo 1 onto the plain ground, at
         its native size (840x1050), colours as photographed (balanced: false) */
      pack: { photo: 1, w: 840, h: 1050, balanced: false },
      photos: [
        { n: 1, alt: 'Front of the Just Ingredients Protein + Creatine French Vanilla bag on a counter' },
        { n: 2, alt: 'The front of the bag, at an angle' },
        { n: 3, alt: 'Back of the bag' },
        { n: 4, alt: 'Back of the bag, left side: the ingredients, and the lot and date printed on this bag' },
        { n: 5, alt: 'Nutrition facts panel on the back of the bag', panel: [180, 412, 270, 420] }
      ]
    },
    {
      id: 'ji-vanilla-peanut-butter',
      category: 'protein',
      brand: 'Just Ingredients',
      name: 'Protein + Creatine',
      flavor: 'Vanilla Peanut Butter',
      summary: 'Protein and creatine together: 25 g of protein per serving, 5 g of creatine monohydrate as the front states, and 0 g of added sugars.',
      size: { text: '42.68 oz (1,210 g)', grams: 1210 },
      servings: { n: 25, about: false },
      protein: 25,
      /* the creatine figure is the front's ("5g CREATINE MONOHYDRATE"); the
         Nutrition Facts panel doesn't list creatine */
      facts: [
        ['Protein', '25 g per serving'],
        ['Creatine', '5 g creatine monohydrate, as printed on the front'],
        ['Servings', '25 per bag'],
        ['First ingredient', '“Certified Grass-Fed Non-Denatured Whey Protein Concentrate”, as printed']
      ],
      ingredients: ['Certified Grass-Fed Non-Denatured Whey Protein Concentrate', 'Organic Peanut Flour', 'Organic Coconut Milk*', 'Creatine Monohydrate (Pürest Creatine™)',
                    'Grass-Fed Collagen', 'Organic Pea Protein', 'Organic Vanilla Extract Powder*', 'Sea Salt', 'Organic Chia Seed Protein',
                    'Organic Monk Fruit Extract', 'Vanilla Bean'],
      /* the back's NO ARTIFICIAL FLAVORS (photo 3) and its icon row's SOY FREE and
         NON GMO (photo 2) */
      label: ['No artificial flavors', 'Soy free', 'Non-GMO'],
      notes: ['Contains: dairy & peanut.'],
      /* printed on the bag in the photos (photos 2 and 3); a bag bought through
         the listing may carry another date, which isn't recorded */
      date: { kind: 'Best by', text: 'August 13, 2028', printed: '08/13/2028', sort: '2028-08-13', photographed: true },
      /* Creatine: the front's "5g CREATINE MONOHYDRATE" and the ingredient
         "Creatine Monohydrate". Not "No added sugars": the label prints "0g ADDED
         SUGAR", not those words (the free-from search still reads its 0g claim) */
      facet: { flavor: ['Vanilla', 'Peanut butter'], source: ['Whey'], label: ['Creatine'] },
      /* whey is the first ingredient, not the only protein: the back prints "PROTEIN
         FROM REAL FOOD SOURCES –BOTH PLANT AND ANIMAL" */
      sourceNote: 'listed first; the label says its protein is from both plant and animal sources',
      price: 49.99,
      /* its own listing: the price checked on 6 Nov 2026; its condition and shipping
         seen when it was published, on 3 Nov 2026 (location and returns are the store's) */
      ebay: { item: '407335492092', url: 'https://www.ebay.com/itm/407335492092', checked: '2026-11-06', checkedText: '6 Nov 2026',
              termsChecked: '2026-11-03', termsCheckedText: '3 Nov 2026' },
      /* each printed on this label: "NO ARTIFICIAL FLAVORS", "NO SUGAR ALCOHOLS OR
         ARTIFICIAL SWEETENERS LIKE SUCRALOSE", "NO SYNTHETIC GUMS, FILLERS, OR
         EMULSIFIERS" (read as all three synthetic), "0g ADDED SUGAR", SOY FREE and
         NON GMO; not gluten, whose badge these photos don't show clearly */
      free: ['artificial flavors', 'sugar alcohols', 'artificial sweeteners', 'synthetic gums', 'synthetic fillers', 'synthetic emulsifiers', 'added sugars', 'soy', 'gmo'],
      withheld: { items: ['the maker’s details under the ingredients', 'the small print beside the QR code'],
                  photo: 2, why: 'too creased or too small in these photos to set out here' },
      /* no packshot: in its one original photo of the front the bag touches the
         photo's top edge, and a packshot never shows a cut bag as whole, so the
         cards and gallery show that photo itself */
      photos: [
        { n: 1, alt: 'Front of the Just Ingredients Protein + Creatine Vanilla Peanut Butter bag on a counter' },
        { n: 2, alt: 'Back of the bag' },
        { n: 3, alt: 'Back of the bag, left side: the ingredients, and the date printed on this bag' },
        { n: 4, alt: 'Nutrition facts panel on the back of the bag', panel: [130, 360, 315, 585] }
      ]
    }
  ],

  /* As listed on every one of these eBay listings when they were checked. */
  listing: {
    condition: 'New',
    shipping: 'Free standard shipping',
    from: 'New York, NY',
    returns: 'Returns are not accepted on these listings.'
  },

  /* What each package's label prints, transcribed twice from the label photos
     (site/assets/img/<id>-<n>.jpg) and reconciled crop by crop: the Nutrition or
     Supplement Facts panels, the ingredients and the statements. Only what was
     certain is here; four uncertain lines were left out. This is the verified
     transcription without its notes, and the site's checks fail if the two
     ever differ.
     `photo` is the photo the text was read from; `complete: false` would mark a
     statement cut off on the bag, which is never shown. */
  labels: {
    equip: {
      panels: [
        {
          photo: 4,
          also_in_photos: [3],
          title: "Supplement Facts",
          serving_size: "Serving Size 1 scoop (approx. 25.7g)",
          servings: "Servings Per Container 20",
          header: { amount: "Amount per serving", dv: "% Daily Value*" },
          complete: true,
          rows: [
            { name: "Calories", amount: "100", dv: "", indent: 0 },
            { name: "Total Fat", amount: "0.5 g", dv: "3%*", indent: 0 },
            { name: "Total Carbohydrate", amount: "2 g", dv: "1%*", indent: 0 },
            { name: "Dietary Fiber", amount: "1 g", dv: "4%*", indent: 1 },
            { name: "Protein", amount: "21 g", dv: "", indent: 0 },
            { name: "Iron", amount: "2.6 mg", dv: "14%", indent: 0 },
            { name: "Sodium", amount: "140 mg", dv: "6%", indent: 0 },
            { name: "Potassium", amount: "300 mg", dv: "6%", indent: 0 }
          ],
          footnotes: ["* Percent Daily Values are based on a 2,000 calorie diet.","**Daily Value not established."]
        }
      ],
      ingredients: { photo: 4, also_in_photos: [3], heading: "Other Ingredients", text: "Grass-Fed Beef Protein, Cocoa Powder, Stevia Leaf Extract" },
      statements: [
        { photo: 5, also_in_photos: [3], kind: "facility", text: "Manufactured in a facility that also processes wheat, peanuts, tree nuts, soy, eggs, and sesame.", complete: true },
        { photo: 5, also_in_photos: [3], kind: "other", text: "‡These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.", complete: true },
        { photo: 5, also_in_photos: [3], kind: "other", text: "Product is packed by weight, not by volume. Natural settling may occur and cannot be avoided.", complete: true },
        { photo: 5, also_in_photos: [3], kind: "other", text: "NO WHEY, DAIRY, SOY, ARTIFICIAL SWEETENERS, GLUTEN, OR SEED OILS.", complete: true },
        { photo: 5, also_in_photos: [3], kind: "other", text: "THIRD-PARTY TESTED FOR HEAVY METALS, PESTICIDES, MICROPLASTICS, AND MORE.", complete: true },
        { photo: 3, also_in_photos: [5,4], kind: "warning", text: "CALIFORNIA WARNING: CAN EXPOSE YOU TO LEAD, A CARCINOGEN AND REPRODUCTIVE TOXICANT. SEE WWW.P65WARNINGS.CA.GOV/FOOD. WANT MORE CONTEXT ON THIS CALIFORNIA-SPECIFIC WARNING? GO TO EQUIPFOODS.COM/PROP65", complete: true }
      ]
    },
    rnwy: {
      panels: [
        {
          photo: 3,
          also_in_photos: [4],
          title: "Supplement Facts",
          serving_size: "Serving Size 1/3 Cup (43 g)",
          servings: "Servings Per Container about 21",
          header: { amount: "Amount Per Serving", dv: "% Daily Value" },
          complete: true,
          rows: [
            { name: "Calories", amount: "150", dv: "", indent: 0 },
            { name: "Total Fat", amount: "3 g", dv: "4%*", indent: 0 },
            { name: "Saturated Fat", amount: "0.5 g", dv: "3%*", indent: 1 },
            { name: "Total Carbohydrate", amount: "5 g", dv: "2%*", indent: 0 },
            { name: "Dietary Fiber", amount: "3 g", dv: "11%*", indent: 1 },
            { name: "Protein", amount: "25 g", dv: "50%*", indent: 0 },
            { name: "Iron", amount: "1 mg", dv: "5%", indent: 0 },
            { name: "Sodium", amount: "330 mg", dv: "14%", indent: 0 },
            { name: "Potassium", amount: "120 mg", dv: "3%", indent: 0 },
            { name: "Fermented Nutrition Yeast Protein (Baker’s Yeast)†", amount: "32 g", dv: "**", indent: 0 },
            { name: "Creatine Monohydrate", amount: "5 g", dv: "**", indent: 0 },
            { name: "Enzyme Complex (Alpha-Amylase, Neutral Protease, Lactase, Lipase, Cellulase)", amount: "150 mg", dv: "**", indent: 0 }
          ],
          footnotes: ["*Percent daily values (DV) are based on a 2,000 calorie diet.","**Daily Value not established."]
        },
        {
          photo: 3,
          title: "Typical Amino Acid Profile",
          subtitle: "(Average milligrams per serving naturally occurring)",
          serving_size: null,
          servings: null,
          complete: true,
          rows: [
            { name: "Alanine", amount: "1,565 mg", dv: "", indent: 0 },
            { name: "Arginine", amount: "1,695 mg", dv: "", indent: 0 },
            { name: "Aspartic Acid", amount: "2,832 mg", dv: "", indent: 0 },
            { name: "Cysteine", amount: "172 mg", dv: "", indent: 0 },
            { name: "Glutamic Acid", amount: "3,002 mg", dv: "", indent: 0 },
            { name: "Glycine", amount: "1,175 mg", dv: "", indent: 0 },
            { name: "Histidine^", amount: "668 mg", dv: "", indent: 0 },
            { name: "Isoleucine†^", amount: "1,549 mg", dv: "", indent: 0 },
            { name: "Leucine†^", amount: "2,387 mg", dv: "", indent: 0 },
            { name: "Lysine^", amount: "2,507 mg", dv: "", indent: 0 },
            { name: "Methionine^", amount: "547 mg", dv: "", indent: 0 },
            { name: "Phenylalanine^", amount: "1,462 mg", dv: "", indent: 0 },
            { name: "Proline", amount: "1,039 mg", dv: "", indent: 0 },
            { name: "Serine", amount: "1,370 mg", dv: "", indent: 0 },
            { name: "Threonine^", amount: "1,385 mg", dv: "", indent: 0 },
            { name: "Tryptophan^", amount: "397 mg", dv: "", indent: 0 },
            { name: "Tyrosine", amount: "1,224 mg", dv: "", indent: 0 },
            { name: "Valine†^", amount: "1,765 mg", dv: "", indent: 0 }
          ],
          footnotes: ["†Branched Chain Amino Acid (BCAA)","^Essential Amino Acid"]
        }
      ],
      ingredients: { photo: 3, also_in_photos: [4], heading: "Other Ingredients", text: "Natural flavors, organic cocoa powder (alkalized), MCT oil powder (from coconut), sea salt, steviol glycosides." },
      statements: [
        { photo: 3, kind: "other", text: "Manufactured in a cGMP facility.", complete: true },
        { photo: 3, kind: "other", text: "†Upcycled", complete: true },
        { photo: 4, kind: "other", text: "*These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure or prevent any disease.", complete: true },
        { photo: 4, kind: "warning", text: "WARNING: Consuming this product can expose you to Lead, which is known to the State of California to cause birth defects or other reproductive harm. For more information go to www.P65Warnings.ca.gov/food", complete: true },
        { photo: 4, kind: "other", text: "Packaged by weight, not volume. Product may settle to this line.", complete: true }
      ]
    },
    tejari: {
      panels: [
        {
          photo: 4,
          also_in_photos: [3,5],
          title: "Nutrition Facts",
          serving_size: "Serving size 4 tbsp (45g)",
          servings: "15 servings",
          header: { amount: "Amount per serving", dv: "% Daily Value *" },
          complete: true,
          rows: [
            { name: "Calories", amount: "160", dv: "", indent: 0 },
            { name: "Total Fat", amount: "1.5g", dv: "2%", indent: 0 },
            { name: "Saturated Fat", amount: "0g", dv: "0%", indent: 1 },
            { name: "Trans Fat", amount: "0g", dv: "", indent: 1 },
            { name: "Cholesterol", amount: "0mg", dv: "0%", indent: 0 },
            { name: "Sodium", amount: "230mg", dv: "10%", indent: 0 },
            { name: "Total Carbohydrate", amount: "16g", dv: "6%", indent: 0 },
            { name: "Dietary Fiber", amount: "5g", dv: "18%", indent: 1 },
            { name: "Total Sugars", amount: "11g", dv: "", indent: 1 },
            { name: "Includes Added Sugars", amount: "0g", dv: "0%", indent: 2, printed: "Includes 0g Added Sugars" },
            { name: "Protein", amount: "21g", dv: "32%", indent: 0 },
            { name: "Vitamin D", amount: "0mcg", dv: "0%", indent: 0 },
            { name: "Calcium", amount: "80mg", dv: "6%", indent: 0 },
            { name: "Iron", amount: "4.2mg", dv: "25%", indent: 0 },
            { name: "Potassium", amount: "240mg", dv: "6%", indent: 0 }
          ],
          footnotes: ["* The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice."]
        }
      ],
      ingredients: { photo: 4, also_in_photos: [3], heading: "INGREDIENTS", text: "Organic Pea Protein, Organic Date Powder, Organic Pumpkin Protein Powder, Organic Vanilla, Organic Cinnamon, Organic Turmeric Root Powder" },
      statements: [
        { photo: 5, also_in_photos: [3], kind: "warning", text: "WARNING: THIS PRODUCT CONTAINS CHEMICALS KNOWN TO THE STATE OF CALIFORNIA TO CAUSE CANCER AND BIRTH DEFECTS OR OTHER REPRODUCTIVE HARM. FOR MORE INFORMATION: WWW.P65WARNINGS.CA.GOV", complete: true },
        { photo: 5, also_in_photos: [3], kind: "other", text: "STORE POWDER IN COOL PLACE.", complete: true },
        { photo: 5, also_in_photos: [3], kind: "other", text: "Non-GMO, Gluten Free, Vegan, Dairy Free, Nut Free, Soy Free", items: ["Non-GMO","Gluten Free","Vegan","Dairy Free","Nut Free","Soy Free"], complete: true },
        { photo: 4, kind: "other", text: "CERTIFIED ORGANIC BY UTAH DEPARTMENT OF AGRICULTURE AND FOOD", complete: true },
        { photo: 4, kind: "other", text: "MADE IN THE USA", complete: true }
      ]
    },
    kachava: {
      panels: [
        {
          photo: 4,
          title: "Nutrition Facts",
          serving_size: "Serving Size 62g (2 scoops)",
          servings: "7 Servings Per Container",
          header: { amount: "Amount Per Serving", dv: "% Daily Value**" },
          complete: true,
          rows: [
            { name: "Calories", amount: "240", dv: "", indent: 0 },
            { name: "Total Fat", amount: "6g", dv: "8%", indent: 0 },
            { name: "Saturated Fat", amount: "2.5g", dv: "13%", indent: 1 },
            { name: "Trans Fat", amount: "0g", dv: "", indent: 1 },
            { name: "Cholesterol", amount: "0mg", dv: "0%", indent: 0 },
            { name: "Sodium", amount: "300mg", dv: "13%", indent: 0 },
            { name: "Total Carbohydrate", amount: "20g", dv: "7%", indent: 0 },
            { name: "Dietary Fiber", amount: "6g", dv: "21%", indent: 1 },
            { name: "Total Sugars", amount: "7g", dv: "", indent: 1 },
            { name: "Includes Added Sugars", amount: "4g", dv: "8%", indent: 2 },
            { name: "Protein", amount: "25g", dv: "38%", indent: 0 },
            { name: "Vitamin D", amount: "5mcg", dv: "25%", indent: 0 },
            { name: "Calcium", amount: "400mg", dv: "30%", indent: 0 },
            { name: "Iron", amount: "4.5mg", dv: "25%", indent: 0 },
            { name: "Potassium", amount: "200mg", dv: "4%", indent: 0 },
            { name: "Vitamin A", amount: "750mcg", dv: "80%", indent: 0 },
            { name: "Vitamin C", amount: "30mg", dv: "35%", indent: 0 },
            { name: "Vitamin E", amount: "10mg", dv: "70%", indent: 0 },
            { name: "Thiamin", amount: "0.75mg", dv: "60%", indent: 0 },
            { name: "Riboflavin", amount: "0.85mg", dv: "70%", indent: 0 },
            { name: "Niacin", amount: "10mg", dv: "60%", indent: 0 },
            { name: "Vitamin B6", amount: "1mg", dv: "60%", indent: 0, printed: "Vitamin B₆" },
            { name: "Folate", amount: "330mcg DFE (195mcg folic acid)", dv: "80%", indent: 0, printed: "Folate 330mcg DFE (195mcg folic acid)" },
            { name: "Vitamin B12", amount: "3mcg", dv: "130%", indent: 0, printed: "Vitamin B₁₂" },
            { name: "Biotin", amount: "75mcg", dv: "250%", indent: 0 },
            { name: "Pantothenic Acid", amount: "5mg", dv: "100%", indent: 0 },
            { name: "Phosphorus", amount: "400mg", dv: "30%", indent: 0 },
            { name: "Iodine", amount: "75mcg", dv: "50%", indent: 0 },
            { name: "Magnesium", amount: "200mg", dv: "50%", indent: 0 },
            { name: "Zinc", amount: "9mg", dv: "80%", indent: 0 },
            { name: "Selenium", amount: "39mcg", dv: "70%", indent: 0 },
            { name: "Copper", amount: "0.8mg", dv: "90%", indent: 0 },
            { name: "Manganese", amount: "1mg", dv: "45%", indent: 0 },
            { name: "Chromium", amount: "37.5mcg", dv: "110%", indent: 0 },
            { name: "Molybdenum", amount: "100mcg", dv: "220%", indent: 0 },
            { name: "Chloride", amount: "300mg", dv: "15%", indent: 0 }
          ],
          footnotes: ["**The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice."]
        }
      ],
      ingredients: { photo: 3, also_in_photos: [4], heading: null, text: "Plant Proteins & Plant Milks Blend (Yellow Pea Protein, Brown Rice Protein, Coconut Milk, Oat Milk), Fiber & Probiotics Blend (Organic Acacia, Flax Seed, Organic Amaranth, Organic Quinoa, Chia Seed, Soluble Corn Fiber, Digestive Enzymes [Amylase, Cellulase, Protease, Lactase, Lipase], Chicory Root, Probiotics [Lactobacillus rhamnosus, Lactobacillus acidophilus]), Greens & Superfoods Blend (Organic Coconut Nectar, Organic Maca Root, Organic Sacha Inchi, Acai, Lo Han Guo Fruit Extract, Organic Beet Root, Organic Carrot, Chlorella, Organic Spinach, Camu Camu, Organic Potato, Organic Tomato, Organic Maqui, Organic Mushrooms [Lion’s Mane, Maitake, Reishi, Shiitake], Organic Parsley, Organic Jujube, Organic Blackberry, Organic Raspberry, Organic Blueberry, Organic Wheat Grass, Spirulina, Organic Papaya, Organic Moringa, Organic Kale, Organic Goji Berry, Organic Baobab, Organic Barley Grass, Organic Acerola, Organic Pomegranate, Organic Ginger), Plant Creamer Blend (Cassava Root, Coconut Oil, Guar Gum, Medium Chain Triglycerides, Xanthan Gum), Vitamins & Minerals Blend (Tricalcium Phosphate, Magnesium Oxide, Ascorbic Acid [Vit.C], D-Alpha Tocopherol Acetate [Vit.E], Niacinamide [Vit.B3], Zinc Oxide, Biotin, Copper Amino Acid Chelate, D-Calcium Pantothenate, Vitamin A Palmitate [Vit.A], Potassium Iodine, Cholecalciferol [Vit.D3], Selenium Chelate, Pyridoxine Hydrochloride [Vit.B6], Chromium Amino Acid Chelate, Thiamine Hydrochloride [Vit.B1], Riboflavin [Vit.B2], Manganese Amino Acid Chelate, Cyanocobalamin [Vit.B12], Folic Acid), Natural Flavors, Salt." },
      statements: [
        { photo: 3, also_in_photos: [4], kind: "allergen", text: "Allergens: Contains tree nuts (coconut).", complete: true },
        { photo: 3, also_in_photos: [4], kind: "warning", text: "NOTICE: Use this product as part of a well-balanced diet. Do not use this product as your only source of nutrition (max two servings daily).", complete: true },
        { photo: 3, also_in_photos: [4], kind: "other", text: "*Contains 6g of total fat per serving. See nutrition information for fat content.", complete: true },
        { photo: 3, also_in_photos: [4], kind: "other", text: "Storage: Store in a cool, dry place.", complete: true },
        { photo: 1, kind: "other", text: "Non-GMO · No Gluten · No Dairy · No Soy · No Stevia · No Preservatives · No Artificial Flavors or Sweeteners", items: ["Non-GMO","No Gluten","No Dairy","No Soy","No Stevia","No Preservatives","No Artificial Flavors or Sweeteners"], complete: true }
      ]
    },
    ascent: {
      panels: [
        {
          photo: 2,
          title: "Nutrition Facts",
          serving_size: "Serving size 1 Rounded Scoop (33g)",
          servings: "About 27 servings per container",
          header: { amount: "Amount Per Serving", dv: "% Daily Value*" },
          complete: true,
          rows: [
            { name: "Calories", amount: "120", dv: "", indent: 0 },
            { name: "Total Fat", amount: "1g", dv: "1%", indent: 0 },
            { name: "Saturated Fat", amount: "0.5g", dv: "3%", indent: 1 },
            { name: "Trans Fat", amount: "0g", dv: "", indent: 1 },
            { name: "Cholesterol", amount: "30mg", dv: "10%", indent: 0 },
            { name: "Sodium", amount: "115mg", dv: "5%", indent: 0 },
            { name: "Total Carbohydrate", amount: "4g", dv: "1%", indent: 0 },
            { name: "Dietary Fiber", amount: "<1g", dv: "0%", indent: 1 },
            { name: "Total Sugars", amount: "1g", dv: "", indent: 1 },
            { name: "Includes Added Sugars", amount: "0g", dv: "0%", indent: 2, printed: "Includes 0g Added Sugars" },
            { name: "Protein", amount: "25g", dv: "50%", indent: 0 },
            { name: "Vitamin D", amount: "0mcg", dv: "0%", indent: 0 },
            { name: "Calcium", amount: "138mg", dv: "10%", indent: 0 },
            { name: "Iron", amount: "1mg", dv: "6%", indent: 0 },
            { name: "Potassium", amount: "244mg", dv: "6%", indent: 0 }
          ],
          footnotes: ["*The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.","Calories per gram: Fat 9 • Carbohydrate 4 • Protein 4"]
        }
      ],
      ingredients: { photo: 2, heading: "INGREDIENTS", text: "WHEY PROTEIN ISOLATE BLEND (NATIVE WHEY PROTEIN ISOLATE, WHEY PROTEIN ISOLATE), WHEY PROTEIN CONCENTRATE, COCOA (PROCESSED WITH ALKALI), NATURAL FLAVORS, LECITHIN, SEA SALT, STEVIA LEAF EXTRACT." },
      statements: [
        { photo: 2, kind: "allergen", text: "ALLERGEN INFORMATION: CONTAINS MILK AND SOY.", complete: true },
        { photo: 2, kind: "facility", text: "NOTICE: PRODUCED ON EQUIPMENT THAT ALSO PROCESSES TREE NUTS & PEANUTS.", complete: true },
        { photo: 2, kind: "other", text: "GLUTEN FREE, rBST/rBGH FREE*", complete: true },
        { photo: 2, kind: "warning", text: "NOTICE: USE THIS PRODUCT AS A FOOD SUPPLEMENT ONLY. DO NOT USE FOR WEIGHT REDUCTION.", complete: true },
        { photo: 2, kind: "other", text: "*NO SIGNIFICANT DIFFERENCE HAS BEEN SHOWN BETWEEN DAIRY PRODUCTS DERIVED FROM rBST/rBGH-TREATED AND NON-rBST/rBGH-TREATED COWS.", complete: true },
        { photo: 2, kind: "other", text: "STORE IN A COOL, DRY PLACE. CONTENTS SOLD BY WEIGHT, NOT VOLUME.", complete: true }
      ]
    },
    'ji-french-vanilla': {
      panels: [
        {
          photo: 5,
          also_in_photos: [3],
          title: "Nutrition Facts",
          serving_size: "Serving size 1 Scoop (40.6g)",
          servings: "Servings Per Container: 25",
          header: { amount: "Amount per serving", dv: "% Daily Value" },
          complete: true,
          rows: [
            { name: "Calories", amount: "160", dv: "", indent: 0 },
            { name: "Total Fat", amount: "6g", dv: "8%", indent: 0 },
            { name: "Saturated Fat", amount: "4.5g", dv: "22%", indent: 1 },
            { name: "Trans Fat", amount: "0g", dv: "", indent: 1 },
            { name: "Cholesterol", amount: "40mg", dv: "13%", indent: 0 },
            { name: "Sodium", amount: "200mg", dv: "9%", indent: 0 },
            { name: "Total Carbohydrate", amount: "5g", dv: "2%", indent: 0 },
            { name: "Dietary Fiber", amount: "1g", dv: "4%", indent: 1 },
            { name: "Total Sugars", amount: "2g", dv: "", indent: 1 },
            { name: "Includes Added Sugars", amount: "0g", dv: "0%", indent: 2, printed: "Includes 0g Added Sugars" },
            { name: "Protein", amount: "22g", dv: "38%", indent: 0 },
            { name: "Vitamin D", amount: "0mcg", dv: "0%", indent: 0 },
            { name: "Calcium", amount: "70mg", dv: "6%", indent: 0 },
            { name: "Iron", amount: "0mg", dv: "0%", indent: 0 },
            { name: "Potassium", amount: "200mg", dv: "4%", indent: 0 }
          ],
          footnotes: ["The % Daily Value tells you how much a nutrient in a serving of food contributes to a daily diet. 2000 calories a day is used for general nutrition advice."]
        }
      ],
      ingredients: { photo: 4, also_in_photos: [3], heading: "INGREDIENTS", text: "Certified Grass-Fed Non-Denatured Whey Protein Concentrate, Organic Coconut Milk*, Creatine Monohydrate (Pürest Creatine™), Grass-Fed Collagen, Organic Pea Protein, Organic Vanilla Extract Powder*, Organic Monk Fruit Extract, Organic Chia Seed Protein, Sea Salt, Vanilla Bean" },
      statements: [
        { photo: 4, also_in_photos: [3], kind: "allergen", text: "CONTAINS: DAIRY", complete: true },
        { photo: 4, also_in_photos: [3], kind: "other", text: "*With Tapioca Starch", complete: true },
        { photo: 1, also_in_photos: [2], kind: "other", text: "22g PROTEIN | 5g CREATINE MONOHYDRATE | 0g ADDED SUGAR", items: ["22g PROTEIN", "5g CREATINE MONOHYDRATE", "0g ADDED SUGAR"], complete: true },
        { photo: 2, also_in_photos: [1], kind: "other", text: "No Artificial Flavors | Third Party Tested | Certified Grass-Fed Whey Protein | Naturally Occurring BCAAs", complete: true },
        { photo: 4, also_in_photos: [3], kind: "other", text: "GLUTEN FREE | EGG FREE | SOY FREE | NON GMO", items: ["GLUTEN FREE", "EGG FREE", "SOY FREE", "NON GMO"], complete: true },
        { photo: 4, also_in_photos: [3], kind: "other", text: "MADE WITH REAL INGREDIENTS • NO ARTIFICIAL FLAVORS • NO SUGAR ALCOHOLS OR ARTIFICIAL SWEETENERS LIKE SUCRALOSE • PROTEIN FROM REAL FOOD SOURCES –BOTH PLANT AND ANIMAL • NO SYNTHETIC GUMS, FILLERS, OR EMULSIFIERS", complete: true },
        { photo: 3, also_in_photos: [4, 5], kind: "other", text: "OPTIMALLY FORMULATED • NEW ZEALAND AND EUROPEAN WHEY • 18 ESSENTIAL AND NON-ESSENTIAL AMINO ACIDS • PÜREST CREATINE MONOHYDRATE, THE GOLD STANDARD IN PURITY AND QUALITY • NON-GMO", complete: true },
        { photo: 4, also_in_photos: [3], kind: "other", text: "We intentionally skip synthetic emulsifiers, gums, anti-caking agents, artificial flavors, and fillers. Because of that, you may notice natural settling or clumping when mixing, that’s normal.", complete: true }
      ]
    },
    'ji-vanilla-peanut-butter': {
      panels: [
        {
          photo: 4,
          also_in_photos: [2],
          title: "Nutrition Facts",
          serving_size: "Serving size 1 Scoop (48.4g)",
          servings: "Servings Per Container: 25",
          header: { amount: "Amount per serving", dv: "% Daily Value†" },
          complete: true,
          rows: [
            { name: "Calories", amount: "200", dv: "", indent: 0 },
            { name: "Total Fat", amount: "8g", dv: "10%", indent: 0 },
            { name: "Saturated Fat", amount: "5g", dv: "25%", indent: 1 },
            { name: "Trans Fat", amount: "0g", dv: "", indent: 1 },
            { name: "Cholesterol", amount: "40mg", dv: "13%", indent: 0 },
            { name: "Sodium", amount: "300mg", dv: "13%", indent: 0 },
            { name: "Total Carbohydrate", amount: "7g", dv: "2%", indent: 0 },
            { name: "Dietary Fiber", amount: "1g", dv: "4%", indent: 1 },
            { name: "Total Sugars", amount: "2g", dv: "", indent: 1 },
            { name: "Includes Added Sugars", amount: "0g", dv: "0%", indent: 2, printed: "Includes 0g Added Sugars" },
            { name: "Protein", amount: "25g", dv: "42%", indent: 0 },
            { name: "Vitamin D", amount: "0mcg", dv: "0%", indent: 0 },
            { name: "Calcium", amount: "70mg", dv: "6%", indent: 0 },
            { name: "Iron", amount: "0mg", dv: "0%", indent: 0 },
            { name: "Potassium", amount: "280mg", dv: "6%", indent: 0 }
          ],
          footnotes: ["†The % Daily Value tells you how much a nutrient in a serving of food contributes to a daily diet. 2000 calories a day is used for general nutrition advice."]
        }
      ],
      ingredients: { photo: 3, also_in_photos: [2], heading: "INGREDIENTS", text: "Certified Grass-Fed Non-Denatured Whey Protein Concentrate, Organic Peanut Flour, Organic Coconut Milk*, Creatine Monohydrate (Pürest Creatine™), Grass-Fed Collagen, Organic Pea Protein, Organic Vanilla Extract Powder*, Sea Salt, Organic Chia Seed Protein, Organic Monk Fruit Extract, Vanilla Bean" },
      statements: [
        { photo: 3, also_in_photos: [2], kind: "allergen", text: "CONTAINS: DAIRY & PEANUT", complete: true },
        { photo: 3, kind: "other", text: "*With Tapioca Starch", complete: true },
        { photo: 1, kind: "other", text: "25g PROTEIN, 5g CREATINE MONOHYDRATE, 0g ADDED SUGAR", items: ["25g PROTEIN", "5g CREATINE MONOHYDRATE", "0g ADDED SUGAR"], complete: false },
        { photo: 1, kind: "other", text: "No Artificial Flavors, Third Party Tested, Certified Grass-Fed Whey Protein", items: ["No Artificial Flavors", "Third Party Tested", "Certified Grass-Fed Whey Protein"], complete: false },
        { photo: 3, also_in_photos: [2], kind: "other", text: "MADE WITH REAL INGREDIENTS • NO ARTIFICIAL FLAVORS • NO SUGAR ALCOHOLS OR ARTIFICIAL SWEETENERS LIKE SUCRALOSE • PROTEIN FROM REAL FOOD SOURCES –BOTH PLANT AND ANIMAL • NO SYNTHETIC GUMS, FILLERS, OR EMULSIFIERS", complete: true },
        { photo: 3, also_in_photos: [2], kind: "other", text: "We intentionally skip synthetic emulsifiers, gums, anti-caking agents, artificial flavors, and fillers. Because of that, you may notice natural settling or clumping when mixing, that’s normal.", complete: true },
        { photo: 3, also_in_photos: [2], kind: "other", text: "SOY FREE, NON GMO", items: ["SOY FREE", "NON GMO"], complete: false }
      ]
    }
  }
};
