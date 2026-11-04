import { useEffect, useState } from 'react';

export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

// Absolute URL for a cookie-authenticated API download (e.g. CSV export).
export function apiUrl(path, params = {}) {
  const raw = import.meta.env.VITE_API_URL || '';
  const base = raw ? `${raw.replace(/\/+$/, '')}/api` : '/api';
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString();
  return `${base}${path}${qs ? `?${qs}` : ''}`;
}

export const PAYMENT_METHODS = [
  ['upi', 'UPI'], ['bank_transfer', 'Bank transfer'], ['cash', 'Cash'], ['card', 'Card (own terminal)'], ['other', 'Other'],
];

export const ANNOUNCEMENT_KINDS = [
  ['announcement', 'Announcement'], ['pickup', 'Pickup info'], ['instruction', 'Instruction'], ['itinerary', 'Itinerary update'],
];

export const GENDER_LABELS = { female: 'Female', male: 'Male', other: 'Other', prefer_not: '—' };
