/* eslint-disable no-console */
// Seed script — safe to run multiple times (everything is upserted).
// Run with: npm run db:seed
import { PrismaClient, Gender } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const IMG = 'https://kw.gissah.com/web/image';

const collections = [
  { slug: 'signature', nameEn: "Signature Collection's", nameAr: 'مجموعة التوقيع', image: `${IMG}/product.public.category/13/image_1920/1024x0?unique=cc42a6c`, descriptionEn: 'Our iconic 200ml signature creations.', descriptionAr: 'إبداعاتنا الأيقونية بحجم 200 مل.' },
  { slug: 'inspired', nameEn: 'INSPIRE VERSION PERFUME', nameAr: 'عطور مستوحاة', image: `${IMG}/product.public.category/11/image_1920/1024x0?unique=3d8a714`, descriptionEn: 'Premium inspired renditions in 50ml and 100ml.', descriptionAr: 'نسخ مستوحاة فاخرة بحجم 50 و100 مل.' },
  { slug: 'gift-sets', nameEn: 'Gift set', nameAr: 'أطقم الهدايا', image: `${IMG}/product.public.category/18/image_1920/1024x0?unique=1ab1e03`, descriptionEn: 'Curated gift collections.', descriptionAr: 'مجموعات هدايا منسقة بعناية.' },
  { slug: 'hair-mist-body-cream', nameEn: 'Hair Mist & Body Cream', nameAr: 'معطر الشعر وكريم الجسم', image: `${IMG}/product.public.category/52/image_1920/1024x0?unique=1e629ba`, descriptionEn: 'Scented care for hair and body.', descriptionAr: 'عناية معطرة للشعر والجسم.' },
  { slug: 'home-fragrance', nameEn: 'HOME FRAGRANCE', nameAr: 'معطرات المنزل', image: `${IMG}/product.public.category/53/image_1920/1024x0?unique=21288ce`, descriptionEn: 'Fill your home with luxury.', descriptionAr: 'املأ منزلك بالفخامة.' },
  { slug: 'buhur', nameEn: 'BUHUR', nameAr: 'بخور', image: `${IMG}/product.public.category/14/image_1920/1024x0?unique=fdb1ef3`, descriptionEn: 'Traditional luxury incense.', descriptionAr: 'بخور فاخر تقليدي.' },
  { slug: 'offers', nameEn: 'OFFERS', nameAr: 'العروض', image: `${IMG}/product.public.category/52/image_1920/1024x0?unique=1e629ba`, descriptionEn: 'Limited-time special offers.', descriptionAr: 'عروض خاصة لفترة محدودة.' },
];

type SeedVariant = { label: string; sizeMl: number | null; price: string; stock?: number };
type SeedProduct = {
  slug: string; nameEn: string; nameAr: string; collection: string; gender: Gender; image: string;
  descriptionEn: string; descriptionAr: string; noteTags: string[];
  notes: [string, string, string]; notesAr: [string, string, string];
  ingredientsEn: string; isRecommended?: boolean; isFeatured?: boolean; variants: SeedVariant[];
};

const products: SeedProduct[] = [
  // ── Signature (homepage "Recommended For You")
  {
    slug: 'beyond-me', nameEn: 'Beyond Me', nameAr: 'بيوند مي', collection: 'signature', gender: 'UNISEX', isRecommended: true,
    image: `${IMG}/product.product/1322/image_1920/1024x0?unique=9639072`,
    descriptionEn: 'An ethereal journey of the senses. Beyond Me captures the timeless elegance of Arabian heritage fused with modern sophistication. A lingering trail that defines presence.',
    descriptionAr: 'رحلة أثيرية للحواس. يجسد بيوند مي الأناقة الخالدة للتراث العربي ممزوجة برقي عصري، بأثر يدوم ويعرّف الحضور.',
    noteTags: ['woody', 'oud', 'spicy'],
    notes: ['Saffron, Bergamot, Pink Pepper', 'Rose, Jasmine, Leather', 'Agarwood (Oud), Amber, Patchouli, Musk'],
    notesAr: ['زعفران، برغموت، فلفل وردي', 'ورد، ياسمين، جلد', 'عود، عنبر، باتشولي، مسك'],
    ingredientsEn: 'Alcohol Denat., Fragrance (Parfum), Water (Aqua), Limonene, Linalool, Coumarin, Citronellol, Geraniol.',
    variants: [{ label: '200 Ml', sizeMl: 200, price: '23.000' }],
  },
  {
    slug: 'hudson-amora', nameEn: 'Hudson Amora', nameAr: 'هدسون أمورا', collection: 'signature', gender: 'FEMALE', isRecommended: true,
    image: `${IMG}/product.product/1244/image_1920/1024x0?unique=4057cb6`,
    descriptionEn: 'A deep, romantic whisper. Hudson Amora invites you into a garden of blooming Turkish roses and fresh, crisp orchard fruits, dry-down to a rich vanilla base.',
    descriptionAr: 'همسة رومانسية عميقة. يدعوك هدسون أمورا إلى حديقة من الورد التركي المتفتح وفواكه البساتين المنعشة، لينتهي بقاعدة غنية من الفانيليا.',
    noteTags: ['sweet', 'floral', 'fruity'],
    notes: ['Turkish Rose, Pear, Red Fruit', 'Amberwood, Vanilla Blossom, Patchouli', 'White Musk, Cashmeran, Cedarwood'],
    notesAr: ['ورد تركي، كمثرى، فواكه حمراء', 'خشب العنبر، زهر الفانيليا، باتشولي', 'مسك أبيض، كشميران، خشب الأرز'],
    ingredientsEn: 'Alcohol Denat., Parfum, Aqua, Benzyl Salicylate, Alpha-Isomethyl Ionone, Hydroxycitronellal.',
    variants: [{ label: '200 Ml', sizeMl: 200, price: '23.000' }],
  },
  {
    slug: 'hudson-valley', nameEn: 'Hudson Valley', nameAr: 'هدسون فالي', collection: 'signature', gender: 'UNISEX', isRecommended: true,
    image: `${IMG}/product.product/733/image_1920/1024x0?unique=82f3ecd`,
    descriptionEn: 'The iconic masterpiece. Hudson Valley is inspired by the dew-covered valleys of the Hudson, featuring a fresh opening of sweet fruits followed by warm amber.',
    descriptionAr: 'التحفة الأيقونية. مستوحى من وديان هدسون المغطاة بالندى، بافتتاحية منعشة من الفواكه الحلوة يتبعها عنبر دافئ.',
    noteTags: ['fruity', 'sweet', 'woody'],
    notes: ['Blackcurrant, Pear, Mandarin', 'Rose, Jasmine, Amber', 'Sandalwood, Vanilla, Musk'],
    notesAr: ['كشمش أسود، كمثرى، يوسفي', 'ورد، ياسمين، عنبر', 'خشب الصندل، فانيليا، مسك'],
    ingredientsEn: 'Alcohol Denat., Fragrance, Aqua, Linalool, Benzyl Benzoate, Farnesol.',
    variants: [{ label: '200 Ml', sizeMl: 200, price: '23.000' }],
  },
  {
    slug: 'helen-legacy', nameEn: 'Helen Legacy', nameAr: 'هيلين ليجاسي', collection: 'signature', gender: 'MALE', isRecommended: true,
    image: `${IMG}/product.product/1180/image_1920/1024x0?unique=5da9496`,
    descriptionEn: 'A tribute to classical luxury. Helen Legacy offers a unique blend of sweet lavender and deep balsamic notes, capturing a legacy of refined tastes.',
    descriptionAr: 'تحية للفخامة الكلاسيكية. يقدم هيلين ليجاسي مزيجاً فريداً من اللافندر الحلو والنفحات البلسمية العميقة.',
    noteTags: ['spicy', 'woody', 'musky'],
    notes: ['Lavender, Cardamom, Mint', 'Cinnamon, Cumin, Iris', 'Vanilla, Tonka Bean, Sandalwood'],
    notesAr: ['لافندر، هيل، نعناع', 'قرفة، كمون، سوسن', 'فانيليا، حبوب التونكا، خشب الصندل'],
    ingredientsEn: 'Alcohol Denat., Fragrance, Aqua, Citral, Eugenol, Limonene.',
    variants: [{ label: '200 Ml', sizeMl: 200, price: '23.000' }],
  },
  // ── Luxury Line (homepage "Luxury Line" = isFeatured)
  {
    slug: 'martinique-osmanthus', nameEn: 'Martinique Osmanthus', nameAr: 'مارتينيك أوسمانثوس', collection: 'signature', gender: 'UNISEX', isFeatured: true,
    image: `${IMG}/product.product/1163/image_1920/1024x0?unique=8340b11`,
    descriptionEn: 'A sunlit escape. Golden osmanthus and apricot blossom drift over a warm bed of suede and soft woods.',
    descriptionAr: 'هروب مشمس. زهر الأوسمانثوس الذهبي وزهر المشمش ينسابان فوق قاعدة دافئة من الشامواه والأخشاب الناعمة.',
    noteTags: ['floral', 'fruity', 'woody'],
    notes: ['Osmanthus, Apricot, Bergamot', 'Jasmine, Orange Blossom', 'Suede, Cedarwood, Musk'],
    notesAr: ['أوسمانثوس، مشمش، برغموت', 'ياسمين، زهر البرتقال', 'شامواه، خشب الأرز، مسك'],
    ingredientsEn: 'Alcohol Denat., Parfum, Aqua, Linalool, Limonene.',
    variants: [{ label: '200 Ml', sizeMl: 200, price: '23.000' }],
  },
  {
    slug: 'capri', nameEn: 'Capri', nameAr: 'كابري', collection: 'signature', gender: 'UNISEX', isFeatured: true,
    image: `${IMG}/product.product/711/image_1920/1024x0?unique=eca469a`,
    descriptionEn: 'The Mediterranean in a bottle. Sparkling citrus and sea salt meet a heart of fig leaves and a creamy sandalwood finish.',
    descriptionAr: 'البحر المتوسط في زجاجة. حمضيات متلألئة وملح البحر مع قلب من أوراق التين ونهاية كريمية من خشب الصندل.',
    noteTags: ['fruity', 'woody'],
    notes: ['Lemon, Sea Salt, Bergamot', 'Fig Leaf, Neroli', 'Sandalwood, White Musk'],
    notesAr: ['ليمون، ملح البحر، برغموت', 'ورق التين، نيرولي', 'خشب الصندل، مسك أبيض'],
    ingredientsEn: 'Alcohol Denat., Parfum, Aqua, Citral, Limonene.',
    variants: [{ label: '200 Ml', sizeMl: 200, price: '23.000' }],
  },
  {
    slug: 'calabria-eau-de-parfum', nameEn: 'Calabria Eau de Parfum', nameAr: 'كالابريا أو دو بارفان', collection: 'signature', gender: 'MALE', isFeatured: true,
    image: `${IMG}/product.product/730/image_1920/1024x0?unique=3c9bfd7`,
    descriptionEn: 'Sun-drenched Calabrian bergamot wrapped in aromatic herbs and smoky vetiver — bright, confident and timeless.',
    descriptionAr: 'برغموت كالابريا المشمس ملفوف بالأعشاب العطرية ونجيل الهند المدخن — مشرق وواثق وخالد.',
    noteTags: ['spicy', 'woody'],
    notes: ['Calabrian Bergamot, Grapefruit', 'Lavender, Geranium, Black Pepper', 'Vetiver, Ambroxan, Cedar'],
    notesAr: ['برغموت كالابريا، جريب فروت', 'لافندر، إبرة الراعي، فلفل أسود', 'نجيل الهند، أمبروكسان، أرز'],
    ingredientsEn: 'Alcohol Denat., Parfum, Aqua, Linalool, Coumarin.',
    variants: [{ label: '200 Ml', sizeMl: 200, price: '23.000' }],
  },
  {
    slug: 'imperial-oud', nameEn: 'Imperial Oud', nameAr: 'إمبريال عود', collection: 'signature', gender: 'UNISEX', isFeatured: true,
    image: `${IMG}/product.product/1322/image_1920/1024x0?unique=9639072`,
    descriptionEn: 'A regal composition of heavy Cambodian oud, incense smoke and velvet Damask rose for a royal sillage.',
    descriptionAr: 'تركيبة ملكية من العود الكمبودي الثقيل ودخان البخور والورد الدمشقي المخملي لأثر ملكي.',
    noteTags: ['oud', 'woody', 'spicy'],
    notes: ['Saffron, Incense, Labdanum', 'Damask Rose, Patchouli, Leather', 'Cambodian Oud, Sandalwood, Amberwood'],
    notesAr: ['زعفران، بخور، لادن', 'ورد دمشقي، باتشولي، جلد', 'عود كمبودي، خشب الصندل، خشب العنبر'],
    ingredientsEn: 'Alcohol Denat., Parfum, Aqua, Citronellol, Limonene.',
    variants: [{ label: '100 Ml', sizeMl: 100, price: '32.000' }],
  },
  // ── Inspired (multi-size)
  {
    slug: 'inspired-beyond-me', nameEn: 'Inspired Beyond Me', nameAr: 'بيوند مي المستوحى', collection: 'inspired', gender: 'UNISEX',
    image: `${IMG}/product.product/1322/image_1920/1024x0?unique=9639072`,
    descriptionEn: 'A premium inspired version of Beyond Me. An ethereal blend of warm saffron, rich agarwood oud, and musky undertones recreated to perfection.',
    descriptionAr: 'نسخة مستوحاة فاخرة من بيوند مي. مزيج أثيري من الزعفران الدافئ والعود الغني ولمسات المسك.',
    noteTags: ['woody', 'oud', 'spicy'],
    notes: ['Saffron, Bergamot, Pink Pepper', 'Rose, Jasmine, Leather', 'Agarwood (Oud), Amber, Patchouli, Musk'],
    notesAr: ['زعفران، برغموت، فلفل وردي', 'ورد، ياسمين، جلد', 'عود، عنبر، باتشولي، مسك'],
    ingredientsEn: 'Alcohol Denat., Fragrance (Parfum), Water (Aqua), Limonene, Linalool.',
    variants: [{ label: '50ml', sizeMl: 50, price: '12.000' }, { label: '100ml', sizeMl: 100, price: '18.000' }],
  },
  {
    slug: 'inspired-hudson-valley', nameEn: 'Inspired Hudson Valley', nameAr: 'هدسون فالي المستوحى', collection: 'inspired', gender: 'UNISEX',
    image: `${IMG}/product.product/733/image_1920/1024x0?unique=82f3ecd`,
    descriptionEn: 'A high-fidelity inspired rendition of Hudson Valley. Captures the famous dew-covered blackcurrant, jasmine heart, and creamy vanilla-sandalwood base.',
    descriptionAr: 'نسخة مستوحاة عالية الدقة من هدسون فالي، بالكشمش الأسود الشهير وقلب الياسمين وقاعدة الفانيليا والصندل الكريمية.',
    noteTags: ['fruity', 'sweet', 'woody'],
    notes: ['Blackcurrant, Pear, Mandarin', 'Rose, Jasmine, Amber', 'Sandalwood, Vanilla, Musk'],
    notesAr: ['كشمش أسود، كمثرى، يوسفي', 'ورد، ياسمين، عنبر', 'خشب الصندل، فانيليا، مسك'],
    ingredientsEn: 'Alcohol Denat., Fragrance, Aqua, Linalool.',
    variants: [{ label: '50ml', sizeMl: 50, price: '12.000' }, { label: '100ml', sizeMl: 100, price: '18.000' }],
  },
  {
    slug: 'inspired-imperial-oud', nameEn: 'Inspired Imperial Oud', nameAr: 'إمبريال عود المستوحى', collection: 'inspired', gender: 'UNISEX',
    image: `${IMG}/product.product/1163/image_1920/1024x0?unique=8340b11`,
    descriptionEn: 'Our luxurious inspired rendition of Imperial Oud. Centers on heavy Cambodian oud, incense smoke, and velvet Damask rose for a royal sillage.',
    descriptionAr: 'نسختنا المستوحاة الفاخرة من إمبريال عود، تتمحور حول العود الكمبودي ودخان البخور والورد الدمشقي.',
    noteTags: ['oud', 'woody', 'spicy'],
    notes: ['Saffron, Incense, Labdanum', 'Damask Rose, Patchouli, Leather', 'Cambodian Oud, Sandalwood, Amberwood'],
    notesAr: ['زعفران، بخور، لادن', 'ورد دمشقي، باتشولي، جلد', 'عود كمبودي، خشب الصندل، خشب العنبر'],
    ingredientsEn: 'Alcohol Denat., Parfum, Aqua, Citronellol, Limonene.',
    variants: [{ label: '50ml', sizeMl: 50, price: '14.000' }, { label: '100ml', sizeMl: 100, price: '22.000' }],
  },
  // ── Other collections
  {
    slug: 'imperial-luxury-gift-set', nameEn: 'Imperial Luxury Gift Set', nameAr: 'طقم هدايا إمبريال الفاخر', collection: 'gift-sets', gender: 'UNISEX',
    image: `${IMG}/product.public.category/18/background_image/1920x0?unique=1ab1e03`,
    descriptionEn: 'The ultimate curated gift collection. A luxurious presentation containing three of our most sought-after signature creations in convenient 50ml bottles.',
    descriptionAr: 'مجموعة الهدايا المثالية. تقديم فاخر يضم ثلاثة من أكثر إبداعاتنا طلباً في زجاجات 50 مل.',
    noteTags: ['woody', 'sweet', 'floral'],
    notes: ['Saffron, Blackcurrant, Bergamot', 'Rose, Jasmine, Amberwood', 'Oud, Vanilla, Musk, Sandalwood'],
    notesAr: ['زعفران، كشمش أسود، برغموت', 'ورد، ياسمين، خشب العنبر', 'عود، فانيليا، مسك، صندل'],
    ingredientsEn: 'Alcohol Denat., Parfum, Aqua.',
    variants: [{ label: '3 x 50ml', sizeMl: 150, price: '45.000' }],
  },
  {
    slug: 'beyond-me-hair-mist', nameEn: 'Beyond Me Hair Mist', nameAr: 'معطر شعر بيوند مي', collection: 'hair-mist-body-cream', gender: 'FEMALE',
    image: `${IMG}/product.public.category/52/image_1920/1024x0?unique=1e629ba`,
    descriptionEn: 'A light, nourishing hair mist infused with the iconic scent of Beyond Me. Protects and scents the hair with a delicate trail of saffron, rose, and amber.',
    descriptionAr: 'معطر شعر خفيف ومغذٍ بعطر بيوند مي الأيقوني، يحمي الشعر ويعطره بأثر رقيق من الزعفران والورد والعنبر.',
    noteTags: ['musky', 'floral', 'spicy'],
    notes: ['Bergamot, Saffron', 'Jasmine, Soft Rose', 'Amber, Light Musk'],
    notesAr: ['برغموت، زعفران', 'ياسمين، ورد ناعم', 'عنبر، مسك خفيف'],
    ingredientsEn: 'Water (Aqua), Alcohol Denat., Fragrance, Glycerin, Panthenol.',
    variants: [{ label: '75ml', sizeMl: 75, price: '12.000' }],
  },
  {
    slug: 'oud-royal-room-spray', nameEn: 'Oud Royal Room Spray', nameAr: 'معطر غرف العود الملكي', collection: 'home-fragrance', gender: 'UNISEX',
    image: `${IMG}/product.public.category/53/image_1920/1024x0?unique=21288ce`,
    descriptionEn: 'An opulent room spray designed to fill your home with the warm, welcoming aroma of royal Cambodian oud, saffron, and sweet amber.',
    descriptionAr: 'معطر غرف فاخر يملأ منزلك برائحة العود الكمبودي الملكي والزعفران والعنبر الحلو.',
    noteTags: ['oud', 'woody', 'sweet'],
    notes: ['Saffron, Cinnamon', 'Amber, Cedarwood', 'Cambodian Oud, Sandalwood'],
    notesAr: ['زعفران، قرفة', 'عنبر، خشب الأرز', 'عود كمبودي، خشب الصندل'],
    ingredientsEn: 'Water, Fragrance Solubilizer, Essential Oils, Preservatives.',
    variants: [{ label: '500ml', sizeMl: 500, price: '9.000' }],
  },
  {
    slug: 'buhur-razi', nameEn: 'Buhur Razi', nameAr: 'بخور رازي', collection: 'buhur', gender: 'UNISEX',
    image: `${IMG}/product.public.category/14/image_1920/1024x0?unique=fdb1ef3`,
    descriptionEn: 'Traditional luxury incense chips soaked in premium essential oils of Taif rose, saffron, agarwood, and sandalwood. Exudes a rich, meditative smoke.',
    descriptionAr: 'رقائق بخور تقليدية فاخرة منقوعة في زيوت ورد الطائف والزعفران والعود والصندل، تفوح بدخان غني.',
    noteTags: ['oud', 'spicy', 'woody'],
    notes: ['Taif Rose, Bergamot', 'Saffron, Cardamom, Leather', 'Agarwood (Oud), Sandalwood, Musk'],
    notesAr: ['ورد الطائف، برغموت', 'زعفران، هيل، جلد', 'عود، خشب الصندل، مسك'],
    ingredientsEn: 'Agarwood Powder, Essential Oils, Incense Resins.',
    variants: [{ label: '70g', sizeMl: null, price: '16.000' }],
  },
  {
    slug: 'special-signature-duo-set', nameEn: 'Special Signature Duo Set', nameAr: 'طقم التوقيع الثنائي الخاص', collection: 'offers', gender: 'UNISEX',
    image: `${IMG}/product.public.category/18/background_image/1920x0?unique=1ab1e03`,
    descriptionEn: 'A limited-time special offer containing two of our iconic 200ml Signature fragrances (Beyond Me & Hudson Valley) at a celebratory bundle price.',
    descriptionAr: 'عرض خاص لفترة محدودة يضم عطرين من عطور التوقيع بحجم 200 مل (بيوند مي وهدسون فالي) بسعر احتفالي.',
    noteTags: ['woody', 'fruity', 'sweet'],
    notes: ['Saffron, Blackcurrant, Pear', 'Rose, Jasmine, Amber', 'Agarwood, Sandalwood, Vanilla'],
    notesAr: ['زعفران، كشمش أسود، كمثرى', 'ورد، ياسمين، عنبر', 'عود، خشب الصندل، فانيليا'],
    ingredientsEn: 'Alcohol Denat., Parfum, Aqua.',
    variants: [{ label: '2 x 200ml', sizeMl: 400, price: '38.000' }],
  },
];

const currencyRates = [
  // Approximate rates — update from the admin panel (Currency rates) before going live.
  { code: 'KWD', rateFromKWD: '1' },
  { code: 'SAR', rateFromKWD: '12.20' },
  { code: 'AED', rateFromKWD: '11.95' },
  { code: 'QAR', rateFromKWD: '11.85' },
  { code: 'OMR', rateFromKWD: '1.252' },
  { code: 'BHD', rateFromKWD: '1.225' },
];

const shippingRates = [
  { country: 'KW', fee: '2.000', freeShippingThreshold: '20.000', estimatedDays: '1-2' },
  { country: 'SA', fee: '5.000', freeShippingThreshold: '50.000', estimatedDays: '3-5' },
  { country: 'AE', fee: '5.000', freeShippingThreshold: '50.000', estimatedDays: '3-5' },
  { country: 'QA', fee: '5.000', freeShippingThreshold: '50.000', estimatedDays: '3-5' },
  { country: 'OM', fee: '5.000', freeShippingThreshold: '50.000', estimatedDays: '3-6' },
  { country: 'BH', fee: '4.000', freeShippingThreshold: '40.000', estimatedDays: '2-4' },
];

const placeholder = (en: string) =>
  `## ${en}\n\nThis page is managed from the Razi Perfumes admin panel (Admin → Content pages). Replace this placeholder text with your final content.\n\nRazi Perfumes is a bridge between traditional Arabian heritage and modern, luxurious perfumery.`;
const placeholderAr = (ar: string) =>
  `## ${ar}\n\nتتم إدارة هذه الصفحة من لوحة تحكم رازي للعطور (المسؤول ← صفحات المحتوى). استبدل هذا النص المؤقت بالمحتوى النهائي.\n\nرازي للعطور جسر بين التراث العربي الأصيل وصناعة العطور الفاخرة الحديثة.`;

const pages = [
  { slug: 'about', titleEn: 'About Us', titleAr: 'من نحن' },
  { slug: 'our-story', titleEn: 'Our Story', titleAr: 'قصتنا' },
  { slug: 'terms', titleEn: 'Terms & Conditions', titleAr: 'الشروط والأحكام' },
  { slug: 'shipping-policy', titleEn: 'Shipping & Delivery Policy', titleAr: 'سياسة الشحن والتوصيل' },
  { slug: 'privacy-policy', titleEn: 'Privacy Policy', titleAr: 'سياسة الخصوصية' },
  { slug: 'return-policy', titleEn: 'Return Policy', titleAr: 'سياسة الإرجاع' },
];

const heroSlides = [
  { imageDesktop: `${IMG}/website.content.config.hero/1/image_1920/1920x0?unique=cfbdcd5`, titleEn: 'BEYOND ME', titleAr: 'عالم جديد من السحر', taglineEn: 'A memory held in time.', taglineAr: 'ذكرى محفوظة في الزمن.', link: '/product/beyond-me' },
  { imageDesktop: `${IMG}/website.content.config.hero/2/image_1920/1920x0?unique=a787d79`, titleEn: 'HUDSON VALLEY', titleAr: 'عبير يوقظ الذاكرة', taglineEn: 'Bring memories home, keep them close.', taglineAr: 'أعد الذكريات إلى المنزل واحتفظ بها قريبة.', link: '/product/hudson-valley' },
  { imageDesktop: `${IMG}/website.content.config.hero/3/image_1920/1920x0?unique=a787d79`, titleEn: 'SIGNATURE COLLECTION', titleAr: 'فخامة التفاصيل', taglineEn: 'A fragrance that awakens memory and lingers like a whisper.', taglineAr: 'عطر يوقظ الذاكرة ويبقى كالهمس.', link: '/collection/signature' },
];

async function main() {
  console.log('Seeding collections…');
  const collectionIds: Record<string, string> = {};
  for (const [i, c] of collections.entries()) {
    const row = await prisma.collection.upsert({
      where: { slug: c.slug },
      update: { ...c, sortOrder: i },
      create: { ...c, sortOrder: i },
    });
    collectionIds[c.slug] = row.id;
  }

  console.log('Seeding products…');
  for (const p of products) {
    const data = {
      nameEn: p.nameEn, nameAr: p.nameAr, descriptionEn: p.descriptionEn, descriptionAr: p.descriptionAr,
      notesTop: p.notes[0], notesHeart: p.notes[1], notesBase: p.notes[2],
      notesTopAr: p.notesAr[0], notesHeartAr: p.notesAr[1], notesBaseAr: p.notesAr[2],
      ingredientsEn: p.ingredientsEn, ingredientsAr: p.ingredientsEn,
      noteTags: p.noteTags, gender: p.gender, images: [p.image],
      isFeatured: !!p.isFeatured, isRecommended: !!p.isRecommended,
      collectionId: collectionIds[p.collection],
    };
    const product = await prisma.product.upsert({ where: { slug: p.slug }, update: data, create: { slug: p.slug, ...data } });
    for (const [i, v] of p.variants.entries()) {
      const sku = `RZ-${p.slug.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-${v.label.toUpperCase().replace(/[^A-Z0-9]+/g, '')}`;
      await prisma.productVariant.upsert({
        where: { sku },
        update: { label: v.label, sizeMl: v.sizeMl, priceKWD: v.price, sortOrder: i },
        create: { productId: product.id, sku, label: v.label, sizeMl: v.sizeMl, priceKWD: v.price, stock: v.stock ?? 50, sortOrder: i },
      });
    }
    const minPrice = Math.min(...p.variants.map((v) => Number(v.price)));
    await prisma.product.update({ where: { id: product.id }, data: { priceFromKWD: minPrice.toFixed(3) } });
  }

  console.log('Seeding currency + shipping rates…');
  for (const r of currencyRates) {
    await prisma.currencyRate.upsert({ where: { code: r.code }, update: {}, create: r });
  }
  for (const s of shippingRates) {
    await prisma.shippingRate.upsert({ where: { country: s.country }, update: {}, create: s });
  }

  console.log('Seeding content pages…');
  for (const pg of pages) {
    await prisma.page.upsert({
      where: { slug: pg.slug },
      update: {},
      create: { ...pg, contentEn: placeholder(pg.titleEn), contentAr: placeholderAr(pg.titleAr) },
    });
  }

  console.log('Seeding hero slides + location…');
  if ((await prisma.heroSlide.count()) === 0) {
    await prisma.heroSlide.createMany({ data: heroSlides.map((s, i) => ({ ...s, sortOrder: i })) });
  }
  if ((await prisma.location.count()) === 0) {
    await prisma.location.create({
      data: {
        nameEn: 'Razi Perfumes — Kuwait City', nameAr: 'رازي للعطور — مدينة الكويت',
        addressEn: 'Kuwait City, Kuwait (edit this address in Admin → Locations)',
        addressAr: 'مدينة الكويت، الكويت (عدّل العنوان من لوحة التحكم)',
        phone: '', mapUrl: 'https://maps.google.com/?q=Kuwait+City', openingHours: '10:00 – 22:00',
      },
    });
  }

  console.log('Seeding sample coupon WELCOME10…');
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: { code: 'WELCOME10', type: 'PERCENT', value: '10', minOrder: '0', isActive: true },
  });

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    console.log(`Seeding admin user ${adminEmail}…`);
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.upsert({
      where: { email: adminEmail },
      update: { role: 'ADMIN', passwordHash },
      create: { email: adminEmail, name: process.env.ADMIN_NAME || 'Admin', role: 'ADMIN', passwordHash, emailVerified: new Date() },
    });
  } else {
    console.warn('ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin user.');
  }
  console.log('Done.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
