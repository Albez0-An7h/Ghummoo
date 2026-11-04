import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowDown, ArrowUp, Check, ImagePlus, Link2, Plus, Star, Trash2, Upload } from 'lucide-react';
import api from '../../lib/api';
import { CATEGORY_LABELS } from '../../lib/format';
import { Button, Field, Input, Textarea, SafeImage, EmptyState, cx } from '../../components/ui';

const CATEGORY_KEYS = ['weekend', 'mountains', 'adventure', 'international', 'cultural', 'beach', 'wildlife', 'spiritual', 'trek'];

export function CategoryPicker({ value = [], onChange, disabled, label = 'Categories', hint }) {
  const toggle = (c) => onChange(value.includes(c) ? value.filter((x) => x !== c) : [...value, c]);
  return (
    <Field label={label} hint={hint}>
      <div className="flex flex-wrap gap-2">
        {CATEGORY_KEYS.map((c) => {
          const on = value.includes(c);
          return (
            <button key={c} type="button" disabled={disabled} onClick={() => toggle(c)} aria-pressed={on}
              className={cx('inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-bold transition disabled:opacity-60',
                on ? 'border-brand bg-peach text-brand-ink' : 'border-line bg-white text-subtle hover:border-brand-soft hover:text-ink')}>
              {on && <Check className="size-3.5" aria-hidden />}{CATEGORY_LABELS[c] || c}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

const emptyDay = () => ({ title: '', description: '', meals: '', stay: '' });

export function ItineraryEditor({ value = [], onChange, disabled }) {
  const update = (i, patch) => onChange(value.map((d, j) => (j === i ? { ...d, ...patch } : d)));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const remove = (i) => onChange(value.filter((_, j) => j !== i));

  return (
    <div className="space-y-4">
      {value.length === 0 && (
        <EmptyState title="No days yet" action={!disabled && <Button onClick={() => onChange([emptyDay()])}><Plus className="size-4" />Add day 1</Button>}>
          Lay out the trip day by day so travellers know exactly what to expect.
        </EmptyState>
      )}
      {value.map((d, i) => (
        <div key={i} className="rounded-2xl border border-line bg-white p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="rounded-full bg-peach px-3 py-1 text-xs font-extrabold text-brand-ink">Day {i + 1}</span>
            {!disabled && (
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="grid size-8 place-items-center rounded-full text-subtle hover:bg-sand disabled:opacity-30" aria-label={`Move day ${i + 1} up`}><ArrowUp className="size-4" /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} className="grid size-8 place-items-center rounded-full text-subtle hover:bg-sand disabled:opacity-30" aria-label={`Move day ${i + 1} down`}><ArrowDown className="size-4" /></button>
                <button type="button" onClick={() => remove(i)} className="grid size-8 place-items-center rounded-full text-subtle hover:bg-danger-bg hover:text-danger" aria-label={`Remove day ${i + 1}`}><Trash2 className="size-4" /></button>
              </div>
            )}
          </div>
          <div className="grid gap-3">
            <Input label="Title" value={d.title} disabled={disabled} onChange={(e) => update(i, { title: e.target.value })} placeholder="e.g. Solang Valley day" />
            <Textarea label="What happens" rows={3} value={d.description} disabled={disabled} onChange={(e) => update(i, { description: e.target.value })} placeholder="Timings, places, activities" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Meals" value={d.meals} disabled={disabled} onChange={(e) => update(i, { meals: e.target.value })} placeholder="Breakfast, Dinner" />
              <Input label="Stay" value={d.stay} disabled={disabled} onChange={(e) => update(i, { stay: e.target.value })} placeholder="Hotel in Manali" />
            </div>
          </div>
        </div>
      ))}
      {value.length > 0 && !disabled && (
        <Button variant="secondary" onClick={() => onChange([...value, emptyDay()])}><Plus className="size-4" />Add day {value.length + 1}</Button>
      )}
    </div>
  );
}

export function PhotoManager({ cover, images = [], onChange, disabled }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState('');
  // All photos shown: cover first, then the gallery without duplicates.
  const all = [...new Set([cover, ...images].filter(Boolean))];

  const commit = (list, nextCover = cover) => {
    const c = list.includes(nextCover) ? nextCover : list[0] || '';
    onChange({ coverImage: c, images: list });
  };

  const add = (u) => {
    if (all.includes(u)) { toast.error('That photo is already added'); return; }
    commit([...all, u], cover || u);
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be smaller than 5 MB'); return; }
    const fd = new FormData();
    fd.append('image', file);
    setUploading(true);
    try {
      const res = await api.post('/uploads', fd);
      add(res.url);
      toast.success('Photo uploaded');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const addUrl = () => {
    const u = url.trim();
    if (!/^(https?:\/\/|\/uploads\/)/i.test(u)) { toast.error('Enter an image URL starting with https://'); return; }
    add(u);
    setUrl('');
  };

  return (
    <div className="space-y-5">
      {!disabled && (
        <div className="grid gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-[auto_1fr] sm:items-end sm:p-5">
          <div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={onFile} />
            <Button onClick={() => fileRef.current?.click()} loading={uploading} className="w-full sm:w-auto">
              {!uploading && <Upload className="size-4" />}{uploading ? 'Uploading…' : 'Upload photo'}
            </Button>
            <p className="mt-1.5 text-[13px] text-subtle">JPG, PNG, WebP or AVIF, up to 5 MB</p>
          </div>
          <div className="flex gap-2">
            <Input className="flex-1" icon={Link2} label="Or add by URL" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }} placeholder="https://…" />
            <Button variant="secondary" className="self-end" onClick={addUrl}>Add</Button>
          </div>
        </div>
      )}
      {all.length === 0 ? (
        <EmptyState icon={ImagePlus} title="No photos yet">A cover photo is required before publishing. Real photos from your past trips work best.</EmptyState>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {all.map((src) => (
            <li key={src} className="group relative overflow-hidden rounded-2xl border border-line bg-white">
              <SafeImage src={src} alt="Package photo" widths={[400, 600]} sizes="(min-width:640px) 33vw, 50vw" className="aspect-[4/3] w-full" />
              {src === cover && <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-ink/80 px-2.5 py-1 text-[11px] font-bold text-white"><Star className="size-3" aria-hidden />Cover</span>}
              {!disabled && (
                <div className="flex gap-1 border-t border-line p-2">
                  <button type="button" disabled={src === cover} onClick={() => commit(all, src)} className="flex-1 rounded-lg px-2 py-1.5 text-xs font-bold text-subtle hover:bg-sand hover:text-ink disabled:opacity-40">Set as cover</button>
                  <button type="button" onClick={() => commit(all.filter((x) => x !== src))} className="grid size-8 place-items-center rounded-lg text-subtle hover:bg-danger-bg hover:text-danger" aria-label="Remove photo"><Trash2 className="size-4" /></button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
