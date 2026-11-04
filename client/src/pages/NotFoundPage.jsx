import { Compass } from 'lucide-react';
import { Button, EmptyState } from '../components/ui';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24">
      <EmptyState icon={Compass} title="This page took a wrong turn" action={<Button to="/">Back to home</Button>}>We couldn't find what you were looking for.</EmptyState>
    </div>
  );
}
