import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, MapPinned, Sparkles, Briefcase } from 'lucide-react';
import { Button } from '../../components/ui';
import useAsync from '../../lib/useAsync';
import SearchBox from '../../design/SearchBox';
import { TripCard, DestinationCard, LandscapeTile } from '../../design/Cards';
import { GridSkeleton, ErrorState } from '../../design/Feedback';
import { Himalayas } from '../../scenes/landscapes';
import { listTrips, landscapesSync, citiesSync } from '../data/store';
import { useSceneMotion } from '../../motion/useSceneMotion';
import usePageTitle from '../usePageTitle';

function SectionHead({ eyebrow, title, children, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-ink">{eyebrow}</p>}
        <h2 className="mt-1 text-[28px] font-extrabold leading-tight sm:text-4xl">{title}</h2>
        {children && <p className="mt-2 text-[16px] text-subtle">{children}</p>}
      </div>
      {action}
    </div>
  );
}

export default function HomePage() {
  usePageTitle('Ghumo AI: group trips across India');
  const hero = useRef(null);
  useSceneMotion(hero);
  const trips = useAsync(() => listTrips({ sort: 'departure', available: true }), []);
  const landscapes = landscapesSync();
  const cities = citiesSync();

  return (
    <>
      {/* Hero */}
      <section ref={hero} className="relative isolate overflow-hidden">
        <div data-scene className="absolute inset-0 -z-10 [&>div]:h-full [&_svg]:h-full [&_svg]:w-full">
          <div className="h-full"><Himalayas /></div>
        </div>
        {/* Keeps hero text readable over the scene, stronger on phones where the art sits behind the copy. */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ivory/85 via-ivory/70 to-ivory sm:from-ivory/55 sm:via-ivory/45" aria-hidden />
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:px-8 lg:pb-24 lg:pt-28">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-[13px] font-extrabold text-brand-ink ring-1 ring-white backdrop-blur">
              <span className="size-1.5 rounded-full bg-brand" aria-hidden />Group trips from independent organisers
            </p>
            <h1 className="mt-5 text-[42px] font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-[76px]">
              India is better<br /><span className="text-brand">explored together.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[17px] font-medium leading-relaxed text-ink/80 sm:text-lg">
              Find a fixed-departure group trip, see exactly what's included, and travel with people who want the same journey.
            </p>
          </div>
          <SearchBox className="mt-8 max-w-2xl" />

          <div className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
            <Link to="/v01/trips" className="group flex items-start gap-4 rounded-[24px] bg-white/90 p-5 ring-1 ring-white backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lift motion-reduce:hover:translate-y-0">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-peach text-brand-ink"><MapPinned className="size-6" aria-hidden /></span>
              <span>
                <span className="block text-lg font-extrabold">I know where I want to go</span>
                <span className="mt-0.5 block text-sm text-subtle">Browse trips by place, dates and budget.</span>
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-extrabold text-brand-ink">Browse trips<ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden /></span>
              </span>
            </Link>
            <Link to="/v01/decide" className="group flex items-start gap-4 rounded-[24px] bg-ink p-5 text-white transition hover:-translate-y-0.5 hover:shadow-lift motion-reduce:hover:translate-y-0">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand text-white"><Sparkles className="size-6" aria-hidden /></span>
              <span>
                <span className="block text-lg font-extrabold">Help me decide</span>
                <span className="mt-0.5 block text-sm text-white/75">Tell us your budget, dates and vibe. We'll suggest real trips.</span>
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-extrabold text-brand-soft">Get suggestions<ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden /></span>
              </span>
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-20 px-4 pt-8 sm:px-6 lg:px-8">
        {/* Curated trips */}
        <section aria-labelledby="curated">
          <SectionHead eyebrow="Leaving soon" title={<span id="curated">A few trips to start with</span>} action={<Button variant="secondary" to="/v01/trips">All trips<ArrowRight className="size-4" /></Button>}>
            Sample listings, sorted by the next open departure. Prices and seats shown are per the listing.
          </SectionHead>
          {trips.loading ? <GridSkeleton count={3} label="Loading trips" />
            : trips.error ? <ErrorState error={trips.error} onRetry={trips.reload} />
              : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{trips.data.items.slice(0, 3).map((t) => <TripCard key={t.slug} trip={t} />)}</div>}
        </section>

        {/* Explore India preview */}
        <section aria-labelledby="explore">
          <SectionHead eyebrow="Explore India" title={<span id="explore">Six landscapes, one country</span>} action={<Button variant="secondary" to="/v01/india">Start exploring<Compass className="size-4" /></Button>}>
            From Himalayan valleys to the backwaters of Kerala. Pick a landscape, then find the trips that go there.
          </SectionHead>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {landscapes.map((l) => <LandscapeTile key={l.slug} landscape={l} to={`/v01/india#${l.slug}`} />)}
          </div>
        </section>

        {/* City discovery */}
        <section aria-labelledby="cities">
          <SectionHead eyebrow="Cities" title={<span id="cities">Start from a city</span>} action={<Button variant="secondary" to="/v01/cities">City index<ArrowRight className="size-4" /></Button>}>
            Ten cities, each with its own landmarks, food and nearby escapes.
          </SectionHead>
          <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0" aria-label="Cities">
            {cities.map((c) => (
              <li key={c.slug} className="w-[62%] shrink-0 snap-start sm:w-[30%] lg:w-[19%]">
                <DestinationCard place={c} size="sm" tripCount={c.tripCounts.to + c.tripCounts.from} />
              </li>
            ))}
          </ul>
        </section>

        {/* Organiser invitation */}
        <section className="relative overflow-hidden rounded-[32px] bg-ink px-6 py-12 text-white sm:px-12">
          <div className="absolute -right-24 -top-24 size-80 rounded-full bg-brand/30 blur-3xl" aria-hidden />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-brand-soft">For organisers</p>
              <h2 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">Run group trips? Bring them to Ghumo.</h2>
              <p className="mt-3 max-w-xl text-white/80">Turn an Instagram post into a listing with AI Package Studio, take booking requests, and keep your group updated in one place. You confirm every booking and handle payment directly.</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Button to="/partners" size="lg"><Briefcase className="size-5" />List your trips</Button>
              <Button to="/how-it-works" size="lg" variant="secondary">How it works</Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
