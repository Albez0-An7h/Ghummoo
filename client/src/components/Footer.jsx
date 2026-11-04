import { Link } from 'react-router-dom';
import Logo from './Logo';

const COLS = [
  { title: 'Travel', links: [['Explore trips', '/trips'], ['Destinations', '/destinations'], ['Weekend getaways', '/trips?category=weekend'], ['International', '/trips?category=international']] },
  { title: 'Organisers', links: [['Become an operator', '/partners'], ['AI Package Studio', '/partners#studio'], ['Operator login', '/login']] },
  { title: 'Ghumo AI', links: [['How it works', '/how-it-works'], ['Trust & safety', '/how-it-works#trust']] },
];

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-sand/70">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-subtle">Your next group trip, minus the chaos. Fixed-departure group trips from independent organisers, all in one place.</p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-ink/70">{c.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {c.links.map(([label, to]) => <li key={label}><Link to={to} className="text-[15px] font-medium text-subtle transition hover:text-brand-ink">{label}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-[13px] text-subtle sm:flex-row sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Ghumo AI. Trips are run by the independent organisers named on each listing.</p>
          <p>Listings marked "Demo" are sample data for this preview.</p>
        </div>
      </div>
    </footer>
  );
}
