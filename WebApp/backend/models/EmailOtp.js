import mongoose from 'mongoose';

const EmailOtpSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  isVerified: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Auto-delete documents when the expiration date/time is reached
EmailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailOtp = mongoose.model('EmailOtp', EmailOtpSchema);
export default EmailOtp;
