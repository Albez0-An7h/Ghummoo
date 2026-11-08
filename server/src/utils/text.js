const crypto = require('crypto');

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .slice(0, 70) || 'item';

async function uniqueSlug(Model, base, excludeId) {
  const root = slugify(base);
  let candidate = root;
  for (let i = 0; i < 20; i += 1) {
    const q = { slug: candidate };
    if (excludeId) q._id = { $ne: excludeId };
    // eslint-disable-next-line no-await-in-loop
    if (!(await Model.exists(q))) return candidate;
    candidate = `${root}-${crypto.randomBytes(2).toString('hex')}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

// Human-friendly booking reference, e.g. GHM-7K3P9Q (no ambiguous chars).
function bookingReference() {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(6);
  let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `GHM-${out}`;
}

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const toList = (v) => {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === 'string') return v.split('\n').map((x) => x.trim()).filter(Boolean);
  return [];
};

// One CSV cell. Values starting with a character a spreadsheet treats as a formula (=, +, -, @,
// tab or carriage return) are prefixed with ' so an exported manifest can't run formulas.
const csvCell = (v) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

module.exports = { slugify, uniqueSlug, bookingReference, escapeRegex, toList, csvCell };
