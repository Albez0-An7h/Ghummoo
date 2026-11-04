import { Link, useOutletContext } from 'react-router-dom';
import { Package, CalendarDays, Ticket, Clock, Plus, Sparkles, ArrowRight, Wallet } from 'lucide-react';
import api from '../../lib/api';
import useAsync from '../../lib/useAsync';
import { money, shortDate, dateRange, dateTime } from '../../lib/format';
import { Button, Card, Stat, Spinner, ErrorState, EmptyState, PageHeader, StatusBadge } from '../../components/ui';

export default function OverviewPage() {
  const { operator } = useOutletContext();
  const { data: s, error, loading, reload } = useAsync(() => api.get('/operator/stats'), []);
  if (loading && !s) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const isNew = s.publishedTrips === 0 && s.draftTrips === 0;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow={operator.businessName} title="Overview" actions={<>
        <Button variant="secondary" size="sm" to="/operator/studio"><Sparkles className="size-4" />AI Package Studio</Button>
        <Button size="sm" to="/operator/packages/new"><Plus className="size-4" />New package</Button>
      </>} />

      {isNew ? (
        <EmptyState icon={Package} title="List your first trip" action={<div className="flex flex-wrap justify-center gap-2"><Button to="/operator/studio"><Sparkles className="size-4" />Import from a caption</Button><Button variant="secondary" to="/operator/packages/new">Create manually</Button></div>}>
          Paste an Instagram or WhatsApp caption into AI Package Studio and we'll turn it into a structured draft you can review, or build a package from scratch.
        </EmptyState>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Stat label="Published trips" value={s.publishedTrips} hint={s.draftTrips ? `${s.draftTrips} draft${s.draftTrips > 1 ? 's' : ''}` : undefined} icon={Package} />
        <Stat label="Upcoming departures" value={s.upcomingDepartures} icon={CalendarDays} />
        <Stat label="Total reservations" value={s.totalReservations} hint={`${s.confirmedBookings} confirmed · ${s.confirmedSeats} seats`} icon={Ticket} />
        <Stat label="Pending requests" value={s.pendingRequests} icon={Clock} tone={s.pendingRequests ? 'warning' : undefined} />
      </div>

      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-peach text-brand-ink"><Wallet className="size-5" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-subtle">Recorded payments</p>
          {s.recordedPayments.length ? (
            <p className="num text-2xl font-extrabold">{s.recordedPayments.map((p) => money(p.total, p.currency)).join(' + ')}
              <span className="ml-2 text-sm font-semibold text-subtle">from {s.recordedPayments.reduce((n, p) => n + p.count, 0)} record(s)</span></p>
          ) : (
            <p className="text-[14px] text-subtle">No payments recorded yet. Ghumo doesn't process payments; record offline payments on confirmed bookings.</p>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">Recent bookings</h2><Link to="/operator/bookings" className="text-sm font-bold text-brand-ink hover:underline">View all</Link></div>
          {s.recentBookings.length === 0 ? <p className="mt-4 text-[14px] text-subtle">No booking requests yet. They'll appear here as soon as a traveller books.</p> : (
            <ul className="mt-3 divide-y divide-line">
              {s.recentBookings.map((b) => (
                <li key={b._id}>
                  <Link to={`/operator/bookings?focus=${b._id}`} className="flex items-center gap-3 py-3 hover:bg-ivory/60">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{b.contact?.name} <span className="font-medium text-subtle">· {b.seats} seat{b.seats > 1 ? 's' : ''}</span></p>
                      <p className="truncate text-[13px] text-subtle">{b.package?.title} · {b.departure ? shortDate(b.departure.startDate) : ''} · {dateTime(b.createdAt)}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold">Next departures</h2><Link to="/operator/packages" className="text-sm font-bold text-brand-ink hover:underline">Packages</Link></div>
          {s.nextDepartures.length === 0 ? <p className="mt-4 text-[14px] text-subtle">No upcoming departures. Add departures to your packages so travellers can book.</p> : (
            <ul className="mt-3 divide-y divide-line">
              {s.nextDepartures.map((d) => {
                const booked = d.totalCapacity - d.seatsAvailable;
                return (
                  <li key={d._id}>
                    <Link to={`/operator/departures/${d._id}`} className="flex items-center gap-3 py-3 hover:bg-ivory/60">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{d.package?.title}</p>
                        <p className="text-[13px] text-subtle">{dateRange(d.startDate, d.endDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="num text-sm font-extrabold">{booked}/{d.totalCapacity}</p>
                        <p className="text-[11px] font-semibold text-subtle">seats held</p>
                      </div>
                      <ArrowRight className="size-4 text-muted" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
