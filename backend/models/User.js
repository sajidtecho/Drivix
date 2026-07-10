import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const VehicleSchema = new mongoose.Schema({
  plate: { type: String, required: true },
  model: { type: String, required: true },
  isPrimary: { type: Boolean, default: false }
});

const DocumentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

const PaymentMethodSchema = new mongoose.Schema({
  type: { type: String, required: true },
  label: { type: String, required: true },
  provider: { type: String, required: true }
});

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  name: { type: String }, // maintained for backward compatibility with frontend forms
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  password: { type: String, required: true, select: false },
  mobile: { type: String, required: true },
  city: { type: String, required: true },
  profileImage: { type: String, default: '' },
  vehicles: [VehicleSchema],
  documents: [DocumentSchema],
  paymentMethods: [PaymentMethodSchema],
  walletBalance: { type: Number, default: 0 },
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  membershipType: { type: String, default: 'Free', enum: ['Free', 'Premium'] },
  membershipExpiry: { type: Date, default: null },
  isVerified: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);
export default User;
