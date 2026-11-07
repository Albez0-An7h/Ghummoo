import { useState } from 'react';
import { Sparkles, SearchX } from 'lucide-react';
import { Button } from '../components/ui';
import useAsync from '../lib/useAsync';
import usePageTitle from '../lib/usePageTitle';
import { listTrips, getLandscapes, getTripMeta, upcomingMonths } from '../lib/catalog';
import { rankTrips, noMatchNote } from '../lib/discovery';
import { PreferenceSelector, FilterSelect } from '../design/Inputs';
import { TripCard } from '../design/Cards';
import { GridSkeleton, ErrorState, EmptyState } from '../design/Feedback';
import { EXPERIENCE_LABEL } from '../design/labels';

const BUDGETS = [['6000', 'Under ₹6k'], ['10000', 'Under ₹10k'], ['20000', 'Under ₹20k'], ['', 'Flexible']];
const LENGTHS = [['2', 'Weekend'], ['4', '4–5 days'], ['7', 'A week+']];
const EXPERIENCES = ['heritage_walks', 'food_trails', 'spiritual', 'trekking', 'river_water', 'nature', 'beaches', 'wildlife'];
const monthLabel = (m) => new Date(`${m}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long' });

/* "Help me decide": structured preferences in, a short explained list of sample trips out.
   Ranks real listings with open seats using lib/discovery.js (rule-based, no AI call yet).
   One submit, one result list: not a chat. */
export default function DecidePage() {
  usePageTitle('Help me decide');
  const [prefs, setPrefs] = useState({ budget: '', days: '', month: '', from: '', landscapes: [], experiences: [] });
  const [state, setState] = useState({ status: 'idle' });
  const set = (k) => (v) => setPrefs((p) => ({ ...p, [k]: v }));
  const opts = useAsync(() => Promise.all([getLandscapes(), getTripMeta()]).then(([landscapes, meta]) => ({ landscapes, meta })), []);
  const landscapes = opts.data?.landscapes || [];
  const cities = opts.data?.meta.places.departureCities || [];

  const submit = async (e) => {
    e.preventDefault();
    setState({ status: 'loading' });
    try {
      const { items } = await listTrips({ maxPrice: prefs.budget, month: prefs.month, from: prefs.from, available: true, limit: 100 });
      const results = rankTrips(items, prefs, { landscapeName: (s) => landscapes.find((l) => l.slug === s)?.name || s, placeName: (s) => cities.find((c) => c.slug === s)?.name || s });
      setState({ status: 'done', results, note: results.length ? '' : noMatchNote(prefs) });
      requestAnimationFrame(() => document.getElementById('matches')?.focus());
    } catch (err) {
      setState({ status: 'error', error: err });
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
      <p className="inline-flex items-center gap-1.5 rounded-full bg-peach px-3 py-1 text-xs font-extrabold text-brand-ink"><Sparkles className="size-3.5" aria-hidden />Help me decide</p>
      <h1 className="mt-3 max-w-3xl text-[36px] font-extrabold leading-tight sm:text-5xl">Tell us what you're after. We'll suggest trips that fit.</h1>
      <p className="mt-2 max-w-2xl text-subtle">Suggestions only ever come from listed trips with open seats, each with the reason it matched.</p>

      <form onSubmit={submit} className="mt-8 grid gap-6 rounded-[28px] bg-white p-5 ring-1 ring-line sm:p-8 lg:grid-cols-2">
        <PreferenceSelector legend="Budget per person" options={BUDGETS.map(([value, label]) => ({ value, label }))} value={prefs.budget} onChange={set('budget')} />
        <PreferenceSelector legend="How long?" options={LENGTHS.map(([value, label]) => ({ value, label }))} value={prefs.days} onChange={set('days')} />
        <PreferenceSelector legend="Landscapes you'd love" hint="Pick any" multiple options={landscapes.map((l) => ({ value: l.slug, label: l.name, swatch: l.palette.primary }))} value={prefs.landscapes} onChange={set('landscapes')} />
        <PreferenceSelector legend="What you want to do" hint="Pick any" multiple options={EXPERIENCES.map((x) => ({ value: x, label: EXPERIENCE_LABEL[x] }))} value={prefs.experiences} onChange={set('experiences')} />
        <FilterSelect label="Leaving from" value={prefs.from} onChange={set('from')}>
          <option value="">Anywhere</option>
          {cities.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </FilterSelect>
        <FilterSelect label="When" value={prefs.month} onChange={set('month')}>
          <option value="">Any time</option>
          {upcomingMonths(8).map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
        </FilterSelect>
        <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
          <Button type="submit" size="lg" loading={state.status === 'loading'}><Sparkles className="size-5" />Show matching trips</Button>
          <p className="text-xs text-subtle">Suggestions are ranked by how well each listing's own details match your choices.</p>
        </div>
      </form>

      <section id="matches" tabIndex={-1} aria-live="polite" aria-labelledby="matches-h" className="mt-10 outline-none">
        {state.status === 'loading' && <GridSkeleton count={3} label="Finding trips" />}
        {state.status === 'error' && <ErrorState error={state.error} />}
        {state.status === 'done' && (
          state.results.length ? (
            <>
              <h2 id="matches-h" className="text-2xl font-extrabold">{state.results.length} trip{state.results.length > 1 ? 's' : ''} for you</h2>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {state.results.map((r) => <TripCard key={r.trip._id || r.trip.slug} trip={r.trip} reason={r.reasons} />)}
              </div>
              <Button variant="secondary" className="mt-6" to="/trips">See all trips instead</Button>
            </>
          ) : (
            <EmptyState icon={SearchX} title="Nothing fits all of that yet">{state.note}</EmptyState>
          )
        )}
        {state.status === 'idle' && <h2 id="matches-h" className="sr-only">Suggestions appear here</h2>}
      </section>
    </div>
  );
}
