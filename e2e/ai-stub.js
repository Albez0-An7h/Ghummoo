// Minimal OpenAI-compatible stub for end-to-end tests. It answers the three prompts Ghumo sends
// (Package Studio extraction, discovery interpretation, Ask This Trip) deterministically, so the
// AI code paths, schema validation and grounding checks run without a real provider or key.
const http = require('http');

const PORT = Number(process.env.E2E_AI_PORT || 5199);
const reply = (res, obj) => {
  res.writeHead(200, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(obj) } }] }));
};

http.createServer((req, res) => {
  if (req.method !== 'POST' || !req.url.endsWith('/chat/completions')) { res.writeHead(404); res.end('{}'); return; }
  let raw = '';
  req.on('data', (c) => { raw += c; });
  req.on('end', () => {
    const body = JSON.parse(raw || '{}');
    const system = body.messages?.[0]?.content || '';
    const user = body.messages?.[1]?.content || '';
    if (system.includes('extract structured travel-package data')) {
      // Studio: only values present in the caption (the server re-checks numbers).
      reply(res, {
        title: 'Chopta Tungnath Weekend Trek', destination: 'Chopta', region: 'Uttarakhand', country: 'India', startLocation: 'Delhi',
        durationDays: 3, durationNights: 2, price: 6499, currency: 'INR', departureDates: [], transport: 'Tempo traveller from Delhi',
        accommodation: 'Camps in Chopta', meals: 'Breakfast and dinner', activities: ['Tungnath temple', 'Chandrashila summit'],
        itinerary: [], inclusions: ['Camp stay', 'Breakfast and dinner', 'Trek leader'], exclusions: [], capacity: null,
        cancellationPolicy: null, pickupInfo: null, categories: ['mountains', 'trek'], summary: 'A short Himalayan trek to Tungnath and Chandrashila.',
        warnings: ['Seat capacity is not mentioned'],
      });
    } else if (system.includes('search preferences')) {
      reply(res, { moods: ['mountains'], interests: [], budget: null, maxPrice: null, affordable: false, duration: null, days: null, departureCity: null, destination: null, dates: null, ambiguities: [] });
    } else if (system.includes('ONE group trip')) {
      const listing = JSON.parse((user.match(/Listing \(JSON\):\n([\s\S]*?)\n\nQuestion:/) || [])[1] || '{}');
      const q = (user.split('Question:')[1] || '').toLowerCase();
      if (q.includes('cancel') && listing.cancellation) reply(res, { answered: true, answer: listing.cancellation, sources: ['cancellation'] });
      else reply(res, { answered: false, answer: 'Not in the listing.', sources: [] });
    } else reply(res, {});
  });
}).listen(PORT, '127.0.0.1', () => console.log(`[ai-stub] listening on ${PORT}`));
