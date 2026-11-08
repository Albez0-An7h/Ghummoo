import { CheckCircle2, CircleSlash, Clock, Lock, Users, XCircle } from 'lucide-react';
import { cx } from '../components/ui';
import { money } from '../lib/format';

/* PriceLabel: a price is never hidden; a missing price says so in words. */
export function PriceLabel({ amount, currency = 'INR', prefix = 'From', unit = 'per person', size = 'md', className }) {
  if (amount == null) {
    return <p className={cx('text-sm font-bold text-subtle', className)}>Price not listed yet</p>;
  }
  return (
    <p className={cx('leading-none', className)}>
      {prefix && <span className="block text-[11px] font-extrabold uppercase tracking-wider text-subtle">{prefix}</span>}
      <span className={cx('num font-extrabold text-ink', size === 'lg' ? 'text-[28px]' : size === 'sm' ? 'text-base' : 'text-xl')}>{money(amount, currency)}</span>
      {unit && <span className="ml-1 text-[13px] font-semibold text-subtle">{unit}</span>}
    </p>
  );
}

const STATES = {
  available: { icon: CheckCircle2, cls: 'bg-success-bg text-success', label: (d) => `${d.seatsAvailable} seats left` },
  few: { icon: Users, cls: 'bg-warning-bg text-warning', label: (d) => `Only ${d.seatsAvailable} seats left` },
  sold_out: { icon: CircleSlash, cls: 'bg-sand text-subtle', label: () => 'Sold out' },
  booking_closed: { icon: Clock, cls: 'bg-sand text-subtle', label: () => 'Booking closed' },
  closed: { icon: Lock, cls: 'bg-sand text-subtle', label: () => 'Not taking bookings' },
  cancelled: { icon: XCircle, cls: 'bg-danger-bg text-danger', label: () => 'Cancelled' },
  departed: { icon: Clock, cls: 'bg-sand text-subtle', label: () => 'Departed' },
};

/* AvailabilityBadge: state in words + icon, never colour alone. "Few" is derived from real seat
   counts (5 or fewer), not an urgency trick. */
export function AvailabilityBadge({ departure, className }) {
  if (!departure) return <span className={cx('inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-xs font-bold text-subtle', className)}><Clock className="size-3.5" aria-hidden />No open departures</span>;
  const key = departure.availability === 'available' && departure.seatsAvailable <= 5 ? 'few' : departure.availability;
  const s = STATES[key] || STATES.closed;
  const Icon = s.icon;
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold', s.cls, className)}>
      <Icon className="size-3.5" aria-hidden />{s.label(departure)}
    </span>
  );
}
