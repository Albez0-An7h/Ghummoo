/* India content directory: editorial reference data for discovery pages.

   Rules for editing this file (see AGENTS.md and .agents/skills/india-visual-storytelling):
   - Facts only, written plainly. No distances, travel times, best seasons, prices,
     opening hours, rankings or "oldest/biggest" claims.
   - "nearby" means "commonly visited together or from here", nothing more precise.
   - Assets are referenced by stable keys with status "planned" until artwork exists;
     the UI must fall back gracefully. Never point an asset at an image we don't have rights to.
   - This is content-as-code: migrations/v0_1.js upserts it by slug on boot. Removing an entry
     here does not delete it from the database.

   Landmarks and places listed here are well-known public sites. Package links are made by
   matching package text to `name`/`aliases`; marketplace data never lives in this file. */

const ill = (group, slug, alt) => ({ kind: 'illustration', key: `illustration/${group}/${slug}`, alt, status: 'planned' });
const scene = (slug, alt) => ({ kind: 'scene', key: `scene/${slug}`, alt, status: 'planned' });
const lm = (slug, name, kind, description) => ({ slug, name, kind, description, asset: ill('landmark', slug, name) });

const LANDSCAPES = [
  {
    slug: 'himalayas', name: 'Himalayas', order: 1,
    tagline: 'High valleys, monasteries and mountain villages',
    intro: 'From the orchards of Himachal to the lakes of Kashmir, the Himalayan states hold some of India\'s most loved mountain journeys: valley drives, village stays, treks and monasteries.',
    palette: { primary: '#C8693C', secondary: '#F3DCC4', ink: '#2E2420' },
    packageCategories: ['mountains', 'trek', 'adventure'],
    assets: [scene('himalayas', 'Layered snow peaks above a pine valley')],
  },
  {
    slug: 'rivers-valleys', name: 'Rivers & valleys', order: 2,
    tagline: 'Ghats, rapids, backwaters and river islands',
    intro: 'India\'s rivers shape its towns and rituals: evening aarti on the ghats, rafting on mountain rivers, houseboats on Kerala\'s backwaters and temples on river islands.',
    palette: { primary: '#3E8A72', secondary: '#E3EFE6', ink: '#1F2B26' },
    packageCategories: ['adventure', 'spiritual', 'weekend'],
    assets: [scene('rivers-valleys', 'A river bending through a green valley at dawn')],
  },
  {
    slug: 'desert', name: 'Desert', order: 3,
    tagline: 'Golden forts, blue lanes and dune camps',
    intro: 'Western Rajasthan\'s Thar country: sandstone forts, painted havelis, old trading towns and evenings at camps among the dunes.',
    palette: { primary: '#D9963A', secondary: '#F8E7C6', ink: '#3A2B1C' },
    packageCategories: ['cultural'],
    assets: [scene('desert', 'Sand dunes with a fort on the horizon at sunset')],
  },
  {
    slug: 'coast', name: 'Coast', order: 4,
    tagline: 'Harbours, beaches and backwater towns',
    intro: 'India\'s long coastline runs past port cities, fishing villages, beach towns and the lagoons of Kerala, each with its own food and architecture.',
    palette: { primary: '#E07B4F', secondary: '#FBE3D2', ink: '#2B2320' },
    packageCategories: ['beach', 'weekend'],
    assets: [scene('coast', 'Palm-lined shore with fishing boats')],
  },
  {
    slug: 'northeast', name: 'Northeast', order: 5,
    tagline: 'Living root bridges, tea country and the Brahmaputra',
    intro: 'The northeastern states combine rainforest hills, river plains and distinct cultures, from Meghalaya\'s root bridges to Assam\'s national parks.',
    palette: { primary: '#5E8C4A', secondary: '#E6EFDC', ink: '#1E2A1B' },
    packageCategories: ['mountains', 'wildlife', 'adventure'],
    assets: [scene('northeast', 'Misty green hills with a waterfall')],
  },
  {
    slug: 'culture-heritage', name: 'Culture & heritage', order: 6,
    tagline: 'Forts, old quarters, food streets and living traditions',
    intro: 'Mughal monuments, royal palaces, colonial landmarks and old city lanes: India\'s cities are best explored on foot, one neighbourhood and one meal at a time.',
    palette: { primary: '#B4461A', secondary: '#F6DFCF', ink: '#2A1F1A' },
    packageCategories: ['cultural', 'spiritual'],
    assets: [scene('culture-heritage', 'Domes and arches of a historic monument')],
  },
];

// The curated city directory. `landscapes` and `nearby` hold slugs, resolved to IDs on upsert.
const CITIES = [
  {
    slug: 'delhi', name: 'Delhi', state: 'Delhi', placeType: 'metro', order: 1, aliases: ['new delhi'],
    intro: 'India\'s capital layers Mughal monuments, colonial-era avenues and crowded old bazaars. Old Delhi\'s lanes are among the country\'s best-known places for street food.',
    theme: { name: 'Red sandstone & marble', palette: { primary: '#B5543C', secondary: '#EFD3BC', ink: '#33231D' } },
    landscapes: ['culture-heritage'],
    landmarks: [
      lm('red-fort', 'Red Fort', 'fort', 'Mughal fort of red sandstone in Old Delhi; a UNESCO World Heritage Site.'),
      lm('qutub-minar', 'Qutub Minar', 'monument', 'Stone minaret within the Qutb complex in Mehrauli; a UNESCO World Heritage Site.'),
      lm('humayuns-tomb', 'Humayun\'s Tomb', 'tomb', 'Garden tomb of the Mughal emperor Humayun; a UNESCO World Heritage Site.'),
      lm('india-gate', 'India Gate', 'memorial', 'War memorial arch at the end of Kartavya Path.'),
      lm('jama-masjid-delhi', 'Jama Masjid', 'mosque', 'Large Mughal-era mosque facing the lanes of Chandni Chowk.'),
    ],
    highlights: ['Old Delhi food lanes', 'Mughal monuments and gardens', 'Chandni Chowk markets', 'Museums and galleries'],
    experiences: ['heritage_walks', 'architecture', 'food_trails', 'markets_crafts', 'arts_culture'],
    nearby: ['agra', 'rishikesh', 'nainital'],
    assets: [ill('city', 'delhi', 'Illustrated skyline of Delhi with India Gate and Qutub Minar')],
  },
  {
    slug: 'jaipur', name: 'Jaipur', state: 'Rajasthan', placeType: 'city', order: 2, aliases: ['pink city'],
    intro: 'Rajasthan\'s capital, known as the Pink City for the painted façades of its old walled city, with hill forts, palaces and busy craft bazaars.',
    theme: { name: 'Pink City', palette: { primary: '#D9776A', secondary: '#F6D5C4', ink: '#4A2622' } },
    landscapes: ['culture-heritage'],
    landmarks: [
      lm('amber-fort', 'Amber Fort', 'fort', 'Hilltop fort-palace above Maota Lake; part of the Hill Forts of Rajasthan World Heritage Site.'),
      lm('hawa-mahal', 'Hawa Mahal', 'palace', 'Five-storey façade of latticed windows in the old city.'),
      lm('city-palace-jaipur', 'City Palace', 'palace', 'Royal palace complex at the heart of the walled city.'),
      lm('jantar-mantar-jaipur', 'Jantar Mantar', 'observatory', 'Collection of masonry astronomical instruments; a UNESCO World Heritage Site.'),
    ],
    highlights: ['Walled old city and bazaars', 'Hill forts', 'Block printing and gem crafts', 'Rajasthani food'],
    experiences: ['heritage_walks', 'architecture', 'markets_crafts', 'food_trails'],
    nearby: ['pushkar', 'ranthambore', 'jodhpur'],
    assets: [ill('city', 'jaipur', 'Illustrated Hawa Mahal façade in pink sandstone')],
  },
  {
    slug: 'varanasi', name: 'Varanasi', state: 'Uttar Pradesh', placeType: 'city', order: 3, aliases: ['banaras', 'benares', 'kashi'],
    intro: 'A sacred city on the Ganga, also called Banaras and Kashi, where life gathers on stone ghats along the river from dawn rituals to the evening aarti.',
    theme: { name: 'Ghats at first light', palette: { primary: '#E08A3C', secondary: '#F7DFC2', ink: '#35271E' } },
    landscapes: ['rivers-valleys', 'culture-heritage'],
    landmarks: [
      lm('dashashwamedh-ghat', 'Dashashwamedh Ghat', 'ghat', 'Main ghat on the Ganga, known for its evening Ganga aarti.'),
      lm('kashi-vishwanath-temple', 'Kashi Vishwanath Temple', 'temple', 'Temple dedicated to Shiva, one of the city\'s most important shrines.'),
      lm('manikarnika-ghat', 'Manikarnika Ghat', 'ghat', 'Cremation ghat on the Ganga; visitors are expected to be respectful.'),
      lm('assi-ghat', 'Assi Ghat', 'ghat', 'Southernmost of the main ghats, where the Assi river meets the Ganga.'),
    ],
    highlights: ['Boat rides along the ghats', 'Ganga aarti', 'Old city lanes', 'Banarasi silk weaving'],
    experiences: ['spiritual', 'river_water', 'heritage_walks', 'food_trails', 'markets_crafts'],
    nearby: ['sarnath', 'ayodhya'],
    assets: [ill('city', 'varanasi', 'Illustrated ghats of Varanasi with boats on the Ganga')],
  },
  {
    slug: 'mumbai', name: 'Mumbai', state: 'Maharashtra', placeType: 'metro', order: 4, aliases: ['bombay'],
    intro: 'India\'s financial capital on the Arabian Sea, with Victorian Gothic and Art Deco architecture, a busy harbour and a street-food culture of its own.',
    theme: { name: 'Sea-facing Art Deco', palette: { primary: '#2E7D6B', secondary: '#DCEDE6', ink: '#1C2723' } },
    landscapes: ['coast', 'culture-heritage'],
    landmarks: [
      lm('gateway-of-india', 'Gateway of India', 'monument', 'Basalt arch on the Apollo Bunder waterfront.'),
      lm('chhatrapati-shivaji-maharaj-terminus', 'Chhatrapati Shivaji Maharaj Terminus', 'station', 'Victorian Gothic railway terminus; a UNESCO World Heritage Site.'),
      lm('elephanta-caves', 'Elephanta Caves', 'caves', 'Rock-cut cave temples on an island in Mumbai Harbour; a UNESCO World Heritage Site.'),
      lm('marine-drive', 'Marine Drive', 'waterfront', 'Curved seafront promenade along Back Bay.'),
    ],
    highlights: ['Art Deco and Gothic architecture', 'Harbour ferries', 'Street food', 'Seafront promenades'],
    experiences: ['architecture', 'food_trails', 'heritage_walks', 'arts_culture', 'beaches'],
    nearby: ['lonavala', 'alibaug'],
    assets: [ill('city', 'mumbai', 'Illustrated Gateway of India with harbour boats')],
  },
  {
    slug: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', placeType: 'metro', order: 5, aliases: ['bangalore'],
    intro: 'Karnataka\'s capital, known for its gardens, its café and brewery culture and its technology industry, and a common starting point for trips into southern Karnataka.',
    theme: { name: 'Garden city', palette: { primary: '#5B8C3E', secondary: '#E4EFD8', ink: '#202A1A' } },
    landscapes: ['culture-heritage'],
    landmarks: [
      lm('lalbagh', 'Lalbagh Botanical Garden', 'garden', 'Historic botanical garden known for its glasshouse.'),
      lm('cubbon-park', 'Cubbon Park', 'garden', 'Large public park in the city centre.'),
      lm('bangalore-palace', 'Bangalore Palace', 'palace', 'Palace built in a Tudor-inspired style.'),
      lm('tipu-sultans-summer-palace', 'Tipu Sultan\'s Summer Palace', 'palace', 'Teak-wood palace near the old fort area.'),
    ],
    highlights: ['Gardens and parks', 'Café and brewery culture', 'South Indian breakfasts', 'Weekend trips into Karnataka'],
    experiences: ['nature', 'food_trails', 'heritage_walks', 'arts_culture'],
    nearby: ['mysuru', 'coorg', 'gokarna'],
    assets: [ill('city', 'bengaluru', 'Illustrated Lalbagh glasshouse among trees')],
  },
  {
    slug: 'kolkata', name: 'Kolkata', state: 'West Bengal', placeType: 'metro', order: 6, aliases: ['calcutta'],
    intro: 'West Bengal\'s capital on the Hooghly river, with colonial-era landmarks, a deep literary and arts tradition, and a celebrated sweet and street-food culture.',
    theme: { name: 'River city in yellow', palette: { primary: '#D69A2D', secondary: '#F7E6C3', ink: '#33281A' } },
    landscapes: ['culture-heritage', 'rivers-valleys'],
    landmarks: [
      lm('victoria-memorial', 'Victoria Memorial', 'memorial', 'White marble memorial hall and museum set in gardens.'),
      lm('howrah-bridge', 'Howrah Bridge', 'bridge', 'Cantilever bridge across the Hooghly river.'),
      lm('dakshineswar-kali-temple', 'Dakshineswar Kali Temple', 'temple', 'Riverside temple complex dedicated to the goddess Kali.'),
      lm('indian-museum', 'Indian Museum', 'museum', 'Large museum of art, archaeology and natural history.'),
    ],
    highlights: ['Colonial-era architecture', 'Bengali sweets and street food', 'Book and art culture', 'Ferries on the Hooghly'],
    experiences: ['heritage_walks', 'arts_culture', 'food_trails', 'spiritual', 'river_water'],
    nearby: ['sundarbans', 'shantiniketan'],
    assets: [ill('city', 'kolkata', 'Illustrated Howrah Bridge with yellow taxis')],
  },
  {
    slug: 'kochi', name: 'Kochi', state: 'Kerala', placeType: 'city', order: 7, aliases: ['cochin', 'fort kochi'],
    intro: 'A port city on Kerala\'s coast whose history of spice trade shows in Fort Kochi and Mattancherry, with their churches, synagogue, warehouses and fishing nets.',
    theme: { name: 'Spice port', palette: { primary: '#3F8F6B', secondary: '#E1F0E6', ink: '#1C2A22' } },
    landscapes: ['coast', 'culture-heritage'],
    landmarks: [
      lm('chinese-fishing-nets', 'Chinese fishing nets', 'waterfront', 'Shore-operated cantilevered fishing nets along Fort Kochi\'s waterfront.'),
      lm('mattancherry-palace', 'Mattancherry Palace', 'palace', 'Palace and museum known for its mural paintings.'),
      lm('paradesi-synagogue', 'Paradesi Synagogue', 'synagogue', 'Synagogue in Jew Town, Mattancherry.'),
      lm('st-francis-church', 'St. Francis Church', 'church', 'Early European church in Fort Kochi.'),
    ],
    highlights: ['Fort Kochi heritage walks', 'Spice markets', 'Kathakali performances', 'Kerala seafood'],
    experiences: ['heritage_walks', 'food_trails', 'arts_culture', 'markets_crafts', 'beaches'],
    nearby: ['munnar', 'alappuzha'],
    assets: [ill('city', 'kochi', 'Illustrated Chinese fishing nets at sunset')],
  },
  {
    slug: 'guwahati', name: 'Guwahati', state: 'Assam', placeType: 'city', order: 8, aliases: ['gauhati'],
    intro: 'A city on the Brahmaputra in Assam and a common gateway to the northeastern states, known for the Kamakhya Temple on Nilachal Hill.',
    theme: { name: 'Brahmaputra greens', palette: { primary: '#4F8A5B', secondary: '#E2EEDF', ink: '#1C281E' } },
    landscapes: ['northeast', 'rivers-valleys'],
    landmarks: [
      lm('kamakhya-temple', 'Kamakhya Temple', 'temple', 'Hilltop temple on Nilachal Hill, an important Shakti shrine.'),
      lm('umananda-temple', 'Umananda Temple', 'temple', 'Shiva temple on Peacock Island in the Brahmaputra.'),
      lm('assam-state-museum', 'Assam State Museum', 'museum', 'Museum of the region\'s archaeology, crafts and ethnography.'),
    ],
    highlights: ['Brahmaputra river cruises', 'Gateway to Meghalaya and Kaziranga', 'Assamese cuisine', 'Assam silk'],
    experiences: ['spiritual', 'river_water', 'food_trails', 'markets_crafts'],
    nearby: ['shillong', 'sohra', 'kaziranga'],
    assets: [ill('city', 'guwahati', 'Illustrated Brahmaputra with a river island temple')],
  },
  {
    slug: 'srinagar', name: 'Srinagar', state: 'Jammu and Kashmir', placeType: 'city', order: 9, aliases: [],
    intro: 'A city in the Kashmir Valley set around Dal Lake with its houseboats and shikaras, Mughal gardens and an old city of wooden mosques and shrines.',
    theme: { name: 'Lake and chinar', palette: { primary: '#B8613A', secondary: '#F2DCCB', ink: '#2C221D' } },
    landscapes: ['himalayas'],
    landmarks: [
      lm('dal-lake', 'Dal Lake', 'lake', 'City lake known for houseboats, shikaras and floating gardens.'),
      lm('shalimar-bagh', 'Shalimar Bagh', 'garden', 'Terraced Mughal garden on the edge of Dal Lake.'),
      lm('nishat-bagh', 'Nishat Bagh', 'garden', 'Terraced Mughal garden overlooking the lake.'),
      lm('hazratbal-shrine', 'Hazratbal Shrine', 'shrine', 'White marble shrine on the northern shore of Dal Lake.'),
    ],
    highlights: ['Shikara rides', 'Houseboat stays', 'Mughal gardens', 'Kashmiri crafts and wazwan'],
    experiences: ['nature', 'river_water', 'heritage_walks', 'markets_crafts', 'food_trails'],
    nearby: ['gulmarg', 'pahalgam', 'sonamarg'],
    assets: [ill('city', 'srinagar', 'Illustrated shikara on Dal Lake with mountains behind')],
  },
  {
    slug: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', placeType: 'city', order: 10, aliases: [],
    intro: 'Uttar Pradesh\'s capital, the city of the Nawabs, known for its imambaras and gateways, chikankari embroidery and Awadhi cuisine.',
    theme: { name: 'Nawabi arches', palette: { primary: '#C27B4A', secondary: '#F4E0CF', ink: '#2F241D' } },
    landscapes: ['culture-heritage'],
    landmarks: [
      lm('bara-imambara', 'Bara Imambara', 'monument', 'Nawabi-era imambara complex known for its maze, the Bhool Bhulaiya.'),
      lm('rumi-darwaza', 'Rumi Darwaza', 'monument', 'Ornate gateway beside the Bara Imambara.'),
      lm('chota-imambara', 'Chota Imambara', 'monument', 'Imambara known for its chandeliers and decoration.'),
      lm('the-residency-lucknow', 'The Residency', 'memorial', 'Ruins of the British Residency complex, now a protected monument.'),
    ],
    highlights: ['Awadhi cuisine', 'Chikankari embroidery', 'Nawabi monuments', 'Old city food walks'],
    experiences: ['heritage_walks', 'food_trails', 'architecture', 'markets_crafts'],
    nearby: ['ayodhya'],
    assets: [ill('city', 'lucknow', 'Illustrated Rumi Darwaza gateway')],
  },
];

// Other places: destinations referenced by the directory or by demo packages, plus
// non-directory departure cities. Kept deliberately minimal and factual.
const d = (slug, name, kind, placeType, state, landscapes, extra = {}) => ({ slug, name, kind, placeType, state, landscapes, aliases: [], ...extra });
const PLACES = [
  d('agra', 'Agra', 'city', 'city', 'Uttar Pradesh', ['culture-heritage'], { experiences: ['heritage_walks', 'architecture'], landmarks: [lm('taj-mahal', 'Taj Mahal', 'tomb', 'White marble mausoleum on the Yamuna; a UNESCO World Heritage Site.'), lm('agra-fort', 'Agra Fort', 'fort', 'Mughal fort of red sandstone; a UNESCO World Heritage Site.')] }),
  d('chandigarh', 'Chandigarh', 'city', 'city', 'Chandigarh', ['culture-heritage'], { experiences: ['architecture', 'nature'] }),
  d('jodhpur', 'Jodhpur', 'city', 'city', 'Rajasthan', ['desert', 'culture-heritage'], { aliases: ['blue city'], experiences: ['heritage_walks', 'architecture'], landmarks: [lm('mehrangarh-fort', 'Mehrangarh Fort', 'fort', 'Fort on a rocky hill above the old blue city.')] }),
  d('jaisalmer', 'Jaisalmer', 'city', 'city', 'Rajasthan', ['desert', 'culture-heritage'], { aliases: ['golden city', 'sam dunes'], experiences: ['heritage_walks', 'architecture'], landmarks: [lm('jaisalmer-fort', 'Jaisalmer Fort', 'fort', 'Yellow sandstone hill fort with homes and shops still inside; part of the Hill Forts of Rajasthan World Heritage Site.')] }),
  d('mysuru', 'Mysuru', 'city', 'city', 'Karnataka', ['culture-heritage'], { aliases: ['mysore'], experiences: ['heritage_walks', 'architecture', 'markets_crafts'], landmarks: [lm('mysore-palace', 'Mysore Palace', 'palace', 'Royal palace of the Wadiyar dynasty.')] }),
  d('manali', 'Manali', 'destination', 'hill_station', 'Himachal Pradesh', ['himalayas'], { aliases: ['old manali', 'solang', 'solang valley'], experiences: ['nature', 'trekking'] }),
  d('kasol', 'Kasol', 'destination', 'village', 'Himachal Pradesh', ['himalayas', 'rivers-valleys'], { aliases: ['parvati valley', 'chalal'], experiences: ['nature', 'trekking', 'river_water'] }),
  d('spiti-valley', 'Spiti Valley', 'destination', 'valley', 'Himachal Pradesh', ['himalayas', 'rivers-valleys'], { aliases: ['spiti', 'kaza'], experiences: ['nature', 'spiritual', 'trekking'] }),
  d('rishikesh', 'Rishikesh', 'destination', 'town', 'Uttarakhand', ['rivers-valleys', 'himalayas'], { experiences: ['spiritual', 'river_water', 'trekking'] }),
  d('nainital', 'Nainital', 'destination', 'hill_station', 'Uttarakhand', ['himalayas'], { experiences: ['nature', 'river_water'] }),
  d('gulmarg', 'Gulmarg', 'destination', 'hill_station', 'Jammu and Kashmir', ['himalayas'], { experiences: ['nature', 'trekking'] }),
  d('pahalgam', 'Pahalgam', 'destination', 'valley', 'Jammu and Kashmir', ['himalayas', 'rivers-valleys'], { experiences: ['nature', 'trekking'] }),
  d('sonamarg', 'Sonamarg', 'destination', 'valley', 'Jammu and Kashmir', ['himalayas', 'rivers-valleys'], { experiences: ['nature', 'trekking'] }),
  d('sarnath', 'Sarnath', 'destination', 'pilgrimage', 'Uttar Pradesh', ['culture-heritage'], { experiences: ['spiritual', 'heritage_walks'] }),
  d('ayodhya', 'Ayodhya', 'destination', 'pilgrimage', 'Uttar Pradesh', ['culture-heritage', 'rivers-valleys'], { experiences: ['spiritual'] }),
  d('pushkar', 'Pushkar', 'destination', 'town', 'Rajasthan', ['desert', 'culture-heritage'], { experiences: ['spiritual', 'markets_crafts'] }),
  d('ranthambore', 'Ranthambore', 'destination', 'national_park', 'Rajasthan', ['culture-heritage'], { experiences: ['wildlife', 'heritage_walks'] }),
  d('lonavala', 'Lonavala', 'destination', 'hill_station', 'Maharashtra', ['rivers-valleys'], { experiences: ['nature', 'trekking'] }),
  d('alibaug', 'Alibaug', 'destination', 'beach', 'Maharashtra', ['coast'], { experiences: ['beaches'] }),
  d('north-goa', 'North Goa', 'destination', 'region', 'Goa', ['coast'], { aliases: ['goa', 'calangute', 'candolim', 'panjim', 'panaji'], experiences: ['beaches', 'heritage_walks', 'food_trails'] }),
  d('gokarna', 'Gokarna', 'destination', 'beach', 'Karnataka', ['coast'], { experiences: ['beaches', 'spiritual', 'trekking'] }),
  d('coorg', 'Coorg', 'destination', 'region', 'Karnataka', ['rivers-valleys'], { aliases: ['kodagu', 'madikeri'], experiences: ['nature', 'trekking'] }),
  d('munnar', 'Munnar', 'destination', 'hill_station', 'Kerala', ['rivers-valleys'], { experiences: ['nature', 'trekking'] }),
  d('alappuzha', 'Alappuzha', 'destination', 'backwaters', 'Kerala', ['coast', 'rivers-valleys'], { aliases: ['alleppey'], experiences: ['river_water', 'food_trails'] }),
  d('sundarbans', 'Sundarbans', 'destination', 'national_park', 'West Bengal', ['rivers-valleys'], { experiences: ['wildlife', 'river_water'] }),
  d('shantiniketan', 'Shantiniketan', 'destination', 'town', 'West Bengal', ['culture-heritage'], { experiences: ['arts_culture', 'markets_crafts'] }),
  d('shillong', 'Shillong', 'destination', 'hill_station', 'Meghalaya', ['northeast'], { experiences: ['nature', 'food_trails'] }),
  d('sohra', 'Sohra (Cherrapunji)', 'destination', 'town', 'Meghalaya', ['northeast'], { aliases: ['cherrapunji', 'cherrapunjee', 'nongriat'], experiences: ['nature', 'trekking'] }),
  d('kaziranga', 'Kaziranga', 'destination', 'national_park', 'Assam', ['northeast'], { experiences: ['wildlife'] }),
];

module.exports = { LANDSCAPES, CITIES, PLACES };
