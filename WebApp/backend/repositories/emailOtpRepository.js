import EmailOtp from '../models/EmailOtp.js';

export const findOtpByEmail = async (email) => {
  return await EmailOtp.findOne({ email });
};

export const createOrUpdateOtp = async (email, otpData) => {
  return await EmailOtp.findOneAndUpdate(
    { email },
    otpData,
    { upsert: true, new: true }
  );
};

export const deleteOtp = async (email) => {
  return await EmailOtp.deleteOne({ email });
};
