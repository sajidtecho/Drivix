import Complaint from '../models/Complaint.js';

// @desc    Create a new complaint
// @route   POST /api/v1/complaints
// @access  Private
export const createComplaint = async (req, res) => {
  const { title, description, image, bookingId, contact, email, slotLocation } = req.body;

  try {
    const complaint = await Complaint.create({
      userId: req.user._id,
      bookingId: bookingId || undefined,
      title,
      description,
      image: image || '',
      contact,
      email,
      slotLocation,
      complaintStatus: 'pending'
    });

    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user's complaints
// @route   GET /api/v1/complaints/my
// @access  Private
export const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all complaints (Admin only)
// @route   GET /api/v1/complaints/all
// @access  Private/Admin
export const getAllComplaints = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized as an admin' });
  }

  try {
    // Populate user details for the admin console
    const complaints = await Complaint.find({})
      .populate('userId', 'fullName name email mobile')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resolve a complaint
// @route   PUT /api/v1/complaints/:id/resolve
// @access  Private/Admin
export const resolveComplaint = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized as an admin' });
  }

  const { adminRemark } = req.body;

  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    complaint.complaintStatus = 'resolved';
    if (adminRemark !== undefined) {
      complaint.adminRemark = adminRemark;
    }

    const updatedComplaint = await complaint.save();
    res.json(updatedComplaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
