/* Live catalogue: the real API behind the traveller screens. Function names and return shapes
   match the prototype's sample store (src/v01/data/store.js) so components are shared. */
import api from './api';
import { toTripParams } from './tripParams.js';

export { toTripParams, upcomingMonths } from './tripParams.js';

export const SORTS = [
  { value: 'departure', label: 'Soonest departure' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'duration', label: 'Shortest first' },
];

export const listTrips = (filters) => api.get('/trips', { params: toTripParams(filters) });
export const getTripMeta = () => api.get('/trips/meta');
export const getTrip = (slug) => api.get(`/trips/${encodeURIComponent(slug)}`);
export const getLandscapes = () => api.get('/india/landscapes');
export const getLandscape = (slug) => api.get(`/india/landscapes/${encodeURIComponent(slug)}`);
export const getCities = () => api.get('/india/cities');
export const getPlace = (slug) => api.get(`/india/places/${encodeURIComponent(slug)}`);
export const getPlaces = () => api.get('/india/places');

