import { Compass } from 'lucide-react';
import { Button } from '../../components/ui';
import { EmptyState } from '../../design/Feedback';
import usePageTitle from '../usePageTitle';

export default function NotFound() {
  usePageTitle('Page not found');
  return (
    <div className="mx-auto max-w-3xl px-4 pt-16">
      <EmptyState icon={Compass} title="This page wandered off" action={<Button to="/v01">Back to the prototype home</Button>}>
        The link may be wrong. Try Explore India or search for a trip.
      </EmptyState>
    </div>
  );
}
