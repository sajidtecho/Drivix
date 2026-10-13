import User from '../models/User.js';

export const findByEmail = async (email) => {
  if (!email) return null;
  const normalized = email.toLowerCase().trim();
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return await User.findOne({
    $or: [
      { email: normalized },
      { email: { $regex: new RegExp(`^${escaped}$`, 'i') } }
    ]
  });
};

export const findByEmailWithPassword = async (email) => {
  if (!email) return null;
  const normalized = email.toLowerCase().trim();
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return await User.findOne({
    $or: [
      { email: normalized },
      { email: { $regex: new RegExp(`^${escaped}$`, 'i') } }
    ]
  }).select('+password');
};

export const findByMobile = async (mobile) => {
  return await User.findOne({ mobile });
};

export const findById = async (id) => {
  return await User.findById(id);
};

export const createUser = async (userData) => {
  return await User.create(userData);
};

export const findAll = async () => {
  return await User.find({}).select('-password');
};
