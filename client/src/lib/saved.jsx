/* Saved trips for signed-in travellers, backed by /api/saved. Guests are sent to log in (and
   come back here); organiser and admin accounts are told saving is for traveller accounts. */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from './api';
import { useAuth } from './auth';

export function useSavedTrips() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [slugs, setSlugs] = useState(() => new Set());
  const traveller = user?.role === 'traveler';

  useEffect(() => {
    if (!traveller) return undefined;
    let live = true;
    api.get('/saved').then((d) => { if (live) setSlugs(new Set(d.slugs)); }).catch(() => {});
    return () => { live = false; };
  }, [traveller, user?._id]);

  const toggle = useCallback(async (trip) => {
    if (!user) {
      toast('Log in to save trips', { icon: '♡' });
      navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    if (!traveller) { toast.error('Saving trips is for traveller accounts'); return; }
    const on = slugs.has(trip.slug);
    const next = new Set(slugs);
    if (on) next.delete(trip.slug); else next.add(trip.slug);
    setSlugs(next); // optimistic
    try {
      if (on) await api.delete(`/saved/${trip.slug}`);
      else await api.put(`/saved/${trip.slug}`);
      toast.success(on ? 'Removed from saved trips' : 'Saved. Find it in My trips.');
    } catch (e) {
      setSlugs(slugs);
      toast.error(e.message);
    }
  }, [user, traveller, slugs, navigate, location]);

  // Outside a traveller session nothing counts as saved (no stale state after logout).
  return useMemo(() => ({ has: (slug) => traveller && slugs.has(slug), toggle, count: traveller ? slugs.size : 0 }), [slugs, toggle, traveller]);
}
