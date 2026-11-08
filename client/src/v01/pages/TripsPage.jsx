import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, SearchX, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui';
import useAsync from '../../lib/useAsync';
import { TripCard } from '../../design/Cards';
import { GridSkeleton, ErrorState, EmptyState } from '../../design/Feedback';
import { Drawer } from '../../design/Dialog';
import { FilterSelect, ActiveFilters, PreferenceSelector } from '../../design/Inputs';
import SearchBox from '../../design/SearchBox';
import { listTrips, SORTS, landscapesSync, departureCityOptions, sampleMonths, placeName, landscapeName } from '../data/store';
import usePageTitle from '../usePageTitle';

const KEYS = ['q', 'place', 'from', 'landscape', 'maxPrice', 'maxDays', 'month', 'available', 'sort'];
const BUDGETS = [['5000', 'Up to ₹5,000'], ['10000', 'Up to ₹10,000'], ['20000', 'Up to ₹20,000']];
const LENGTHS = [['3', 'Up to 3 days'], ['5', 'Up to 5 days'], ['8', 'Up to 8 days']];
const monthLabel = (m) => new Date(`${m}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

function Filters({ f, set }) {
  const landscapes = landscapesSync();
  return (
    <div className="space-y-6">
      <PreferenceSelector legend="Landscape" options={landscapes.map((l) => ({ value: l.slug, label: l.name, swatch: l.palette.primary }))} value={f.landscape} onChange={(v) => set({ landscape: v })} />
      <FilterSelect label="Departing from" value={f.from} onChange={(v) => set({ from: v })}>
        <option value="">Any city</option>
        {departureCityOptions().map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
      </FilterSelect>
      <FilterSelect label="Month" value={f.month} onChange={(v) => set({ month: v })}>
        <option value="">Any month</option>
        {sampleMonths().map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
      </FilterSelect>
      <PreferenceSelector legend="Budget per person" options={BUDGETS.map(([value, label]) => ({ value, label }))} value={f.maxPrice} onChange={(v) => set({ maxPrice: v })} />
      <PreferenceSelector legend="Trip length" options={LENGTHS.map(([value, label]) => ({ value, label }))} value={f.maxDays} onChange={(v) => set({ maxDays: v })} />
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-extrabold">
        <input type="checkbox" checked={f.available === '1'} onChange={(e) => set({ available: e.target.checked ? '1' : '' })} className="size-5 accent-[#F26A2E]" />
        Only trips with open seats
      </label>
    </div>
  );
}

export default function TripsPage() {
  usePageTitle('Trips');
  const [params, setParams] = useSearchParams();
  const [drawer, setDrawer] = useState(false);
  const f = useMemo(() => Object.fromEntries(KEYS.map((k) => [k, params.get(k) || ''])), [params]);
  const set = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };
  const clear = () => setParams(params.get('simulate') ? { simulate: params.get('simulate') } : {}, { replace: true });
  const { data, error, loading, reload } = useAsync(() => listTrips({ ...f, available: f.available === '1' }), [params.toString()]);

  const active = [
    f.q && { key: 'q', label: `“${f.q}”` },
    f.place && { key: 'place', label: placeName(f.place) },
    f.landscape && { key: 'landscape', label: landscapeName(f.landscape) },
    f.from && { key: 'from', label: `From ${placeName(f.from)}` },
    f.month && { key: 'month', label: monthLabel(f.month) },
    f.maxPrice && { key: 'maxPrice', label: `Up to ₹${Number(f.maxPrice).toLocaleString('en-IN')}` },
    f.maxDays && { key: 'maxDays', label: `Up to ${f.maxDays} days` },
    f.available && { key: 'available', label: 'Open seats' },
  ].filter(Boolean).map((a) => ({ ...a, onRemove: () => set({ [a.key]: '' }) }));

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
      <h1 className="text-[36px] font-extrabold leading-tight sm:text-5xl">Group trips</h1>
      <p className="mt-1 text-subtle">Sample listings from independent organisers. Every price is per person, per the listing.</p>
      <SearchBox size="md" className="mt-6 max-w-xl" />

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-24 rounded-[24px] bg-white p-5 ring-1 ring-line"><h2 className="mb-4 text-lg font-extrabold">Filters</h2><Filters f={f} set={set} /></div>
        </aside>

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setDrawer(true)}><SlidersHorizontal className="size-4" />Filters{active.length ? ` (${active.length})` : ''}</Button>
            <p className="text-sm font-bold text-subtle" aria-live="polite">{loading ? 'Loading…' : data ? `${data.total} trip${data.total === 1 ? '' : 's'}` : ''}</p>
            <div className="ml-auto w-48">
              <label htmlFor="sort" className="sr-only">Sort by</label>
              <select id="sort" value={f.sort || 'departure'} onChange={(e) => set({ sort: e.target.value === 'departure' ? '' : e.target.value })} className="h-10 w-full rounded-full border border-line bg-white px-3 text-sm font-bold focus:border-brand focus:outline-none">
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3"><ActiveFilters items={active} onClear={clear} /></div>

          <div className="mt-5">
            {loading ? <GridSkeleton count={6} label="Loading trips" />
              : error ? <ErrorState error={error} onRetry={reload} />
                : data.items.length === 0 ? (
                  <EmptyState icon={SearchX} title="No trips match these filters" action={<div className="flex flex-wrap justify-center gap-2"><Button variant="secondary" onClick={clear}>Clear filters</Button><Button to="/v01/decide"><Sparkles className="size-4" />Help me decide</Button></div>}>
                    Try removing a filter. Months and budgets only count departures that still have seats.
                  </EmptyState>
                ) : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{data.items.map((t) => <TripCard key={t.slug} trip={t} />)}</div>}
          </div>
        </div>
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Filters" footer={<><Button variant="secondary" className="flex-1" onClick={clear}>Clear</Button><Button className="flex-1" onClick={() => setDrawer(false)}>Show {data?.total ?? ''} trips</Button></>}>
        <Filters f={f} set={set} />
      </Drawer>
    </div>
  );
}
