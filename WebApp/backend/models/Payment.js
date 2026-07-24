import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking reference is required']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    transactionId: {
      type: String,
      required: [true, 'Transaction ID is required'],
      unique: true,
      trim: true
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: ['wallet', 'upi', 'card', 'netbanking', 'cash'],
        message: 'Payment method must be one of: wallet, upi, card, netbanking, cash'
      }
    },
    paymentStatus: {
      type: String,
      required: [true, 'Payment status is required'],
      enum: {
        values: ['pending', 'success', 'failed', 'refunded'],
        message: 'Payment status must be one of: pending, success, failed, refunded'
      },
      default: 'pending'
    },
    paymentDate: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const Payment = mongoose.model('Payment', PaymentSchema);
export default Payment;
