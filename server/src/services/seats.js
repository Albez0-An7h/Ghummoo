const { TripDeparture, Booking } = require('../models');

// Atomically holds `n` seats on an open departure. Returns the updated departure or null if
// there were not enough seats (or the departure is not open).
async function holdSeats(departureId, n) {
  return TripDeparture.findOneAndUpdate(
    { _id: departureId, status: 'open', seatsAvailable: { $gte: n } },
    { $inc: { seatsAvailable: -n } },
    { new: true }
  );
}

// Releases seats, never exceeding total capacity.
async function releaseSeats(departureId, n) {
  return TripDeparture.findOneAndUpdate(
    { _id: departureId },
    [{ $set: { seatsAvailable: { $min: ['$totalCapacity', { $add: ['$seatsAvailable', n] }] } } }],
    { new: true }
  );
}

// Moves the confirmed-seat counter by `delta`, never below zero.
async function adjustConfirmedSeats(departureId, delta) {
  return TripDeparture.findOneAndUpdate(
    { _id: departureId },
    [{ $set: { confirmedSeats: { $max: [0, { $add: [{ $ifNull: ['$confirmedSeats', 0] }, delta] }] } } }],
    { new: true }
  );
}

// Recomputes confirmedSeats from bookings: the source of truth if the counter ever drifts.
async function recountConfirmedSeats(departureId) {
  const agg = await Booking.aggregate([
    { $match: { departure: departureId, status: 'confirmed' } },
    { $group: { _id: null, seats: { $sum: '$seats' } } },
  ]);
  const seats = agg[0]?.seats || 0;
  await TripDeparture.updateOne({ _id: departureId }, { $set: { confirmedSeats: seats } });
  return seats;
}

module.exports = { holdSeats, releaseSeats, adjustConfirmedSeats, recountConfirmedSeats };
