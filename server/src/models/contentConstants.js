// Shared vocabularies for the India content model (Landscape, Place). Editorial reference data,
// separate from organiser-owned marketplace data (TripPackage, TripDeparture).

const EXPERIENCES = [
  'heritage_walks', // forts, palaces, old quarters
  'architecture',
  'food_trails',
  'spiritual', // temples, ghats, shrines, monasteries
  'markets_crafts',
  'arts_culture', // museums, music, performance
  'nature', // gardens, lakes, viewpoints
  'trekking',
  'river_water', // rafting, boating, backwaters
  'wildlife',
  'beaches',
];

const PLACE_KINDS = ['city', 'destination'];

const PLACE_TYPES = [
  'metro', 'city', 'town', 'village', 'hill_station', 'valley', 'lake', 'beach', 'backwaters',
  'national_park', 'pilgrimage', 'region',
];

const LANDMARK_KINDS = [
  'fort', 'palace', 'tomb', 'monument', 'memorial', 'temple', 'mosque', 'church', 'synagogue', 'shrine',
  'ghat', 'garden', 'lake', 'island', 'museum', 'observatory', 'station', 'bridge', 'waterfront', 'caves', 'market',
];

const ASSET_KINDS = ['photo', 'illustration', 'scene'];
// `planned`: referenced by key, artwork not produced yet; the UI must fall back gracefully.
const ASSET_STATUS = ['planned', 'available'];

module.exports = { EXPERIENCES, PLACE_KINDS, PLACE_TYPES, LANDMARK_KINDS, ASSET_KINDS, ASSET_STATUS };
