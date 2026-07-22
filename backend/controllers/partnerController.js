import Partner from '../models/Partner.js';
import Booking from '../models/Booking.js';
import Review from '../models/Review.js';
import ParkingLocation from '../models/ParkingLocation.js';

// @desc    Submit a new partner registration application
// @route   POST /api/v1/partners/register
// @access  Public
export const createPartnerApplication = async (req, res) => {
  try {
    const {
      fullName,
      businessName,
      phone,
      email,
      address,
      city,
      state,
      pin,
      latitude,
      longitude,
      facilityType,
      slotsCount,
      vehicles,
      operatingHours,
      documentFile,
      notes
    } = req.body;

    // Validate required fields
    if (
      !fullName ||
      !businessName ||
      !phone ||
      !email ||
      !address ||
      !city ||
      !state ||
      !pin ||
      latitude === undefined ||
      longitude === undefined ||
      !facilityType ||
      !slotsCount ||
      !vehicles ||
      !operatingHours ||
      !documentFile
    ) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const application = await Partner.create({
      fullName,
      businessName,
      phone,
      email,
      address,
      city,
      state,
      pin,
      latitude: Number(latitude),
      longitude: Number(longitude),
      facilityType,
      slotsCount,
      vehicles,
      operatingHours,
      documentFile,
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });
  } catch (error) {
    console.error('Error in createPartnerApplication:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all partner applications (Admin only)
// @route   GET /api/v1/partners/all
// @access  Private/Admin
export const getAllPartnerApplications = async (req, res) => {
  try {
    // Note: auth middleware will verify the role, but controller double-checks it
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized as an admin' });
    }

    const applications = await Partner.find({}).sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    console.error('Error in getAllPartnerApplications:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get partner stats for the landing page
// @route   GET /api/v1/partners/stats
// @access  Public
export const getPartnerStats = async (req, res) => {
  try {
    const approvedPartnersCount = await Partner.countDocuments({ status: 'approved' });
    const activeLocationsCount = await ParkingLocation.countDocuments({ status: 'Active' });
    const activePartners = approvedPartnersCount + activeLocationsCount;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlyBookings = await Booking.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const reviews = await Review.find({});
    let satisfactionRating = 100;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = totalRating / reviews.length;
      satisfactionRating = Math.round((avgRating / 5) * 100);
    }

    res.json({
      success: true,
      activePartners,
      monthlyBookings,
      satisfactionRating
    });
  } catch (error) {
    console.error('Error in getPartnerStats:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update partner application status (Admin only)
// @route   PUT /api/v1/partners/:id/status
// @access  Private/Admin
export const updatePartnerApplicationStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized as an admin' });
    }

    const { status } = req.body;
    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const application = await Partner.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Partner application not found' });
    }

    application.status = status;
    await application.save();

    res.json({
      success: true,
      message: `Application status updated to ${status}`,
      data: application
    });
  } catch (error) {
    console.error('Error in updatePartnerApplicationStatus:', error.message);
    res.status(500).json({ message: error.message });
  }
};
