import { Search, CalendarCheck, UserCheck, Megaphone, Sparkles, ClipboardList, Send, ShieldCheck, BadgeCheck, FileWarning, Flag } from 'lucide-react';
import { Button } from '../components/ui';

const TRAVELLER = [
  [Search, 'Discover', 'Browse fixed-departure group trips. Compare itineraries, stays, inclusions and real seat availability.'],
  [CalendarCheck, 'Request your seats', 'Pick a departure and number of travellers, then add traveller details once. Your seats are held immediately.'],
  [UserCheck, 'Organiser confirms', 'The organiser reviews your request and contacts you to confirm and arrange payment directly. Ghumo AI does not take payments.'],
  [Megaphone, 'Get trip updates', 'Once confirmed, your private trip board shows pickup pins, instructions and itinerary changes from the organiser.'],
];
const OPERATOR = [
  [Sparkles, 'Paste your post', 'AI Package Studio turns an Instagram caption into a structured package and lists anything it couldn\'t find.'],
  [ClipboardList, 'Review & publish', 'Fill the gaps, add departures and seat capacity, then publish once your profile is approved.'],
  [Send, 'Share one link', 'Replace "DM for details" with a page that has everything, including live seats.'],
  [CalendarCheck, 'Manage requests', 'Confirm or decline bookings, export traveller lists and post updates to each departure.'],
];
const TRUST = [
  [BadgeCheck, 'Verified means verified', 'The Verified badge appears only after our team reviews an organiser\'s business registration. Approval to list is a separate, lighter check.'],
  [FileWarning, 'Terms before you book', 'Cancellation policy, exclusions and pickup details are shown again on the review step, and you confirm you\'ve read them.'],
  [ShieldCheck, 'Real reviews only', 'Only travellers with a confirmed booking on a completed trip can leave a review.'],
  [Flag, 'Report a listing', 'Every trip page has a report button. Our moderators can remove misleading listings.'],
];

function Steps({ items }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(([Icon, t, d], i) => (
        <li key={t} className="rounded-3xl border border-line bg-white p-6">
          <div className="flex items-center justify-between"><div className="grid size-11 place-items-center rounded-2xl bg-peach text-brand-ink"><Icon className="size-5" /></div><span className="num text-3xl font-extrabold text-line">0{i + 1}</span></div>
          <h3 className="mt-5 text-lg font-extrabold">{t}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-subtle">{d}</p>
        </li>
      ))}
    </ol>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="max-w-3xl">
        <p className="text-sm font-extrabold uppercase tracking-wider text-brand-ink">How it works</p>
        <h1 className="mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">From Instagram post to confirmed seat, without the DMs.</h1>
      </div>
      <section className="mt-12"><h2 className="mb-5 text-2xl font-extrabold">For travellers</h2><Steps items={TRAVELLER} /><Button className="mt-6" to="/trips">Explore trips</Button></section>
      <section className="mt-16"><h2 className="mb-5 text-2xl font-extrabold">For travel organisers</h2><Steps items={OPERATOR} /><Button className="mt-6" to="/partners">Become an operator</Button></section>
      <section id="trust" className="mt-16 scroll-mt-24 rounded-[32px] bg-sand p-6 sm:p-10">
        <h2 className="text-2xl font-extrabold">Trust & safety</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {TRUST.map(([Icon, t, d]) => (
            <div key={t} className="flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-line">
              <Icon className="size-6 shrink-0 text-brand" />
              <div><h3 className="font-extrabold">{t}</h3><p className="mt-1 text-[15px] leading-relaxed text-subtle">{d}</p></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
