import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Sparkles, Pencil, Eye, Trash2, CalendarDays, Users, Package } from 'lucide-react';
import api from '../../lib/api';
import useAsync from '../../lib/useAsync';
import { money, shortDate, duration } from '../../lib/format';
import { Button, Card, Badge, StatusBadge, Spinner, ErrorState, EmptyState, PageHeader, Tabs, Modal, SafeImage } from '../../components/ui';

const FILTERS = {
  all: () => true,
  published: (p) => p.status === 'published',
  drafts: (p) => p.status === 'draft' || p.status === 'unpublished',
  removed: (p) => p.status === 'removed',
};

export default function PackagesPage() {
  const { data, error, loading, reload } = useAsync(() => api.get('/operator/packages'), []);
  const [tab, setTab] = useState('all');
  const [busy, setBusy] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const act = async (pkg, action) => {
    setBusy(`${pkg._id}:${action}`);
    try {
      await api.post(`/operator/packages/${pkg._id}/${action}`);
      toast.success(action === 'publish' ? 'Trip is live on the marketplace' : 'Trip unpublished');
      await reload({ silent: true });
    } catch (err) {
      toast.error(err.message, { duration: 6000 });
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    setBusy(`${toDelete._id}:delete`);
    try {
      await api.delete(`/operator/packages/${toDelete._id}`);
      toast.success('Package deleted');
      setToDelete(null);
      await reload({ silent: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const items = data || [];
  const tabs = [
    { value: 'all', label: 'All', count: items.length },
    { value: 'published', label: 'Published', count: items.filter(FILTERS.published).length },
    { value: 'drafts', label: 'Drafts', count: items.filter(FILTERS.drafts).length },
    { value: 'removed', label: 'Removed', count: items.filter(FILTERS.removed).length },
  ];
  const shown = items.filter(FILTERS[tab]);

  return (
    <div className="space-y-6">
      <PageHeader title="Packages" actions={<>
        <Button variant="secondary" size="sm" to="/operator/studio"><Sparkles className="size-4" />Import with AI</Button>
        <Button size="sm" to="/operator/packages/new"><Plus className="size-4" />New package</Button>
      </>}>Create trips, add departures and publish them to the marketplace.</PageHeader>

      {loading && !data ? <Spinner /> : error ? <ErrorState error={error} onRetry={reload} /> : (
        <>
          <Tabs tabs={tabs} value={tab} onChange={setTab} className="w-fit max-w-full" />
          {shown.length === 0 ? (
            <EmptyState icon={Package} title={items.length ? 'Nothing here' : 'No packages yet'} action={!items.length && <Button to="/operator/packages/new"><Plus className="size-4" />Create a package</Button>}>
              {items.length ? 'No packages match this filter.' : 'Create your first package manually or import one from a social-media caption.'}
            </EmptyState>
          ) : (
            <div className="grid gap-4">
              {shown.map((p) => {
                const up = p.upcoming;
                return (
                  <Card key={p._id} className="flex flex-col overflow-hidden sm:flex-row">
                    <SafeImage src={p.coverImage} alt={p.title} widths={[320, 480]} sizes="(min-width:640px) 220px, 100vw" className="aspect-[16/9] w-full sm:aspect-auto sm:w-56 sm:shrink-0" />
                    <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 sm:p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={p.status} />
                        {p.source === 'ai' && <Badge tone="brand" icon={Sparkles}>AI import</Badge>}
                        {p.pendingRequests > 0 && <Badge tone="warning">{p.pendingRequests} pending request{p.pendingRequests > 1 ? 's' : ''}</Badge>}
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold leading-snug">{p.title}</h3>
                        <p className="text-[14px] text-subtle">{[p.destination, duration(p.durationDays, p.durationNights), p.basePrice != null ? `${money(p.basePrice, p.currency)} /person` : null].filter(Boolean).join(' · ')}</p>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-semibold text-ink/80">
                        <span className="flex items-center gap-1"><CalendarDays className="size-4 text-brand" />{up ? `${up.count} upcoming · next ${shortDate(up.next)}` : 'No upcoming departures'}</span>
                        {up && <span className="flex items-center gap-1"><Users className="size-4 text-brand" />{up.seatsLeft}/{up.capacity} seats left</span>}
                      </div>
                      {p.status === 'removed' && p.removedReason && <p className="text-[13px] text-danger">Removed by moderators: {p.removedReason}</p>}
                      <div className="mt-auto flex flex-wrap gap-2 pt-1">
                        {p.status !== 'removed' && <Button size="sm" variant="secondary" to={`/operator/packages/${p._id}`}><Pencil className="size-4" />Edit</Button>}
                        {p.status === 'published' && <Button size="sm" variant="ghost" to={`/trips/${p.slug}`}><Eye className="size-4" />View</Button>}
                        {(p.status === 'draft' || p.status === 'unpublished') && <Button size="sm" loading={busy === `${p._id}:publish`} onClick={() => act(p, 'publish')}>Publish</Button>}
                        {p.status === 'published' && <Button size="sm" variant="ghost" loading={busy === `${p._id}:unpublish`} onClick={() => act(p, 'unpublish')}>Unpublish</Button>}
                        {p.status !== 'published' && p.status !== 'removed' && <Button size="sm" variant="ghost" className="text-danger" onClick={() => setToDelete(p)}><Trash2 className="size-4" />Delete</Button>}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal open={Boolean(toDelete)} onClose={() => setToDelete(null)} title="Delete package?" footer={<>
        <Button variant="ghost" onClick={() => setToDelete(null)}>Cancel</Button>
        <Button variant="danger" loading={busy === `${toDelete?._id}:delete`} onClick={remove}>Delete package</Button>
      </>}>
        <p className="text-[15px]">"{toDelete?.title}" and all of its departures will be permanently deleted. Packages that already have bookings can't be deleted; unpublish them instead.</p>
      </Modal>
    </div>
  );
}
