// Exports server/src/content/india.js (the single source of India content) to JSON for the
// V0.1 frontend prototype:  node scripts/export-india-content.js
const fs = require('fs');
const path = require('path');
const { LANDSCAPES, CITIES, PLACES } = require('../server/src/content/india');

const strip = (place) => ({ aliases: [], ...place });
const out = {
  generatedFrom: 'server/src/content/india.js',
  landscapes: LANDSCAPES.map(({ packageCategories, ...l }) => l),
  places: [
    ...CITIES.map((c) => strip({ ...c, kind: 'city', featured: true, aliases: c.aliases })),
    ...PLACES.map((p) => strip({ featured: false, nearby: [], highlights: [], landmarks: [], intro: '', ...p })),
  ],
};
const file = path.join(__dirname, '..', 'client', 'src', 'v01', 'data', 'india.generated.json');
fs.writeFileSync(file, `${JSON.stringify(out, null, 1)}\n`);
console.log(`Wrote ${path.relative(process.cwd(), file)}: ${out.landscapes.length} landscapes, ${out.places.length} places`);
