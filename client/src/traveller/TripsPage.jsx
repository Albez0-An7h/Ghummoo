import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, SearchX, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Button, cx } from '../components/ui';
import useAsync from '../lib/useAsync';
import usePageTitle from '../lib/usePageTitle';
import { CATEGORY_LABELS } from '../lib/format';
import { listTrips, getTripMeta, getLandscapes, SORTS, upcomingMonths } from '../lib/catalog';
import { TripCard } from '../design/Cards';
import { GridSkeleton, ErrorState, EmptyState } from '../design/Feedback';
import { Drawer } from '../design/Dialog';
import { FilterSelect, ActiveFilters, PreferenceSelector } from '../design/Inputs';
import { usePaths } from '../design/context';
import SearchBox from '../design/SearchBox';

const KEYS = ['q', 'destination', 'place', 'from', 'landscape', 'category', 'maxPrice', 'maxDays', 'month', 'available', 'sort'];
const BUDGETS = [['5000', 'Up to ₹5,000'], ['10000', 'Up to ₹10,000'], ['20000', 'Up to ₹20,000'], ['50000', 'Up to ₹50,000']];
const LENGTHS = [['3', 'Up to 3 days'], ['5', 'Up to 5 days'], ['8', 'Up to 8 days']];
const monthLabel = (m) => new Date(`${m}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

/* Few filters by default (destination, experience, budget, length); the rest live under
   "More filters" so search stays simple. Filter state is the URL, so results are shareable. */
function Filters({ f, set, facets, defaultMore }) {
  const [more, setMore] = useState(defaultMore);
  const { meta, landscapes } = facets;
  return (
    <div className="space-y-6">
      <FilterSelect label="Destination" value={f.place} onChange={(v) => set({ place: v })}>
        <option value="">Anywhere</option>
        {meta.places.destinations.map((p) => <option key={p.slug} value={p.slug}>{p.name} ({p.tripCount})</option>)}
      </FilterSelect>
      <PreferenceSelector size="sm" legend="Experience" options={meta.categories.map((c) => ({ value: c.name, label: CATEGORY_LABELS[c.name] || c.name }))} value={f.category} onChange={(v) => set({ category: v })} />
      <PreferenceSelector size="sm" legend="Budget per person" options={BUDGETS.map(([value, label]) => ({ value, label }))} value={f.maxPrice} onChange={(v) => set({ maxPrice: v })} />
      <PreferenceSelector size="sm" legend="Trip length" options={LENGTHS.map(([value, label]) => ({ value, label }))} value={f.maxDays} onChange={(v) => set({ maxDays: v })} />

      <div className="border-t border-line pt-4">
        <button type="button" onClick={() => setMore((m) => !m)} aria-expanded={more} className="flex w-full items-center justify-between text-sm font-extrabold">
          More filters<ChevronDown className={cx('size-4 transition', more && 'rotate-180')} aria-hidden />
        </button>
        {more && (
          <div className="mt-5 space-y-6">
            <FilterSelect label="Departing from" value={f.from} onChange={(v) => set({ from: v })}>
              <option value="">Any city</option>
              {meta.places.departureCities.map((p) => <option key={p.slug} value={p.slug}>{p.name} ({p.tripCount})</option>)}
            </FilterSelect>
            <FilterSelect label="Month" value={f.month} onChange={(v) => set({ month: v })}>
              <option value="">Any month</option>
              {upcomingMonths(8).map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
            </FilterSelect>
            <PreferenceSelector size="sm" legend="Landscape" options={landscapes.filter((l) => meta.landscapes.includes(l.slug)).map((l) => ({ value: l.slug, label: l.name, swatch: l.palette.primary }))} value={f.landscape} onChange={(v) => set({ landscape: v })} />
            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-extrabold">
              <input type="checkbox" checked={f.available === '1'} onChange={(e) => set({ available: e.target.checked ? '1' : '' })} className="size-5 accent-[#F26A2E]" />
              Only trips with open seats
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TripsPage() {
  usePageTitle('Trips');
  const paths = usePaths();
  const [params, setParams] = useSearchParams();
  const [drawer, setDrawer] = useState(false);
  const f = useMemo(() => Object.fromEntries(KEYS.map((k) => [k, params.get(k) || ''])), [params]);
  const set = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };
  const clear = () => setParams({}, { replace: true });
  const facets = useAsync(async () => { const [meta, landscapes] = await Promise.all([getTripMeta(), getLandscapes()]); return { meta, landscapes }; }, []);
  const { data, error, loading, reload } = useAsync(() => listTrips({ ...f, available: f.available === '1' }), [params.toString()]);

  const nameOf = (list, slug) => list?.find((x) => x.slug === slug)?.name || slug;
  const meta = facets.data?.meta;
  const active = [
    f.q && { key: 'q', label: `“${f.q}”` },
    f.destination && { key: 'destination', label: f.destination },
    f.place && { key: 'place', label: nameOf(meta?.places.destinations.concat(meta.places.departureCities), f.place) },
    f.category && { key: 'category', label: CATEGORY_LABELS[f.category] || f.category },
    f.maxPrice && { key: 'maxPrice', label: `Up to ₹${Number(f.maxPrice).toLocaleString('en-IN')}` },
    f.maxDays && { key: 'maxDays', label: `Up to ${f.maxDays} days` },
    f.from && { key: 'from', label: `From ${nameOf(meta?.places.departureCities, f.from)}` },
    f.month && { key: 'month', label: monthLabel(f.month) },
    f.landscape && { key: 'landscape', label: nameOf(facets.data?.landscapes, f.landscape) },
    f.available && { key: 'available', label: 'Open seats' },
  ].filter(Boolean).map((a) => ({ ...a, onRemove: () => set({ [a.key]: '' }) }));
  const advancedActive = Boolean(f.from || f.month || f.landscape || f.available);
  const hasDemo = data?.items.some((t) => t.isDemo);

  const filterPanel = facets.loading ? <GridSkeleton count={1} kind="place" label="Loading filters" />
    : facets.error ? <ErrorState error={facets.error} onRetry={facets.reload} />
      : <Filters f={f} set={set} facets={facets.data} defaultMore={advancedActive} />;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-10 lg:px-8">
      <h1 className="text-[30px] font-extrabold leading-tight sm:text-5xl">Group trips</h1>
      <p className="mt-1 text-subtle">Fixed departures from independent organisers<span className="hidden sm:inline">, with seats from each organiser's live inventory</span>.</p>
      <SearchBox size="md" className="mt-4 max-w-xl sm:mt-6" />

      <div className="mt-5 grid sm:mt-8 gap-8 lg:grid-cols-[300px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-24 rounded-[24px] bg-white p-5 ring-1 ring-line"><h2 className="mb-4 text-lg font-extrabold">Filters</h2>{filterPanel}</div>
        </aside>

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setDrawer(true)}><SlidersHorizontal className="size-4" />Filters{active.length ? ` (${active.length})` : ''}</Button>
            <p className="text-sm font-bold text-subtle" aria-live="polite">{loading ? 'Loading…' : data ? `${data.total} trip${data.total === 1 ? '' : 's'}` : ''}</p>
            <div className="ml-auto w-[176px] sm:w-48">
              <label htmlFor="sort" className="sr-only">Sort by</label>
              <select id="sort" value={f.sort || 'departure'} onChange={(e) => set({ sort: e.target.value === 'departure' ? '' : e.target.value })} className="h-10 w-full rounded-full border border-line bg-white px-3 text-[13px] font-bold focus:border-brand focus:outline-none sm:text-sm">
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3"><ActiveFilters items={active} onClear={clear} /></div>
          {hasDemo && <p className="mt-3 hidden text-xs font-semibold text-subtle sm:block">Trips marked “Demo” are sample listings for this preview. Every other listing is published by a real organiser.</p>}

          <div className="mt-5">
            {loading ? <GridSkeleton count={6} label="Loading trips" />
              : error ? <ErrorState error={error} onRetry={reload} />
                : data.items.length === 0 ? (
                  <EmptyState icon={SearchX} title="No trips match these filters" action={<div className="flex flex-wrap justify-center gap-2"><Button variant="secondary" onClick={clear}>Clear filters</Button><Button to={paths.decide}><Sparkles className="size-4" />Help me decide</Button></div>}>
                    Try removing a filter. Month and budget only count departures that still have seats.
                  </EmptyState>
                ) : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{data.items.map((t) => <TripCard key={t._id} trip={t} />)}</div>}
          </div>
        </div>
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Filters" footer={<><Button variant="secondary" className="flex-1" onClick={clear}>Clear</Button><Button className="flex-1" onClick={() => setDrawer(false)}>Show {data?.total ?? ''} trips</Button></>}>
        {filterPanel}
      </Drawer>
    </div>
  );
}
