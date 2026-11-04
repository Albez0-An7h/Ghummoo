import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CalendarDays, Wallet, Search } from 'lucide-react';
import { cx } from './ui';

const BUDGETS = [
  ['', 'Any budget'], ['5000', 'Under ₹5,000'], ['10000', 'Under ₹10,000'], ['20000', 'Under ₹20,000'], ['40000', 'Under ₹40,000'], ['100000', 'Under ₹1,00,000'],
];

export function monthOptions(n = 12) {
  const out = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < n; i += 1) {
    const y = d.getFullYear();
    const m = d.getMonth();
    const from = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const last = new Date(y, m + 1, 0).getDate();
    const to = `${y}-${String(m + 1).padStart(2, '0')}-${last}`;
    out.push({ value: `${from}|${to}`, label: d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) });
    d.setMonth(m + 1);
  }
  return out;
}

export default function SearchPanel({ destinations = [], className }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [month, setMonth] = useState('');
  const [budget, setBudget] = useState('');
  const months = useMemo(() => monthOptions(), []);

  const submit = (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set('q', q.trim());
    if (month) { const [from, to] = month.split('|'); p.set('from', from); p.set('to', to); }
    if (budget) p.set('maxPrice', budget);
    navigate(`/trips${p.toString() ? `?${p}` : ''}`);
  };

  const cell = 'flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-4 py-3 transition focus-within:bg-white/80 hover:bg-white/60';
  const lbl = 'block text-[11px] font-extrabold uppercase tracking-wider text-subtle';
  const ctl = 'w-full min-w-0 truncate bg-transparent text-[15px] font-semibold text-ink outline-none placeholder:text-muted';

  return (
    <form onSubmit={submit} className={cx('glass rounded-3xl p-2 shadow-lift', className)} role="search" aria-label="Search trips">
      <div className="flex flex-col gap-1 md:flex-row md:items-center">
        <label className={cell}>
          <MapPin className="size-5 shrink-0 text-brand" aria-hidden />
          <span className="min-w-0 flex-1"><span className={lbl}>Where</span>
            <input list="dest-list" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Where do you want to go?" className={ctl} />
            <datalist id="dest-list">{destinations.map((d) => <option key={d.name} value={d.name} />)}</datalist>
          </span>
        </label>
        <div className="mx-2 hidden h-10 w-px bg-line md:block" />
        <label className={cell}>
          <CalendarDays className="size-5 shrink-0 text-brand" aria-hidden />
          <span className="min-w-0 flex-1"><span className={lbl}>When</span>
            <select value={month} onChange={(e) => setMonth(e.target.value)} className={cx(ctl, 'cursor-pointer appearance-none')}>
              <option value="">Any time</option>
              {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </span>
        </label>
        <div className="mx-2 hidden h-10 w-px bg-line md:block" />
        <label className={cell}>
          <Wallet className="size-5 shrink-0 text-brand" aria-hidden />
          <span className="min-w-0 flex-1"><span className={lbl}>Budget</span>
            <select value={budget} onChange={(e) => setBudget(e.target.value)} className={cx(ctl, 'cursor-pointer appearance-none')}>
              {BUDGETS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </span>
        </label>
        <button type="submit" className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand px-7 text-base font-extrabold text-white transition hover:bg-brand-hover active:scale-[0.98] md:h-[60px]">
          <Search className="size-5" aria-hidden />Search Trips
        </button>
      </div>
    </form>
  );
}
