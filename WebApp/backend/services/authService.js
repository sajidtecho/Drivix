import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import * as userRepository from '../repositories/userRepository.js';
import * as emailOtpRepository from '../repositories/emailOtpRepository.js';
import { sendOtpEmail } from './emailService.js';

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

export const registerUser = async ({ name, email, password, mobile, city }) => {
  const userExists = await userRepository.findByEmail(email);
  if (userExists) {
    throw new Error('User already exists');
  }

  const role = email === 'drivixmobility@gmail.com' ? 'admin' : 'user';

  const user = await userRepository.createUser({
    fullName: name || 'Drivix User',
    name: name || 'Drivix User',
    email,
    password,
    mobile,
    city,
    role,
    isVerified: true
  });

  if (!user) {
    throw new Error('Invalid user data');
  }

  return {
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
  };
};

export const loginUser = async ({ email, password }) => {
  const user = await userRepository.findByEmailWithPassword(email);
  if (!user || !(await user.matchPassword(password))) {
    throw new Error('Invalid email or password');
  }

  // Auto-verify user if they are not verified for any reason
  if (!user.isVerified) {
    user.isVerified = true;
    await user.save();
  }

  return {
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
  };
};

export const getUserProfile = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

export const authGoogle = async ({ credential }) => {
  if (!credential) {
    throw new Error('Google credential is required');
  }

  const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
  if (!response.ok) {
    throw new Error('Invalid Google credential token');
  }

  const payload = await response.json();
  const { email, name, picture } = payload;

  if (!email) {
    throw new Error('Email address not found in Google account metadata');
  }

  let user = await userRepository.findByEmail(email);

  if (!user) {
    const role = email === 'drivixmobility@gmail.com' ? 'admin' : 'user';
    const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

    user = await userRepository.createUser({
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

  return {
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
  };
};

export const authPhone = async ({ mobile }) => {
  let user = await userRepository.findByMobile(mobile);

  if (!user) {
    const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

    user = await userRepository.createUser({
      fullName: 'Mobile User',
      name: 'Mobile User',
      password: randomPassword,
      mobile,
      city: '',
      role: 'user'
    });
  }

  return {
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
  };
};

export const updateUserProfile = async (userId, updateData) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (updateData.name || updateData.fullName) {
    user.name = updateData.name || updateData.fullName;
    user.fullName = updateData.fullName || updateData.name;
  }
  user.email = updateData.email || user.email;
  user.mobile = updateData.mobile || user.mobile;
  user.city = updateData.city || user.city;
  user.drivingLicence = updateData.drivingLicence || user.drivingLicence;
  if (updateData.isProfileCompleted !== undefined) {
    user.isProfileCompleted = updateData.isProfileCompleted;
  }
  
  if (updateData.vehicles) {
    user.vehicles = updateData.vehicles;
    try {
      const Vehicle = mongoose.model('Vehicle');
      const incomingPlates = updateData.vehicles.map(v => v.plate.trim().toUpperCase());
      await Vehicle.deleteMany({
        userId: user._id,
        vehicleNumber: { $nin: incomingPlates }
      });
      for (const v of updateData.vehicles) {
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
  
  if (updateData.documents) user.documents = updateData.documents;
  if (updateData.paymentMethods) user.paymentMethods = updateData.paymentMethods;
  if (updateData.preferences) user.preferences = updateData.preferences;
  if (updateData.notifications) user.notifications = updateData.notifications;
  
  if (updateData.walletBalance !== undefined) {
    user.walletBalance = updateData.walletBalance;
  }

  if (updateData.password) {
    user.password = updateData.password;
  }

  const updatedUser = await user.save();

  return {
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
  };
};

export const getAllUsers = async () => {
  return await userRepository.findAll();
};

export const updateUserPlan = async (userId, plan) => {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  user.membershipType = plan === 'premium' ? 'Premium' : 'Free';
  await user.save();
  return user.membershipType;
};

export const getPublicStats = async () => {
  const Booking = mongoose.model('Booking');
  const bookingCount = await Booking.countDocuments({});
  
  const ParkingLocation = mongoose.model('ParkingLocation');
  const facilityCount = await ParkingLocation.countDocuments({});
  
  return {
    users: bookingCount || 0,
    facilities: facilityCount || 0
  };
};

export const verifyEmailOtp = async (email, otp) => {
  if (!email || !otp) {
    throw new Error('Email and OTP code are required.');
  }

  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new Error('User not found.');
  }

  if (user.isVerified) {
    return {
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
    };
  }

  if (!user.emailOtp || user.emailOtp !== otp || !user.emailOtpExpires || user.emailOtpExpires < Date.now()) {
    throw new Error('Invalid or expired OTP.');
  }

  user.emailOtp = undefined;
  user.emailOtpExpires = undefined;
  user.isVerified = true;
  await user.save();

  return {
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
  };
};

export const resendEmailOtp = async (email) => {
  if (!email) {
    throw new Error('Email is required.');
  }

  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new Error('User not found.');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  user.emailOtp = otp;
  user.emailOtpExpires = otpExpires;
  await user.save();

  try {
    await sendOtpEmail(user.email, user.fullName, otp);
    return { message: 'Verification OTP sent to your email.' };
  } catch (emailError) {
    console.warn('⚠️ SMTP Email delivery failed. Falling back to console log. Generated OTP for resend:', otp);
    return { message: 'SMTP settings missing. Verification OTP printed to backend console.' };
  }
};

export const sendPublicEmailOtp = async (email) => {
  if (!email) {
    throw new Error('Email address is required');
  }

  const userExists = await userRepository.findByEmail(email);
  if (userExists) {
    throw new Error('Email already registered');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await emailOtpRepository.createOrUpdateOtp(email, { otp, expiresAt, isVerified: false });

  try {
    await sendOtpEmail(email, 'Drivix User', otp);
    return { message: 'Verification OTP sent to your email.' };
  } catch (emailError) {
    console.warn('⚠️ SMTP Email delivery failed. Falling back to console log. Generated OTP:', otp);
    return { message: 'SMTP settings missing. Verification OTP printed to backend console.' };
  }
};

export const verifyPublicEmailOtp = async (email, otp) => {
  if (!email || !otp) {
    throw new Error('Email and OTP are required');
  }

  const record = await emailOtpRepository.findOtpByEmail(email);
  if (!record || record.otp !== otp || record.expiresAt < new Date()) {
    throw new Error('Invalid or expired OTP');
  }

  record.isVerified = true;
  await record.save();

  return { message: 'Email verified successfully.' };
};
