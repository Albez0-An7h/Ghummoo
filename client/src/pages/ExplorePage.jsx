import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X, Compass } from 'lucide-react';
import api from '../lib/api';
import useAsync from '../lib/useAsync';
import TripCard, { TripCardSkeleton } from '../components/TripCard';
import { Button, Select, Modal, EmptyState, ErrorState, cx } from '../components/ui';
import { CATEGORY_LABELS } from '../lib/format';
import { monthOptions } from '../components/SearchPanel';

const DURATIONS = [['', 'Any length'], ['1-3', '1–3 days'], ['4-6', '4–6 days'], ['7-60', '7+ days']];
const BUDGETS = [['', 'Any budget'], ['0-5000', 'Under ₹5,000'], ['5000-10000', '₹5,000–10,000'], ['10000-20000', '₹10,000–20,000'], ['20000-40000', '₹20,000–40,000'], ['40000-', '₹40,000+']];
const SORTS = [['departure', 'Upcoming departure'], ['price_asc', 'Price: low to high'], ['price_desc', 'Price: high to low'], ['duration', 'Shortest first']];
const FILTER_KEYS = ['q', 'destination', 'category', 'minPrice', 'maxPrice', 'from', 'to', 'minDays', 'maxDays', 'city'];

function Filters({ params, set, meta }) {
  const months = useMemo(() => monthOptions(), []);
  const budget = params.get('minPrice') || params.get('maxPrice') ? `${params.get('minPrice') || '0'}-${params.get('maxPrice') || ''}` : '';
  const dur = params.get('minDays') ? `${params.get('minDays')}-${params.get('maxDays') || '60'}` : '';
  const month = params.get('from') && params.get('to') ? `${params.get('from')}|${params.get('to')}` : '';
  const cats = (params.get('category') || '').split(',').filter(Boolean);
  const toggleCat = (c) => set({ category: (cats.includes(c) ? cats.filter((x) => x !== c) : [...cats, c]).join(',') });

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-semibold">Trip type</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(CATEGORY_LABELS).filter(([k]) => !meta || meta.categories.some((c) => c.name === k)).map(([k, l]) => (
            <button key={k} type="button" onClick={() => toggleCat(k)} aria-pressed={cats.includes(k)}
              className={cx('rounded-full px-3.5 py-2 text-[13px] font-bold transition ring-1', cats.includes(k) ? 'bg-ink text-white ring-ink' : 'bg-white text-ink ring-line hover:ring-brand-soft')}>{l}</button>
          ))}
        </div>
      </div>
      <Select label="Destination" value={params.get('destination') || ''} onChange={(e) => set({ destination: e.target.value })}>
        <option value="">All destinations</option>
        {meta?.destinations.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
      </Select>
      <Select label="Budget per person" value={budget} onChange={(e) => { const [a, b] = e.target.value.split('-'); set({ minPrice: a && a !== '0' ? a : '', maxPrice: b || '' }); }}>
        {BUDGETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </Select>
      <Select label="Departure month" value={month} onChange={(e) => { const [a, b] = e.target.value.split('|'); set({ from: a || '', to: b || '' }); }}>
        <option value="">Any time</option>
        {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
      </Select>
      <Select label="Duration" value={dur} onChange={(e) => { const [a, b] = e.target.value.split('-'); set({ minDays: a || '', maxDays: b || '' }); }}>
        {DURATIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </Select>
      <Select label="Departing from" value={params.get('city') || ''} onChange={(e) => set({ city: e.target.value })}>
        <option value="">Any city</option>
        {meta?.cities.map((c) => <option key={c} value={c}>{c}</option>)}
      </Select>
    </div>
  );
}

export default function ExplorePage() {
  const [params, setParams] = useSearchParams();
  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState(params.get('q') || '');
  const meta = useAsync(() => api.get('/trips/meta'), []);
  const key = params.toString();
  const trips = useAsync(() => api.get('/trips', { params: Object.fromEntries(new URLSearchParams(key)) }), [key]);

  useEffect(() => { setQ(params.get('q') || ''); }, [params]);

  const set = (patch) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setParams(next, { replace: true });
  };
  const activeCount = FILTER_KEYS.filter((k) => k !== 'q' && k !== 'to' && k !== 'maxPrice' && k !== 'maxDays' && params.get(k)).length
    + (params.get('maxPrice') && !params.get('minPrice') ? 1 : 0) + (params.get('maxDays') && !params.get('minDays') ? 1 : 0);
  const hasAny = FILTER_KEYS.some((k) => params.get(k));
  const clear = () => setParams(params.get('sort') ? { sort: params.get('sort') } : {}, { replace: true });
  const items = trips.data?.items || [];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8 lg:pt-12">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-extrabold sm:text-[40px]">Explore group trips</h1>
        <p className="mt-2 text-[16px] text-subtle">Fixed departures from independent organisers. Filter by budget, dates and the kind of trip you're after.</p>
      </div>

      <form className="mt-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); set({ q: q.trim() }); }} role="search">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search destinations, trips or activities" aria-label="Search trips"
            className="h-12 w-full rounded-full border border-line bg-white pl-12 pr-4 text-[15px] font-medium outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10" />
        </div>
        <Button type="submit" className="h-12 px-6">Search</Button>
      </form>

      <div className="mt-8 lg:grid lg:grid-cols-[280px_1fr] lg:gap-10">
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-3xl border border-line bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-extrabold">Filters</h2>
              {hasAny && <button type="button" onClick={clear} className="text-sm font-bold text-brand-ink hover:underline">Clear all</button>}
            </div>
            <Filters params={params} set={set} meta={meta.data} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[15px] font-semibold text-subtle" aria-live="polite">
              {trips.loading ? 'Finding trips…' : `${trips.data?.total ?? 0} trip${trips.data?.total === 1 ? '' : 's'}`}
              {params.get('q') && <> for "<span className="text-ink">{params.get('q')}</span>"</>}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setDrawer(true)}>
                <SlidersHorizontal className="size-4" />Filters{activeCount > 0 && <span className="num grid size-5 place-items-center rounded-full bg-brand text-[11px] text-white">{activeCount}</span>}
              </Button>
              <label className="flex items-center gap-2 text-sm font-semibold text-subtle">
                <span className="hidden sm:inline">Sort</span>
                <select value={params.get('sort') || 'departure'} onChange={(e) => set({ sort: e.target.value === 'departure' ? '' : e.target.value })}
                  className="h-9 rounded-full border border-line bg-white px-3 text-sm font-bold text-ink outline-none focus:border-brand">
                  {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
            </div>
          </div>

          {hasAny && (
            <div className="mb-5 flex flex-wrap gap-2">
              {params.get('q') && <Chip onClear={() => set({ q: '' })}>"{params.get('q')}"</Chip>}
              {params.get('destination') && <Chip onClear={() => set({ destination: '' })}>{params.get('destination')}</Chip>}
              {(params.get('category') || '').split(',').filter(Boolean).map((c) => <Chip key={c} onClear={() => set({ category: params.get('category').split(',').filter((x) => x !== c).join(',') })}>{CATEGORY_LABELS[c] || c}</Chip>)}
              {(params.get('minPrice') || params.get('maxPrice')) && <Chip onClear={() => set({ minPrice: '', maxPrice: '' })}>Budget</Chip>}
              {params.get('from') && <Chip onClear={() => set({ from: '', to: '' })}>{new Date(params.get('from')).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</Chip>}
              {params.get('minDays') && <Chip onClear={() => set({ minDays: '', maxDays: '' })}>{params.get('minDays')}–{params.get('maxDays')} days</Chip>}
              {params.get('city') && <Chip onClear={() => set({ city: '' })}>From {params.get('city')}</Chip>}
            </div>
          )}

          {trips.error ? <ErrorState error={trips.error} onRetry={trips.reload} /> : trips.loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <TripCardSkeleton key={i} />)}</div>
          ) : items.length === 0 ? (
            <EmptyState icon={Compass} title="No trips match these filters" action={hasAny && <Button variant="secondary" onClick={clear}>Clear filters</Button>}>
              Try a different month or budget, or browse all trips.
            </EmptyState>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{items.map((t) => <TripCard key={t._id} trip={t} />)}</div>
          )}
        </div>
      </div>

      <Modal open={drawer} onClose={() => setDrawer(false)} title="Filters"
        footer={<>{hasAny && <Button variant="ghost" onClick={clear}>Clear all</Button>}<Button onClick={() => setDrawer(false)}>Show {trips.data?.total ?? ''} trips</Button></>}>
        <Filters params={params} set={set} meta={meta.data} />
      </Modal>
    </div>
  );
}

function Chip({ children, onClear }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-peach py-1 pl-3 pr-1 text-[13px] font-bold text-brand-ink">
      {children}
      <button type="button" onClick={onClear} className="grid size-6 place-items-center rounded-full hover:bg-white/60" aria-label="Remove filter"><X className="size-3.5" /></button>
    </span>
  );
}
