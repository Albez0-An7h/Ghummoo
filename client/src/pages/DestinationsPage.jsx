import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import api from '../lib/api';
import useAsync from '../lib/useAsync';
import { SafeImage, Spinner, ErrorState, EmptyState, Button } from '../components/ui';
import { money } from '../lib/format';

export default function DestinationsPage() {
  const { data, loading, error, reload } = useAsync(() => api.get('/trips/meta'), []);
  const groups = {};
  for (const d of data?.destinations || []) {
    const key = d.country === 'India' ? 'India' : 'International';
    (groups[key] ||= []).push(d);
  }
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <h1 className="text-3xl font-extrabold sm:text-[40px]">Destinations</h1>
      <p className="mt-2 max-w-xl text-[16px] text-subtle">Every place below has at least one group trip on Ghumo AI right now.</p>
      {loading ? <Spinner /> : error ? <ErrorState error={error} onRetry={reload} /> : !data.destinations.length ? (
        <EmptyState icon={MapPin} title="No destinations yet" className="mt-8" action={<Button to="/partners">List the first trip</Button>} />
      ) : ['India', 'International'].filter((k) => groups[k]).map((k) => (
        <section key={k} className="mt-10">
          <h2 className="mb-4 text-xl font-extrabold">{k}</h2>
          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3">
            {groups[k].map((d) => (
              <Link key={d.name} to={`/trips?destination=${encodeURIComponent(d.name)}`} className="group relative aspect-[4/3] overflow-hidden rounded-3xl">
                <SafeImage src={d.image} alt={d.name} sizes="(min-width:1024px) 33vw, 50vw" className="absolute inset-0 size-full transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="text-[12px] font-bold uppercase tracking-wider text-white/75">{d.region}{d.country !== 'India' ? `, ${d.country}` : ''}</p>
                  <h3 className="text-2xl font-extrabold text-white">{d.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-white/85">{d.tripCount} trip{d.tripCount > 1 ? 's' : ''}{d.priceFrom != null ? ` · from ${money(d.priceFrom)}` : ''}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
