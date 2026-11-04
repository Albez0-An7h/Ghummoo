const mongoose = require('mongoose');

// No payment gateway is integrated. A PaymentRecord is an operator's own record of money
// received offline (UPI, bank transfer, cash). Revenue figures are computed only from these.
const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: 'Operator', required: true, index: true },
    amount: { type: Number, required: [true, 'Amount is required'], min: 1 },
    currency: { type: String, default: 'INR' },
    method: { type: String, enum: ['upi', 'bank_transfer', 'cash', 'card', 'other'], required: true },
    externalReference: { type: String, trim: true, default: '' },
    note: { type: String, trim: true, default: '' },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    gateway: { type: String, default: 'offline' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentRecord', paymentSchema);
