import mongoose from 'mongoose';

const FASTagSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true,
    unique: true
  },
  vehicleNumber: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  bank: {
    type: String,
    required: true,
    enum: ['ICICI', 'HDFC', 'Axis', 'SBI', 'Paytm', 'Airtel']
  },
  tagId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    default: 'Active',
    enum: ['Active', 'Suspended', 'Low Balance']
  },
  balance: {
    type: Number,
    default: 850,
    min: 0
  },
  autoRechargeEnabled: {
    type: Boolean,
    default: false
  },
  thresholdLimit: {
    type: Number,
    default: 200
  },
  autoRechargeAmount: {
    type: Number,
    default: 500
  }
}, {
  timestamps: true
});

const FASTag = mongoose.model('FASTag', FASTagSchema);
export default FASTag;
