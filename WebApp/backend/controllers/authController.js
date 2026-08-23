import * as authService from '../services/authService.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, mobile, city } = req.body;
    const data = await authService.registerUser({ name, email, password, mobile, city });
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const data = await authService.loginUser({ email, password });
    res.json(data);
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await authService.getUserProfile(req.user._id);
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
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// @desc    Auth/Register user via Google Login
// @route   POST /api/auth/google
// @access  Public
export const authGoogle = async (req, res) => {
  try {
    const { credential } = req.body;
    const data = await authService.authGoogle({ credential });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth/Register user via Phone Login (after client OTP verify)
// @route   POST /api/auth/phone
// @access  Public
export const authPhone = async (req, res) => {
  try {
    const { mobile } = req.body;
    const data = await authService.authPhone({ mobile });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile details
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const data = await authService.updateUserProfile(req.user._id, req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await authService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user plan by admin
// @route   PUT /api/auth/users/:id/plan
// @access  Private/Admin
export const updateUserPlan = async (req, res) => {
  try {
    const { plan } = req.body;
    const updatedPlan = await authService.updateUserPlan(req.params.id, plan);
    res.json({ message: `Plan updated successfully to ${updatedPlan}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get public statistics (counts of users and facilities)
// @route   GET /api/auth/public-stats
// @access  Public
export const getPublicStats = async (req, res) => {
  try {
    const data = await authService.getPublicStats();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify email OTP
// @route   POST /api/auth/verify-email-otp
// @access  Public
export const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const data = await authService.verifyEmailOtp(email, otp);
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Resend email OTP
// @route   POST /api/auth/resend-email-otp
// @access  Public
export const resendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const data = await authService.resendEmailOtp(email);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send email OTP before registration
// @route   POST /api/auth/send-public-otp
// @access  Public
export const sendPublicEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const data = await authService.sendPublicEmailOtp(email);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify email OTP before registration
// @route   POST /api/auth/verify-public-otp
// @access  Public
export const verifyPublicEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const data = await authService.verifyPublicEmailOtp(email, otp);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
