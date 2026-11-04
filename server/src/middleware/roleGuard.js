const Operator = require('../models/Operator');

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Please log in to continue' });
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Your account does not have access to this area' });
  }
  return next();
};

// Loads the operator profile owned by the logged-in user. `requireApproved` blocks
// publishing-type actions until an admin approves the operator.
const loadOperator = ({ required = true } = {}) => async (req, res, next) => {
  const op = await Operator.findOne({ owner: req.user._id });
  if (!op && required) {
    return res.status(409).json({ success: false, code: 'ONBOARDING_REQUIRED', message: 'Complete your operator profile first' });
  }
  req.operator = op;
  return next();
};

module.exports = { requireRole, loadOperator };
