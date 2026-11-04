import { useState } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LayoutDashboard, Building2, Package, Ticket, Flag, Search, ExternalLink, ShieldCheck, Check, X } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import api from '../../lib/api';
import useAsync from '../../lib/useAsync';
import { money, date, shortDate, dateTime } from '../../lib/format';
import { Button, Card, Badge, Input, Textarea, StatusBadge, Spinner, ErrorState, EmptyState, PageHeader, Tabs, Modal, Stat, SafeImage } from '../../components/ui';
import { useDebounced } from '../operator/_shared';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/operators', label: 'Operators', icon: Building2 },
  { to: '/admin/packages', label: 'Listings', icon: Package },
  { to: '/admin/bookings', label: 'Bookings', icon: Ticket },
  { to: '/admin/reports', label: 'Reports', icon: Flag },
];

// Modal asking for a note/reason before an action. `required` enforces a minimum length.
function ReasonModal({ state, onClose }) {
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  if (!state) return null;
  const submit = async () => {
    if (state.required && note.trim().length < 3) { toast.error('Please add a reason'); return; }
    setSaving(true);
    try {
      await state.run(note.trim());
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open onClose={onClose} title={state.title} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant={state.danger ? 'danger' : 'primary'} loading={saving} onClick={submit}>{state.confirm}</Button></>}>
      {state.body && <p className="mb-4 text-[15px] text-subtle">{state.body}</p>}
      <Textarea label={state.label || 'Note'} required={state.required} rows={4} value={note} onChange={(e) => setNote(e.target.value)} autoFocus />
    </Modal>
  );
}

function Overview() {
  const { data: s, error, loading, reload } = useAsync(() => api.get('/admin/stats'), []);
  if (loading && !s) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Trust & safety" title="Admin overview" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Operators awaiting review" value={s.opsPending} icon={Building2} tone={s.opsPending ? 'warning' : undefined} />
        <Stat label="Approved operators" value={s.opsApproved} icon={ShieldCheck} />
        <Stat label="Published listings" value={s.pkgsPublished} hint={`${s.pkgsTotal} total`} icon={Package} />
        <Stat label="Open reports" value={s.reportsOpen} icon={Flag} tone={s.reportsOpen ? 'warning' : undefined} />
        <Stat label="Bookings" value={s.bookingsTotal} hint={`${s.bookingsRequested} awaiting operator`} icon={Ticket} />
        <Stat label="Accounts" value={s.users} icon={LayoutDashboard} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" to="/admin/operators">Review operators</Button>
        <Button size="sm" variant="secondary" to="/admin/reports">Handle reports</Button>
      </div>
    </div>
  );
}

function Operators() {
  const [status, setStatus] = useState('pending');
  const { data, error, loading, reload } = useAsync(() => api.get('/admin/operators', { params: { status: status || undefined } }), [status]);
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(null);

  const approve = async (op) => {
    setBusy(op._id);
    try { await api.post(`/admin/operators/${op._id}/approve`); toast.success(`${op.businessName} approved`); reload({ silent: true }); } catch (e) { toast.error(e.message); } finally { setBusy(null); }
  };
  const reject = (op) => setModal({
    title: `Reject ${op.businessName}?`, confirm: 'Reject operator', danger: true, required: true, label: 'Reason (shown to the operator)',
    body: 'Their published listings are unpublished. They can update their profile to re-apply.',
    run: async (note) => { await api.post(`/admin/operators/${op._id}/reject`, { note }); toast.success('Operator rejected'); reload({ silent: true }); },
  });
  const verify = (op, decision) => setModal({
    title: decision === 'verified' ? 'Mark as verified?' : 'Reject verification?', confirm: decision === 'verified' ? 'Mark verified' : 'Reject verification',
    danger: decision !== 'verified', required: decision !== 'verified', label: 'Review note',
    body: decision === 'verified' ? 'Only verify after checking the registration details are genuine. A "Verified organiser" badge will appear on their listings.' : 'The verified badge will be removed.',
    run: async (note) => { await api.post(`/admin/operators/${op._id}/verification`, { decision, note }); toast.success('Verification updated'); reload({ silent: true }); },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Operators">Approve operators before their trips go live. Verification is a separate document check.</PageHeader>
      <Tabs tabs={[{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }, { value: '', label: 'All' }]} value={status} onChange={setStatus} className="w-fit max-w-full" />
      {loading && !data ? <Spinner /> : error ? <ErrorState error={error} onRetry={reload} /> : data.length === 0 ? <EmptyState icon={Building2} title="No operators here">Nothing in this queue right now.</EmptyState> : (
        <div className="grid gap-4">
          {data.map((op) => (
            <Card key={op._id} className="p-5">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="size-14 shrink-0 overflow-hidden rounded-2xl bg-peach">
                  {op.logoUrl ? <SafeImage src={op.logoUrl} alt="" className="size-full" /> : <div className="grid size-full place-items-center text-lg font-extrabold text-brand-ink">{op.businessName[0]}</div>}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-extrabold">{op.businessName}</h3>
                    <StatusBadge status={op.status} />
                    {op.verifiedAt && <StatusBadge status="verified" />}
                    {op.isDemo && <Badge>Demo</Badge>}
                  </div>
                  <p className="text-[14px] text-subtle">{op.location} · Owner {op.owner?.name} ({op.owner?.email}) · {op.contactPhone} · Applied {date(op.createdAt)}</p>
                  <p className="text-[14px] leading-relaxed">{op.description}</p>
                  <p className="text-[13px] font-semibold text-subtle">{op.packages.total} package(s), {op.packages.published} published{op.instagram ? ` · ${op.instagram}` : ''}{op.website ? ` · ${op.website}` : ''}</p>
                  {op.statusNote && <p className="text-[13px] text-subtle">Status note: {op.statusNote}</p>}
                  <div className="rounded-xl bg-sand p-3 text-[13px]">
                    {op.verification ? (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <span className="font-bold">Verification</span><StatusBadge status={op.verification.status} />
                        <span>{op.verification.registrationType.toUpperCase()}: <span className="font-mono font-semibold">{op.verification.registrationNumber}</span></span>
                        {op.verification.legalName && <span>{op.verification.legalName}</span>}
                        {op.verification.documentUrl && <a href={op.verification.documentUrl} target="_blank" rel="noreferrer noopener" className="font-bold text-brand-ink underline">Document</a>}
                        {op.verification.notes && <span className="w-full text-subtle">{op.verification.notes}</span>}
                      </div>
                    ) : <span className="text-subtle">No verification details submitted.</span>}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                {op.status !== 'approved' && <Button size="sm" variant="success" loading={busy === op._id} onClick={() => approve(op)}><Check className="size-4" />Approve</Button>}
                {op.status !== 'rejected' && <Button size="sm" variant="danger" onClick={() => reject(op)}><X className="size-4" />Reject</Button>}
                {op.verification && !op.verifiedAt && <Button size="sm" variant="secondary" onClick={() => verify(op, 'verified')}><ShieldCheck className="size-4" />Mark verified</Button>}
                {op.verification && (op.verifiedAt || op.verification.status === 'submitted') && <Button size="sm" variant="ghost" onClick={() => verify(op, 'rejected')}>Reject verification</Button>}
                {op.status === 'approved' && <Button size="sm" variant="ghost" to={`/organisers/${op.slug}`}><ExternalLink className="size-4" />Public page</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
      <ReasonModal state={modal} onClose={() => setModal(null)} />
    </div>
  );
}

function Packages() {
  const [status, setStatus] = useState('published');
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const { data, error, loading, reload } = useAsync(() => api.get('/admin/packages', { params: { status: status || undefined, q: dq || undefined } }), [status, dq]);
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(null);

  const remove = (p) => setModal({
    title: `Remove "${p.title}"?`, confirm: 'Remove listing', danger: true, required: true, label: 'Reason (shown to the operator)',
    body: 'The listing disappears from the marketplace and the operator can no longer edit it.',
    run: async (reason) => { await api.post(`/admin/packages/${p._id}/remove`, { reason }); toast.success('Listing removed'); reload({ silent: true }); },
  });
  const restore = async (p) => {
    setBusy(p._id);
    try { await api.post(`/admin/packages/${p._id}/restore`); toast.success('Restored as unpublished'); reload({ silent: true }); } catch (e) { toast.error(e.message); } finally { setBusy(null); }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Listings">Review packages and remove anything misleading.</PageHeader>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs tabs={[{ value: 'published', label: 'Published' }, { value: 'draft', label: 'Drafts' }, { value: 'unpublished', label: 'Unpublished' }, { value: 'removed', label: 'Removed' }, { value: '', label: 'All' }]} value={status} onChange={setStatus} className="w-fit max-w-full" />
        <Input icon={Search} placeholder="Search titles" value={q} onChange={(e) => setQ(e.target.value)} className="md:w-72" aria-label="Search listings" />
      </div>
      {loading && !data ? <Spinner /> : error ? <ErrorState error={error} onRetry={reload} /> : data.length === 0 ? <EmptyState icon={Package} title="No listings">Nothing matches this filter.</EmptyState> : (
        <div className="grid gap-3">
          {data.map((p) => (
            <Card key={p._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <SafeImage src={p.coverImage} alt="" widths={[200, 320]} sizes="120px" className="aspect-[16/9] w-full rounded-xl sm:w-32 sm:shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><p className="font-extrabold">{p.title}</p><StatusBadge status={p.status} />{p.source === 'ai' && <Badge tone="brand">AI import</Badge>}{p.isDemo && <Badge>Demo</Badge>}</div>
                <p className="text-[13px] text-subtle">{p.operator?.businessName} · {p.destination || 'No destination'} · {p.basePrice != null ? money(p.basePrice, p.currency) : 'No price'} · updated {shortDate(p.updatedAt)}</p>
                {p.removedReason && <p className="text-[13px] text-danger">Removed: {p.removedReason}</p>}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button size="sm" variant="ghost" to={`/trips/${p.slug}`}><ExternalLink className="size-4" />Preview</Button>
                {p.status === 'removed' ? <Button size="sm" variant="secondary" loading={busy === p._id} onClick={() => restore(p)}>Restore</Button> : <Button size="sm" variant="danger" onClick={() => remove(p)}>Remove</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
      <ReasonModal state={modal} onClose={() => setModal(null)} />
    </div>
  );
}

function Bookings() {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const dq = useDebounced(q);
  const { data, error, loading, reload } = useAsync(() => api.get('/admin/bookings', { params: { status: status || undefined, q: dq || undefined } }), [status, dq]);
  return (
    <div className="space-y-6">
      <PageHeader title="Bookings">Read-only view of all booking requests across operators.</PageHeader>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs tabs={[{ value: '', label: 'All' }, { value: 'requested', label: 'Requested' }, { value: 'confirmed', label: 'Confirmed' }, { value: 'rejected', label: 'Declined' }, { value: 'cancelled', label: 'Cancelled' }]} value={status} onChange={setStatus} className="w-fit max-w-full" />
        <Input icon={Search} placeholder="Reference, name or email" value={q} onChange={(e) => setQ(e.target.value)} className="md:w-72" aria-label="Search bookings" />
      </div>
      {loading && !data ? <Spinner /> : error ? <ErrorState error={error} onRetry={reload} /> : data.length === 0 ? <EmptyState icon={Ticket} title="No bookings">No bookings match.</EmptyState> : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-line bg-white md:block">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-sand/70 text-xs font-bold uppercase tracking-wider text-subtle"><tr><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Trip</th><th className="px-4 py-3">Operator</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Status</th></tr></thead>
              <tbody className="divide-y divide-line">
                {data.map((b) => (
                  <tr key={b._id}>
                    <td className="px-4 py-3"><span className="font-mono text-[13px] font-bold">{b.reference}</span><p className="text-xs text-subtle">{dateTime(b.createdAt)}</p></td>
                    <td className="max-w-[220px] px-4 py-3"><p className="truncate font-semibold">{b.package?.title}</p><p className="text-xs text-subtle">{b.departure && shortDate(b.departure.startDate)} · {b.seats} seat(s)</p></td>
                    <td className="px-4 py-3">{b.operator?.businessName}</td>
                    <td className="px-4 py-3"><p>{b.contact.name}</p><p className="text-xs text-subtle">{b.contact.email}</p></td>
                    <td className="num px-4 py-3 text-right font-bold">{money(b.totalAmount, b.currency)}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="grid gap-3 md:hidden">
            {data.map((b) => (
              <li key={b._id} className="rounded-2xl border border-line bg-white p-4 text-[14px]">
                <div className="flex items-center justify-between gap-2"><span className="font-mono text-[13px] font-bold">{b.reference}</span><StatusBadge status={b.status} /></div>
                <p className="mt-1.5 font-bold">{b.package?.title}</p>
                <p className="text-[13px] text-subtle">{b.operator?.businessName} · {b.contact.name} · {b.seats} seat(s) · {money(b.totalAmount, b.currency)}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

const REASONS = { misleading: 'Misleading listing', pricing: 'Pricing issue', safety: 'Safety concern', fraud: 'Suspected fraud', other: 'Other' };

function Reports() {
  const [status, setStatus] = useState('open');
  const { data, error, loading, reload } = useAsync(() => api.get('/admin/reports', { params: { status: status || undefined } }), [status]);
  const [modal, setModal] = useState(null);
  const resolve = (r, next) => setModal({
    title: next === 'resolved' ? 'Resolve report' : 'Dismiss report', confirm: next === 'resolved' ? 'Mark resolved' : 'Dismiss', label: 'Resolution note',
    body: next === 'resolved' ? 'Describe the action you took, e.g. "Listing removed" or "Operator contacted".' : undefined,
    run: async (note) => { await api.post(`/admin/reports/${r._id}/resolve`, { status: next, note }); toast.success(`Report ${next}`); reload({ silent: true }); },
  });
  const targetLink = (r) => {
    if (!r.target) return null;
    if (r.targetType === 'package') return <Link to={`/trips/${r.target.slug}`} className="font-bold text-brand-ink hover:underline">{r.target.title}</Link>;
    if (r.targetType === 'operator') return <Link to={`/organisers/${r.target.slug}`} className="font-bold text-brand-ink hover:underline">{r.target.businessName}</Link>;
    return null;
  };
  return (
    <div className="space-y-6">
      <PageHeader title="Reports">Issues raised by travellers about listings, organisers or bookings.</PageHeader>
      <Tabs tabs={[{ value: 'open', label: 'Open' }, { value: 'resolved', label: 'Resolved' }, { value: 'dismissed', label: 'Dismissed' }, { value: '', label: 'All' }]} value={status} onChange={setStatus} className="w-fit max-w-full" />
      {loading && !data ? <Spinner /> : error ? <ErrorState error={error} onRetry={reload} /> : data.length === 0 ? <EmptyState icon={Flag} title="No reports">Nothing to review here.</EmptyState> : (
        <div className="grid gap-3">
          {data.map((r) => (
            <Card key={r._id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="warning">{REASONS[r.reason]}</Badge><StatusBadge status={r.status} />
                <span className="text-[13px] text-subtle">{r.targetType} · {dateTime(r.createdAt)} · by {r.reporter?.name}</span>
              </div>
              <div className="mt-2 text-[14px]">{targetLink(r) || <span className="text-subtle">Target: {r.targetType} {String(r.targetId).slice(-6)}</span>}</div>
              {r.details && <p className="mt-2 rounded-xl bg-sand p-3 text-[14px]">{r.details}</p>}
              {r.resolutionNote && <p className="mt-2 text-[13px] text-subtle">Resolution: {r.resolutionNote}</p>}
              {r.status === 'open' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => resolve(r, 'resolved')}>Resolve</Button>
                  <Button size="sm" variant="ghost" onClick={() => resolve(r, 'dismissed')}>Dismiss</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      <ReasonModal state={modal} onClose={() => setModal(null)} />
    </div>
  );
}

export default function AdminPage() {
  return (
    <DashboardShell nav={NAV} title="Admin">
      <Routes>
        <Route index element={<Overview />} />
        <Route path="operators" element={<Operators />} />
        <Route path="packages" element={<Packages />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="reports" element={<Reports />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </DashboardShell>
  );
}
