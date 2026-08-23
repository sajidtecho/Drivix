import User from '../models/User.js';

export const findByEmail = async (email) => {
  return await User.findOne({ email });
};

export const findByEmailWithPassword = async (email) => {
  return await User.findOne({ email }).select('+password');
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
