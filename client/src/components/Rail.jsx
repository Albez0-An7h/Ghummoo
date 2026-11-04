import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import TripCard, { TripCardSkeleton } from './TripCard';

export default function Rail({ title, subtitle, items, loading, href }) {
  const ref = useRef(null);
  const scroll = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  if (!loading && (!items || items.length === 0)) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold sm:text-[28px]">{title}</h2>
          {subtitle && <p className="mt-1 text-[15px] text-subtle">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {href && <Link to={href} className="hidden text-sm font-bold text-brand-ink hover:underline sm:block">See all</Link>}
          <button type="button" onClick={() => scroll(-1)} className="hidden size-10 place-items-center rounded-full border border-line bg-white transition hover:border-brand-soft md:grid" aria-label={`Scroll ${title} left`}><ArrowLeft className="size-4" /></button>
          <button type="button" onClick={() => scroll(1)} className="hidden size-10 place-items-center rounded-full border border-line bg-white transition hover:border-brand-soft md:grid" aria-label={`Scroll ${title} right`}><ArrowRight className="size-4" /></button>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:-mx-8 lg:scroll-px-8 lg:px-8">
        {(loading ? Array.from({ length: 4 }) : items).map((t, i) => (
          <div key={t?._id || i} className="w-[78%] shrink-0 snap-start sm:w-[46%] lg:w-[calc(25%-12px)]">
            {loading ? <TripCardSkeleton /> : <TripCard trip={t} className="h-full" />}
          </div>
        ))}
      </div>
      {href && <Link to={href} className="mt-1 inline-block text-sm font-bold text-brand-ink sm:hidden">See all</Link>}
    </section>
  );
}
