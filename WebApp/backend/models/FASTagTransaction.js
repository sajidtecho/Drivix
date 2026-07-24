import mongoose from 'mongoose';

const FASTagTransactionSchema = new mongoose.Schema({
  fastagId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FASTag',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Debit', 'Credit']
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const FASTagTransaction = mongoose.model('FASTagTransaction', FASTagTransactionSchema);
export default FASTagTransaction;
