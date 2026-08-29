import mongoose from 'mongoose';

const SafetyLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  bookingId: {
    type: String,
    default: null
  },
  alertType: {
    type: String,
    enum: ['PHONE', 'EYE', 'NONE'],
    required: true
  },
  duration: {
    type: Number, // duration in seconds
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const SafetyLog = mongoose.model('SafetyLog', SafetyLogSchema);
export default SafetyLog;
