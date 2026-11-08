/* AI discovery API (see server/src/routes/discover.js) and the preference vocabulary the UI
   offers. Labels must stay in step with server/src/services/discovery/prefs.js. */
import api from './api';

export const getDiscoverStatus = () => api.get('/discover/status');
export const interpretRequest = (text) => api.post('/discover/interpret', { text });
export const searchDiscovery = (prefs) => api.post('/discover/search', { prefs });
export const askTripQuestion = (slug, question) => api.post(`/discover/trips/${encodeURIComponent(slug)}/ask`, { question });

export const MOOD_OPTIONS = [
  ['mountains', 'Mountains'], ['beaches', 'Beaches'], ['adventure', 'Adventure'], ['nature', 'Nature'], ['culture', 'Culture'],
  ['heritage', 'Heritage'], ['luxury', 'Luxury'], ['peaceful', 'Peaceful'], ['nightlife', 'Nightlife'], ['food', 'Food experiences'],
];
export const BUDGET_OPTIONS = [['under_5k', 'Under ₹5,000'], ['5k_10k', '₹5,000–₹10,000'], ['10k_20k', '₹10,000–₹20,000'], ['20k_plus', '₹20,000+'], ['flexible', 'Flexible']];
export const DURATION_OPTIONS = [['weekend', 'Weekend'], ['3_5', '3–5 days'], ['6_8', '6–8 days'], ['flexible', 'Flexible']];

const label = (opts, v) => opts.find(([k]) => k === v)?.[1] || v;
const fmt = (s) => new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

/* Removable chips describing the current preferences. Each chip knows which keys it clears. */
export function prefChips(p) {
  const chips = [];
  for (const m of p.moods || []) chips.push({ key: `mood-${m}`, label: label(MOOD_OPTIONS, m), remove: (q) => ({ ...q, moods: q.moods.filter((x) => x !== m) }) });
  for (const i of p.interests || []) chips.push({ key: `int-${i}`, label: `Includes ${i}`, remove: (q) => ({ ...q, interests: q.interests.filter((x) => x !== i) }) });
  if (p.destination) chips.push({ key: 'dest', label: `To ${p.destination.name || p.destination.text}`, remove: (q) => ({ ...q, destination: undefined }) });
  if (p.maxPrice) chips.push({ key: 'max', label: `Under ₹${p.maxPrice.toLocaleString('en-IN')}`, remove: (q) => ({ ...q, maxPrice: undefined }) });
  else if (p.budget && p.budget !== 'flexible') chips.push({ key: 'budget', label: label(BUDGET_OPTIONS, p.budget), remove: (q) => ({ ...q, budget: undefined }) });
  if (p.affordable && !p.maxPrice) chips.push({ key: 'aff', label: 'Lower price first', remove: (q) => ({ ...q, affordable: undefined }) });
  if (p.days) chips.push({ key: 'days', label: `About ${p.days} days`, remove: (q) => ({ ...q, days: undefined }) });
  else if (p.duration && p.duration !== 'flexible') chips.push({ key: 'dur', label: label(DURATION_OPTIONS, p.duration), remove: (q) => ({ ...q, duration: undefined }) });
  if (p.departureCity) chips.push({ key: 'city', label: `From ${p.departureCity.name || p.departureCity.text}`, remove: (q) => ({ ...q, departureCity: undefined }) });
  if (p.dates?.mode === 'weekend') chips.push({ key: 'dates', label: 'This coming weekend', remove: (q) => ({ ...q, dates: undefined }) });
  else if (p.dates?.mode === 'range') chips.push({ key: 'dates', label: p.dates.from === p.dates.to ? `On ${fmt(p.dates.from)}` : `${fmt(p.dates.from)} – ${fmt(p.dates.to)}`, remove: (q) => ({ ...q, dates: undefined }) });
  return chips;
}
