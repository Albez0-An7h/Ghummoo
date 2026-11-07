import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, CalendarDays, Eye, Inbox, CheckCircle2 } from 'lucide-react';
import api from '../../lib/api';
import useAsync from '../../lib/useAsync';
import { dateRange } from '../../lib/format';
import { Card, Stat, Spinner, ErrorState, EmptyState, PageHeader, Tabs, StatusBadge } from '../../components/ui';

/* Basic insights, limited to events the product actually records: public listing views,
   booking requests, confirmations and seat occupancy. No revenue or conversion figures. */
export default function InsightsPage() {
  const [days, setDays] = useState('30');
  const { data, error, loading, reload } = useAsync(() => api.get('/operator/insights', { params: { days } }), [days]);

  return (
    <div className="space-y-6">
      <PageHeader title="Insights">How people find and book your trips. Only things we can actually count are shown.</PageHeader>
      <Tabs className="w-fit" value={days} onChange={setDays} tabs={[{ value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }, { value: '90', label: 'Last 90 days' }]} />

      {loading && !data ? <Spinner /> : error ? <ErrorState error={error} onRetry={reload} /> : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-4">
            <Stat label="Listing views" value={data.totals.views} hint="Visits to your public trip pages" icon={Eye} />
            <Stat label="Booking requests" value={data.totals.requests} hint="Requests travellers sent" icon={Inbox} />
            <Stat label="Bookings confirmed" value={data.totals.confirmed} hint="Requests you confirmed" icon={CheckCircle2} />
          </div>
          <p className="-mt-2 text-xs text-subtle">Views count every visit to a public trip page, including repeat visits. Your own visits, admin visits and known bots aren't counted.</p>

          <Card className="overflow-hidden">
            <h2 className="border-b border-line px-5 py-4 text-lg font-extrabold">By package</h2>
            {data.perPackage.length === 0 ? (
              <EmptyState className="m-5" icon={BarChart3} title="No packages yet">Once you create and publish a trip, its views and requests appear here.</EmptyState>
            ) : (
              <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Views and requests per package">
                <table className="w-full min-w-[520px] text-left text-[14px]">
                  <thead className="bg-sand/60 text-xs font-extrabold uppercase tracking-wider text-subtle">
                    <tr><th scope="col" className="px-5 py-3">Package</th><th scope="col" className="px-3 py-3 text-right">Views</th><th scope="col" className="px-3 py-3 text-right">Requests</th><th scope="col" className="px-5 py-3 text-right">Confirmed</th></tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {data.perPackage.map((p) => (
                      <tr key={p._id}>
                        <th scope="row" className="px-5 py-3 font-bold"><Link to={`/operator/packages/${p._id}`} className="hover:text-brand-ink">{p.title}</Link> <StatusBadge status={p.status} /></th>
                        <td className="num px-3 py-3 text-right">{p.views}</td>
                        <td className="num px-3 py-3 text-right">{p.requests}</td>
                        <td className="num px-5 py-3 text-right">{p.confirmed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-extrabold">Departure occupancy</h2>
            <p className="mt-1 text-sm text-subtle">Upcoming departures. Confirmed seats, seats held by requests waiting for you, and seats still open.</p>
            {data.occupancy.length === 0 ? <p className="mt-4 text-[14px] text-subtle">No upcoming departures. Add dates to a package to start taking requests.</p> : (
              <ul className="mt-4 space-y-4">
                {data.occupancy.map((d) => {
                  const pct = (n) => `${(n / d.totalCapacity) * 100}%`;
                  return (
                    <li key={d._id}>
                      <Link to={`/operator/departures/${d._id}`} className="block rounded-xl p-2 -m-2 hover:bg-ivory">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <p className="font-bold">{d.trip} <span className="font-medium text-subtle"><CalendarDays className="mb-0.5 inline size-3.5" aria-hidden /> {dateRange(d.startDate)}</span></p>
                          <p className="num text-sm font-bold">{d.confirmedSeats} confirmed · {d.requestedSeats} requested · {d.seatsAvailable} open <span className="text-subtle">of {d.totalCapacity}</span></p>
                        </div>
                        <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-sand" role="img" aria-label={`${d.confirmedSeats} confirmed, ${d.requestedSeats} requested, ${d.seatsAvailable} open of ${d.totalCapacity} seats`}>
                          <span className="h-full bg-success" style={{ width: pct(d.confirmedSeats) }} />
                          <span className="h-full bg-warning/70" style={{ width: pct(d.requestedSeats) }} />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
