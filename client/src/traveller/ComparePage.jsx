import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { Button } from '../components/ui';
import useAsync from '../lib/useAsync';
import usePageTitle from '../lib/usePageTitle';
import { getTrip } from '../lib/catalog';
import ComparisonTable from '../design/ComparisonTable';
import { EmptyState, ErrorState, Bone } from '../design/Feedback';
import { useCompare } from '../design/Compare';
import { usePaths } from '../design/context';

const MAX = 3;

/* Compare up to three trips from their live listings. A trip that can't be loaded (for
   example unpublished since it was added) is reported, never silently dropped. */
export default function ComparePage() {
  usePageTitle('Compare trips');
  const paths = usePaths();
  const [params, setParams] = useSearchParams();
  const { remove } = useCompare();
  const key = params.get('trips') || '';
  const slugs = useMemo(() => [...new Set(key.split(',').filter(Boolean))].slice(0, MAX), [key]);
  const { data, error, loading, reload } = useAsync(
    () => Promise.allSettled(slugs.map(getTrip)).then((rs) => ({
      trips: rs.filter((r) => r.status === 'fulfilled').map((r) => r.value),
      missing: rs.map((r, i) => (r.status === 'rejected' ? slugs[i] : null)).filter(Boolean),
    })),
    [key]
  );

  const drop = (slug) => {
    remove(slug);
    const next = slugs.filter((s) => s !== slug);
    setParams(next.length ? { trips: next.join(',') } : {}, { replace: true });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
      <h1 className="text-[36px] font-extrabold leading-tight sm:text-5xl">Compare trips</h1>
      <p className="mt-1 text-subtle">Side by side, straight from each organiser's listing. Anything they haven't stated says so. No scores or rankings.</p>
      <div className="mt-8">
        {slugs.length < 2 ? (
          <EmptyState icon={Scale} title={slugs.length ? 'Add one more trip to compare' : 'Pick trips to compare'} action={<Button to={paths.trips()}>Browse trips</Button>}>
            Use “Compare” on up to three trip cards, then open the comparison from the tray at the bottom of the screen.
          </EmptyState>
        ) : loading ? (
          <div role="status" aria-busy="true"><span className="sr-only">Loading comparison</span><Bone className="h-[480px] rounded-[24px]" /></div>
        ) : error ? <ErrorState error={error} onRetry={reload} /> : (
          <>
            {data.missing.length > 0 && (
              <p role="status" className="mb-4 rounded-2xl bg-warning-bg px-4 py-3 text-sm font-semibold text-warning">
                {data.missing.length === 1 ? 'One trip is' : `${data.missing.length} trips are`} no longer listed and can't be compared ({data.missing.join(', ')}).
              </p>
            )}
            {data.trips.length >= 2 ? <ComparisonTable trips={data.trips} onRemove={drop} />
              : <EmptyState icon={Scale} title="Not enough trips to compare" action={<Button to={paths.trips()}>Browse trips</Button>}>Pick at least two listed trips.</EmptyState>}
          </>
        )}
      </div>
    </div>
  );
}
