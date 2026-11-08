/* Trip groups: membership rules. Access is decided here on EVERY request from the database,
   never from anything the client sends:

     organiser  the user who owns the departure's operator profile
     traveller  a user with a CONFIRMED booking on that exact departure, who hasn't left

   Pending, declined and cancelled bookings, other departures of the same package, and every
   other user are refused. Losing a confirmed booking removes access immediately. */
const mongoose = require('mongoose');
const { TripDeparture, TripPackage, Operator, Booking, TripGroup, GroupMember } = require('../models');
const { HttpError } = require('../utils/http');

const denied = (message, code = 'GROUP_ACCESS_DENIED') => Object.assign(new HttpError(403, message), { details: { code } });
const ONLY_MEMBERS = 'This trip group is only for the organiser and confirmed travellers of this departure.';

async function ensureGroup(dep) {
  return TripGroup.findOneAndUpdate(
    { departure: dep._id },
    { $setOnInsert: { departure: dep._id, package: dep.package, operator: dep.operator } },
    { upsert: true, new: true }
  ).lean();
}

/* Resolves the caller's role in a departure's group or throws 403/404. */
async function access(user, departureId, { allowLeft = false } = {}) {
  if (!mongoose.isValidObjectId(departureId)) throw new HttpError(404, 'Trip group not found');
  const dep = await TripDeparture.findById(departureId).lean();
  if (!dep) throw new HttpError(404, 'Trip group not found');
  const operator = await Operator.findById(dep.operator).lean();

  let role = null;
  if (user.role === 'operator' && operator && String(operator.owner) === String(user._id)) role = 'organiser';
  else if (user.role === 'traveler') {
    const confirmed = await Booking.exists({ departure: dep._id, user: user._id, status: 'confirmed' });
    if (confirmed) role = 'traveller';
    else {
      const other = await Booking.findOne({ departure: dep._id, user: user._id }).sort({ updatedAt: -1 }).select('status').lean();
      if (other?.status === 'requested') throw denied('Your booking for this departure is waiting for the organiser. The group opens once it\'s confirmed.', 'GROUP_NOT_CONFIRMED');
      if (other) throw denied(`Your booking for this departure was ${other.status === 'rejected' ? 'declined' : 'cancelled'}, so the trip group isn't available.`, 'GROUP_NOT_CONFIRMED');
    }
  }
  if (!role) throw denied(ONLY_MEMBERS);

  const group = await ensureGroup(dep);
  const member = await GroupMember.findOneAndUpdate(
    { group: group._id, user: user._id },
    { $setOnInsert: { group: group._id, departure: dep._id, user: user._id } },
    { upsert: true, new: true }
  ).lean();
  if (member.leftAt && !allowLeft) throw denied('You left this trip group. You can rejoin from your booking.', 'GROUP_LEFT');

  const pkg = await TripPackage.findById(dep.package, 'title slug destination coverImage durationDays durationNights').lean();
  return { dep, pkg, operator, group, member, role };
}

// "Priya Sharma" → "Priya S." (no surnames, contacts or booking details in groups).
const displayName = (name) => {
  const parts = String(name || 'Traveller').trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
};

/* Current members: the organiser plus confirmed travellers who haven't left. */
async function members(ctx) {
  const bookings = await Booking.find({ departure: ctx.dep._id, status: 'confirmed' }).populate('user', 'name').select('user').lean();
  const left = new Set((await GroupMember.find({ group: ctx.group._id, leftAt: { $ne: null } }).select('user').lean()).map((m) => String(m.user)));
  const seen = new Set();
  const travellers = [];
  for (const b of bookings) {
    const id = String(b.user?._id);
    if (!b.user || seen.has(id) || left.has(id)) continue;
    seen.add(id);
    travellers.push({ _id: id, name: displayName(b.user.name), role: 'traveller' });
  }
  return [{ _id: String(ctx.operator.owner), name: ctx.operator.businessName, role: 'organiser' }, ...travellers.sort((a, b) => a.name.localeCompare(b.name))];
}

/* Groups the user can open right now, for lists and unread badges. */
async function groupsFor(user) {
  let deps = [];
  if (user.role === 'traveler') {
    const ids = await Booking.find({ user: user._id, status: 'confirmed' }).distinct('departure');
    deps = await TripDeparture.find({ _id: { $in: ids } }).lean();
  } else if (user.role === 'operator') {
    const op = await Operator.findOne({ owner: user._id }).lean();
    if (op) {
      const withConfirmed = await Booking.find({ operator: op._id, status: 'confirmed' }).distinct('departure');
      deps = await TripDeparture.find({ _id: { $in: withConfirmed } }).lean();
    }
  }
  return deps;
}

module.exports = { access, ensureGroup, members, groupsFor, displayName };
