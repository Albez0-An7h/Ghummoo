import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CalendarDays, Check, Info, MapPin, MapPinOff, Minus, Plus, X } from 'lucide-react';
import { Button, SafeImage, cx } from '../../components/ui';
import useAsync from '../../lib/useAsync';
import { money, dateRange, duration } from '../../lib/format';
import { PriceLabel, AvailabilityBadge } from '../../design/Booking';
import { SampleBadge, NotStated, ErrorState, EmptyState, Bone } from '../../design/Feedback';
import { CompareToggle } from '../../design/Compare';
import { Dialog } from '../../design/Dialog';
import { AIInput } from '../../design/Inputs';
import { PlaceArt } from '../../scenes';
import { getTrip, askTrip } from '../data/store';
import usePageTitle from '../usePageTitle';

function Fact({ label, children }) {
  return <div className="rounded-2xl bg-white p-4 ring-1 ring-line"><dt className="text-[11px] font-extrabold uppercase tracking-wider text-subtle">{label}</dt><dd className="mt-1 font-bold">{children}</dd></div>;
}

function AskThisTrip({ trip }) {
  const [busy, setBusy] = useState(false);
  const [qa, setQa] = useState([]);
  const ask = async (q) => {
    setBusy(true);
    const res = await askTrip(trip.slug, q).catch((e) => ({ answered: false, answer: e.message, sources: [] }));
    setQa((cur) => [{ q, ...res }, ...cur].slice(0, 4));
    setBusy(false);
  };
  return (
    <section aria-labelledby="ask" className="rounded-[28px] bg-gradient-to-br from-peach/70 to-white p-5 ring-1 ring-line sm:p-6">
      <h2 id="ask" className="text-xl font-extrabold">Ask this trip</h2>
      <p className="mt-1 text-sm text-subtle">Answers come only from this listing. If the organiser hasn't said, we'll tell you.</p>
      <AIInput className="mt-4" label="Your question" placeholder="Is food included? Where is pickup?" busy={busy} onSubmit={ask}
        suggestions={['Which meals are included?', 'Where is the pickup point?', 'What is the cancellation policy?', 'What is not included?']}
        note="Prototype: answered from sample listing data, no AI call." />
      <div aria-live="polite" className="mt-4 space-y-3">
        {busy && <Bone className="h-16 w-full rounded-2xl" />}
        {qa.map((r, i) => (
          <div key={`${r.q}-${i}`} className="rounded-2xl bg-white p-4 ring-1 ring-line">
            <p className="text-sm font-extrabold">{r.q}</p>
            <p className={cx('mt-1.5 text-[15px]', r.answered ? 'text-ink' : 'text-subtle italic')}>{r.answer}</p>
            {r.sources.length > 0 && <p className="mt-2 text-xs font-bold text-brand-ink">From the listing: {r.sources.join(', ')}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function TripPage() {
  const { slug } = useParams();
  const { data: t, error, loading, reload } = useAsync(() => getTrip(slug), [slug]);
  usePageTitle(t?.title || (error ? (error.status === 404 ? 'Trip not found' : 'Something went wrong') : undefined));
  const [depId, setDepId] = useState(null);
  const [seats, setSeats] = useState(1);
  const [requestOpen, setRequestOpen] = useState(false);

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8" role="status" aria-busy="true"><span className="sr-only">Loading trip</span><Bone className="aspect-[16/7] w-full rounded-[32px]" /><Bone className="mt-6 h-10 w-2/3" /><Bone className="mt-3 h-5 w-1/2" /></div>;
  }
  if (error) {
    return <div className="mx-auto max-w-3xl px-4 pt-16">{error.status === 404 ? <EmptyState icon={MapPinOff} title="This trip isn't listed" action={<Button to="/v01/trips">Browse trips</Button>}>It may have been removed, or the link is wrong.</EmptyState> : <ErrorState error={error} onRetry={reload} />}</div>;
  }

  const bookable = t.departures.filter((d) => d.availability === 'available');
  const dep = t.departures.find((d) => d._id === depId) || bookable[0] || null;
  const canBook = dep?.availability === 'available';
  const maxSeats = canBook ? Math.min(10, dep.seatsAvailable) : 1;
  const place = t.places.destinations[0];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm font-semibold text-subtle"><Link to="/v01/trips" className="hover:text-ink hover:underline">Trips</Link><span className="mx-2">/</span><span aria-current="page" className="text-ink">{t.title}</span></nav>
      <div className="relative aspect-[16/9] overflow-hidden rounded-[32px] sm:aspect-[16/7]">
        {t.coverImage ? <SafeImage src={t.coverImage} alt={t.coverAlt} eager className="size-full" /> : place && <PlaceArt place={place} className="size-full [&>svg]:size-full" label={`Illustration of ${place.name} (no trip photo provided)`} />}
        <div className="absolute left-4 top-4 flex gap-2"><SampleBadge onImage /></div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-10">
          <header>
            <div className="flex flex-wrap gap-2">
              {[...t.places.destinations].map((p) => <Link key={p.slug} to={`/v01/places/${p.slug}`} className="inline-flex h-8 items-center gap-1 rounded-full bg-peach px-3 text-[13px] font-extrabold text-brand-ink hover:bg-[#ffd9bf]"><MapPin className="size-3.5" aria-hidden />{p.name}</Link>)}
            </div>
            <h1 className="mt-3 text-[34px] font-extrabold leading-tight sm:text-5xl">{t.title}</h1>
            <p className="mt-2 text-[17px] text-subtle">{t.summary}</p>
            <p className="mt-3 text-sm font-semibold">by {t.operator.businessName} <span className="text-subtle">· sample organiser, not verified</span></p>
            <div className="mt-4"><CompareToggle trip={t} /></div>
          </header>

          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Fact label="Duration">{duration(t.durationDays, t.durationNights)}</Fact>
            <Fact label="Departs from">{t.places.departureCities.map((c) => c.name).join(', ') || <NotStated>Not stated</NotStated>}</Fact>
            <Fact label="Price from"><span className="num">{t.priceFrom != null ? money(t.priceFrom) : <NotStated>No open date</NotStated>}</span></Fact>
            <Fact label="Departures">{t.departures.length} listed</Fact>
          </dl>

          <section aria-labelledby="deps">
            <h2 id="deps" className="text-2xl font-extrabold">Departures</h2>
            <p className="mt-1 text-sm text-subtle">Prices are per person for that departure. Seat counts come from the organiser's listing.</p>
            <fieldset className="mt-4 space-y-2">
              <legend className="sr-only">Choose a departure</legend>
              {t.departures.map((d) => {
                const disabled = d.availability !== 'available';
                return (
                  <label key={d._id} className={cx('flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-white p-4 ring-1 transition', disabled ? 'cursor-not-allowed opacity-75 ring-line' : 'cursor-pointer hover:ring-brand-soft', dep?._id === d._id && !disabled ? 'ring-2 ring-brand' : 'ring-line', 'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand')}>
                    <input type="radio" name="departure" className="sr-only" checked={dep?._id === d._id} disabled={disabled} onChange={() => { setDepId(d._id); setSeats(1); }} />
                    <CalendarDays className="size-5 text-brand" aria-hidden />
                    <span className="min-w-40 font-extrabold">{dateRange(d.startDate, d.endDate)}</span>
                    <AvailabilityBadge departure={d} />
                    <span className="ml-auto num text-lg font-extrabold">{money(d.price, t.currency)}</span>
                  </label>
                );
              })}
            </fieldset>
          </section>

          <AskThisTrip trip={t} />

          <section aria-labelledby="iti">
            <h2 id="iti" className="text-2xl font-extrabold">Day by day</h2>
            <ol className="mt-4 space-y-3">
              {t.itinerary.map((d) => (
                <li key={d.day} className="flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-line">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink text-sm font-extrabold text-white">D{d.day}</span>
                  <span><span className="block font-extrabold">{d.title}</span><span className="mt-0.5 block text-[15px] text-subtle">{d.description}</span></span>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="inc" className="grid gap-4 sm:grid-cols-2">
            <h2 id="inc" className="sr-only">What's included</h2>
            <div className="rounded-2xl bg-success-bg/60 p-5"><h3 className="font-extrabold text-success">Included</h3>{t.inclusions.length ? <ul className="mt-2 space-y-1.5">{t.inclusions.map((x) => <li key={x} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />{x}</li>)}</ul> : <p className="mt-2"><NotStated /></p>}</div>
            <div className="rounded-2xl bg-sand p-5"><h3 className="font-extrabold">Not included</h3>{t.exclusions.length ? <ul className="mt-2 space-y-1.5">{t.exclusions.map((x) => <li key={x} className="flex gap-2"><X className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />{x}</li>)}</ul> : <p className="mt-2"><NotStated /></p>}</div>
          </section>

          <section aria-labelledby="log">
            <h2 id="log" className="text-2xl font-extrabold">Stay, transport and policies</h2>
            <dl className="mt-4 divide-y divide-line rounded-2xl bg-white ring-1 ring-line">
              {[['Stay', t.accommodation], ['Transport', t.transport], ['Meals', t.meals], ['Pickup', t.pickupInfo], ['Cancellation', t.cancellationPolicy]].map(([k, v]) => (
                <div key={k} className="grid gap-1 p-4 sm:grid-cols-[160px_1fr]"><dt className="text-sm font-extrabold text-subtle">{k}</dt><dd>{v || <NotStated />}</dd></div>
              ))}
            </dl>
          </section>
        </div>

        {/* Booking summary: price and key details stay visible. */}
        <aside aria-label="Booking summary" className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[28px] bg-white p-5 shadow-lift ring-1 ring-line sm:p-6">
            {dep ? (
              <>
                <PriceLabel amount={dep.price} currency={t.currency} prefix={dateRange(dep.startDate, dep.endDate)} size="lg" />
                <div className="mt-3"><AvailabilityBadge departure={dep} /></div>
                {canBook && (
                  <div className="mt-5 flex items-center justify-between rounded-2xl bg-sand p-2">
                    <span className="pl-2 text-sm font-extrabold" id="seats-l">Travellers</span>
                    <div className="flex items-center gap-1" role="group" aria-labelledby="seats-l">
                      <button type="button" onClick={() => setSeats((s) => Math.max(1, s - 1))} disabled={seats <= 1} className="grid size-10 place-items-center rounded-full bg-white disabled:opacity-40" aria-label="Fewer travellers"><Minus className="size-4" /></button>
                      <output className="num w-8 text-center text-lg font-extrabold" aria-live="polite">{seats}</output>
                      <button type="button" onClick={() => setSeats((s) => Math.min(maxSeats, s + 1))} disabled={seats >= maxSeats} className="grid size-10 place-items-center rounded-full bg-white disabled:opacity-40" aria-label="More travellers"><Plus className="size-4" /></button>
                    </div>
                  </div>
                )}
                {canBook && <p className="mt-4 flex justify-between text-[15px] font-bold"><span>Total for {seats}</span><span className="num">{money(dep.price * seats, t.currency)}</span></p>}
                <Button className="mt-5 w-full" size="lg" disabled={!canBook} onClick={() => setRequestOpen(true)}>Request to book</Button>
              </>
            ) : <p className="font-bold text-subtle">No departures are open for booking right now.</p>}
            <p className="mt-4 flex gap-2 text-xs text-subtle"><Info className="size-4 shrink-0" aria-hidden />Booking is a request. The organiser confirms and shares payment details directly. No payment is taken on Ghumo.</p>
          </div>
        </aside>
      </div>

      <Dialog open={requestOpen} onClose={() => setRequestOpen(false)} title="Booking request (prototype)" description="This prototype doesn't send requests. In the live app this step collects traveller details."
        footer={<><Button variant="secondary" onClick={() => setRequestOpen(false)}>Close</Button><Button to="/trips">Go to the live site</Button></>}>
        {dep && (
          <dl className="space-y-3 text-[15px]">
            <div className="flex justify-between gap-4"><dt className="text-subtle">Trip</dt><dd className="text-right font-bold">{t.title}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-subtle">Departure</dt><dd className="font-bold">{dateRange(dep.startDate, dep.endDate)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-subtle">Travellers</dt><dd className="font-bold">{seats}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-subtle">Price per person</dt><dd className="num font-bold">{money(dep.price, t.currency)}</dd></div>
            <div className="flex justify-between gap-4 border-t border-line pt-3"><dt className="font-extrabold">Total (paid to the organiser)</dt><dd className="num text-lg font-extrabold">{money(dep.price * seats, t.currency)}</dd></div>
          </dl>
        )}
      </Dialog>
    </div>
  );
}
