import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { Button } from '../../components/ui';
import ComparisonTable from '../../design/ComparisonTable';
import { EmptyState } from '../../design/Feedback';
import { useCompare } from '../../design/Compare';
import { tripSync } from '../data/store';
import usePageTitle from '../usePageTitle';

export default function ComparePage() {
  usePageTitle('Compare trips');
  const [params, setParams] = useSearchParams();
  const { remove } = useCompare();
  const key = params.get('trips') || '';
  const slugs = useMemo(() => key.split(',').filter(Boolean).slice(0, 3), [key]);
  const trips = useMemo(() => slugs.map(tripSync).filter(Boolean), [slugs]);

  const drop = (slug) => {
    remove(slug);
    const next = slugs.filter((s) => s !== slug);
    setParams(next.length ? { trips: next.join(',') } : {}, { replace: true });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
      <h1 className="text-[36px] font-extrabold leading-tight sm:text-5xl">Compare trips</h1>
      <p className="mt-1 text-subtle">Side by side, straight from each listing. Anything the organiser hasn't stated says so.</p>
      <div className="mt-8">
        {trips.length >= 2 ? <ComparisonTable trips={trips} onRemove={drop} /> : (
          <EmptyState icon={Scale} title={trips.length ? 'Add one more trip to compare' : 'Pick trips to compare'} action={<Button to="/v01/trips">Browse trips</Button>}>
            Use “Compare” on up to three trip cards, then open the comparison from the tray at the bottom of the screen.
          </EmptyState>
        )}
      </div>
    </div>
  );
}
