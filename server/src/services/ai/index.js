// AI Package Studio: turns an unstructured social-media caption into a structured trip draft.
// Runs server-side only. Provider is chosen with environment variables:
//   AI_PROVIDER=anthropic (default when ANTHROPIC_API_KEY is set) | openai (any OpenAI-compatible API)
//   ANTHROPIC_API_KEY / OPENAI_API_KEY, AI_MODEL, OPENAI_BASE_URL

const CATEGORIES = ['weekend', 'mountains', 'adventure', 'international', 'cultural', 'beach', 'wildlife', 'spiritual', 'trek'];

const SCHEMA = {
  type: 'object',
  properties: {
    title: { type: ['string', 'null'], description: 'Short marketable package title based on the text' },
    destination: { type: ['string', 'null'], description: 'Main destination(s), e.g. "Manali & Kasol"' },
    region: { type: ['string', 'null'], description: 'State or region if stated or unambiguous from destination' },
    country: { type: ['string', 'null'] },
    startLocation: { type: ['string', 'null'], description: 'City the group departs from' },
    durationDays: { type: ['integer', 'null'] },
    durationNights: { type: ['integer', 'null'] },
    price: { type: ['number', 'null'], description: 'Price per person exactly as stated' },
    currency: { type: ['string', 'null'], description: 'ISO code, INR if ₹/Rs/INR or Indian context with bare numbers' },
    departureDates: { type: 'array', items: { type: 'string', description: 'YYYY-MM-DD' } },
    transport: { type: ['string', 'null'] },
    accommodation: { type: ['string', 'null'] },
    meals: { type: ['string', 'null'] },
    activities: { type: 'array', items: { type: 'string' } },
    itinerary: {
      type: 'array',
      items: {
        type: 'object',
        properties: { day: { type: 'integer' }, title: { type: 'string' }, description: { type: 'string' } },
        required: ['day', 'title', 'description'],
      },
    },
    inclusions: { type: 'array', items: { type: 'string' } },
    exclusions: { type: 'array', items: { type: 'string' } },
    capacity: { type: ['integer', 'null'], description: 'Seats per departure, only if stated' },
    cancellationPolicy: { type: ['string', 'null'] },
    pickupInfo: { type: ['string', 'null'] },
    categories: { type: 'array', items: { type: 'string', enum: CATEGORIES } },
    summary: { type: ['string', 'null'], description: 'One-sentence factual summary using only stated facts' },
    warnings: { type: 'array', items: { type: 'string' }, description: 'Ambiguities or assumptions the operator must check' },
  },
  required: ['title', 'destination', 'price', 'departureDates', 'itinerary', 'inclusions', 'exclusions', 'warnings'],
};

function systemPrompt() {
  const today = new Date().toISOString().slice(0, 10);
  return `You extract structured travel-package data from informal social-media posts written by small Indian group-travel organisers.
Today is ${today}.
STRICT RULES:
- Use ONLY information present in the text. Never invent prices, dates, hotels, capacities, policies, times or activities.
- If a value is not stated, return null (or an empty array). Do not guess.
- Inclusions: only items the text says are included (e.g. "2 nights hotel", "breakfast", "bonfire").
- Exclusions: only if the text explicitly says something is excluded/not included. Otherwise empty.
- Itinerary: only build day-wise entries if the text describes days or a clear sequence. You may group stated activities into days ONLY when the text indicates which day; otherwise return an empty itinerary and add a warning.
- Dates: if day and month are given without a year, use the next future occurrence and add a warning that the year was assumed.
- Duration: "5 days 4 nights" → 5 and 4. "5D/4N" likewise.
- Price is per person unless the text says otherwise; if unclear add a warning.
- Title may be phrased nicely but must only reference stated places.
- warnings: list every assumption you made and every ambiguity. Be concise.`;
}

function getConfig() {
  const provider = (process.env.AI_PROVIDER || (process.env.ANTHROPIC_API_KEY ? 'anthropic' : process.env.OPENAI_API_KEY ? 'openai' : '')).toLowerCase();
  if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    return { provider, model: process.env.AI_MODEL || 'claude-sonnet-5-5', key: process.env.ANTHROPIC_API_KEY };
  }
  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    return {
      provider,
      model: process.env.AI_MODEL || 'gpt-4.1-mini',
      key: process.env.OPENAI_API_KEY,
      baseUrl: (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
    };
  }
  return null;
}

async function callAnthropic(cfg, text) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': cfg.key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: 4000,
      system: systemPrompt(),
      tools: [{ name: 'record_package', description: 'Record the extracted package', input_schema: SCHEMA }],
      tool_choice: { type: 'tool', name: 'record_package' },
      messages: [{ role: 'user', content: `Extract the package from this post:\n\n"""${text}"""` }],
    }),
    signal: AbortSignal.timeout(60000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error?.message || `AI provider returned ${res.status}`);
  const block = (body.content || []).find((c) => c.type === 'tool_use');
  if (!block) throw new Error('AI provider returned no structured output');
  return block.input;
}

// Some OpenAI-compatible APIs (e.g. Gemini) wrap errors in an array.
const providerError = (body) => (Array.isArray(body) ? body[0]?.error : body?.error) || {};

function parseJsonContent(content) {
  const s = String(content || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '');
  try { return JSON.parse(s); } catch { throw new Error('AI provider returned invalid JSON'); }
}

// AI_MODEL may be a comma-separated list; overloaded models (503/429) fall through to the next.
async function callOpenAI(cfg, text) {
  const models = cfg.model.split(',').map((m) => m.trim()).filter(Boolean);
  let lastErr;
  for (const model of models) {
    const payload = JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      temperature: 0,
      messages: [
        { role: 'system', content: `${systemPrompt()}\nRespond with a single JSON object matching this JSON Schema:\n${JSON.stringify(SCHEMA)}` },
        { role: 'user', content: `Extract the package from this post:\n\n"""${text}"""` },
      ],
    });
    for (let attempt = 0; attempt < 2; attempt += 1) {
      // eslint-disable-next-line no-await-in-loop
      const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${cfg.key}` },
        body: payload,
        signal: AbortSignal.timeout(60000),
      });
      // eslint-disable-next-line no-await-in-loop
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        cfg.usedModel = model;
        return parseJsonContent(body.choices?.[0]?.message?.content);
      }
      const busy = res.status === 503 || res.status === 429;
      lastErr = new Error(busy ? 'The AI provider is busy right now. Please try again in a minute.' : providerError(body).message || `AI provider returned ${res.status}`);
      lastErr.statusCode = 502;
      if (!busy) throw lastErr;
      // eslint-disable-next-line no-await-in-loop
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1200));
    }
  }
  throw lastErr || new Error('AI provider did not respond');
}

const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const arr = (v) => (Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x.trim() : x)).filter(Boolean) : []);
const int = (v) => (Number.isFinite(Number(v)) && v !== null && v !== '' ? Math.round(Number(v)) : null);

// Grounding check: a number the model returns must literally appear in the source text.
function numberInText(n, text) {
  if (n == null) return false;
  const digits = text.replace(/[,\s]/g, '');
  return digits.includes(String(n)) || text.toLowerCase().includes(`${n / 1000}k`);
}

function normalise(raw, text) {
  const warnings = arr(raw.warnings);
  let price = raw.price == null ? null : Number(raw.price);
  if (price != null && !numberInText(price, text)) {
    warnings.push(`Price ${price} could not be found in the text and was cleared`);
    price = null;
  }
  let capacity = int(raw.capacity);
  if (capacity != null && !numberInText(capacity, text)) capacity = null;

  const today = new Date().toISOString().slice(0, 10);
  const departureDates = arr(raw.departureDates).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !Number.isNaN(Date.parse(d)) && d >= today);

  const itinerary = arr(raw.itinerary)
    .filter((d) => d && typeof d === 'object' && str(d.title))
    .map((d, i) => ({ day: int(d.day) || i + 1, title: str(d.title), description: str(d.description) || '', meals: '', stay: '' }));

  const draft = {
    title: str(raw.title),
    destination: str(raw.destination),
    region: str(raw.region),
    country: str(raw.country),
    startLocation: str(raw.startLocation),
    durationDays: int(raw.durationDays),
    durationNights: int(raw.durationNights),
    basePrice: price,
    currency: (str(raw.currency) || (price != null ? 'INR' : null))?.toUpperCase() || null,
    departureDates,
    transport: str(raw.transport),
    accommodation: str(raw.accommodation),
    meals: str(raw.meals),
    highlights: arr(raw.activities),
    itinerary,
    inclusions: arr(raw.inclusions),
    exclusions: arr(raw.exclusions),
    capacity,
    cancellationPolicy: str(raw.cancellationPolicy),
    pickupInfo: str(raw.pickupInfo),
    categories: arr(raw.categories).filter((c) => CATEGORIES.includes(c)),
    summary: str(raw.summary),
  };

  // Deterministic missing-field warnings, independent of what the model says.
  const missing = [];
  if (!draft.title) missing.push('Package title');
  if (!draft.destination) missing.push('Destination');
  if (draft.basePrice == null) missing.push('Price per person');
  if (!draft.durationDays) missing.push('Duration');
  if (!draft.departureDates.length) missing.push('Departure dates');
  if (!draft.startLocation) missing.push('Starting location');
  if (!draft.transport) missing.push('Transport details');
  if (!draft.accommodation) missing.push('Accommodation details');
  if (!draft.itinerary.length) missing.push('Day-wise itinerary');
  if (!draft.exclusions.length) missing.push('Exclusions');
  if (draft.capacity == null) missing.push('Seat capacity');
  if (!draft.cancellationPolicy) missing.push('Cancellation policy');
  if (!draft.pickupInfo) missing.push('Exact pickup point and reporting time');
  if (draft.accommodation && !/star|category|3\*|4\*|5\*|boutique|hostel|camp|homestay|resort/i.test(draft.accommodation)) {
    warnings.push('Hotel category is not specified');
  }

  return { draft, missing, warnings: [...new Set(warnings)] };
}

async function extractPackage(text) {
  const cfg = getConfig();
  if (!cfg) {
    const err = new Error('AI is not configured on this server');
    err.statusCode = 503;
    err.details = { code: 'AI_NOT_CONFIGURED' };
    throw err;
  }
  const raw = cfg.provider === 'anthropic' ? await callAnthropic(cfg, text) : await callOpenAI(cfg, text);
  return { ...normalise(raw || {}, text), provider: cfg.provider, model: cfg.usedModel || cfg.model };
}

const status = () => {
  const cfg = getConfig();
  return cfg ? { configured: true, provider: cfg.provider, model: cfg.model } : { configured: false };
};

module.exports = { extractPackage, status, normalise };
