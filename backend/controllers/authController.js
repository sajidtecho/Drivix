/* global process */
import jwt from 'jsonwebtoken';
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
      name,
      email,
      password,
      mobile,
      city,
      role
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        city: user.city,
        role: user.role,
        walletBalance: user.walletBalance,
        vehicles: user.vehicles,
        documents: user.documents,
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
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        city: user.city,
        role: user.role,
        walletBalance: user.walletBalance,
        vehicles: user.vehicles,
        documents: user.documents,
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
        email: user.email,
        mobile: user.mobile,
        city: user.city,
        role: user.role,
        walletBalance: user.walletBalance,
        vehicles: user.vehicles,
        documents: user.documents
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
  const { name, email } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      // Create user if not exists
      const role = email === 'drivixmobility@gmail.com' ? 'admin' : 'user';
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

      user = await User.create({
        name: name || 'Google User',
        email,
        password: randomPassword,
        mobile: '',
        city: '',
        role
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      city: user.city,
      role: user.role,
      walletBalance: user.walletBalance,
      vehicles: user.vehicles,
      documents: user.documents,
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
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      city: user.city,
      role: user.role,
      walletBalance: user.walletBalance,
      vehicles: user.vehicles,
      documents: user.documents,
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
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.mobile = req.body.mobile || user.mobile;
      user.city = req.body.city || user.city;
      
      // Update nested structures if provided
      if (req.body.vehicles) user.vehicles = req.body.vehicles;
      if (req.body.documents) user.documents = req.body.documents;
      
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
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        city: updatedUser.city,
        role: updatedUser.role,
        walletBalance: updatedUser.walletBalance,
        vehicles: updatedUser.vehicles,
        documents: updatedUser.documents,
        token: generateToken(updatedUser._id)
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
