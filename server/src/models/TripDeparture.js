const mongoose = require('mongoose');

const departureSchema = new mongoose.Schema(
  {
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'TripPackage', required: true, index: true },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator', required: true, index: true },
    startDate: { type: Date, required: [true, 'Departure date is required'], index: true },
    endDate: { type: Date, required: [true, 'Return date is required'] },
    price: { type: Number, required: [true, 'Price is required'], min: 0 },
    totalCapacity: { type: Number, required: [true, 'Capacity is required'], min: 1, max: 500 },
    seatsAvailable: { type: Number, required: true, min: 0 },
    bookingDeadline: { type: Date, default: null },
    pickupPoint: { type: String, trim: true, default: '' },
    reportingTime: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['open', 'closed', 'cancelled'], default: 'open' },
  },
  { timestamps: true }
);

departureSchema.virtual('isBookable').get(function isBookable() {
  const now = new Date();
  const deadline = this.bookingDeadline || this.startDate;
  return this.status === 'open' && this.seatsAvailable > 0 && deadline >= now && this.startDate >= now;
});

departureSchema.set('toJSON', { virtuals: true });
departureSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TripDeparture', departureSchema);
