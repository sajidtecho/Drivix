import FASTag from '../models/FASTag.js';
import FASTagTransaction from '../models/FASTagTransaction.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';

// @desc    Register/Link a FASTag to a vehicle
// @route   POST /api/v1/fastags
// @access  Private
export const registerFASTag = async (req, res) => {
  const { vehicleId, bank, tagId } = req.body;

  if (!vehicleId || !bank) {
    return res.status(400).json({ message: 'Vehicle and Bank are required' });
  }

  try {
    const vehicle = await Vehicle.findOne({ _id: vehicleId, userId: req.user._id });
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found or not owned by you' });
    }

    // Check if vehicle already has a linked FASTag
    const existingTag = await FASTag.findOne({ vehicleId });
    if (existingTag) {
      return res.status(400).json({ message: 'This vehicle is already linked to a FASTag' });
    }

    // Generate a simulated Tag ID if not provided
    const resolvedTagId = tagId ? tagId.trim().toUpperCase() : 'FT' + Math.floor(100000000 + Math.random() * 900000000);

    // Link tag with a seed balance of 850 as per specs
    const fastag = await FASTag.create({
      userId: req.user._id,
      vehicleId,
      vehicleNumber: vehicle.vehicleNumber,
      bank,
      tagId: resolvedTagId,
      balance: 850,
      status: 'Active'
    });

    // Create a seed/initial transaction
    await FASTagTransaction.create({
      fastagId: fastag._id,
      type: 'Credit',
      amount: 850,
      description: 'Initial Balance Activation'
    });

    res.status(201).json(fastag);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's registered FASTags
// @route   GET /api/v1/fastags
// @access  Private
export const getMyFASTags = async (req, res) => {
  try {
    const tags = await FASTag.find({ userId: req.user._id });
    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Recharge a FASTag from the Drivix Wallet
// @route   POST /api/v1/fastags/:id/recharge
// @access  Private
export const rechargeFASTag = async (req, res) => {
  const { amount } = req.body;
  const rechargeAmount = Number(amount);

  if (!rechargeAmount || rechargeAmount <= 0) {
    return res.status(400).json({ message: 'Please enter a valid recharge amount' });
  }

  try {
    const fastag = await FASTag.findOne({ _id: req.params.id, userId: req.user._id });
    if (!fastag) {
      return res.status(404).json({ message: 'FASTag not found or not owned by you' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify wallet balance
    if (user.walletBalance < rechargeAmount) {
      return res.status(400).json({ 
        message: `Insufficient wallet balance. Required: Rs. ${rechargeAmount}, Current: Rs. ${user.walletBalance}. Please add money to your wallet.` 
      });
    }

    // Perform recharge transactions
    user.walletBalance -= rechargeAmount;
    await user.save();

    fastag.balance += rechargeAmount;
    if (fastag.balance >= fastag.thresholdLimit) {
      fastag.status = 'Active';
    }
    await fastag.save();

    // Log transaction
    const transaction = await FASTagTransaction.create({
      fastagId: fastag._id,
      type: 'Credit',
      amount: rechargeAmount,
      description: 'Recharge via Wallet'
    });

    res.json({
      message: 'Recharge successful!',
      fastag,
      transaction,
      walletBalance: user.walletBalance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get FASTag transaction history
// @route   GET /api/v1/fastags/:id/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const fastag = await FASTag.findOne({ _id: req.params.id, userId: req.user._id });
    if (!fastag) {
      return res.status(404).json({ message: 'FASTag not found or not owned by you' });
    }

    // Return transactions, sorted by newest first
    const transactions = await FASTagTransaction.find({ fastagId: fastag._id }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Configure Auto Recharge settings
// @route   PUT /api/v1/fastags/:id/auto-recharge
// @access  Private
export const updateAutoRecharge = async (req, res) => {
  const { autoRechargeEnabled, thresholdLimit, autoRechargeAmount } = req.body;

  try {
    const fastag = await FASTag.findOne({ _id: req.params.id, userId: req.user._id });
    if (!fastag) {
      return res.status(404).json({ message: 'FASTag not found' });
    }

    if (autoRechargeEnabled !== undefined) fastag.autoRechargeEnabled = autoRechargeEnabled;
    if (thresholdLimit !== undefined) fastag.thresholdLimit = Number(thresholdLimit);
    if (autoRechargeAmount !== undefined) fastag.autoRechargeAmount = Number(autoRechargeAmount);

    await fastag.save();
    res.json({ message: 'Auto recharge settings updated successfully', fastag });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Estimate Toll cost based on source and destination (mock engine)
// @route   POST /api/v1/fastags/estimate
// @access  Private
export const estimateToll = async (req, res) => {
  const { source, destination } = req.body;

  if (!source || !destination) {
    return res.status(400).json({ message: 'Source and Destination are required' });
  }

  try {
    const sClean = source.trim().toLowerCase();
    const dClean = destination.trim().toLowerCase();

    let distance = 0;
    let toll = 0;

    // Check predefined routes
    if (sClean.includes('sharda') && dClean.includes('airport')) {
      distance = 45;
      toll = 145;
    } else if (sClean.includes('noida') && dClean.includes('gurgaon')) {
      distance = 55;
      toll = 80;
    } else if (sClean.includes('connaught') && dClean.includes('noida')) {
      distance = 22;
      toll = 35;
    } else if (sClean.includes('delhi') && dClean.includes('agra')) {
      distance = 210;
      toll = 415;
    } else {
      // Dynamic fallback estimation based on name lengths to ensure any custom route is responsive
      const routeSeed = sClean.length + dClean.length;
      distance = Math.max(12, routeSeed * 2);
      toll = Math.max(25, Math.round(distance * 1.8));
    }

    // Include simulated toll booths
    const details = [];
    if (toll > 100) {
      details.push({ tollName: 'Entry Plaza', cost: 45 });
      details.push({ tollName: 'Express Tollbooth', cost: toll - 45 });
    } else {
      details.push({ tollName: 'Main Toll Plaza', cost: toll });
    }

    res.json({
      source,
      destination,
      distance,
      estimatedToll: toll,
      details
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
