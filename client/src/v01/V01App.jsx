/* Ghumo AI V0.1 frontend prototype. Self-contained under /v01: uses sample data from
   ./data and never calls the booking APIs. Lazy-loaded, so GSAP stays out of the live app's
   bundles. */
import { Suspense, lazy, useEffect, useRef } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';
import { Spinner } from '../components/ui';
import FlightCursor from '../components/FlightCursor';
import Navbar from '../design/Navbar';
import { CompareProvider, CompareTray } from '../design/Compare';
import { DesignProvider } from '../design/context';
import { allPlaces } from './data/store';

const PLACES = allPlaces();

const HomePage = lazy(() => import('./pages/HomePage'));
const ExploreIndiaPage = lazy(() => import('./pages/ExploreIndiaPage'));
const CityIndexPage = lazy(() => import('./pages/CityIndexPage'));
const PlacePage = lazy(() => import('./pages/PlacePage'));
const TripsPage = lazy(() => import('./pages/TripsPage'));
const TripPage = lazy(() => import('./pages/TripPage'));
const DecidePage = lazy(() => import('./pages/DecidePage'));
const ComparePage = lazy(() => import('./pages/ComparePage'));
const NotFound = lazy(() => import('./pages/NotFound'));

/* Move focus to <main> on route changes (not on first load) so keyboard and screen-reader
   users start at the new content. Hash links keep their own target. */
function useRouteFocus(main) {
  const { pathname, hash } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (hash) return;
    window.scrollTo(0, 0);
    main.current?.focus({ preventScroll: true });
  }, [pathname, hash, main]);
}

export default function V01App() {
  const main = useRef(null);
  useRouteFocus(main);
  return (
    <DesignProvider base="/v01" places={PLACES}>
    <CompareProvider>
      <a href="#main" className="sr-only z-[80] rounded-full bg-ink px-4 py-2 font-bold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-3">Skip to content</a>
      <div className="bg-ink px-4 py-1.5 text-center text-xs font-bold text-white">
        <FlaskConical className="mr-1 inline size-3.5 text-brand-soft" aria-hidden />
        V0.1 design prototype: all trips and organisers are sample data, and nothing here books a real trip.
        <Link to="/" className="ml-2 underline underline-offset-2">Back to the live site</Link>
      </div>
      <Navbar />
      <main id="main" ref={main} tabIndex={-1} className="min-h-[70vh] outline-none">
        <Suspense fallback={<div className="py-24"><Spinner label="Loading page" /></div>}>
          <Routes>
            <Route index element={<HomePage />} />
            <Route path="india" element={<ExploreIndiaPage />} />
            <Route path="cities" element={<CityIndexPage />} />
            <Route path="places/:slug" element={<PlacePage />} />
            <Route path="trips" element={<TripsPage />} />
            <Route path="trips/:slug" element={<TripPage />} />
            <Route path="decide" element={<DecidePage />} />
            <Route path="compare" element={<ComparePage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <footer className="mt-24 border-t border-line bg-sand/60">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 text-sm text-subtle sm:px-6 md:grid-cols-3 lg:px-8">
          <div><p className="font-extrabold text-ink">ghumo AI · V0.1 prototype</p><p className="mt-1">Group trips from independent organisers across India.</p></div>
          <div className="space-y-1"><p>Trips and organisers marked “Sample” are not real listings.</p><p>Bookings are requests: organisers confirm and share payment details directly. No payment is taken on Ghumo.</p></div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2 font-bold text-ink md:justify-end">
            <Link to="/v01/india">Explore India</Link><Link to="/v01/cities">City index</Link><Link to="/v01/trips">Trips</Link><Link to="/v01/decide">Help me decide</Link>
          </nav>
        </div>
      </footer>
      <CompareTray />
      <FlightCursor />
    </CompareProvider>
    </DesignProvider>
  );
}
