import { ArrowRight, Sparkles, CalendarRange, Users, Download, Megaphone, ShieldCheck, Check } from 'lucide-react';
import { Button, SafeImage } from '../components/ui';
import { useAuth } from '../lib/auth';

const IMG = 'https://images.unsplash.com/photo-1530866495561-507c9faab2ed?w=1400&q=72&auto=format&fit=crop';
const CAPTION = 'Manali Kasol trip, 5 days 4 nights, 7999 per person, Delhi to Delhi Volvo, 2 nights hotel, breakfast, dinner, bonfire, Solang Valley, DJ night, starting 15 December.';

export default function PartnersPage() {
  const { user } = useAuth();
  const cta = user?.role === 'operator' ? { to: '/operator', label: 'Go to your dashboard' } : { to: '/register?role=operator', label: 'Create an operator account' };
  return (
    <div>
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-16">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-wider text-brand-ink">For independent travel organisers</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-[1.05] sm:text-[56px]">Your trips deserve better than “DM for details”.</h1>
          <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-subtle">List your group departures on Ghumo AI, share one link, and manage seats and booking requests from one simple dashboard. Free while we're in preview.</p>
          <div className="mt-7 flex flex-wrap gap-3"><Button size="lg" to={cta.to}>{cta.label}<ArrowRight className="size-4" /></Button><Button size="lg" variant="secondary" to="/how-it-works">How it works</Button></div>
          <ul className="mt-8 grid gap-2 text-[15px] font-semibold sm:grid-cols-2">
            {['No listing fees during preview', 'You keep your customers and payments', 'Works with your existing Instagram', 'Approval in one review'].map((x) => <li key={x} className="flex items-center gap-2"><Check className="size-4 text-success" strokeWidth={3} />{x}</li>)}
          </ul>
        </div>
        <div className="relative">
          <SafeImage src={IMG} alt="Group river rafting" eager className="aspect-[4/5] w-full rounded-[32px] sm:aspect-[4/3] lg:aspect-[4/5]" sizes="(min-width:1024px) 50vw, 100vw" />
          <div id="studio" className="glass absolute inset-x-4 bottom-4 scroll-mt-24 rounded-3xl p-5 shadow-lift sm:inset-x-8 sm:bottom-8">
            <p className="flex items-center gap-2 text-sm font-extrabold text-brand-ink"><Sparkles className="size-4" />AI Package Studio</p>
            <p className="mt-2 line-clamp-3 rounded-2xl bg-white/80 p-3 text-[13px] italic text-subtle">“{CAPTION}”</p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[12px] font-bold">
              {['5D / 4N', '₹7,999 pp', 'Delhi → Delhi', 'Volvo', '15 Dec'].map((t) => <span key={t} className="rounded-full bg-success-bg px-2.5 py-1 text-success">{t}</span>)}
              {['Seat capacity missing', 'Cancellation policy missing'].map((t) => <span key={t} className="rounded-full bg-warning-bg px-2.5 py-1 text-warning">{t}</span>)}
            </div>
            <p className="mt-2 text-[11px] text-subtle">Illustration of the studio's output format</p>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[[Sparkles, 'Caption to listing', 'Paste a post and get a structured draft. Missing details are flagged, never invented.'], [CalendarRange, 'Multiple departures', 'Each trip can have many dates, each with its own price, capacity and booking deadline.'], [Users, 'Live seat control', 'Seats are reserved safely, so you can never be overbooked, even when two people book at once.'], [Download, 'Traveller exports', 'Download traveller lists as CSV for hotels, permits and transport.'], [Megaphone, 'Trip updates board', 'Post pickup pins and instructions that only confirmed travellers can see.'], [ShieldCheck, 'Earn your badge', 'Submit business registration details to get the Verified organiser badge.']].map(([Icon, t, d]) => (
            <div key={t} className="rounded-3xl border border-line bg-white p-6">
              <div className="grid size-11 place-items-center rounded-2xl bg-peach text-brand-ink"><Icon className="size-5" /></div>
              <h3 className="mt-4 text-lg font-extrabold">{t}</h3><p className="mt-1.5 text-[15px] leading-relaxed text-subtle">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
