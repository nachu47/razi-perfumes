export const categories = [
  { id: 'signature', name: "Signature Collection's", image: 'https://kw.gissah.com/web/image/product.public.category/13/image_1920/1024x0?unique=cc42a6c' },
  { id: 'inspired', name: 'INSPIRE VERSION PERFUME', image: 'https://kw.gissah.com/web/image/product.public.category/11/image_1920/1024x0?unique=3d8a714' },
  { id: 'gift-sets', name: 'Gift set', image: 'https://kw.gissah.com/web/image/product.public.category/18/image_1920/1024x0?unique=1ab1e03' },
  { id: 'hair-mist-body-cream', name: 'Hair Mist & Body Cream', image: 'https://kw.gissah.com/web/image/product.public.category/52/image_1920/1024x0?unique=1e629ba' },
  { id: 'home-fragrance', name: 'HOME FRAGRANCE', image: 'https://kw.gissah.com/web/image/product.public.category/53/image_1920/1024x0?unique=21288ce' },
  { id: 'buhur', name: 'BUHUR', image: 'https://kw.gissah.com/web/image/product.public.category/14/image_1920/1024x0?unique=fdb1ef3' },
  { id: 'offers', name: 'OFFERS', image: 'https://kw.gissah.com/web/image/product.public.category/52/image_1920/1024x0?unique=1e629ba' },
];

export const allProducts = [
  // Signature Collection
  {
    id: 'p1',
    name: 'Beyond Me',
    category: 'signature',
    volume: '200 Ml',
    price: '23.000 KD',
    image: 'https://kw.gissah.com/web/image/product.product/1322/image_1920/1024x0?unique=9639072',
    description: 'An ethereal journey of the senses. Beyond Me captures the timeless elegance of Arabian heritage fused with modern sophistication. A lingering trail that defines presence.',
    gender: 'unisex',
    noteTags: ['woody', 'oud', 'spicy'],
    notes: {
      top: 'Saffron, Bergamot, Pink Pepper',
      heart: 'Rose, Jasmine, Leather',
      base: 'Agarwood (Oud), Amber, Patchouli, Musk'
    },
    ingredients: 'Alcohol Denat., Fragrance (Parfum), Water (Aqua), Limonene, Linalool, Coumarin, Citronellol, Geraniol.'
  },
  {
    id: 'p2',
    name: 'Hudson Amora',
    category: 'signature',
    volume: '200 Ml',
    price: '23.000 KD',
    image: 'https://kw.gissah.com/web/image/product.product/1244/image_1920/1024x0?unique=4057cb6',
    description: 'A deep, romantic whisper. Hudson Amora invites you into a garden of blooming Turkish roses and fresh, crisp orchard fruits, dry-down to a rich vanilla base.',
    gender: 'female',
    noteTags: ['sweet', 'floral', 'fruity'],
    notes: {
      top: 'Turkish Rose, Pear, Red Fruit',
      heart: 'Amberwood, Vanilla Blossom, Patchouli',
      base: 'White Musk, Cashmeran, Cedarwood'
    },
    ingredients: 'Alcohol Denat., Parfum, Aqua, Benzyl Salicylate, Alpha-Isomethyl Ionone, Hydroxycitronellal.'
  },
  {
    id: 'p3',
    name: 'Hudson Valley',
    category: 'signature',
    volume: '200 Ml',
    price: '23.000 KD',
    image: 'https://kw.gissah.com/web/image/product.product/733/image_1920/1024x0?unique=82f3ecd',
    description: 'The iconic masterpiece. Hudson Valley is inspired by the dew-covered valleys of the Hudson, featuring a fresh opening of sweet fruits followed by warm amber.',
    gender: 'unisex',
    noteTags: ['fruity', 'sweet', 'woody'],
    notes: {
      top: 'Blackcurrant, Pear, Mandarin',
      heart: 'Rose, Jasmine, Amber',
      base: 'Sandalwood, Vanilla, Musk'
    },
    ingredients: 'Alcohol Denat., Fragrance, Aqua, Linalool, Benzyl Benzoate, Farnesol.'
  },
  {
    id: 'p4',
    name: 'Helen Legacy',
    category: 'signature',
    volume: '200 Ml',
    price: '23.000 KD',
    image: 'https://kw.gissah.com/web/image/product.product/1180/image_1920/1024x0?unique=5da9496',
    description: 'A tribute to classical luxury. Helen Legacy offers a unique blend of sweet lavender and deep balsamic notes, capturing a legacy of refined tastes.',
    gender: 'male',
    noteTags: ['spicy', 'woody', 'musky'],
    notes: {
      top: 'Lavender, Cardamom, Mint',
      heart: 'Cinnamon, Cumin, Iris',
      base: 'Vanilla, Tonka Bean, Sandalwood'
    },
    ingredients: 'Alcohol Denat., Fragrance, Aqua, Citral, Eugenol, Limonene.'
  },

  // Inspired Version Perfume
  {
    id: 'p5',
    name: 'Inspired Beyond Me',
    category: 'inspired',
    sizes: ['50ml', '100ml'],
    prices: {
      '50ml': '12.000 KD',
      '100ml': '18.000 KD'
    },
    image: 'https://kw.gissah.com/web/image/product.product/1322/image_1920/1024x0?unique=9639072',
    description: 'A premium inspired version of Beyond Me. An ethereal blend of warm saffron, rich agarwood oud, and musky undertones recreated to perfection.',
    gender: 'unisex',
    noteTags: ['woody', 'oud', 'spicy'],
    notes: {
      top: 'Saffron, Bergamot, Pink Pepper',
      heart: 'Rose, Jasmine, Leather',
      base: 'Agarwood (Oud), Amber, Patchouli, Musk'
    },
    ingredients: 'Alcohol Denat., Fragrance (Parfum), Water (Aqua), Limonene, Linalool.'
  },
  {
    id: 'p6',
    name: 'Inspired Hudson Valley',
    category: 'inspired',
    sizes: ['50ml', '100ml'],
    prices: {
      '50ml': '12.000 KD',
      '100ml': '18.000 KD'
    },
    image: 'https://kw.gissah.com/web/image/product.product/733/image_1920/1024x0?unique=82f3ecd',
    description: 'A high-fidelity inspired rendition of Hudson Valley. Captures the famous dew-covered blackcurrant, jasmine heart, and creamy vanilla-sandalwood base.',
    gender: 'unisex',
    noteTags: ['fruity', 'sweet', 'woody'],
    notes: {
      top: 'Blackcurrant, Pear, Mandarin',
      heart: 'Rose, Jasmine, Amber',
      base: 'Sandalwood, Vanilla, Musk'
    },
    ingredients: 'Alcohol Denat., Fragrance, Aqua, Linalool.'
  },
  {
    id: 'p7',
    name: 'Inspired Imperial Oud',
    category: 'inspired',
    sizes: ['50ml', '100ml'],
    prices: {
      '50ml': '14.000 KD',
      '100ml': '22.000 KD'
    },
    image: 'https://kw.gissah.com/web/image/product.product/1163/image_1920/1024x0?unique=8340b11',
    description: 'Our luxurious inspired rendition of Imperial Oud. Centers on heavy Cambodian oud, incense smoke, and velvet Damask rose for a royal sillage.',
    gender: 'unisex',
    noteTags: ['oud', 'woody', 'spicy'],
    notes: {
      top: 'Saffron, Incense, Labdanum',
      heart: 'Damask Rose, Patchouli, Leather',
      base: 'Cambodian Oud, Sandalwood, Amberwood'
    },
    ingredients: 'Alcohol Denat., Parfum, Aqua, Citronellol, Limonene.'
  },

  // Gift sets
  {
    id: 'p8',
    name: 'Imperial Luxury Gift Set',
    category: 'gift-sets',
    volume: '3 x 50ml',
    price: '45.000 KD',
    image: 'https://kw.gissah.com/web/image/product.public.category/18/background_image/1920x0?unique=1ab1e03',
    description: 'The ultimate curated gift collection. A luxurious presentation containing three of our most sought-after signature creations in convenient 50ml bottles.',
    gender: 'unisex',
    noteTags: ['woody', 'sweet', 'floral'],
    notes: {
      top: 'Saffron, Blackcurrant, Bergamot',
      heart: 'Rose, Jasmine, Amberwood',
      base: 'Oud, Vanilla, Musk, Sandalwood'
    },
    ingredients: 'Alcohol Denat., Parfum, Aqua.'
  },

  // Hair Mist & Body Cream
  {
    id: 'p9',
    name: 'Beyond Me Hair Mist',
    category: 'hair-mist-body-cream',
    volume: '75ml',
    price: '12.000 KD',
    image: 'https://kw.gissah.com/web/image/product.public.category/52/image_1920/1024x0?unique=1e629ba',
    description: 'A light, nourishing hair mist infused with the iconic scent of Beyond Me. Protects and scents the hair with a delicate trail of saffron, rose, and amber.',
    gender: 'female',
    noteTags: ['musky', 'floral', 'spicy'],
    notes: {
      top: 'Bergamot, Saffron',
      heart: 'Jasmine, Soft Rose',
      base: 'Amber, Light Musk'
    },
    ingredients: 'Water (Aqua), Alcohol Denat., Fragrance, Glycerin, Panthenol.'
  },

  // HOME FRAGRANCE
  {
    id: 'p10',
    name: 'Oud Royal Room Spray',
    category: 'home-fragrance',
    volume: '500ml',
    price: '9.000 KD',
    image: 'https://kw.gissah.com/web/image/product.public.category/53/image_1920/1024x0?unique=21288ce',
    description: 'An opulent room spray designed to fill your home with the warm, welcoming aroma of royal Cambodian oud, saffron, and sweet amber.',
    gender: 'unisex',
    noteTags: ['oud', 'woody', 'sweet'],
    notes: {
      top: 'Saffron, Cinnamon',
      heart: 'Amber, Cedarwood',
      base: 'Cambodian Oud, Sandalwood'
    },
    ingredients: 'Water, Fragrance Solubilizer, Essential Oils, Preservatives.'
  },

  // BUHUR
  {
    id: 'p11',
    name: 'Buhur Razi',
    category: 'buhur',
    volume: '70g',
    price: '16.000 KD',
    image: 'https://kw.gissah.com/web/image/product.public.category/14/image_1920/1024x0?unique=fdb1ef3',
    description: 'Traditional luxury incense chips soaked in premium essential oils of Taif rose, saffron, agarwood, and sandalwood. Exudes a rich, meditative smoke.',
    gender: 'unisex',
    noteTags: ['oud', 'spicy', 'woody'],
    notes: {
      top: 'Taif Rose, Bergamot',
      heart: 'Saffron, Cardamom, Leather',
      base: 'Agarwood (Oud), Sandalwood, Musk'
    },
    ingredients: 'Agarwood Powder, Essential Oils, Incense Resins.'
  },

  // OFFERS
  {
    id: 'p12',
    name: 'Special Signature Duo Set',
    category: 'offers',
    volume: '2 x 200ml',
    price: '38.000 KD',
    image: 'https://kw.gissah.com/web/image/product.public.category/18/background_image/1920x0?unique=1ab1e03',
    description: 'A limited-time special offer containing two of our iconic 200ml Signature fragrances (Beyond Me & Hudson Valley) at a celebratory bundle price.',
    gender: 'unisex',
    noteTags: ['woody', 'fruity', 'sweet'],
    notes: {
      top: 'Saffron, Blackcurrant, Pear',
      heart: 'Rose, Jasmine, Amber',
      base: 'Agarwood, Sandalwood, Vanilla'
    },
    ingredients: 'Alcohol Denat., Parfum, Aqua.'
  }
];

export const getProductsByCategory = (catId) => {
  return allProducts.filter(p => p.category === catId);
};

export const getProductById = (id) => {
  return allProducts.find(p => p.id === id);
};
