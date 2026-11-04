import { StrictMode, Suspense, lazy, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import { AuthProvider } from './lib/auth';
import Header from './components/Header';
import Footer from './components/Footer';
import { RequireRole } from './components/Guards';
import { Spinner } from './components/ui';
import HomePage from './pages/HomePage';
import FlightCursor from './components/FlightCursor';

const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const TripDetailPage = lazy(() => import('./pages/TripDetailPage'));
const BookPage = lazy(() => import('./pages/BookPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const MyTripsPage = lazy(() => import('./pages/MyTripsPage'));
const DestinationsPage = lazy(() => import('./pages/DestinationsPage'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'));
const PartnersPage = lazy(() => import('./pages/PartnersPage'));
const OrganiserPage = lazy(() => import('./pages/OrganiserPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const OperatorLayout = lazy(() => import('./pages/operator/OperatorLayout'));
const OperatorOverview = lazy(() => import('./pages/operator/OverviewPage'));
const OperatorProfile = lazy(() => import('./pages/operator/ProfilePage'));
const OperatorPackages = lazy(() => import('./pages/operator/PackagesPage'));
const PackageEditor = lazy(() => import('./pages/operator/PackageEditorPage'));
const PackageStudio = lazy(() => import('./pages/operator/StudioPage'));
const OperatorBookings = lazy(() => import('./pages/operator/BookingsPage'));
const DepartureManifest = lazy(() => import('./pages/operator/DeparturePage'));

const AdminPage = lazy(() => import('./pages/admin/AdminPage'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function PublicLayout() {
  const { pathname } = useLocation();
  const overlay = pathname === '/';
  return (
    <>
      <Header overlay={overlay} />
      <main className={overlay ? '' : 'pt-16 lg:pt-[72px]'}>
        <Suspense fallback={<div className="pt-24"><Spinner /></div>}><Outlet /></Suspense>
      </main>
      <Footer />
      {/* Public traveller pages only; dashboards keep the standard cursor. */}
      <FlightCursor />
    </>
  );
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<div className="pt-32"><Spinner /></div>}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/trips" element={<ExplorePage />} />
            <Route path="/trips/:slug" element={<TripDetailPage />} />
            <Route path="/trips/:slug/book" element={<RequireRole roles={['traveler']}><BookPage /></RequireRole>} />
            <Route path="/bookings/:id" element={<RequireRole><BookingPage /></RequireRole>} />
            <Route path="/me/trips" element={<RequireRole roles={['traveler']}><MyTripsPage /></RequireRole>} />
            <Route path="/destinations" element={<DestinationsPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/partners" element={<PartnersPage />} />
            <Route path="/organisers/:slug" element={<OrganiserPage />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/register" element={<AuthPage mode="register" />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route path="/operator" element={<RequireRole roles={['operator']}><OperatorLayout /></RequireRole>}>
            <Route index element={<OperatorOverview />} />
            <Route path="profile" element={<OperatorProfile />} />
            <Route path="packages" element={<OperatorPackages />} />
            <Route path="packages/new" element={<PackageEditor />} />
            <Route path="packages/:id" element={<PackageEditor />} />
            <Route path="studio" element={<PackageStudio />} />
            <Route path="bookings" element={<OperatorBookings />} />
            <Route path="departures/:id" element={<DepartureManifest />} />
          </Route>
          <Route path="/admin/*" element={<RequireRole roles={['admin']}><AdminPage /></RequireRole>} />
        </Routes>
      </Suspense>
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster position="top-center" toastOptions={{
          duration: 3500,
          style: { background: '#241F1B', color: '#fff', borderRadius: '999px', fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: 14, padding: '10px 18px' },
          success: { iconTheme: { primary: '#F5A477', secondary: '#241F1B' } },
          error: { iconTheme: { primary: '#F8E3DF', secondary: '#A8443A' } },
        }} />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
