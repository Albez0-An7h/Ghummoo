import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, CalendarPlus, Eye, Lock, Rocket, Save, Sparkles, EyeOff, Users, ChevronRight, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import useAsync from '../../lib/useAsync';
import { money, date, dateRange, toInputDate } from '../../lib/format';
import {
  Button, Input, Textarea, Select, StatusBadge, Card, Spinner, EmptyState, ErrorState, Notice, Modal, Tabs, PageHeader, ListEditor, Badge, cx,
} from '../../components/ui';
import { CategoryPicker, ItineraryEditor, PhotoManager } from './packageForm';

const CURRENCIES = ['INR', 'USD', 'EUR', 'IDR', 'THB', 'AED'];

const toForm = (p = {}) => ({
  title: p.title || '',
  summary: p.summary || '',
  overview: p.overview || '',
  destination: p.destination || '',
  region: p.region || '',
  country: p.country || 'India',
  startLocation: p.startLocation || '',
  categories: p.categories || [],
  durationDays: p.durationDays ?? '',
  durationNights: p.durationNights ?? '',
  basePrice: p.basePrice ?? '',
  currency: p.currency || 'INR',
  groupSize: p.groupSize || '',
  highlights: p.highlights || [],
  itinerary: (p.itinerary || []).map((d) => ({ title: d.title || '', description: d.description || '', meals: d.meals || '', stay: d.stay || '' })),
  accommodation: p.accommodation || '',
  transport: p.transport || '',
  meals: p.meals || '',
  pickupInfo: p.pickupInfo || '',
  inclusions: p.inclusions || [],
  exclusions: p.exclusions || [],
  cancellationPolicy: p.cancellationPolicy || '',
  coverImage: p.coverImage || '',
  images: p.images || [],
});

const numOrNull = (v) => (v === '' || v == null ? null : Number(v));

const toPayload = (f) => ({
  ...f,
  durationDays: numOrNull(f.durationDays),
  durationNights: numOrNull(f.durationNights),
  basePrice: numOrNull(f.basePrice),
  itinerary: f.itinerary.filter((d) => d.title.trim()),
});

function validate(f) {
  const e = {};
  if (f.title.trim().length < 4) e.title = 'Title must be at least 4 characters';
  if (f.summary.length > 300) e.summary = 'Keep the summary under 300 characters';
  for (const k of ['durationDays', 'durationNights', 'basePrice']) {
    if (f[k] !== '' && (!Number.isFinite(Number(f[k])) || Number(f[k]) < 0)) e[k] = 'Must be 0 or more';
  }
  if (f.durationDays !== '' && Number(f.durationDays) < 1) e.durationDays = 'At least 1 day';
  if (f.durationDays !== '' && f.durationNights !== '' && Number(f.durationNights) > Number(f.durationDays)) e.durationNights = 'Nights can’t exceed days';
  if (f.itinerary.some((d) => !d.title.trim() && (d.description.trim() || d.meals.trim() || d.stay.trim()))) e.itinerary = 'Every itinerary day needs a title';
  return e;
}

const addDays = (iso, n) => {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toInputDate(d);
};

export default function PackageEditorPage() {
  const { id } = useParams();
  if (!id) return <CreatePackage />;
  return <EditPackageLoader key={id} id={id} />;
}

/* ------------------------------------ Create ------------------------------------ */

function CreatePackage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(toForm());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) { toast.error('Please fix the highlighted fields'); return; }
    setSaving(true);
    try {
      const pkg = await api.post('/operator/packages', toPayload(form));
      toast.success('Draft created. Add itinerary, photos and departures next.');
      navigate(`/operator/packages/${pkg._id}`, { replace: true });
    } catch (err) {
      toast.error(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/operator/packages" className="inline-flex items-center gap-1.5 text-sm font-bold text-subtle hover:text-ink"><ArrowLeft className="size-4" />All packages</Link>
      <PageHeader eyebrow="New package" title="Create a trip package">
        Start with the basics. It's saved as a draft, and you can add the itinerary, photos and departures next.
      </PageHeader>
      <Notice tone="brand" title="Have an Instagram caption already?" action={<Button size="sm" variant="soft" to="/operator/studio"><Sparkles className="size-4" />Use AI Studio</Button>}>
        Paste it into AI Package Studio and we'll structure it for you to review.
      </Notice>
      <Card as="form" onSubmit={submit} className="space-y-5 p-5 sm:p-6" noValidate>
        <Input label="Package title" required value={form.title} onChange={set('title')} error={errors.title} placeholder="e.g. Manali & Kasol Escape" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Destination" value={form.destination} onChange={set('destination')} placeholder="e.g. Manali & Kasol" />
          <Input label="Starting city" value={form.startLocation} onChange={set('startLocation')} placeholder="e.g. Delhi" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Input label="Days" type="number" min="1" inputMode="numeric" value={form.durationDays} onChange={set('durationDays')} error={errors.durationDays} />
          <Input label="Nights" type="number" min="0" inputMode="numeric" value={form.durationNights} onChange={set('durationNights')} error={errors.durationNights} />
          <Input className="col-span-2 sm:col-span-1" label="Price per person (₹)" type="number" min="0" inputMode="numeric" value={form.basePrice} onChange={set('basePrice')} error={errors.basePrice} />
        </div>
        <CategoryPicker value={form.categories} onChange={(categories) => setForm((f) => ({ ...f, categories }))} />
        <Textarea label="Short summary" rows={2} value={form.summary} onChange={set('summary')} error={errors.summary} hint={`${form.summary.length}/300 · shown on trip cards`} />
        <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-5">
          <Button variant="ghost" to="/operator/packages">Cancel</Button>
          <Button type="submit" loading={saving}>Create draft</Button>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------------- Edit ------------------------------------- */

function EditPackageLoader({ id }) {
  const { data, error, loading, reload } = useAsync(() => api.get(`/operator/packages/${id}`), [id]);
  if (loading && !data) return <Spinner label="Loading package" />;
  if (error && !data) return <ErrorState error={error} onRetry={reload} />;
  return <Editor key={data.package._id} data={data} reload={reload} />;
}

const TABS = [
  { value: 'basics', label: 'Basics' },
  { value: 'itinerary', label: 'Itinerary' },
  { value: 'details', label: 'Details & policies' },
  { value: 'photos', label: 'Photos' },
  { value: 'departures', label: 'Departures' },
];

function Editor({ data, reload }) {
  const ctx = useOutletContext() || {};
  const [params, setParams] = useSearchParams();
  const tab = TABS.some((t) => t.value === params.get('tab')) ? params.get('tab') : 'basics';
  const setTab = (v) => setParams((p) => { p.set('tab', v); return p; }, { replace: true });

  const pkg = data.package;
  const [form, setForm] = useState(() => toForm(pkg));
  const [saved, setSaved] = useState(() => JSON.stringify(toForm(pkg)));
  const [status, setStatus] = useState(pkg.status);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(null);
  const [aiDismissed, setAiDismissed] = useState(false);

  const readOnly = status === 'removed';
  const dirty = JSON.stringify(form) !== saved;
  const operatorStatus = data.operatorStatus || ctx.operator?.status;
  const approved = operatorStatus === 'approved';

  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setVal = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async ({ quiet } = {}) => {
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error('Please fix the highlighted fields');
      if (errs.itinerary) setTab('itinerary'); else setTab('basics');
      return false;
    }
    setBusy('save');
    try {
      const updated = await api.put(`/operator/packages/${pkg._id}`, toPayload(form));
      const next = toForm(updated);
      setForm(next);
      setSaved(JSON.stringify(next));
      setStatus(updated.status);
      if (!quiet) toast.success('Changes saved');
      await reload({ silent: true });
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const publish = async () => {
    if (dirty && !(await save({ quiet: true }))) return;
    setBusy('publish');
    try {
      const updated = await api.post(`/operator/packages/${pkg._id}/publish`);
      setStatus(updated.status);
      toast.success('Your trip is live on Ghumo AI');
      await reload({ silent: true });
    } catch (err) {
      toast.error(err.message);
      await reload({ silent: true });
    } finally {
      setBusy(null);
    }
  };

  const unpublish = async () => {
    setBusy('unpublish');
    try {
      const updated = await api.post(`/operator/packages/${pkg._id}/unpublish`);
      setStatus(updated.status);
      toast.success('Trip unpublished. Travellers can no longer see it.');
      await reload({ silent: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const blockers = data.publishBlockers || [];
  const aiWarnings = pkg.aiWarnings || [];
  const tabs = TABS.map((t) => (t.value === 'departures' ? { ...t, count: data.departures.length } : t));

  return (
    <div className="space-y-6">
      <Link to="/operator/packages" className="inline-flex items-center gap-1.5 text-sm font-bold text-subtle hover:text-ink"><ArrowLeft className="size-4" />All packages</Link>

      <div className="sticky top-[104px] z-30 -mx-4 border-b border-line bg-ivory/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-0 lg:-mx-10 lg:px-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={status} />
              {pkg.source === 'ai' && <Badge tone="brand" icon={Sparkles}>From AI Studio</Badge>}
              {dirty && <Badge tone="warning">Unsaved changes</Badge>}
            </div>
            <h1 className="mt-1.5 truncate text-xl font-extrabold sm:text-2xl">{form.title || 'Untitled package'}</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" href={`/trips/${pkg.slug}`} target="_blank" rel="noreferrer"><Eye className="size-4" />Preview</Button>
            {!readOnly && <Button variant="secondary" size="sm" onClick={() => save()} loading={busy === 'save'} disabled={!dirty || !!busy}><Save className="size-4" />Save</Button>}
            {!readOnly && (status === 'published'
              ? <Button variant="dark" size="sm" onClick={unpublish} loading={busy === 'unpublish'} disabled={!!busy}><EyeOff className="size-4" />Unpublish</Button>
              : <Button size="sm" onClick={publish} loading={busy === 'publish'} disabled={!approved || !!busy} title={approved ? undefined : 'Your operator profile must be approved first'}><Rocket className="size-4" />Publish</Button>)}
          </div>
        </div>
      </div>

      {readOnly && (
        <Notice tone="danger" title="Removed by moderators">
          {pkg.removedReason || 'This listing was removed for breaking marketplace guidelines.'} This page is read-only. Contact the Ghumo team if you think this is a mistake.
        </Notice>
      )}
      {!readOnly && !approved && (
        <Notice tone="warning" title={operatorStatus === 'rejected' ? 'Your operator application needs changes' : 'Publishing unlocks after approval'}>
          You can build and save drafts now. The Ghumo team reviews every organiser before their trips go live. <Link className="font-bold underline" to="/operator/profile">Check your profile status</Link>
        </Notice>
      )}
      {!readOnly && status !== 'published' && blockers.length > 0 && (
        <Notice tone="info" title="Add these before publishing">
          <ul className="mt-1.5 grid gap-1 sm:grid-cols-2">
            {blockers.map((b) => <li key={b} className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-brand" aria-hidden />{b}</li>)}
          </ul>
          {dirty && <p className="mt-2 text-[13px] text-subtle">This list updates when you save.</p>}
        </Notice>
      )}
      {!readOnly && status !== 'published' && blockers.length === 0 && approved && (
        <Notice tone="success" title="Ready to publish">Everything travellers need is in place.</Notice>
      )}
      {aiWarnings.length > 0 && !aiDismissed && !readOnly && (
        <Notice tone="warning" title="Check these AI notes" action={<button type="button" onClick={() => setAiDismissed(true)} className="text-sm font-bold underline">Dismiss</button>}>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">{aiWarnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </Notice>
      )}

      <Tabs tabs={tabs} value={tab} onChange={setTab} />

      {tab === 'basics' && (
        <Card className="space-y-5 p-5 sm:p-6">
          <Input label="Package title" required value={form.title} onChange={set('title')} error={errors.title} disabled={readOnly} />
          <Textarea label="Short summary" rows={2} value={form.summary} onChange={set('summary')} error={errors.summary} disabled={readOnly} hint={`${form.summary.length}/300 · shown on trip cards`} />
          <Textarea label="Overview" rows={5} value={form.overview} onChange={set('overview')} disabled={readOnly} hint="What makes this trip special, who it suits and the pace" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Destination" value={form.destination} onChange={set('destination')} disabled={readOnly} placeholder="e.g. Spiti Valley" />
            <Input label="Region / state" value={form.region} onChange={set('region')} disabled={readOnly} placeholder="e.g. Himachal Pradesh" />
            <Input label="Country" value={form.country} onChange={set('country')} disabled={readOnly} />
            <Input label="Starting city" value={form.startLocation} onChange={set('startLocation')} disabled={readOnly} placeholder="e.g. Delhi" />
          </div>
          <CategoryPicker value={form.categories} onChange={setVal('categories')} disabled={readOnly} />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <Input label="Days" type="number" min="1" inputMode="numeric" value={form.durationDays} onChange={set('durationDays')} error={errors.durationDays} disabled={readOnly} />
            <Input label="Nights" type="number" min="0" inputMode="numeric" value={form.durationNights} onChange={set('durationNights')} error={errors.durationNights} disabled={readOnly} />
            <Input label="Base price / person" type="number" min="0" inputMode="numeric" value={form.basePrice} onChange={set('basePrice')} error={errors.basePrice} disabled={readOnly} />
            <Select label="Currency" value={form.currency} onChange={set('currency')} disabled={readOnly}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Input className="col-span-2 lg:col-span-1" label="Group size" value={form.groupSize} onChange={set('groupSize')} disabled={readOnly} placeholder="12–24 travellers" />
          </div>
          {readOnly ? null : <ListEditor label="Highlights" value={form.highlights} onChange={setVal('highlights')} placeholder="e.g. Sunrise at Key Monastery" />}
        </Card>
      )}

      {tab === 'itinerary' && (
        <div className="space-y-3">
          {errors.itinerary && <Notice tone="danger">{errors.itinerary}</Notice>}
          <ItineraryEditor value={form.itinerary} onChange={setVal('itinerary')} disabled={readOnly} />
        </div>
      )}

      {tab === 'details' && (
        <Card className="space-y-5 p-5 sm:p-6">
          <Textarea label="Accommodation" rows={2} value={form.accommodation} onChange={set('accommodation')} disabled={readOnly} hint="Hotel category, sharing basis, facilities" />
          <Textarea label="Transport" rows={2} value={form.transport} onChange={set('transport')} disabled={readOnly} hint="Vehicle type, route, what's covered" />
          <Input label="Meals" value={form.meals} onChange={set('meals')} disabled={readOnly} placeholder="4 breakfasts and 4 dinners" />
          <Textarea label="Pickup & departure information" rows={2} value={form.pickupInfo} onChange={set('pickupInfo')} disabled={readOnly} hint="Exact meeting point and reporting time" />
          {!readOnly && (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <ListEditor label="What's included" value={form.inclusions} onChange={setVal('inclusions')} placeholder="e.g. 2 nights hotel stay" />
              <ListEditor label="What's excluded" value={form.exclusions} onChange={setVal('exclusions')} placeholder="e.g. Adventure activities" hint="Shown to travellers before they book" />
            </div>
          )}
          {readOnly && (
            <div className="grid gap-5 text-[14px] md:grid-cols-2">
              <div><p className="font-bold">Included</p><ul className="mt-1 list-disc pl-5 text-subtle">{form.inclusions.map((x) => <li key={x}>{x}</li>)}</ul></div>
              <div><p className="font-bold">Excluded</p><ul className="mt-1 list-disc pl-5 text-subtle">{form.exclusions.map((x) => <li key={x}>{x}</li>)}</ul></div>
            </div>
          )}
          <Textarea label="Cancellation & refund policy" required rows={4} value={form.cancellationPolicy} onChange={set('cancellationPolicy')} disabled={readOnly} hint="Required to publish. Travellers see this before booking." />
        </Card>
      )}

      {tab === 'photos' && (
        <PhotoManager cover={form.coverImage} images={form.images} disabled={readOnly} onChange={({ coverImage, images }) => setForm((f) => ({ ...f, coverImage, images }))} />
      )}

      {tab === 'departures' && (
        <DeparturesPanel pkg={pkg} form={form} departures={data.departures} reload={reload} readOnly={readOnly} />
      )}

      {dirty && !readOnly && (
        <div className="sticky bottom-4 z-30 flex justify-center">
          <div className="flex items-center gap-3 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-lift">
            <span>You have unsaved changes</span>
            <Button size="sm" onClick={() => save()} loading={busy === 'save'}>Save</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Departures ---------------------------------- */

function DeparturesPanel({ pkg, form, departures, reload, readOnly }) {
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const now = useMemo(() => new Date(), []);

  const act = async (dep, fn, msg) => {
    setBusyId(dep._id);
    try { await fn(); toast.success(msg); await reload({ silent: true }); } catch (err) { toast.error(err.message); } finally { setBusyId(null); }
  };

  const upcoming = departures.filter((d) => new Date(d.endDate) >= now);
  const past = departures.filter((d) => new Date(d.endDate) < now);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[15px] text-subtle">Each departure has its own dates, price and seats. Travellers book a specific departure.</p>
        {!readOnly && <Button onClick={() => setOpen(true)}><CalendarPlus className="size-4" />Add departure</Button>}
      </div>

      {departures.length === 0 ? (
        <EmptyState icon={CalendarPlus} title="No departures yet" action={!readOnly && <Button onClick={() => setOpen(true)}>Add first departure</Button>}>
          You need at least one upcoming departure to publish.
        </EmptyState>
      ) : (
        <ul className="space-y-3">
          {[...upcoming, ...past].map((d) => {
            const c = d.bookingCounts || {};
            const hasBookings = Object.values(c).some((x) => x.count > 0);
            const isPast = new Date(d.endDate) < now;
            const booked = d.totalCapacity - d.seatsAvailable;
            return (
              <li key={d._id}>
                <Card className={cx('p-4 sm:p-5', isPast && 'opacity-70')}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[17px] font-extrabold">{dateRange(d.startDate, d.endDate)}</p>
                        {isPast ? <Badge>Completed</Badge> : <StatusBadge status={d.status} />}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-subtle">
                        <span className="num font-bold text-ink">{money(d.price, pkg.currency)} / person</span>
                        <span className="num">{d.seatsAvailable} of {d.totalCapacity} seats free</span>
                        {d.bookingDeadline && <span>Book by {date(d.bookingDeadline)}</span>}
                        {d.pickupPoint && <span className="truncate">{d.pickupPoint}</span>}
                      </div>
                      <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-sand" aria-hidden>
                        <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (booked / d.totalCapacity) * 100)}%` }} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {c.requested?.count > 0 && <Badge tone="warning">{c.requested.count} awaiting confirmation</Badge>}
                        {c.confirmed?.count > 0 && <Badge tone="success">{c.confirmed.count} confirmed · {c.confirmed.seats} seats</Badge>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" to={`/operator/departures/${d._id}`}><Users className="size-4" />Manifest<ChevronRight className="size-4" /></Button>
                      {!readOnly && !isPast && d.status !== 'cancelled' && (
                        d.status === 'open'
                          ? <Button size="sm" variant="ghost" loading={busyId === d._id} onClick={() => act(d, () => api.put(`/operator/departures/${d._id}`, { status: 'closed' }), 'Bookings closed for this departure')}><Lock className="size-4" />Close</Button>
                          : <Button size="sm" variant="ghost" loading={busyId === d._id} onClick={() => act(d, () => api.put(`/operator/departures/${d._id}`, { status: 'open' }), 'Departure reopened')}>Reopen</Button>
                      )}
                      {!readOnly && !hasBookings && (
                        <Button size="sm" variant="danger" disabled={busyId === d._id} onClick={() => { if (window.confirm('Delete this departure?')) act(d, () => api.delete(`/operator/departures/${d._id}`), 'Departure deleted'); }} aria-label="Delete departure"><Trash2 className="size-4" /></Button>
                      )}
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {open && <AddDepartureModal pkg={pkg} form={form} onClose={() => setOpen(false)} onCreated={async () => { setOpen(false); await reload({ silent: true }); }} />}
    </div>
  );
}

function AddDepartureModal({ pkg, form, onClose, onCreated }) {
  const days = Number(form.durationDays) || pkg.durationDays || null;
  const [d, setD] = useState({ startDate: '', endDate: '', price: form.basePrice ?? pkg.basePrice ?? '', totalCapacity: '', bookingDeadline: '', pickupPoint: '', reportingTime: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const today = toInputDate(new Date());

  const onStart = (e) => {
    const startDate = e.target.value;
    setD((x) => ({ ...x, startDate, endDate: days && startDate ? addDays(startDate, days - 1) : x.endDate }));
  };
  const set = (k) => (e) => setD((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!d.startDate) errs.startDate = 'Required';
    else if (d.startDate < today) errs.startDate = 'Must be today or later';
    if (!d.endDate) errs.endDate = 'Required';
    else if (d.startDate && d.endDate < d.startDate) errs.endDate = 'Must be on or after departure';
    if (d.price === '' || Number(d.price) < 0) errs.price = 'Enter a price';
    if (!Number.isInteger(Number(d.totalCapacity)) || Number(d.totalCapacity) < 1 || Number(d.totalCapacity) > 500) errs.totalCapacity = 'Between 1 and 500';
    if (d.bookingDeadline && d.startDate && d.bookingDeadline > d.startDate) errs.bookingDeadline = 'Must be before departure';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      await api.post(`/operator/packages/${pkg._id}/departures`, {
        ...d, price: Number(d.price), totalCapacity: Number(d.totalCapacity), bookingDeadline: d.bookingDeadline || null,
      });
      toast.success('Departure added');
      await onCreated();
    } catch (err) {
      toast.error(err.message);
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Add a departure" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="add-departure" loading={saving}>Add departure</Button></>}>
      <form id="add-departure" onSubmit={submit} className="grid gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Departure date" type="date" required min={today} value={d.startDate} onChange={onStart} error={errors.startDate} />
          <Input label="Return date" type="date" required min={d.startDate || today} value={d.endDate} onChange={set('endDate')} error={errors.endDate} hint={days ? `Auto-filled for ${days} days` : undefined} />
          <Input label={`Price per person (${pkg.currency || 'INR'})`} type="number" min="0" inputMode="numeric" required value={d.price} onChange={set('price')} error={errors.price} />
          <Input label="Total seats" type="number" min="1" max="500" inputMode="numeric" required value={d.totalCapacity} onChange={set('totalCapacity')} error={errors.totalCapacity} />
          <Input label="Booking deadline" type="date" min={today} max={d.startDate || undefined} value={d.bookingDeadline} onChange={set('bookingDeadline')} error={errors.bookingDeadline} hint="Optional. Defaults to the departure date." />
          <Input label="Reporting time" value={d.reportingTime} onChange={set('reportingTime')} placeholder="6:30 PM" />
        </div>
        <Input label="Pickup point" value={d.pickupPoint} onChange={set('pickupPoint')} placeholder="Majnu ka Tilla, New Delhi" />
      </form>
    </Modal>
  );
}
