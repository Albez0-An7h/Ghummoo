import { useId, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Info, MessageSquareText, RotateCcw, SearchX, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Button, cx } from '../components/ui';
import useAsync from '../lib/useAsync';
import usePageTitle from '../lib/usePageTitle';
import { getDiscoverStatus, interpretRequest, searchDiscovery, MOOD_OPTIONS, BUDGET_OPTIONS, DURATION_OPTIONS, prefChips } from '../lib/discover';
import { PreferenceSelector, AIInput } from '../design/Inputs';
import { TripCard } from '../design/Cards';
import { GridSkeleton, ErrorState, EmptyState, Bone } from '../design/Feedback';
import { usePaths, usePlaces } from '../design/context';

const STEPS = [
  { key: 'mood', label: 'Mood' },
  { key: 'budget', label: 'Budget' },
  { key: 'duration', label: 'Duration' },
  { key: 'city', label: 'From' },
  { key: 'dates', label: 'Dates' },
];
const EXAMPLES = [
  'An affordable mountain trip for 3 days from Delhi, with trekking and camping',
  'Beach weekend from Mumbai under ₹8,000',
  'Something peaceful in December, about a week',
];

/* Departure city: pick from the directory or type any city. */
function CityField({ value, onChange }) {
  const id = useId();
  const places = usePlaces();
  const cities = useMemo(() => places.filter((p) => p.kind === 'city'), [places]);
  const [text, setText] = useState(value ? (value.name || value.text) : '');
  const commit = (v) => {
    const t = v.trim();
    if (!t) return onChange(undefined);
    const hit = cities.find((c) => [c.name, ...(c.aliases || [])].some((n) => n.toLowerCase() === t.toLowerCase()));
    return onChange(hit ? { slug: hit.slug, name: hit.name } : { text: t });
  };
  return (
    <div>
      <label htmlFor={id} className="text-sm font-extrabold">Departure city</label>
      <p className="mt-0.5 text-xs text-subtle">Type any city or pick one. Trips must start there.</p>
      <input id={id} list={`${id}-l`} value={text} onChange={(e) => setText(e.target.value)} onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(e.currentTarget.value); } }}
        placeholder="e.g. Delhi" autoComplete="off"
        className="mt-2 h-11 w-full max-w-sm rounded-xl border border-line bg-white px-3 text-[15px] font-semibold focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/10" />
      <datalist id={`${id}-l`}>{cities.map((c) => <option key={c.slug} value={c.name} />)}</datalist>
      <div className="mt-3 flex flex-wrap gap-2">
        {cities.filter((c) => c.featured).slice(0, 6).map((c) => (
          <button key={c.slug} type="button" onClick={() => { setText(c.name); onChange({ slug: c.slug, name: c.name }); }}
            className={cx('h-9 rounded-full px-3 text-sm font-bold ring-1', value?.slug === c.slug ? 'bg-ink text-white ring-ink' : 'bg-white ring-line hover:ring-brand-soft')}>{c.name}</button>
        ))}
        {value && <button type="button" onClick={() => { setText(''); onChange(undefined); }} className="h-9 rounded-full px-3 text-sm font-bold text-subtle underline">Any city</button>}
      </div>
    </div>
  );
}

function DatesField({ value, onChange }) {
  const id = useId();
  const mode = value?.mode || 'flexible';
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div>
      <PreferenceSelector legend="When do you want to go?" options={[{ value: 'flexible', label: 'Flexible' }, { value: 'weekend', label: 'This coming weekend' }, { value: 'range', label: 'Choose dates' }]}
        value={mode} onChange={(m) => onChange(m === 'weekend' ? { mode: 'weekend' } : m === 'range' ? { mode: 'range', from: value?.from || today, to: value?.to || today } : undefined)} />
      {mode === 'range' && (
        <div className="mt-4 flex flex-wrap gap-3">
          <div><label htmlFor={`${id}-f`} className="text-xs font-extrabold text-subtle">Departing from</label>
            <input id={`${id}-f`} type="date" min={today} value={value.from} onChange={(e) => onChange({ ...value, from: e.target.value, to: value.to < e.target.value ? e.target.value : value.to })} className="mt-1 block h-11 rounded-xl border border-line bg-white px-3 font-semibold" /></div>
          <div><label htmlFor={`${id}-t`} className="text-xs font-extrabold text-subtle">to</label>
            <input id={`${id}-t`} type="date" min={value.from} value={value.to} onChange={(e) => onChange({ ...value, to: e.target.value })} className="mt-1 block h-11 rounded-xl border border-line bg-white px-3 font-semibold" /></div>
        </div>
      )}
      <p className="mt-2 text-xs text-subtle">Trips must have a departure with seats in this window.</p>
    </div>
  );
}

/* One step's field. Shared by the guided stepper and the "adjust filters" panel. */
function StepField({ step, prefs, set }) {
  if (step === 'mood') return <PreferenceSelector legend="What kind of trip?" hint="Pick any. These rank trips; they don't hide any." multiple options={MOOD_OPTIONS.map(([value, label]) => ({ value, label }))} value={prefs.moods || []} onChange={(v) => set({ moods: v })} />;
  if (step === 'budget') return <PreferenceSelector legend="Budget per traveller" options={BUDGET_OPTIONS.map(([value, label]) => ({ value, label }))} value={prefs.maxPrice ? '' : prefs.budget || ''} onChange={(v) => set({ budget: v || undefined, maxPrice: undefined })} hint={prefs.maxPrice ? `Currently under ₹${prefs.maxPrice.toLocaleString('en-IN')} from your description. Pick a band to replace it.` : undefined} />;
  if (step === 'duration') return <PreferenceSelector legend="How long?" options={DURATION_OPTIONS.map(([value, label]) => ({ value, label }))} value={prefs.days ? '' : prefs.duration || ''} onChange={(v) => set({ duration: v || undefined, days: undefined })} hint={prefs.days ? `Currently about ${prefs.days} days from your description.` : undefined} />;
  if (step === 'city') return <CityField value={prefs.departureCity} onChange={(v) => set({ departureCity: v })} />;
  return <DatesField value={prefs.dates} onChange={(v) => set({ dates: v })} />;
}

function Guided({ prefs, set, onSearch, busy }) {
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;
  return (
    <div>
      <ol className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s.key}>
            <button type="button" onClick={() => setStep(i)} aria-current={i === step ? 'step' : undefined}
              className={cx('flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm font-bold transition', i === step ? 'bg-ink text-white' : 'bg-white text-ink ring-1 ring-line hover:ring-brand-soft')}>
              <span className={cx('grid size-5 place-items-center rounded-full text-[11px]', i === step ? 'bg-white/20' : 'bg-sand')}>{i + 1}</span>{s.label}
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-6 min-h-[180px]"><StepField step={STEPS[step].key} prefs={prefs} set={set} /></div>
      <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-5">
        {step > 0 && <Button variant="ghost" onClick={() => setStep(step - 1)}><ArrowLeft className="size-4" />Back</Button>}
        {!last && <Button variant="secondary" onClick={() => setStep(step + 1)}>{step === 0 && !(prefs.moods?.length) ? 'Skip' : 'Next'}<ArrowRight className="size-4" /></Button>}
        <Button className="ml-auto" onClick={onSearch} loading={busy}><Sparkles className="size-4" />Show trips</Button>
      </div>
      <p className="mt-2 text-right text-xs text-subtle">Every step is optional. Show trips whenever you like.</p>
    </div>
  );
}

function Describe({ onInterpret, busy, aiOn }) {
  return (
    <div>
      <AIInput label="Describe the trip you want" placeholder="e.g. An affordable mountain trip for 3 days from Lucknow, with trekking and camping" max={500}
        busy={busy} onSubmit={onInterpret} buttonLabel="Find trips" suggestions={EXAMPLES}
        note={aiOn ? 'We turn this into filters you can edit. Trips always come from real listings.' : 'Our AI helper is off right now, so we read this with simple rules. You can edit the filters.'} />
    </div>
  );
}

function ResultsBlock({ state, onEdit, onReset, setPrefs }) {
  const paths = usePaths();
  if (state.status === 'loading') {
    return (
      <div className="space-y-4" role="status" aria-busy="true">
        <p className="flex items-center gap-2 text-sm font-bold text-subtle"><Sparkles className="size-4 animate-pulse text-brand motion-reduce:animate-none" aria-hidden />{state.phase === 'interpret' ? 'Reading your request…' : 'Checking trips, dates and seats…'}</p>
        <Bone className="h-16 rounded-2xl" /><GridSkeleton count={3} />
      </div>
    );
  }
  if (state.status === 'error') return <ErrorState error={state.error} onRetry={state.retry} />;
  if (state.status !== 'done') return null;
  const { data, interpretation } = state;
  const chips = prefChips(data.prefs);
  return (
    <div>
      <section aria-labelledby="understood-h" className="rounded-[24px] bg-white p-5 ring-1 ring-line sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <h2 id="understood-h" className="text-xs font-extrabold uppercase tracking-[0.14em] text-brand-ink">{interpretation ? 'What we understood' : 'Your choices'}</h2>
            <p className="mt-1 text-[17px] font-bold">{data.summary}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={onEdit}><SlidersHorizontal className="size-4" />Adjust filters</Button>
            <Button size="sm" variant="ghost" onClick={onReset}><RotateCcw className="size-4" />Start over</Button>
          </div>
        </div>
        {chips.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Filters in use">
            {chips.map((c) => (
              <button key={c.key} type="button" onClick={() => setPrefs(c.remove(data.prefs), true)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-peach px-3 text-[13px] font-bold text-brand-ink hover:bg-[#ffd9bf]">
                {c.label}<span aria-hidden>×</span><span className="sr-only">Remove this filter</span>
              </button>
            ))}
          </div>
        )}
        {interpretation?.notice && <p className="mt-3 flex items-start gap-2 rounded-xl bg-warning-bg px-3 py-2 text-sm font-semibold text-warning"><Info className="mt-0.5 size-4 shrink-0" aria-hidden />{interpretation.notice}</p>}
        {interpretation?.ambiguities?.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-subtle">{interpretation.ambiguities.map((a) => <li key={a.message} className="flex gap-2"><Info className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />{a.message}</li>)}</ul>
        )}
      </section>

      <section aria-labelledby="results-h" className="mt-8">
        {data.results.length > 0 ? (
          <>
            <h2 id="results-h" className="text-2xl font-extrabold">{data.results.length} trip{data.results.length > 1 ? 's' : ''} that fit{data.results.length > 1 ? '' : 's'}</h2>
            <p className="mt-1 text-sm text-subtle">Ranked by how much of your request each listing covers, then the soonest date. Only departures with seats right now are shown.</p>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.results.map((r) => <TripCard key={r.trip._id} trip={r.trip} reason={r.reasons} caveats={r.caveats} />)}
            </div>
          </>
        ) : (
          <>
            <h2 id="results-h" className="sr-only">Results</h2>
            <EmptyState icon={SearchX} title="No trip fits everything yet" action={<Button variant="secondary" onClick={onEdit}><SlidersHorizontal className="size-4" />Adjust filters</Button>}>
              {data.explanation}
            </EmptyState>
            {data.alternatives.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-extrabold">Close matches</h3>
                <p className="mt-1 text-sm text-subtle">Each of these misses one thing you asked for. The difference is spelt out on the card.</p>
                <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {data.alternatives.map((r) => <TripCard key={r.trip._id} trip={r.trip} reason={r.reasons} caveats={r.caveats} difference={r.difference} />)}
                </div>
              </div>
            )}
          </>
        )}
        <Button variant="ghost" className="mt-6" to={paths.trips()}>Browse all trips instead</Button>
      </section>
    </div>
  );
}

/* Help me decide: describe the trip in your own words, or choose step by step. Both produce the
   same editable filters; trips always come from the real catalogue and live inventory. */
export default function DecidePage() {
  usePageTitle('Help me decide');
  const status = useAsync(getDiscoverStatus, []);
  const aiOn = status.data?.ai === true;
  const [mode, setMode] = useState('describe');
  const [prefs, setPrefsState] = useState({});
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState({ status: 'idle' });
  const resultsRef = useRef(null);

  const run = async (p, interpretation) => {
    setState({ status: 'loading' });
    try {
      const data = await searchDiscovery(p);
      setPrefsState(data.prefs);
      setState({ status: 'done', data, interpretation });
      requestAnimationFrame(() => resultsRef.current?.focus());
    } catch (error) {
      setState({ status: 'error', error, retry: () => run(p, interpretation) });
    }
  };
  const set = (patch) => setPrefsState((p) => Object.fromEntries(Object.entries({ ...p, ...patch }).filter(([, v]) => v !== undefined && !(Array.isArray(v) && !v.length))));
  const setPrefs = (next, search) => { setPrefsState(next); if (search) run(next, state.interpretation && { ...state.interpretation, notice: undefined }); };

  const onInterpret = async (text) => {
    setState({ status: 'loading', phase: 'interpret' });
    try {
      const interpretation = await interpretRequest(text);
      setEditing(false);
      await run(interpretation.prefs, interpretation);
    } catch (error) {
      setState({ status: 'error', error, retry: () => onInterpret(text) });
    }
  };
  const reset = () => { setPrefsState({}); setState({ status: 'idle' }); setEditing(false); };
  const busy = state.status === 'loading';

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
      <p className="inline-flex items-center gap-1.5 rounded-full bg-peach px-3 py-1 text-xs font-extrabold text-brand-ink"><Sparkles className="size-3.5" aria-hidden />Help me decide</p>
      <h1 className="mt-3 max-w-3xl text-[36px] font-extrabold leading-tight sm:text-5xl">Tell us what you're after. We'll find trips that fit.</h1>
      <p className="mt-2 max-w-2xl text-subtle">Describe it in your own words or choose step by step. Suggestions only ever come from listed trips with seats, each with the reason it matched.</p>
      {status.data && !aiOn && <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-sand px-3 py-1.5 text-xs font-bold text-subtle"><Info className="size-3.5" aria-hidden />AI helper is off on this server. Search still works with simple rules.</p>}

      {(state.status === 'idle' || editing || state.status === 'error') && (
        <div className="mt-8 rounded-[28px] bg-white p-5 ring-1 ring-line sm:p-8">
          {!editing && (
            <div role="tablist" aria-label="How do you want to search?" className="mb-6 inline-flex rounded-full bg-sand p-1">
              {[['describe', 'Describe it', MessageSquareText], ['guided', 'Choose step by step', SlidersHorizontal]].map(([k, l, Icon]) => (
                <button key={k} type="button" role="tab" aria-selected={mode === k} onClick={() => setMode(k)}
                  className={cx('inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-extrabold transition', mode === k ? 'bg-white text-ink shadow-soft' : 'text-subtle hover:text-ink')}>
                  <Icon className="size-4" aria-hidden />{l}
                </button>
              ))}
            </div>
          )}
          {editing ? (
            <div>
              <h2 className="text-lg font-extrabold">Adjust your filters</h2>
              <div className="mt-5 grid gap-8 lg:grid-cols-2">{STEPS.map((s) => <StepField key={s.key} step={s.key} prefs={prefs} set={set} />)}</div>
              <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
                <Button onClick={() => { setEditing(false); run(prefs, state.interpretation && { ...state.interpretation, notice: undefined, ambiguities: [] }); }} loading={busy}><Sparkles className="size-4" />Update trips</Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : mode === 'describe' ? <Describe onInterpret={onInterpret} busy={busy} aiOn={aiOn} />
            : <Guided prefs={prefs} set={set} busy={busy} onSearch={() => run(prefs, null)} />}
        </div>
      )}

      <div ref={resultsRef} tabIndex={-1} aria-live="polite" className="mt-10 outline-none">
        <ResultsBlock state={state} onEdit={() => setEditing(true)} onReset={reset} setPrefs={setPrefs} />
      </div>
    </div>
  );
}
