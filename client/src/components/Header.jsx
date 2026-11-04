import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, LayoutDashboard, Briefcase } from 'lucide-react';
import Logo from './Logo';
import { Button, cx } from './ui';
import { useAuth, homeFor } from '../lib/auth';

const NAV = [
  { to: '/trips', label: 'Explore Trips' },
  { to: '/destinations', label: 'Destinations' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/partners', label: 'Become an Operator' },
];

export default function Header({ overlay }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const transparent = overlay && !scrolled && !open;
  const dashLabel = user?.role === 'operator' ? 'Operator dashboard' : user?.role === 'admin' ? 'Admin' : 'My trips';

  return (
    <header className={cx('fixed inset-x-0 top-0 z-50 transition-all duration-300', transparent ? 'bg-transparent' : 'glass !border-x-0 !border-t-0 border-b !border-b-line/70')}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-[72px] lg:px-8">
        <Logo light={transparent} />
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => cx('rounded-full px-4 py-2 text-[15px] font-semibold transition',
              transparent ? 'text-white/90 hover:bg-white/15 hover:text-white' : isActive ? 'bg-peach text-brand-ink' : 'text-ink/80 hover:bg-sand hover:text-ink')}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Button variant={transparent ? 'secondary' : 'soft'} size="sm" to={homeFor(user)}>
                {user.role === 'operator' ? <Briefcase className="size-4" /> : <LayoutDashboard className="size-4" />}{dashLabel}
              </Button>
              <button type="button" onClick={async () => { await logout(); navigate('/'); }} className={cx('grid size-9 place-items-center rounded-full transition', transparent ? 'text-white hover:bg-white/15' : 'text-subtle hover:bg-sand')} aria-label="Log out" title="Log out">
                <LogOut className="size-[18px]" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={cx('rounded-full px-4 py-2 text-[15px] font-semibold', transparent ? 'text-white hover:bg-white/15' : 'text-ink hover:bg-sand')}>Log in</Link>
              <Button size="sm" to="/register">Sign up</Button>
            </>
          )}
        </div>
        <button type="button" className={cx('grid size-10 place-items-center rounded-full lg:hidden', transparent ? 'text-white hover:bg-white/15' : 'hover:bg-sand')} onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'}>
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>
      {open && (
        <div className="border-t border-line bg-ivory px-4 pb-6 pt-2 lg:hidden animate-fade-up">
          <nav className="flex flex-col" aria-label="Mobile">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => cx('rounded-xl px-3 py-3.5 text-[17px] font-bold', isActive ? 'bg-peach text-brand-ink' : 'text-ink')}>{n.label}</NavLink>
            ))}
          </nav>
          <div className="mt-4 grid gap-2 border-t border-line pt-4">
            {user ? (
              <>
                <Button to={homeFor(user)}>{dashLabel}</Button>
                <Button variant="secondary" onClick={async () => { await logout(); navigate('/'); }}>Log out</Button>
              </>
            ) : (
              <>
                <Button to="/register">Sign up</Button>
                <Button variant="secondary" to="/login">Log in</Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
