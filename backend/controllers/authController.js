/* global process */
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

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

    // Preserve original Drivix admin logic
    const role = email === 'drivixmobility@gmail.com' ? 'admin' : 'user';

    const user = await User.create({
      fullName: name || 'Drivix User',
      name: name || 'Drivix User',
      email,
      password,
      mobile,
      city,
      role
    });

    if (user) {
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

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
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
      const email = `${mobile}@drivix.com`; // placeholder email for Schema constraint
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

      user = await User.create({
        fullName: 'Mobile User',
        name: 'Mobile User',
        email,
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
      if (req.body.vehicles) user.vehicles = req.body.vehicles;
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
    const userCount = await User.countDocuments({});
    
    // Dynamically retrieve ParkingLocation model to avoid circular imports
    const ParkingLocation = mongoose.model('ParkingLocation');
    const facilityCount = await ParkingLocation.countDocuments({});
    
    res.json({
      users: userCount || 0,
      facilities: facilityCount || 0
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


