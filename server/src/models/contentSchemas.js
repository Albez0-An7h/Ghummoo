const mongoose = require('mongoose');
const { ASSET_KINDS, ASSET_STATUS, LANDMARK_KINDS } = require('./contentConstants');

const HEX = /^#[0-9A-Fa-f]{6}$/;

// A visual asset reference. Illustrations are referenced by a stable key (e.g.
// "illustration/landmark/hawa-mahal") so artwork can be produced later without data changes.
const assetSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ASSET_KINDS, required: true },
    key: { type: String, required: true, trim: true },
    url: { type: String, trim: true, default: '' },
    alt: { type: String, trim: true, required: [true, 'Every asset needs alt text'], maxlength: 200 },
    credit: { type: String, trim: true, default: '' },
    licence: { type: String, trim: true, default: '' },
    status: { type: String, enum: ASSET_STATUS, default: 'planned' },
  },
  { _id: false }
);
assetSchema.pre('validate', function requireUrl(next) {
  if (this.status === 'available' && !this.url) this.invalidate('url', 'An available asset needs a URL');
  next();
});

const paletteSchema = new mongoose.Schema(
  {
    primary: { type: String, match: HEX, required: true },
    secondary: { type: String, match: HEX, required: true },
    ink: { type: String, match: HEX, required: true },
  },
  { _id: false }
);

const landmarkSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    kind: { type: String, enum: LANDMARK_KINDS, required: true },
    description: { type: String, trim: true, maxlength: 280, default: '' },
    asset: { type: assetSchema, default: null },
  },
  { _id: false }
);

module.exports = { assetSchema, paletteSchema, landmarkSchema };
