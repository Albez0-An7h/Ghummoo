/* Design-system context: lets the same components serve the live traveller app (real API,
   routes at /) and the V0.1 prototype (sample data, routes under /v01).

     base    route prefix ('' live, '/v01' prototype)
     places  place summaries used by search suggestions
     saved   saved-trips controller (live only); null hides the Save button */
import { createContext, useContext, useMemo } from 'react';

const DesignCtx = createContext({ base: '', places: [], saved: null });

export function DesignProvider({ base = '', places = [], saved = null, children }) {
  const value = useMemo(() => ({ base, places, saved }), [base, places, saved]);
  return <DesignCtx.Provider value={value}>{children}</DesignCtx.Provider>;
}

export function usePaths() {
  const { base } = useContext(DesignCtx);
  return useMemo(() => ({
    home: base || '/',
    india: (hash = '') => `${base}/india${hash}`,
    cities: `${base}/cities`,
    place: (slug) => `${base}/places/${slug}`,
    trips: (query = '') => `${base}/trips${query}`,
    trip: (slug) => `${base}/trips/${slug}`,
    decide: `${base}/decide`,
    compare: (slugs = []) => `${base}/compare${slugs.length ? `?trips=${slugs.join(',')}` : ''}`,
  }), [base]);
}

export const usePlaces = () => useContext(DesignCtx).places;
export const useSaved = () => useContext(DesignCtx).saved;
