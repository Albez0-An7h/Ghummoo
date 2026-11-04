import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, BadgeCheck, Users } from 'lucide-react';
import { SafeImage, cx } from './ui';
import { money, shortDate, duration } from '../lib/format';

export default function TripCard({ trip, className, compact }) {
  const next = trip.nextDeparture;
  const low = next && next.seatsAvailable <= 5;
  return (
    <Link to={`/trips/${trip.slug}`} className={cx('group flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-line transition duration-300 hover:-translate-y-1 hover:shadow-lift hover:ring-brand-soft/50', className)}>
      <div className={cx('relative overflow-hidden', compact ? 'aspect-[4/3]' : 'aspect-[5/4]')}>
        <SafeImage src={trip.coverImage} alt={trip.title} sizes="(min-width:1024px) 25vw, (min-width:640px) 45vw, 85vw" className="size-full transition duration-700 group-hover:scale-[1.04]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="glass rounded-full px-2.5 py-1 text-xs font-bold">{duration(trip.durationDays, trip.durationNights)}</span>
          {trip.isDemo && <span className="rounded-full bg-ink/70 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">Demo</span>}
        </div>
        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 text-[13px] font-semibold text-white">
          <MapPin className="size-3.5" aria-hidden /><span className="truncate">{trip.destination}{trip.country && trip.country !== 'India' ? `, ${trip.country}` : ''}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-[17px] font-extrabold leading-snug transition group-hover:text-brand-ink">{trip.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-[13px] font-medium text-subtle">
          by {trip.operator?.businessName}
          {trip.operator?.verified && <BadgeCheck className="size-4 text-success" aria-label="Verified organiser" />}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-semibold text-ink/80">
          {next ? (
            <span className="flex items-center gap-1"><CalendarDays className="size-3.5 text-brand" aria-hidden />{shortDate(next.startDate)}{trip.departureCount > 1 && <span className="font-medium text-subtle">+{trip.departureCount - 1} more</span>}</span>
          ) : <span className="text-subtle">No upcoming departures</span>}
          {trip.startLocation && <span className="text-subtle">from {trip.startLocation}</span>}
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-subtle">From</p>
            <p className="num text-xl font-extrabold">{money(trip.priceFrom, trip.currency)}<span className="text-[13px] font-semibold text-subtle"> /person</span></p>
          </div>
          {next && (
            <span className={cx('flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold', low ? 'bg-warning-bg text-warning' : 'bg-sand text-subtle')}>
              <Users className="size-3.5" aria-hidden />{next.seatsAvailable} seats left
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function TripCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-line">
      <div className="aspect-[5/4] animate-pulse bg-sand" />
      <div className="space-y-3 p-5"><div className="h-5 w-3/4 animate-pulse rounded bg-sand" /><div className="h-4 w-1/2 animate-pulse rounded bg-sand" /><div className="h-7 w-1/3 animate-pulse rounded bg-sand" /></div>
    </div>
  );
}
