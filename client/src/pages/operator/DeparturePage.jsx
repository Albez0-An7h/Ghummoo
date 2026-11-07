import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Download, Pencil, Pin, Trash2, Megaphone, Users, CalendarDays, MessagesSquare } from 'lucide-react';
import api from '../../lib/api';
import useAsync from '../../lib/useAsync';
import { money, dateRange, date, dateTime, toInputDate } from '../../lib/format';
import { Button, Card, Badge, Input, Textarea, Select, StatusBadge, Spinner, ErrorState, Modal, Notice } from '../../components/ui';
import { apiUrl, ANNOUNCEMENT_KINDS, GENDER_LABELS } from './_shared';

function EditDeparture({ dep, open, onClose, onSaved }) {
  const [form, setForm] = useState(() => ({
    startDate: toInputDate(dep.startDate), endDate: toInputDate(dep.endDate), price: String(dep.price), totalCapacity: String(dep.totalCapacity),
    bookingDeadline: toInputDate(dep.bookingDeadline), pickupPoint: dep.pickupPoint || '', reportingTime: dep.reportingTime || '', status: dep.status,
  }));
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const save = async () => {
    if (!form.startDate || !form.endDate) { setErr('Departure and return dates are required'); return; }
    if (form.endDate < form.startDate) { setErr('Return date must be on or after the departure date'); return; }
    if (form.bookingDeadline && form.bookingDeadline > form.startDate) { setErr('Booking deadline must be before the departure date'); return; }
    if (!(Number(form.price) >= 0) || form.price === '') { setErr('Enter a valid price'); return; }
    if (!Number.isInteger(Number(form.totalCapacity)) || Number(form.totalCapacity) < 1) { setErr('Capacity must be at least 1'); return; }
    setErr('');
    setSaving(true);
    try {
      await api.put(`/operator/departures/${dep._id}`, { ...form, price: Number(form.price), totalCapacity: Number(form.totalCapacity), bookingDeadline: form.bookingDeadline || null });
      toast.success('Departure updated');
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title="Edit departure" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={saving} onClick={save}>Save changes</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        {err && <Notice tone="danger" className="sm:col-span-2">{err}</Notice>}
        <Input label="Departure date" type="date" value={form.startDate} onChange={set('startDate')} required />
        <Input label="Return date" type="date" value={form.endDate} onChange={set('endDate')} required />
        <Input label="Price per person (₹)" type="number" min="0" value={form.price} onChange={set('price')} hint="Applies to new bookings only" required />
        <Input label="Total capacity" type="number" min="1" value={form.totalCapacity} onChange={set('totalCapacity')} hint={`${dep.totalCapacity - dep.seatsAvailable} seat(s) already held`} required />
        <Input label="Booking deadline" type="date" value={form.bookingDeadline} onChange={set('bookingDeadline')} />
        <Select label="Status" value={form.status} onChange={set('status')}>
          <option value="open">Open for bookings</option><option value="closed">Closed (no new bookings)</option><option value="cancelled">Cancelled</option>
        </Select>
        <Input label="Pickup point" value={form.pickupPoint} onChange={set('pickupPoint')} className="sm:col-span-2" />
        <Input label="Reporting time" value={form.reportingTime} onChange={set('reportingTime')} placeholder="e.g. 6:30 PM" />
      </div>
    </Modal>
  );
}

function Composer({ depId, onPosted }) {
  const [form, setForm] = useState({ kind: 'announcement', title: '', body: '', pinned: false });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    if (form.title.trim().length < 3 || form.body.trim().length < 3) { toast.error('Add a title and a message'); return; }
    setSaving(true);
    try {
      await api.post(`/operator/departures/${depId}/announcements`, form);
      toast.success('Update posted');
      setForm({ kind: 'announcement', title: '', body: '', pinned: false });
      onPosted();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
        <Select label="Type" value={form.kind} onChange={set('kind')}>{ANNOUNCEMENT_KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
        <Input label="Title" value={form.title} onChange={set('title')} maxLength={140} placeholder="e.g. Pickup point confirmed" />
      </div>
      <Textarea label="Message" rows={4} value={form.body} onChange={set('body')} maxLength={4000} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.pinned} onChange={set('pinned')} className="size-4 accent-[#F26A2E]" />Pin to top</label>
        <Button type="submit" size="sm" loading={saving}><Megaphone className="size-4" />Post update</Button>
      </div>
    </form>
  );
}

export default function DeparturePage() {
  const { id } = useParams();
  const { data, error, loading, reload } = useAsync(() => api.get(`/operator/departures/${id}`), [id]);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(null);

  if (loading && !data) return <Spinner />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  const { departure: dep, bookings, announcements } = data;
  const booked = dep.totalCapacity - dep.seatsAvailable;
  const active = bookings.filter((b) => ['requested', 'confirmed'].includes(b.status));
  const manifest = active.flatMap((b) => b.travelers.map((t) => ({ ...t, booking: b })));

  const removeAnnouncement = async (a) => {
    setDeleting(a._id);
    try {
      await api.delete(`/operator/announcements/${a._id}`);
      toast.success('Update deleted');
      reload({ silent: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <Link to={`/operator/packages/${dep.package?._id}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-subtle hover:text-ink"><ArrowLeft className="size-4" />Back to package</Link>
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><StatusBadge status={dep.status} /><span className="text-sm text-subtle">{money(dep.price)} /person</span></div>
            <h1 className="mt-2 text-2xl font-extrabold">{dep.package?.title}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-[15px] text-subtle"><CalendarDays className="size-4" />{dateRange(dep.startDate, dep.endDate)}{dep.bookingDeadline && ` · book by ${date(dep.bookingDeadline)}`}</p>
            {(dep.pickupPoint || dep.reportingTime) && <p className="mt-1 text-[14px] text-subtle">{[dep.pickupPoint, dep.reportingTime && `Reporting ${dep.reportingTime}`].filter(Boolean).join(' · ')}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}><Pencil className="size-4" />Edit departure</Button>
            <Button variant="ghost" size="sm" to={`/operator/bookings?departure=${dep._id}`}>Bookings</Button>
            <Button size="sm" to={`/operator/groups/${dep._id}`}><MessagesSquare className="size-4" />Trip group</Button>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex justify-between text-sm font-semibold"><span>{booked} of {dep.totalCapacity} seats held</span><span className="text-subtle">{dep.seatsAvailable} available</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-sand"><div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (booked / dep.totalCapacity) * 100)}%` }} /></div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-extrabold"><Users className="size-5 text-brand" />Traveller manifest <span className="num text-subtle">({manifest.length})</span></h2>
          <Button variant="secondary" size="sm" href={apiUrl('/operator/bookings/export.csv', { departure: dep._id })}><Download className="size-4" />Export CSV</Button>
        </div>
        {manifest.length === 0 ? <p className="mt-4 text-[14px] text-subtle">No travellers yet on this departure.</p> : (
          <>
            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="w-full text-left text-[14px]">
                <thead className="text-xs font-bold uppercase tracking-wider text-subtle"><tr className="border-b border-line"><th className="py-2 pr-3">Traveller</th><th className="py-2 pr-3">Age</th><th className="py-2 pr-3">Gender</th><th className="py-2 pr-3">Phone</th><th className="py-2 pr-3">Emergency</th><th className="py-2 pr-3">Booking</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {manifest.map((t, i) => (
                    <tr key={`${t.booking._id}-${i}`}>
                      <td className="py-2.5 pr-3 font-semibold">{t.fullName}</td><td className="num py-2.5 pr-3">{t.age}</td><td className="py-2.5 pr-3">{GENDER_LABELS[t.gender]}</td>
                      <td className="py-2.5 pr-3">{t.phone || '—'}</td><td className="py-2.5 pr-3">{t.emergencyContact || '—'}</td>
                      <td className="py-2.5 pr-3"><Link to={`/operator/bookings?focus=${t.booking._id}`} className="font-mono text-[13px] font-bold hover:text-brand-ink">{t.booking.reference}</Link> <StatusBadge status={t.booking.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="mt-4 grid gap-2 md:hidden">
              {manifest.map((t, i) => (
                <li key={`${t.booking._id}-${i}`} className="rounded-xl bg-sand/70 p-3 text-[14px]">
                  <div className="flex items-center justify-between gap-2"><span className="font-bold">{t.fullName}</span><StatusBadge status={t.booking.status} /></div>
                  <p className="text-subtle">{t.age} yrs{GENDER_LABELS[t.gender] !== '—' ? ` · ${GENDER_LABELS[t.gender]}` : ''}{t.phone ? ` · ${t.phone}` : ''}</p>
                  <Link to={`/operator/bookings?focus=${t.booking._id}`} className="font-mono text-[12px] font-bold text-brand-ink">{t.booking.reference}</Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-lg font-extrabold"><Megaphone className="size-5 text-brand" />Trip updates board</h2>
        <p className="mt-1 text-[14px] text-subtle">Travellers with a confirmed booking on this departure see these updates on their trip page. Nobody else can.</p>
        <div className="mt-5 rounded-2xl border border-line p-4"><Composer depId={dep._id} onPosted={() => reload({ silent: true })} /></div>
        {announcements.length === 0 ? <p className="mt-5 text-[14px] text-subtle">No updates posted yet.</p> : (
          <ul className="mt-5 space-y-3">
            {announcements.map((a) => (
              <li key={a._id} className="rounded-2xl border border-line bg-ivory/50 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  {a.pinned && <Badge tone="brand" icon={Pin}>Pinned</Badge>}
                  <Badge>{ANNOUNCEMENT_KINDS.find(([v]) => v === a.kind)?.[1]}</Badge>
                  <span className="text-[13px] text-subtle">{dateTime(a.createdAt)}</span>
                  <Button size="sm" variant="ghost" className="ml-auto text-danger" loading={deleting === a._id} onClick={() => removeAnnouncement(a)} aria-label="Delete update"><Trash2 className="size-4" /></Button>
                </div>
                <p className="mt-2 font-bold">{a.title}</p>
                <p className="mt-1 whitespace-pre-line text-[14px] text-ink/85">{a.body}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editing && <EditDeparture dep={dep} open={editing} onClose={() => setEditing(false)} onSaved={() => reload({ silent: true })} />}
    </div>
  );
}
