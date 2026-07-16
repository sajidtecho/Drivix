import Partner from '../models/Partner.js';

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
