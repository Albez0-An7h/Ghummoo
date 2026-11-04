import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Search, Download, Ticket, Phone, Mail, Check, X, Wallet } from 'lucide-react';
import api from '../../lib/api';
import useAsync from '../../lib/useAsync';
import { money, shortDate, dateRange, dateTime } from '../../lib/format';
import { Button, Card, Input, Textarea, Select, StatusBadge, Spinner, ErrorState, EmptyState, PageHeader, Tabs, Modal, Notice } from '../../components/ui';
import { useDebounced, apiUrl, PAYMENT_METHODS, GENDER_LABELS } from './_shared';

const STATUSES = [['', 'All'], ['requested', 'Requests'], ['confirmed', 'Confirmed'], ['rejected', 'Declined'], ['cancelled', 'Cancelled']];

function PaymentForm({ booking, onDone }) {
  const paid = (booking.payments || []).reduce((s, p) => s + p.amount, 0);
  const remaining = booking.totalAmount - paid;
  const [form, setForm] = useState({ amount: remaining > 0 ? String(remaining) : '', method: 'upi', externalReference: '', note: '' });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  if (remaining <= 0) return <Notice tone="success">Recorded payments cover the full booking amount.</Notice>;
  const submit = async (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) { toast.error('Enter the amount received'); return; }
    if (amount > remaining) { toast.error(`Amount can't exceed the outstanding ${money(remaining, booking.currency)}`); return; }
    setSaving(true);
    try {
      await api.post(`/operator/bookings/${booking._id}/payments`, { ...form, amount });
      toast.success('Payment recorded');
      await onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-line p-4" noValidate>
      <div>
        <p className="font-bold">Record an offline payment</p>
        <p className="text-[13px] text-subtle">Ghumo doesn't process payments. Use this to log money you received directly (UPI, bank transfer, cash). Outstanding: {money(remaining, booking.currency)}.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Amount received" type="number" inputMode="numeric" min="1" value={form.amount} onChange={set('amount')} required />
        <Select label="Method" value={form.method} onChange={set('method')}>{PAYMENT_METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select>
        <Input label="Transaction reference" value={form.externalReference} onChange={set('externalReference')} placeholder="UPI ref / UTR" />
        <Input label="Note" value={form.note} onChange={set('note')} />
      </div>
      <div className="flex justify-end"><Button type="submit" size="sm" loading={saving}><Wallet className="size-4" />Save payment record</Button></div>
    </form>
  );
}

function BookingModal({ id, onClose, onChanged }) {
  const { data: b, error, loading, reload } = useAsync(() => (id ? api.get(`/operator/bookings/${id}`) : Promise.resolve(null)), [id]);
  const [mode, setMode] = useState(null); // 'confirm' | 'reject'
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);


  const decide = async () => {
    if (mode === 'reject' && note.trim().length < 3) { toast.error('Please tell the traveller why'); return; }
    setSaving(true);
    try {
      await api.post(`/operator/bookings/${id}/${mode}`, { note: note.trim() });
      toast.success(mode === 'confirm' ? 'Booking confirmed' : 'Booking declined and seats released');
      setMode(null);
      setNote('');
      await reload({ silent: true });
      onChanged();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const footer = b && b.status === 'requested' && !mode ? (
    <>
      <Button variant="danger" onClick={() => setMode('reject')}><X className="size-4" />Decline</Button>
      <Button variant="success" onClick={() => setMode('confirm')}><Check className="size-4" />Confirm booking</Button>
    </>
  ) : b && b.status === 'confirmed' && !mode ? (
    <Button variant="danger" onClick={() => setMode('reject')}>Cancel confirmed booking</Button>
  ) : mode ? (
    <>
      <Button variant="ghost" onClick={() => { setMode(null); setNote(''); }}>Back</Button>
      <Button variant={mode === 'confirm' ? 'success' : 'danger'} loading={saving} onClick={decide}>{mode === 'confirm' ? 'Confirm booking' : 'Decline booking'}</Button>
    </>
  ) : null;

  return (
    <Modal open={Boolean(id)} onClose={onClose} title={b ? `Booking ${b.reference}` : 'Booking'} size="lg" footer={footer}>
      {loading && !b ? <Spinner /> : error ? <ErrorState error={error} onRetry={reload} /> : b && (
        <div className="space-y-5 text-[14px]">
          <div className="flex flex-wrap items-center gap-2"><StatusBadge status={b.status} /><span className="text-subtle">Requested {dateTime(b.createdAt)}</span></div>
          {mode && (
            <Card className="space-y-3 bg-sand/60 p-4">
              <p className="font-bold">{mode === 'confirm' ? 'Confirm this booking?' : b.status === 'confirmed' ? 'Cancel this confirmed booking?' : 'Decline this request?'}</p>
              <p className="text-subtle">{mode === 'confirm' ? 'The traveller will see the booking as confirmed and get access to the trip updates board.' : `The ${b.seats} held seat(s) go back on sale.`}</p>
              <Textarea label={mode === 'confirm' ? 'Note to traveller (optional)' : 'Reason (shown to the traveller)'} required={mode === 'reject'} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </Card>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-subtle">Trip</p>
              <p className="mt-1 font-bold">{b.package?.title}</p>
              <p className="text-subtle">{b.departure && dateRange(b.departure.startDate, b.departure.endDate)}</p>
              <p className="num mt-2 font-extrabold">{b.seats} × {money(b.pricePerSeat, b.currency)} = {money(b.totalAmount, b.currency)}</p>
              {b.departure && <Link to={`/operator/departures/${b.departure._id}`} className="mt-2 inline-block text-sm font-bold text-brand-ink hover:underline">Open departure</Link>}
            </Card>
            <Card className="p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-subtle">Booking contact</p>
              <p className="mt-1 font-bold">{b.contact.name}</p>
              <a href={`tel:${b.contact.phone}`} className="mt-1 flex items-center gap-1.5 text-ink hover:text-brand-ink"><Phone className="size-4" />{b.contact.phone}</a>
              <a href={`mailto:${b.contact.email}`} className="mt-1 flex items-center gap-1.5 break-all text-ink hover:text-brand-ink"><Mail className="size-4 shrink-0" />{b.contact.email}</a>
            </Card>
          </div>
          <div>
            <p className="mb-2 font-bold">Travellers ({b.travelers.length})</p>
            <ul className="divide-y divide-line rounded-2xl border border-line">
              {b.travelers.map((t, i) => (
                <li key={t._id || i} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-4 py-3">
                  <span className="font-bold">{t.fullName}</span>
                  <span className="text-subtle">{t.age} yrs{GENDER_LABELS[t.gender] !== '—' ? ` · ${GENDER_LABELS[t.gender]}` : ''}</span>
                  {t.phone && <span className="text-subtle">{t.phone}</span>}
                  {t.emergencyContact && <span className="w-full text-[13px] text-subtle">Emergency: {t.emergencyContact}</span>}
                </li>
              ))}
            </ul>
          </div>
          {b.specialRequests && <div><p className="mb-1 font-bold">Special requests</p><p className="rounded-xl bg-sand p-3">{b.specialRequests}</p></div>}
          {b.operatorNote && <div><p className="mb-1 font-bold">Your note</p><p className="text-subtle">{b.operatorNote}</p></div>}
          {b.status === 'confirmed' && (
            <div className="space-y-3">
              <p className="font-bold">Payment records</p>
              {b.payments?.length > 0 && (
                <ul className="divide-y divide-line rounded-2xl border border-line">
                  {b.payments.map((p) => (
                    <li key={p._id} className="flex flex-wrap justify-between gap-2 px-4 py-3">
                      <span><span className="num font-bold">{money(p.amount, p.currency)}</span> <span className="text-subtle">via {PAYMENT_METHODS.find(([v]) => v === p.method)?.[1]}{p.externalReference ? ` · ${p.externalReference}` : ''}</span></span>
                      <span className="text-subtle">{dateTime(p.createdAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <PaymentForm key={b.payments?.length} booking={b} onDone={async () => { await reload({ silent: true }); onChanged(); }} />
            </div>
          )}
          <div>
            <p className="mb-2 font-bold">History</p>
            <ol className="space-y-2 border-l-2 border-line pl-4">
              {b.history.map((h, i) => (
                <li key={i}><span className="font-semibold capitalize">{h.status}</span> <span className="text-subtle">· {dateTime(h.at)}</span>{h.note && <p className="text-subtle">{h.note}</p>}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function BookingsPage() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const departure = params.get('departure') || '';
  const focus = params.get('focus');
  const [q, setQ] = useState(params.get('q') || '');
  const dq = useDebounced(q, 300);

  const all = useAsync(() => api.get('/operator/bookings', { params: { departure: departure || undefined } }), [departure]);
  const list = useAsync(() => api.get('/operator/bookings', { params: { status: status || undefined, q: dq || undefined, departure: departure || undefined } }), [status, dq, departure]);

  const update = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };
  const counts = (all.data || []).reduce((m, b) => ({ ...m, [b.status]: (m[b.status] || 0) + 1 }), {});
  const tabs = STATUSES.map(([v, l]) => ({ value: v, label: l, count: v ? counts[v] || 0 : (all.data || []).length }));
  const refresh = () => { all.reload({ silent: true }); list.reload({ silent: true }); };
  const exportCsv = () => { window.location.href = apiUrl('/operator/bookings/export.csv', { status, q: dq, departure }); };

  const items = list.data || [];
  return (
    <div className="space-y-6">
      <PageHeader title="Bookings" actions={<Button variant="secondary" size="sm" onClick={exportCsv}><Download className="size-4" />Export CSV</Button>}>
        Review booking requests, confirm seats and keep traveller details in one place.
      </PageHeader>
      {departure && <Notice tone="brand" action={<Button size="sm" variant="ghost" onClick={() => update('departure', '')}>Show all</Button>}>Showing bookings for one departure.</Notice>}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs tabs={tabs} value={status} onChange={(v) => update('status', v)} className="w-fit max-w-full" />
        <Input icon={Search} placeholder="Search name, phone, reference" value={q} onChange={(e) => setQ(e.target.value)} className="md:w-80" aria-label="Search bookings" />
      </div>
      {list.loading && !list.data ? <Spinner /> : list.error ? <ErrorState error={list.error} onRetry={list.reload} /> : items.length === 0 ? (
        <EmptyState icon={Ticket} title={dq || status ? 'No matching bookings' : 'No bookings yet'}>
          {dq || status ? 'Try a different search or filter.' : 'When travellers request seats on your departures, they show up here.'}
        </EmptyState>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-line bg-white md:block">
            <table className="w-full text-left text-[14px]">
              <thead className="bg-sand/70 text-xs font-bold uppercase tracking-wider text-subtle">
                <tr><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Trip</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3 text-right">Seats</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3 text-right">Received</th><th className="px-4 py-3">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {items.map((b) => (
                  <tr key={b._id} onClick={() => update('focus', b._id)} className="cursor-pointer transition hover:bg-ivory">
                    <td className="px-4 py-3"><button type="button" className="font-mono text-[13px] font-bold hover:text-brand-ink" onClick={(e) => { e.stopPropagation(); update('focus', b._id); }}>{b.reference}</button><p className="text-xs text-subtle">{shortDate(b.createdAt)}</p></td>
                    <td className="max-w-[220px] px-4 py-3"><p className="truncate font-semibold">{b.package?.title}</p><p className="text-xs text-subtle">{b.departure && shortDate(b.departure.startDate)}</p></td>
                    <td className="px-4 py-3"><p className="font-semibold">{b.contact.name}</p><p className="text-xs text-subtle">{b.contact.phone}</p></td>
                    <td className="num px-4 py-3 text-right font-bold">{b.seats}</td>
                    <td className="num px-4 py-3 text-right font-bold">{money(b.totalAmount, b.currency)}</td>
                    <td className="num px-4 py-3 text-right text-subtle">{b.amountReceived ? money(b.amountReceived, b.currency) : '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="grid gap-3 md:hidden">
            {items.map((b) => (
              <li key={b._id}>
                <button type="button" onClick={() => update('focus', b._id)} className="w-full rounded-2xl border border-line bg-white p-4 text-left">
                  <div className="flex items-center justify-between gap-2"><span className="font-mono text-[13px] font-bold">{b.reference}</span><StatusBadge status={b.status} /></div>
                  <p className="mt-2 font-bold">{b.contact.name} <span className="font-medium text-subtle">· {b.seats} seat{b.seats > 1 ? 's' : ''}</span></p>
                  <p className="text-[13px] text-subtle">{b.package?.title} · {b.departure && shortDate(b.departure.startDate)}</p>
                  <p className="num mt-2 text-[14px] font-extrabold">{money(b.totalAmount, b.currency)}{b.amountReceived ? <span className="font-semibold text-subtle"> · {money(b.amountReceived, b.currency)} received</span> : null}</p>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <BookingModal key={focus || 'none'} id={focus} onClose={() => update('focus', '')} onChanged={refresh} />
    </div>
  );
}
