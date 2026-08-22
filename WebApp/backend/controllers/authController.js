/* global process */
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import EmailOtp from '../models/EmailOtp.js';
import { sendOtpEmail } from '../services/emailService.js';

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password, mobile, city } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Enforce email verification check from EmailOtp model
    const verifiedEmailRecord = await EmailOtp.findOne({ email, isVerified: true });
    if (!verifiedEmailRecord) {
      return res.status(400).json({ message: 'Please verify your email address first using the OTP sent to your Gmail.' });
    }

    // Preserve original Drivix admin logic
    const role = email === 'drivixmobility@gmail.com' ? 'admin' : 'user';

    const user = await User.create({
      fullName: name || 'Drivix User',
      name: name || 'Drivix User',
      email,
      password,
      mobile,
      city,
      role,
      isVerified: true // Set verified directly since it was checked inline
    });

    if (user) {
      // Delete verification record now that user is registered
      await EmailOtp.deleteOne({ email });

      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        city: user.city,
        role: user.role,
        walletBalance: user.walletBalance,
        vehicles: user.vehicles,
        documents: user.documents,
        membershipType: user.membershipType,
        isVerified: user.isVerified,
        preferences: user.preferences,
        notifications: user.notifications,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      // Check if email has been verified
      if (!user.isVerified) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.emailOtp = otp;
        user.emailOtpExpires = otpExpires;
        await user.save();

        try {
          await sendOtpEmail(user.email, user.fullName, otp);
        } catch (emailError) {
          console.error('Error sending verification email during login:', emailError.message);
          return res.status(200).json({
            requiresEmailVerification: true,
            email: user.email,
            message: 'Verification OTP failed to send. Please request a resend.'
          });
        }

        return res.status(200).json({
          requiresEmailVerification: true,
          email: user.email,
          message: 'Verification OTP sent to your email.'
        });
      }

      res.json({
        _id: user._id,
        fullName: user.fullName,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        city: user.city,
        role: user.role,
        walletBalance: user.walletBalance,
        vehicles: user.vehicles,
        documents: user.documents,
        membershipType: user.membershipType,
        isVerified: user.isVerified,
        preferences: user.preferences,
        notifications: user.notifications,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        city: user.city,
        drivingLicence: user.drivingLicence || '',
        isProfileCompleted: user.isProfileCompleted || false,
        role: user.role,
        walletBalance: user.walletBalance,
        vehicles: user.vehicles,
        documents: user.documents,
        paymentMethods: user.paymentMethods,
        preferences: user.preferences,
        notifications: user.notifications
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth/Register user via Google Login
// @route   POST /api/auth/google
// @access  Public
export const authGoogle = async (req, res) => {
  const { credential } = req.body;

  try {
    if (!credential) {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    // Verify Google ID Token (JWT) directly via Google's tokeninfo API
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!response.ok) {
      return res.status(401).json({ message: 'Invalid Google credential token' });
    }

    const payload = await response.json();
    const { email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Email address not found in Google account metadata' });
    }

    let user = await User.findOne({ email });

    if (!user) {
      // Create user if not exists
      const role = email === 'drivixmobility@gmail.com' ? 'admin' : 'user';
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

      user = await User.create({
        fullName: name || 'Google User',
        name: name || 'Google User',
        email,
        password: randomPassword,
        mobile: '',
        city: '',
        profileImage: picture || '',
        role
      });
    }

    res.json({
      _id: user._id,
      fullName: user.fullName,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      city: user.city,
      role: user.role,
      walletBalance: user.walletBalance,
      vehicles: user.vehicles,
      documents: user.documents,
      membershipType: user.membershipType,
      isVerified: user.isVerified,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Auth/Register user via Phone Login (after client OTP verify)
// @route   POST /api/auth/phone
// @access  Public
export const authPhone = async (req, res) => {
  const { mobile } = req.body;

  try {
    let user = await User.findOne({ mobile });

    if (!user) {
      // Create user if not exists
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

      user = await User.create({
        fullName: 'Mobile User',
        name: 'Mobile User',
        password: randomPassword,
        mobile,
        city: '',
        role: 'user'
      });
    }

    res.json({
      _id: user._id,
      fullName: user.fullName,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      city: user.city,
      role: user.role,
      isProfileCompleted: user.isProfileCompleted || false,
      walletBalance: user.walletBalance,
      vehicles: user.vehicles,
      documents: user.documents,
      membershipType: user.membershipType,
      isVerified: user.isVerified,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile details
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      if (req.body.name || req.body.fullName) {
        user.name = req.body.name || req.body.fullName;
        user.fullName = req.body.fullName || req.body.name;
      }
      user.email = req.body.email || user.email;
      user.mobile = req.body.mobile || user.mobile;
      user.city = req.body.city || user.city;
      user.drivingLicence = req.body.drivingLicence || user.drivingLicence;
      if (req.body.isProfileCompleted !== undefined) {
        user.isProfileCompleted = req.body.isProfileCompleted;
      }
      
      // Update nested structures if provided
      if (req.body.vehicles) {
        user.vehicles = req.body.vehicles;
        try {
          const Vehicle = mongoose.model('Vehicle');
          const incomingPlates = req.body.vehicles.map(v => v.plate.trim().toUpperCase());
          await Vehicle.deleteMany({
            userId: user._id,
            vehicleNumber: { $nin: incomingPlates }
          });
          for (const v of req.body.vehicles) {
            const plateUpper = v.plate.trim().toUpperCase();
            await Vehicle.findOneAndUpdate(
              { userId: user._id, vehicleNumber: plateUpper },
              {
                $set: {
                  vehicleNumber: plateUpper,
                  model: v.model || 'Generic',
                  isPrimary: !!v.isPrimary,
                  vehicleType: 'Car',
                  fuelType: 'Petrol'
                }
              },
              { upsert: true, new: true }
            );
          }
        } catch (syncErr) {
          console.warn('Error syncing standalone vehicles during profile update:', syncErr.message);
        }
      }
      if (req.body.documents) user.documents = req.body.documents;
      if (req.body.paymentMethods) user.paymentMethods = req.body.paymentMethods;
      if (req.body.preferences) user.preferences = req.body.preferences;
      if (req.body.notifications) user.notifications = req.body.notifications;
      
      // Merge wallet updates or additions
      if (req.body.walletBalance !== undefined) {
        user.walletBalance = req.body.walletBalance;
      }

      // Check if password update is requested
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        city: updatedUser.city,
        drivingLicence: updatedUser.drivingLicence || '',
        isProfileCompleted: updatedUser.isProfileCompleted || false,
        role: updatedUser.role,
        walletBalance: updatedUser.walletBalance,
        vehicles: updatedUser.vehicles,
        documents: updatedUser.documents,
        paymentMethods: updatedUser.paymentMethods,
        preferences: updatedUser.preferences,
        notifications: updatedUser.notifications,
        token: generateToken(updatedUser._id)
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user plan by admin
// @route   PUT /api/auth/users/:id/plan
// @access  Private/Admin
export const updateUserPlan = async (req, res) => {
  const { plan } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.membershipType = plan === 'premium' ? 'Premium' : 'Free';
    await user.save();
    res.json({ message: `Plan updated successfully to ${user.membershipType}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get public statistics (counts of users and facilities)
// @route   GET /api/auth/public-stats
// @access  Public
export const getPublicStats = async (req, res) => {
  try {
    // Dynamically retrieve Booking model to count bookings as happy users
    const Booking = mongoose.model('Booking');
    const bookingCount = await Booking.countDocuments({});
    
    // Dynamically retrieve ParkingLocation model to avoid circular imports
    const ParkingLocation = mongoose.model('ParkingLocation');
    const facilityCount = await ParkingLocation.countDocuments({});
    
    res.json({
      users: bookingCount || 0,
      facilities: facilityCount || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify email OTP
// @route   POST /api/auth/verify-email-otp
// @access  Public
export const verifyEmailOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP code are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isVerified) {
      // Already verified, return login payload
      return res.json({
        _id: user._id,
        fullName: user.fullName,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        city: user.city,
        role: user.role,
        walletBalance: user.walletBalance,
        vehicles: user.vehicles,
        documents: user.documents,
        membershipType: user.membershipType,
        isVerified: user.isVerified,
        preferences: user.preferences,
        notifications: user.notifications,
        token: generateToken(user._id)
      });
    }

    if (!user.emailOtp || user.emailOtp !== otp || !user.emailOtpExpires || user.emailOtpExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    // Clear verification codes and mark as verified
    user.emailOtp = undefined;
    user.emailOtpExpires = undefined;
    user.isVerified = true;
    await user.save();

    res.json({
      _id: user._id,
      fullName: user.fullName,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      city: user.city,
      role: user.role,
      walletBalance: user.walletBalance,
      vehicles: user.vehicles,
      documents: user.documents,
      membershipType: user.membershipType,
      isVerified: user.isVerified,
      preferences: user.preferences,
      notifications: user.notifications,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resend email OTP
// @route   POST /api/auth/resend-email-otp
// @access  Public
export const resendEmailOtp = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Generate new 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailOtp = otp;
    user.emailOtpExpires = otpExpires;
    await user.save();

    await sendOtpEmail(user.email, user.fullName, otp);

    res.json({ message: 'Verification OTP sent to your email.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send email OTP before registration
// @route   POST /api/auth/send-public-otp
// @access  Public
export const sendPublicEmailOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email address is required' });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await EmailOtp.findOneAndUpdate(
      { email },
      { otp, expiresAt, isVerified: false },
      { upsert: true, new: true }
    );

    try {
      await sendOtpEmail(email, 'Drivix User', otp);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError.message);
      return res.status(500).json({ message: 'Failed to send verification email. Please check if email is correct.' });
    }

    res.json({ message: 'Verification OTP sent to your email.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify email OTP before registration
// @route   POST /api/auth/verify-public-otp
// @access  Public
export const verifyPublicEmailOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    const record = await EmailOtp.findOne({ email });
    if (!record || record.otp !== otp || record.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    record.isVerified = true;
    await record.save();

    res.json({ message: 'Email verified successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


