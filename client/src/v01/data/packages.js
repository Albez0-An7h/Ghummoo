/* Sample packages for the V0.1 frontend prototype. Shaped like the approved data dictionary
   (TripPackage + TripDeparture, docs/V0_1_DATA_DICTIONARY.md). Every record is a SAMPLE:
   it is labelled in the UI and is never sent to the booking API.

   Honesty rules kept even in sample data:
   - Missing values stay null and render as "Not stated by organiser".
   - Organisers are sample organisers, never "Verified".
   - Photos are used only where the photo shows the trip's own destination; otherwise
     coverImage is null and the card shows the place's illustrated placeholder. */

const img = (id) => `https://images.unsplash.com/photo-${id}?w=1600&q=72&auto=format&fit=crop`;
const PHOTO = {
  hawa: img('1477587458883-47145ed94245'),
  taj: img('1548013146-72479768bada'),
  rafting: img('1530866495561-507c9faab2ed'),
  solang: img('1593181629936-11c609b8db9b'),
  nainital: img('1610715936287-6c2ad208cdbf'),
  goa: img('1512343879784-a960bf40e7f2'),
  kerala: img('1506461883276-594a12b11cf3'),
  clouds: img('1622308644420-b20142dc993c'),
};

const day = (n) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

// [startOffsetDays, days, price, totalCapacity, seatsAvailable, confirmedSeats, opts]
const dep = (id, start, days, price, cap, avail, confirmed, opts = {}) => ({
  _id: id,
  startDate: day(start),
  endDate: day(start + days - 1),
  price,
  totalCapacity: cap,
  seatsAvailable: avail,
  confirmedSeats: confirmed,
  bookingDeadline: opts.deadline != null ? day(opts.deadline) : null,
  pickupPoint: opts.pickup ?? '',
  reportingTime: opts.reporting ?? '',
  status: opts.status || 'open',
});

const organiser = (name, city) => ({ businessName: name, location: city, verified: false, isSample: true });

export const PACKAGES = [
  {
    slug: 'rajasthan-cultural-journey', title: 'Rajasthan Cultural Journey',
    summary: 'Pink-city bazaars, a blue-city fort and a night at a desert camp near Jaisalmer.',
    destination: 'Jaipur, Jodhpur & Jaisalmer', destinationRefs: ['jaipur', 'jodhpur', 'jaisalmer'], departureCityRefs: ['jaipur'],
    categories: ['cultural'], durationDays: 6, durationNights: 5, currency: 'INR', coverImage: PHOTO.hawa, coverAlt: 'Hawa Mahal façade in Jaipur',
    operator: organiser('Desert Route Travels (sample)', 'Jaipur'),
    accommodation: 'Heritage hotel in Jaipur, haveli in Jodhpur, Swiss tents at the desert camp', transport: 'AC tempo traveller throughout', meals: 'Breakfast and dinner daily',
    inclusions: ['5 nights stay', 'All transfers in AC vehicle', 'Breakfast and dinner', 'Camel ride and folk evening at camp', 'Trip captain'],
    exclusions: ['Monument entry tickets', 'Lunches', 'Travel to Jaipur'],
    pickupInfo: 'Jaipur railway station or airport, by 1:00 PM on day 1', cancellationPolicy: 'Full refund up to 21 days before departure, 50% up to 7 days, none after.',
    itinerary: [
      { day: 1, title: 'Arrive in Jaipur', description: 'Check in, Hawa Mahal, evening walk through Johari Bazaar.' },
      { day: 2, title: 'Amber Fort & the old city', description: 'Amber Fort in the morning, then City Palace and Jantar Mantar.' },
      { day: 3, title: 'On to Jodhpur', description: 'Drive to Jodhpur and walk the blue lanes in the evening.' },
      { day: 4, title: 'Mehrangarh, then Jaisalmer', description: 'Mehrangarh Fort, then drive to Jaisalmer.' },
      { day: 5, title: 'Golden fort & dunes', description: 'Jaisalmer Fort and havelis, sunset at the dunes, dinner at camp.' },
      { day: 6, title: 'Departure', description: 'Drop at Jaisalmer station or airport.' },
    ],
    departures: [dep('raj-1', 18, 6, 16999, 18, 7, 9), dep('raj-2', 46, 6, 17499, 18, 18, 0)],
  },
  {
    slug: 'varanasi-ghats-sarnath-weekend', title: 'Varanasi Ghats & Sarnath Weekend',
    summary: 'Dawn boat ride along the ghats, the evening aarti and a morning at Sarnath.',
    destination: 'Varanasi & Sarnath', destinationRefs: ['varanasi', 'sarnath'], departureCityRefs: ['lucknow'],
    categories: ['spiritual', 'cultural', 'weekend'], durationDays: 3, durationNights: 2, currency: 'INR', coverImage: null,
    operator: organiser('Ganga Trails (sample)', 'Lucknow'),
    accommodation: 'Guesthouse near Assi Ghat (twin sharing)', transport: 'Overnight train from Lucknow, local autos in Varanasi', meals: null,
    inclusions: ['2 nights stay', 'Sunrise boat ride', 'Guided old-city walk', 'Trip captain'],
    exclusions: [],
    pickupInfo: null, cancellationPolicy: null,
    itinerary: [
      { day: 1, title: 'Ghats and evening aarti', description: 'Arrive, walk from Assi to Dashashwamedh Ghat, watch the Ganga aarti.' },
      { day: 2, title: 'Dawn on the river, Sarnath', description: 'Sunrise boat ride, then a half day at Sarnath.' },
      { day: 3, title: 'Old city lanes & return', description: 'Morning lanes walk, then the train back.' },
    ],
    departures: [dep('var-1', 9, 3, 7499, 16, 0, 16), dep('var-2', 30, 3, 7499, 16, 11, 3)],
  },
  {
    slug: 'delhi-agra-heritage-weekend', title: 'Delhi & Agra Heritage Weekend',
    summary: 'Old Delhi food lanes, Humayun\'s Tomb and a sunrise at the Taj Mahal.',
    destination: 'Delhi & Agra', destinationRefs: ['delhi', 'agra'], departureCityRefs: ['delhi'],
    categories: ['cultural', 'weekend'], durationDays: 2, durationNights: 1, currency: 'INR', coverImage: PHOTO.taj, coverAlt: 'The Taj Mahal in Agra',
    operator: organiser('Wandering Pahadi Co. (sample)', 'New Delhi'),
    accommodation: 'Hotel in Agra (triple sharing)', transport: 'AC tempo traveller from Delhi', meals: 'Breakfast and one street-food dinner',
    inclusions: ['1 night stay', 'Transport from Delhi', 'Guided Old Delhi food walk', 'Trip captain'],
    exclusions: ['Monument entry tickets', 'Lunches'],
    pickupInfo: 'Rajiv Chowk metro, gate 7', cancellationPolicy: 'Full refund up to 7 days before departure, none after.',
    itinerary: [
      { day: 1, title: 'Old Delhi & Humayun\'s Tomb', description: 'Chandni Chowk food walk, Jama Masjid, Humayun\'s Tomb, drive to Agra.' },
      { day: 2, title: 'Taj Mahal at sunrise', description: 'Sunrise at the Taj Mahal, Agra Fort, return to Delhi by evening.' },
    ],
    departures: [dep('dag-1', 3, 2, 5499, 20, 6, 12, { deadline: -1, pickup: 'Rajiv Chowk metro, gate 7', reporting: '5:30 AM' }), dep('dag-2', 17, 2, 5499, 20, 14, 4, { pickup: 'Rajiv Chowk metro, gate 7', reporting: '5:30 AM' })],
  },
  {
    slug: 'rishikesh-adventure-weekend', title: 'Rishikesh Adventure Weekend',
    summary: 'Rafting from Shivpuri, a riverside camp and the Triveni Ghat aarti.',
    destination: 'Rishikesh', destinationRefs: ['rishikesh'], departureCityRefs: ['delhi'],
    categories: ['weekend', 'adventure'], durationDays: 3, durationNights: 2, currency: 'INR', coverImage: PHOTO.rafting, coverAlt: 'Rafting on the Ganga near Rishikesh',
    operator: organiser('Wandering Pahadi Co. (sample)', 'New Delhi'),
    accommodation: 'Riverside Swiss tents (triple sharing)', transport: 'AC tempo traveller from Delhi', meals: 'Breakfast, lunch and dinner at camp',
    inclusions: ['Rafting', 'Camp stay', 'Meals at camp', 'Bonfire evening'], exclusions: ['Personal expenses'],
    pickupInfo: 'Akshardham metro station, 10:00 PM Friday', cancellationPolicy: 'Full refund up to 10 days before departure.',
    itinerary: [
      { day: 1, title: 'Friday night departure', description: 'Depart Delhi by AC tempo traveller.' },
      { day: 2, title: 'Rafting & camp', description: 'Rafting from Shivpuri, evening bonfire.' },
      { day: 3, title: 'Waterfall hike & aarti', description: 'Neer Garh waterfall, Triveni Ghat aarti, return overnight.' },
    ],
    departures: [dep('rsh-1', 6, 3, 4999, 30, 4, 21), dep('rsh-2', 13, 3, 4999, 30, 25, 2), dep('rsh-3', 20, 3, 5299, 30, 30, 0)],
  },
  {
    slug: 'manali-kasol-escape', title: 'Manali & Kasol Escape',
    summary: 'Old Manali cafés, Solang Valley and a riverside walk through Kasol.',
    destination: 'Manali & Kasol', destinationRefs: ['manali', 'kasol'], departureCityRefs: ['delhi'],
    categories: ['mountains', 'adventure'], durationDays: 5, durationNights: 4, currency: 'INR', coverImage: PHOTO.solang, coverAlt: 'Snow slopes at Solang Valley near Manali',
    operator: organiser('Wandering Pahadi Co. (sample)', 'New Delhi'),
    accommodation: 'Hotel in Manali (twin or triple sharing)', transport: 'Overnight Volvo from Delhi, cab in Manali', meals: 'Breakfast and dinner on hotel nights',
    inclusions: ['2 nights hotel', 'Volvo both ways', 'Solang Valley excursion', 'Kasol day trip'], exclusions: ['Paragliding and adventure activities'],
    pickupInfo: 'Majnu ka Tilla, 7:00 PM', cancellationPolicy: 'Full refund up to 14 days before departure, 50% up to 5 days.',
    itinerary: [
      { day: 1, title: 'Overnight Volvo', description: 'Board in Delhi, meet the group.' },
      { day: 2, title: 'Old Manali', description: 'Hadimba Temple and café lanes.' },
      { day: 3, title: 'Solang Valley', description: 'Full day at Solang.' },
      { day: 4, title: 'Kasol & Manikaran', description: 'Riverside walk to Chalal, Manikaran Sahib, Volvo back.' },
      { day: 5, title: 'Arrive in Delhi', description: 'Trip ends in the morning.' },
    ],
    departures: [dep('mkl-1', 11, 5, 8499, 24, 3, 19), dep('mkl-2', 32, 5, 8499, 24, 20, 2)],
  },
  {
    slug: 'nainital-lakes-weekend', title: 'Nainital Lakes Weekend',
    summary: 'Boating on Naini Lake, Tiffin Top at sunrise and the lakes of Bhimtal and Sattal.',
    destination: 'Nainital', destinationRefs: ['nainital'], departureCityRefs: ['delhi'],
    categories: ['weekend', 'mountains'], durationDays: 3, durationNights: 2, currency: 'INR', coverImage: PHOTO.nainital, coverAlt: 'Naini Lake surrounded by hills',
    operator: organiser('Wandering Pahadi Co. (sample)', 'New Delhi'),
    accommodation: 'Hotel in Nainital (twin or triple sharing)', transport: 'AC tempo traveller from Delhi', meals: 'Breakfast and dinner',
    inclusions: ['1 night hotel', 'Transport', 'Boating'], exclusions: [],
    pickupInfo: 'Akshardham metro station', cancellationPolicy: null,
    itinerary: [
      { day: 1, title: 'Friday night departure', description: 'Overnight drive from Delhi.' },
      { day: 2, title: 'Nainital lakes', description: 'Naini Lake boating, Mall Road.' },
      { day: 3, title: 'Tiffin Top & return', description: 'Sunrise walk, Bhimtal and Sattal, drive back.' },
    ],
    departures: [dep('nai-1', 10, 3, 6499, 24, 12, 8)],
  },
  {
    slug: 'spiti-valley-expedition', title: 'Spiti Valley Expedition',
    summary: 'Kinnaur villages, Key Monastery and a night by Chandratal lake.',
    destination: 'Spiti Valley', destinationRefs: ['spiti-valley'], departureCityRefs: ['chandigarh'],
    categories: ['mountains', 'adventure'], durationDays: 8, durationNights: 7, currency: 'INR', coverImage: null,
    operator: organiser('High Altitude Collective (sample)', 'Chandigarh'),
    accommodation: 'Hotels, homestays and a camp at Chandratal', transport: 'Tempo traveller with an experienced mountain driver', meals: 'Breakfast and dinner',
    inclusions: ['7 nights stay', 'All transport from Chandigarh', 'Breakfast and dinner', 'Trip leader'], exclusions: ['Lunches', 'Inner-line permits'],
    pickupInfo: 'Chandigarh ISBT Sector 43', cancellationPolicy: 'Full refund up to 21 days before departure, 50% up to 10 days.',
    itinerary: [
      { day: 1, title: 'Chandigarh to Narkanda', description: 'Drive through Shimla.' },
      { day: 2, title: 'To Chitkul', description: 'Into Kinnaur along the Sutlej.' },
      { day: 3, title: 'To Nako', description: 'Via Reckong Peo.' },
      { day: 4, title: 'Tabo and Kaza', description: 'Tabo Monastery and Dhankar.' },
      { day: 5, title: 'Key, Kibber & Chicham', description: 'Monastery and villages.' },
      { day: 6, title: 'Langza, Hikkim & Komic', description: 'High villages.' },
      { day: 7, title: 'Chandratal', description: 'Camp near the lake.' },
      { day: 8, title: 'To Manali', description: 'Trip ends by evening.' },
    ],
    departures: [dep('spt-1', 40, 8, 21999, 14, 9, 5)],
  },
  {
    slug: 'meghalaya-explorer', title: 'Meghalaya Explorer',
    summary: 'Root bridges near Sohra, Dawki\'s river and the canyons of Laitlum.',
    destination: 'Shillong & Cherrapunji', destinationRefs: ['shillong', 'sohra'], departureCityRefs: ['guwahati'],
    categories: ['mountains', 'adventure', 'cultural'], durationDays: 6, durationNights: 5, currency: 'INR', coverImage: PHOTO.clouds, coverAlt: 'Clouds over green Meghalaya hills',
    operator: organiser('Northeast Trails (sample)', 'Guwahati'),
    accommodation: 'Hotels in Shillong, resort in Sohra, homestay near Dawki', transport: 'SUVs from Guwahati', meals: 'Breakfast and dinner',
    inclusions: ['5 nights stay', 'Local guide for the root-bridge trek', 'All transfers'], exclusions: ['Boating fees', 'Lunches'],
    pickupInfo: 'Guwahati airport or railway station by 11:00 AM', cancellationPolicy: 'Full refund up to 15 days before departure.',
    itinerary: [
      { day: 1, title: 'Guwahati to Shillong', description: 'Umiam Lake on the way.' },
      { day: 2, title: 'To Sohra', description: 'Waterfalls and valleys.' },
      { day: 3, title: 'Root bridge trek', description: 'Trek to Nongriat with a local guide.' },
      { day: 4, title: 'Mawlynnong & Dawki', description: 'Village walk and the Umngot river.' },
      { day: 5, title: 'Laitlum', description: 'Canyons, then a free evening.' },
      { day: 6, title: 'Departure', description: 'Drop in Guwahati.' },
    ],
    departures: [dep('mgh-1', 25, 6, 18500, 16, 10, 4), dep('mgh-2', 53, 6, 18500, 16, 16, 0, { status: 'closed' })],
  },
  {
    slug: 'goa-beach-weekend', title: 'Goa Beach Weekend',
    summary: 'North Goa beaches, a Mandovi sunset cruise and a walk through Fontainhas.',
    destination: 'North Goa', destinationRefs: ['north-goa'], departureCityRefs: ['mumbai'],
    categories: ['weekend', 'beach'], durationDays: 3, durationNights: 1, currency: 'INR', coverImage: PHOTO.goa, coverAlt: 'Beach in North Goa',
    operator: organiser('Island Circle Holidays (sample)', 'Mumbai'),
    accommodation: 'Beach resort in Calangute (triple sharing)', transport: 'AC sleeper bus from Mumbai', meals: 'Breakfast',
    inclusions: ['1 night stay', 'Sleeper bus both ways', 'Sunset cruise'], exclusions: ['Water sports'],
    pickupInfo: 'Borivali, 8:00 PM', cancellationPolicy: null,
    itinerary: [
      { day: 1, title: 'Overnight from Mumbai', description: 'Board the sleeper bus.' },
      { day: 2, title: 'North Goa beaches', description: 'Fort Aguada, Candolim, sunset cruise.' },
      { day: 3, title: 'Panjim & return', description: 'Fontainhas walk, bus back.' },
    ],
    departures: [dep('goa-1', 12, 3, 7999, 30, 22, 6)],
  },
  {
    slug: 'kochi-alappuzha-backwaters', title: 'Kochi & Alappuzha Backwaters',
    summary: 'Fort Kochi\'s heritage lanes, a Kathakali evening and a day on the backwaters.',
    destination: 'Kochi & Alappuzha', destinationRefs: ['kochi', 'alappuzha'], departureCityRefs: ['kochi'],
    categories: ['cultural', 'beach'], durationDays: 4, durationNights: 3, currency: 'INR', coverImage: PHOTO.kerala, coverAlt: 'Kerala backwaters lined with palms',
    operator: organiser('Coastal Weekenders (sample)', 'Kochi'),
    accommodation: 'Homestay in Fort Kochi, houseboat night in Alappuzha', transport: null, meals: 'All meals on the houseboat',
    inclusions: ['3 nights stay', 'Houseboat night', 'Kathakali performance ticket'], exclusions: ['Travel to Kochi'],
    pickupInfo: 'Fort Kochi homestay', cancellationPolicy: 'Full refund up to 14 days before departure.',
    itinerary: [
      { day: 1, title: 'Fort Kochi', description: 'Chinese fishing nets, St. Francis Church.' },
      { day: 2, title: 'Mattancherry', description: 'Palace, synagogue and spice market; Kathakali in the evening.' },
      { day: 3, title: 'Alappuzha houseboat', description: 'A day and night on the backwaters.' },
      { day: 4, title: 'Return to Kochi', description: 'Trip ends by noon.' },
    ],
    departures: [dep('koc-1', 21, 4, 14999, 12, 5, 6)],
  },
  {
    slug: 'srinagar-gulmarg-getaway', title: 'Srinagar & Gulmarg Getaway',
    summary: 'A houseboat night on Dal Lake, Mughal gardens and a day in Gulmarg.',
    destination: 'Srinagar & Gulmarg', destinationRefs: ['srinagar', 'gulmarg'], departureCityRefs: ['srinagar'],
    categories: ['mountains'], durationDays: 5, durationNights: 4, currency: 'INR', coverImage: null,
    operator: organiser('Chinar Group Trips (sample)', 'Srinagar'),
    accommodation: 'Houseboat on Dal Lake, hotel in Srinagar', transport: 'Private cabs', meals: 'Breakfast and dinner',
    inclusions: ['4 nights stay', 'Shikara ride', 'Gulmarg day trip'], exclusions: ['Gondola tickets'],
    pickupInfo: 'Srinagar airport', cancellationPolicy: 'Full refund up to 15 days before departure.',
    itinerary: [
      { day: 1, title: 'Arrive in Srinagar', description: 'Check in to the houseboat, evening shikara ride.' },
      { day: 2, title: 'Mughal gardens', description: 'Shalimar Bagh and Nishat Bagh.' },
      { day: 3, title: 'Gulmarg', description: 'Day trip to Gulmarg.' },
      { day: 4, title: 'Old city', description: 'Hazratbal and the old city.' },
      { day: 5, title: 'Departure', description: 'Airport drop.' },
    ],
    departures: [dep('sxr-1', 34, 5, 23999, 14, 14, 0)],
  },
];
