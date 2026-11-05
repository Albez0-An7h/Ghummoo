import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, CalendarCheck, FileText, Users, Sparkles, LayoutDashboard, Link2 } from 'lucide-react';
import useAsync from '../lib/useAsync';
import api from '../lib/api';
import SearchPanel from '../components/SearchPanel';
import Rail from '../components/Rail';
import { Button, SafeImage, Notice } from '../components/ui';
import { money } from '../lib/format';

const HERO = 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=1600&q=72&auto=format&fit=crop';

const WHY = [
  { icon: FileText, title: 'Everything in one page', text: 'Day-wise itinerary, stays, meals, pickup points, inclusions and exclusions, so you never have to DM for details.' },
  { icon: CalendarCheck, title: 'Real dates, real seats', text: 'See every departure with the seats actually left. Reserve your spot without a WhatsApp back-and-forth.' },
  { icon: ShieldCheck, title: 'Know who runs your trip', text: 'Every listing names the organiser. We only show "Verified" once our team has reviewed their business documents.' },
  { icon: Users, title: 'Travel as a group', text: 'Confirmed travellers get a private trip board with pickup details and updates from the organiser.' },
];

export default function HomePage() {
  const trips = useAsync(() => api.get('/trips', { params: { limit: 100 } }), []);
  const meta = useAsync(() => api.get('/trips/meta'), []);
  const items = trips.data?.items || [];
  const by = (c) => items.filter((t) => t.categories?.includes(c));
  const loading = trips.loading;

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <SafeImage src={HERO} alt="Friends around a campfire in the forest" eager widths={[800, 1200, 1600, 2000]} className="absolute inset-0 -z-10 size-full" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/25 to-ivory" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/40 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 pb-14 pt-32 sm:px-6 sm:pt-40 lg:px-8 lg:pb-20 lg:pt-48">
          <div className="max-w-3xl animate-fade-up">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-[13px] font-bold text-white ring-1 ring-white/25 backdrop-blur">
              <span className="size-1.5 rounded-full bg-brand-soft" />Group trips from independent organisers
            </p>
            <h1 className="text-[44px] font-extrabold leading-[1.02] tracking-[-0.035em] text-white sm:text-6xl lg:text-[80px]">
              Some trips are<br />better <span className="text-brand-soft">together.</span>
            </h1>
            <p className="mt-5 max-w-xl text-[17px] font-medium leading-relaxed text-white/90 sm:text-lg">
              Discover extraordinary group adventures from independent travel organisers across India.
            </p>
          </div>
          <SearchPanel destinations={meta.data?.destinations} className="mt-10 max-w-5xl animate-fade-up [animation-delay:120ms]" />
          {meta.data?.categories?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {[['weekend', 'Weekend getaways'], ['mountains', 'Mountains'], ['adventure', 'Adventure'], ['international', 'International'], ['cultural', 'Culture']].map(([c, l]) => (
                <Link key={c} to={`/trips?category=${c}`} className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-ink ring-1 ring-white transition hover:bg-white">{l}</Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="space-y-16 pt-6 sm:space-y-20">
        {trips.error && (
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Notice tone="warning" title="Trips couldn't be loaded" action={<Button variant="secondary" size="sm" onClick={() => { trips.reload(); meta.reload(); }}>Try again</Button>}>
              {trips.error.message}
            </Notice>
          </div>
        )}
        <Rail title="Popular trips" subtitle="Upcoming group departures, soonest first" items={items.slice(0, 10)} loading={loading} href="/trips" />
        <Rail title="Weekend getaways" subtitle="Leave Friday night, be back for Monday" items={by('weekend')} loading={loading} href="/trips?category=weekend" />
        <Rail title="Mountain escapes" subtitle="Himalayan valleys, high passes and pine forests" items={by('mountains')} loading={loading} href="/trips?category=mountains" />
        <Rail title="Adventure trips" subtitle="Rapids, treks and road expeditions" items={by('adventure')} loading={loading} href="/trips?category=adventure" />
        <Rail title="International experiences" subtitle="Abroad, with a trip leader from day one" items={by('international')} loading={loading} href="/trips?category=international" />

        {/* Destinations */}
        {meta.data?.destinations?.length > 0 && (
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div><h2 className="text-2xl font-extrabold sm:text-[28px]">Explore by destination</h2><p className="mt-1 text-[15px] text-subtle">Where groups are heading next</p></div>
              <Link to="/destinations" className="text-sm font-bold text-brand-ink hover:underline">All destinations</Link>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {meta.data.destinations.slice(0, 6).map((d, i) => (
                <Link key={d.name} to={`/trips?destination=${encodeURIComponent(d.name)}`} className={`group relative overflow-hidden rounded-3xl ${i === 0 ? 'col-span-2 row-span-2 aspect-[4/3] lg:col-span-1 lg:aspect-auto' : 'aspect-[4/3]'}`}>
                  <SafeImage src={d.image} alt={d.name} sizes="(min-width:1024px) 33vw, 50vw" className="absolute inset-0 size-full transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    <p className="text-[12px] font-bold uppercase tracking-wider text-white/75">{d.region}{d.country !== 'India' ? `, ${d.country}` : ''}</p>
                    <h3 className="text-lg font-extrabold leading-tight text-white sm:text-2xl">{d.name}</h3>
                    <p className="mt-1 text-[13px] font-semibold text-white/85">{d.tripCount} trip{d.tripCount > 1 ? 's' : ''}{d.priceFrom != null ? ` · from ${money(d.priceFrom)}` : ''}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Why */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[32px] bg-sand px-5 py-12 sm:px-10 lg:px-14 lg:py-16">
            <div className="max-w-2xl">
              <p className="text-sm font-extrabold uppercase tracking-wider text-brand-ink">Why book through Ghumo AI</p>
              <h2 className="mt-2 text-3xl font-extrabold leading-tight sm:text-4xl">No DMs. No forms in five places. Just the trip.</h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {WHY.map((w) => (
                <div key={w.title} className="rounded-3xl bg-white p-6 ring-1 ring-line">
                  <div className="grid size-11 place-items-center rounded-2xl bg-peach text-brand-ink"><w.icon className="size-5" aria-hidden /></div>
                  <h3 className="mt-5 text-lg font-extrabold">{w.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-subtle">{w.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Partner CTA */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[32px] bg-ink px-6 py-12 text-white sm:px-10 lg:grid lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-12 lg:px-14 lg:py-16">
            <div className="absolute -right-24 -top-24 size-80 rounded-full bg-brand/30 blur-3xl" aria-hidden />
            <div className="relative">
              <p className="text-sm font-extrabold uppercase tracking-wider text-brand-soft">Become a travel partner</p>
              <h2 className="mt-2 text-3xl font-extrabold leading-tight sm:text-[40px]">Selling trips on Instagram? Turn your posts into bookings.</h2>
              <p className="mt-4 max-w-lg text-[16px] leading-relaxed text-white/75">Paste your caption into AI Package Studio and get a structured listing to review. Then manage departures, seats and reservations from one dashboard.</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button to="/partners" size="lg">List your trips<ArrowRight className="size-4" /></Button>
                <Button to="/how-it-works" size="lg" variant="secondary" className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20">How it works</Button>
              </div>
            </div>
            <div className="relative mt-10 grid gap-3 lg:mt-0">
              {[[Sparkles, 'AI Package Studio', 'Caption in, structured trip out, with missing details flagged'], [CalendarCheck, 'Departures & seats', 'Multiple dates per trip, live seat counts'], [LayoutDashboard, 'Booking requests', 'Confirm, decline and export traveller lists'], [Link2, 'One shareable link', 'Put it in your bio instead of "DM for details"']].map(([Icon, t, d]) => (
                <div key={t} className="flex items-start gap-4 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
                  <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/20 text-brand-soft"><Icon className="size-5" aria-hidden /></div>
                  <div><p className="font-bold">{t}</p><p className="text-sm text-white/65">{d}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
