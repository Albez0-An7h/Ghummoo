import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle2, Copy, CalendarDays, MapPin, Phone, Mail, Megaphone, Lock, Pin, Star, ArrowLeft, Clock } from 'lucide-react';
import api from '../lib/api';
import useAsync from '../lib/useAsync';
import { useAuth } from '../lib/auth';
import { Button, Badge, StatusBadge, SafeImage, Spinner, EmptyState, Notice, Modal, Textarea, cx } from '../components/ui';
import { money, dateRange, date, dateTime, daysUntil } from '../lib/format';

const STATUS_COPY = {
  requested: ['Waiting for the organiser', 'Your seats are held. The organiser will review your request and contact you to confirm and arrange payment.'],
  confirmed: ['You are going', 'The organiser has confirmed your booking. Trip updates from them will appear below.'],
  rejected: ['Request declined', 'The organiser could not accept this request. Your seats have been released.'],
  cancelled: ['Booking cancelled', 'This booking was cancelled and the seats were released.'],
};
const KIND = { announcement: 'Announcement', pickup: 'Pickup', instruction: 'Instructions', itinerary: 'Itinerary update' };

function ReviewForm({ bookingId, onDone }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!rating) return toast.error('Choose a rating');
    setBusy(true);
    try { await api.post(`/bookings/${bookingId}/review`, { rating, comment }); toast.success('Thanks for your review'); onDone(); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
    return null;
  };
  return (
    <div className="rounded-3xl border border-line bg-white p-5 sm:p-6">
      <h2 className="text-lg font-extrabold">How was your trip?</h2>
      <div className="mt-3 flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star`} onClick={() => setRating(n)}><Star className={cx('size-8 transition', n <= rating ? 'fill-brand text-brand' : 'text-line hover:text-brand-soft')} /></button>)}
      </div>
      <Textarea className="mt-3" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What should future travellers know?" />
      <Button className="mt-3" onClick={submit} loading={busy}>Post review</Button>
    </div>
  );
}

export default function BookingPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const booking = useAsync(() => api.get(`/bookings/${id}`), [id]);
  const board = useAsync(() => api.get(`/bookings/${id}/announcements`), [id]);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  if (booking.loading) return <Spinner className="py-40" />;
  if (booking.error) return <div className="mx-auto max-w-2xl px-4 py-24"><EmptyState title="Booking not found" action={<Button to="/me/trips">My trips</Button>}>{booking.error.message}</EmptyState></div>;

  const b = booking.data;
  const isOwner = String(b.user) === String(user?._id);
  const pkg = b.package;
  const dep = b.departure;
  const [title, copy] = STATUS_COPY[b.status];
  const ended = new Date(dep.endDate) < new Date();
  const canCancel = isOwner && ['requested', 'confirmed'].includes(b.status) && new Date(dep.startDate) > new Date();
  const days = daysUntil(dep.startDate);

  const cancel = async () => {
    setBusy(true);
    try { await api.post(`/bookings/${id}/cancel`, { reason }); toast.success('Booking cancelled'); setCancelOpen(false); booking.reload(); board.reload(); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  const copyRef = async () => { try { await navigator.clipboard.writeText(b.reference); toast.success('Reference copied'); } catch { toast.error('Could not copy'); } };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      {isOwner && <Link to="/me/trips" className="inline-flex items-center gap-1.5 text-sm font-bold text-subtle hover:text-ink"><ArrowLeft className="size-4" />My trips</Link>}

      {params.get('new') && (
        <div className="mt-4 rounded-3xl bg-ink p-6 text-white sm:p-8 animate-fade-up">
          <CheckCircle2 className="size-10 text-brand-soft" />
          <h1 className="mt-3 text-2xl font-extrabold sm:text-3xl">Booking request sent</h1>
          <p className="mt-2 max-w-xl text-white/75">{b.seats} seat{b.seats > 1 ? 's are' : ' is'} held for you. {b.operator.businessName} has been notified and will confirm your request. No payment has been taken.</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="rounded-2xl bg-white/10 px-4 py-2.5"><span className="block text-[11px] font-bold uppercase tracking-wider text-white/60">Booking reference</span><span className="num text-xl font-extrabold tracking-wider">{b.reference}</span></span>
            <Button variant="secondary" size="sm" onClick={copyRef}><Copy className="size-4" />Copy</Button>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-6">
          <div className="overflow-hidden rounded-3xl border border-line bg-white">
            <div className="flex flex-col sm:flex-row">
              <SafeImage src={pkg.coverImage} alt={pkg.title} className="aspect-[16/9] w-full sm:aspect-auto sm:w-56" sizes="240px" />
              <div className="flex-1 p-5">
                <div className="flex flex-wrap items-center gap-2"><StatusBadge status={b.status} /><span className="num text-sm font-bold text-subtle">{b.reference}</span></div>
                <Link to={`/trips/${pkg.slug}`} className="mt-2 block text-xl font-extrabold hover:text-brand-ink">{pkg.title}</Link>
                <p className="mt-1 flex items-center gap-1.5 text-[15px] font-semibold text-subtle"><CalendarDays className="size-4 text-brand" />{dateRange(dep.startDate, dep.endDate)}{b.status === 'confirmed' && days > 0 && <Badge tone="brand" className="ml-1">in {days} day{days > 1 ? 's' : ''}</Badge>}</p>
                <p className="mt-1 text-sm text-subtle">by {b.operator.businessName}</p>
              </div>
            </div>
          </div>

          <Notice tone={b.status === 'confirmed' ? 'success' : b.status === 'requested' ? 'warning' : 'info'} title={title}>
            {copy}{b.operatorNote && <p className="mt-1.5 font-semibold">Note from organiser: “{b.operatorNote}”</p>}
          </Notice>

          {/* Trip updates board */}
          <section className="rounded-3xl border border-line bg-white p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-extrabold"><Megaphone className="size-5 text-brand" />Trip updates</h2>
            {board.loading ? <Spinner className="py-8" /> : board.data?.locked ? (
              <p className="mt-3 flex items-start gap-2 text-[15px] text-subtle"><Lock className="mt-0.5 size-4 shrink-0" />Updates from the organiser (pickup pins, instructions, itinerary changes) unlock once your booking is confirmed.</p>
            ) : board.data?.items?.length ? (
              <ul className="mt-4 space-y-3">
                {board.data.items.map((a) => (
                  <li key={a._id} className={cx('rounded-2xl p-4', a.pinned ? 'bg-peach/50 ring-1 ring-[#f8cfb2]' : 'bg-sand')}>
                    <div className="flex flex-wrap items-center gap-2"><Badge tone={a.pinned ? 'brand' : 'neutral'} icon={a.pinned ? Pin : undefined}>{KIND[a.kind]}</Badge><span className="text-xs font-semibold text-subtle">{dateTime(a.createdAt)}</span></div>
                    <h3 className="mt-2 font-extrabold">{a.title}</h3>
                    <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-ink/85">{a.body}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-[15px] text-subtle">No updates yet. The organiser will post pickup details and instructions here before departure.</p>}
          </section>

          <section className="rounded-3xl border border-line bg-white p-5 sm:p-6">
            <h2 className="text-lg font-extrabold">Travellers</h2>
            <ul className="mt-3 divide-y divide-line">
              {b.travelers.map((t) => <li key={t._id} className="flex flex-wrap justify-between gap-2 py-3 text-[15px]"><span className="font-bold">{t.fullName}</span><span className="text-subtle">{t.age} yrs{t.phone ? ` · ${t.phone}` : ''}</span></li>)}
            </ul>
            {b.specialRequests && <p className="mt-3 rounded-xl bg-sand p-3 text-sm"><span className="font-bold">Special requests:</span> {b.specialRequests}</p>}
          </section>

          {pkg.itinerary?.length > 0 && (
            <section className="rounded-3xl border border-line bg-white p-5 sm:p-6">
              <h2 className="text-lg font-extrabold">Itinerary</h2>
              <ol className="mt-4 space-y-4">
                {pkg.itinerary.map((d) => (
                  <li key={d.day} className="flex gap-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-peach text-sm font-extrabold text-brand-ink">{d.day}</span>
                    <div><p className="font-extrabold">{d.title}</p>{d.description && <p className="mt-0.5 text-[14px] leading-relaxed text-subtle">{d.description}</p>}</div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {isOwner && b.status === 'confirmed' && ended && !b.review && <ReviewForm bookingId={b._id} onDone={booking.reload} />}
          {b.review && <Notice tone="success" title="You reviewed this trip">{b.review.rating} out of 5{b.review.comment ? `: “${b.review.comment}”` : ''}</Notice>}
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-line bg-white p-5">
            <h2 className="font-extrabold">Summary</h2>
            <dl className="mt-3 space-y-2 text-[14px]">
              <div className="flex justify-between"><dt className="text-subtle">Seats</dt><dd className="font-bold">{b.seats}</dd></div>
              <div className="flex justify-between"><dt className="text-subtle">Per person</dt><dd className="num font-bold">{money(b.pricePerSeat, b.currency)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2"><dt className="font-bold">Total</dt><dd className="num text-lg font-extrabold">{money(b.totalAmount, b.currency)}</dd></div>
            </dl>
            <p className="mt-3 text-[13px] text-subtle">Payment is arranged directly with the organiser. Ghumo AI doesn't take payments.</p>
          </div>
          <div className="rounded-3xl border border-line bg-white p-5">
            <h2 className="font-extrabold">Organiser</h2>
            <p className="mt-1 font-bold">{b.operator.businessName}</p>
            <div className="mt-3 space-y-2 text-sm">
              {b.operator.contactPhone && <a href={`tel:${b.operator.contactPhone.replace(/\s/g, '')}`} className="flex items-center gap-2 font-semibold hover:text-brand-ink"><Phone className="size-4 text-brand" />{b.operator.contactPhone}</a>}
              {b.operator.contactEmail && <a href={`mailto:${b.operator.contactEmail}?subject=Booking ${b.reference}`} className="flex min-w-0 items-center gap-2 font-semibold hover:text-brand-ink"><Mail className="size-4 shrink-0 text-brand" /><span className="truncate">{b.operator.contactEmail}</span></a>}
            </div>
            {pkg.pickupInfo && <p className="mt-4 flex gap-2 border-t border-line pt-3 text-[13px] text-subtle"><MapPin className="size-4 shrink-0 text-brand" />{pkg.pickupInfo}</p>}
          </div>
          <div className="rounded-3xl border border-line bg-white p-5">
            <h2 className="flex items-center gap-2 font-extrabold"><Clock className="size-4 text-brand" />History</h2>
            <ol className="mt-3 space-y-2.5">
              {[...b.history].reverse().map((h, i) => <li key={i} className="text-[13px]"><StatusBadge status={h.status} /><span className="ml-2 text-subtle">{dateTime(h.at)}</span>{h.note && <p className="mt-1 text-ink/80">{h.note}</p>}</li>)}
            </ol>
          </div>
          {canCancel && <Button variant="danger" className="w-full" onClick={() => setCancelOpen(true)}>Cancel booking</Button>}
          {pkg.cancellationPolicy && <p className="text-[13px] leading-relaxed text-subtle"><span className="font-bold">Cancellation policy:</span> {pkg.cancellationPolicy}</p>}
        </aside>
      </div>

      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel this booking?"
        footer={<><Button variant="ghost" onClick={() => setCancelOpen(false)}>Keep booking</Button><Button variant="danger" onClick={cancel} loading={busy}>Cancel booking</Button></>}>
        <p className="text-[15px] text-subtle">Your seats will be released. Refunds for any payment you made follow the organiser's policy and are handled by them directly.</p>
        <Textarea className="mt-4" label="Reason (optional)" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        <p className="mt-3 text-[13px] text-subtle">Booked on {date(b.createdAt)}</p>
      </Modal>
    </div>
  );
}
