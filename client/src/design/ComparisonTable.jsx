import { Link } from 'react-router-dom';
import { BadgeCheck, X } from 'lucide-react';
import { money, shortDate, duration } from '../lib/format';
import { compareRows } from '../lib/discovery';
import { AvailabilityBadge } from './Booking';
import { NotStated, DataBadge } from './Feedback';
import { usePaths } from './context';

const RENDER = {
  price: (v, t) => <span className="num text-lg font-extrabold">{money(v, t.currency)}<span className="text-xs font-semibold text-subtle"> /person</span></span>,
  departures: (v) => (
    <ul className="space-y-2">
      {v.slice(0, 4).map((d) => <li key={d._id} className="flex flex-wrap items-center gap-2"><span className="font-bold">{shortDate(d.startDate)}</span><AvailabilityBadge departure={d} /></li>)}
      {v.length > 4 && <li className="text-xs text-subtle">+{v.length - 4} more</li>}
    </ul>
  ),
  duration: (v) => duration(v.days, v.nights),
  from: (v) => v.join(', '),
  inclusions: (v) => <ul className="space-y-1">{v.map((x) => <li key={x}>• {x}</li>)}</ul>,
  exclusions: (v) => <ul className="space-y-1">{v.map((x) => <li key={x}>• {x}</li>)}</ul>,
  organiser: (op) => (
    <span>
      <span className="font-bold">{op.businessName}</span>
      <span className="mt-0.5 flex items-center gap-1 text-xs text-subtle">
        {op.verified ? <><BadgeCheck className="size-3.5 text-success" aria-hidden />Verified by Ghumo</> : 'Not yet verified'}
        {op.location ? ` · ${op.location}` : ''}
      </span>
    </span>
  ),
};
const MISSING = { price: 'No open departure', departures: 'No upcoming dates' };

/* ComparisonTable: a real <table> with row headers; scrolls sideways on small screens while the
   first column stays put. Only stored fields; gaps read "Not stated by organiser". */
export default function ComparisonTable({ trips, onRemove }) {
  const paths = usePaths();
  const rows = compareRows(trips);
  const bySlug = new Map(trips.map((t) => [t.slug, t]));
  return (
    <div className="overflow-x-auto rounded-[24px] bg-white ring-1 ring-line" tabIndex={0} role="region" aria-label="Trip comparison, scroll sideways for more">
      <table className="w-full min-w-[640px] border-collapse text-left text-[14px]">
        <caption className="sr-only">Side-by-side comparison of {trips.length} trips</caption>
        <thead>
          <tr>
            <td className="sticky left-0 z-10 w-36 bg-white p-4" />
            {trips.map((t) => (
              <th key={t.slug} scope="col" className="min-w-[210px] border-l border-line p-4 align-top">
                <div className="flex items-start justify-between gap-2">
                  <Link to={paths.trip(t.slug)} className="text-base font-extrabold leading-snug hover:text-brand-ink">{t.title}</Link>
                  {onRemove && <button type="button" onClick={() => onRemove(t.slug)} className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-sand" aria-label={`Remove ${t.title}`}><X className="size-4" /></button>}
                </div>
                <p className="mt-1 text-xs font-semibold text-subtle">{t.destination}</p>
                <DataBadge trip={t} className="mt-2" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-line">
              <th scope="row" className="sticky left-0 z-10 bg-white p-4 align-top text-xs font-extrabold uppercase tracking-wider text-subtle">{r.label}</th>
              {r.cells.map((c) => (
                <td key={c.slug} className="border-l border-line p-4 align-top font-medium">
                  {c.missing ? <NotStated>{MISSING[r.key] || 'Not stated by organiser'}</NotStated> : (RENDER[r.key] ? RENDER[r.key](c.value, bySlug.get(c.slug)) : c.value)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
