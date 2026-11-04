const { TripDeparture } = require('../models');

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
  const dep = await TripDeparture.findById(departureId);
  if (!dep) return null;
  return TripDeparture.findOneAndUpdate(
    { _id: departureId },
    [{ $set: { seatsAvailable: { $min: ['$totalCapacity', { $add: ['$seatsAvailable', n] }] } } }],
    { new: true }
  );
}

module.exports = { holdSeats, releaseSeats };
