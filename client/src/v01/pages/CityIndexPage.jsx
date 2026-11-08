import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { DestinationCard } from '../../design/Cards';
import { EmptyState } from '../../design/Feedback';
import { PreferenceSelector } from '../../design/Inputs';
import { citiesSync, landscapesSync } from '../data/store';
import usePageTitle from '../usePageTitle';

/* Browsable index of the ten directory cities, filterable by name/state and landscape. */
export default function CityIndexPage() {
  usePageTitle('City index');
  const cities = citiesSync();
  const landscapes = landscapesSync();
  const [q, setQ] = useState('');
  const [land, setLand] = useState('');
  const shown = useMemo(() => cities.filter((c) => {
    const s = q.trim().toLowerCase();
    return (!s || c.name.toLowerCase().includes(s) || c.state.toLowerCase().includes(s)) && (!land || c.landscapes.includes(land));
  }), [cities, q, land]);

  return (
    <div className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-ink">City index</p>
      <h1 className="mt-1 text-[40px] font-extrabold leading-tight sm:text-5xl">Ten cities to start from</h1>
      <p className="mt-2 max-w-2xl text-subtle">Each city page has its landmarks, the places people pair it with, and the trips that go there or leave from there.</p>

      <div className="mt-8 grid gap-5 rounded-[28px] bg-white p-5 ring-1 ring-line lg:grid-cols-[320px_1fr] lg:items-start">
        <div>
          <label htmlFor="city-q" className="text-sm font-extrabold">Find a city</label>
          <div className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-line px-3 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/10">
            <Search className="size-4 text-brand" aria-hidden />
            <input id="city-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or state" className="min-w-0 flex-1 bg-transparent font-semibold focus:outline-none" />
          </div>
        </div>
        <PreferenceSelector legend="Landscape" options={landscapes.map((l) => ({ value: l.slug, label: l.name, swatch: l.palette.primary }))} value={land} onChange={setLand} />
      </div>

      <p className="mt-6 text-sm font-bold text-subtle" aria-live="polite">{shown.length} of {cities.length} cities</p>
      {shown.length ? (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
          {shown.map((c) => <li key={c.slug}><DestinationCard place={c} tripCount={c.tripCounts.to + c.tripCounts.from} /></li>)}
        </ul>
      ) : (
        <EmptyState className="mt-3" title="No city matches" action={<button type="button" className="font-extrabold text-brand-ink underline" onClick={() => { setQ(''); setLand(''); }}>Clear filters</button>}>
          Try another name, or pick a different landscape.
        </EmptyState>
      )}
    </div>
  );
}
