import Banner from '../models/Banner.js';

// @desc    Get active banners for carousel
// @route   GET /api/v1/banners
// @access  Public
export const getActiveBanners = async (req, res) => {
  try {
    const now = new Date();
    // Query condition: isActive must be true, and current time should be within optional start/end display dates
    const query = {
      isActive: true,
      $and: [
        {
          $or: [
            { startDate: null },
            { startDate: { $lte: now } }
          ]
        },
        {
          $or: [
            { endDate: null },
            { endDate: { $gte: now } }
          ]
        }
      ]
    };

    const banners = await Banner.find(query).sort({ priority: 1, createdAt: -1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all banners (including inactive) for admin
// @route   GET /api/v1/banners/admin
// @access  Private/Admin
export const getAdminBanners = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized as an admin' });
  }

  try {
    const banners = await Banner.find({}).sort({ priority: 1, createdAt: -1 });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new advertisement banner
// @route   POST /api/v1/banners
// @access  Private/Admin
export const createBanner = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized as an admin' });
  }

  const { title, description, imageUrl, ctaText, redirectUrl, priority, isActive, startDate, endDate } = req.body;

  try {
    const banner = await Banner.create({
      title,
      description,
      imageUrl,
      ctaText: ctaText || 'Learn More',
      redirectUrl,
      priority: Number(priority || 0),
      isActive: isActive !== undefined ? isActive : true,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null
    });

    res.status(201).json(banner);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a banner properties
// @route   PUT /api/v1/banners/:id
// @access  Private/Admin
export const updateBanner = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized as an admin' });
  }

  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    banner.title = req.body.title || banner.title;
    banner.description = req.body.description || banner.description;
    banner.imageUrl = req.body.imageUrl || banner.imageUrl;
    banner.ctaText = req.body.ctaText || banner.ctaText;
    banner.redirectUrl = req.body.redirectUrl || banner.redirectUrl;
    
    if (req.body.priority !== undefined) {
      banner.priority = Number(req.body.priority);
    }
    if (req.body.isActive !== undefined) {
      banner.isActive = req.body.isActive;
    }
    
    banner.startDate = req.body.startDate ? new Date(req.body.startDate) : (req.body.startDate === null ? null : banner.startDate);
    banner.endDate = req.body.endDate ? new Date(req.body.endDate) : (req.body.endDate === null ? null : banner.endDate);

    const updated = await banner.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a banner
// @route   DELETE /api/v1/banners/:id
// @access  Private/Admin
export const deleteBanner = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized as an admin' });
  }

  try {
    const banner = await Banner.findById(req.params.id);

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    await banner.deleteOne();
    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Increment banner impressions
// @route   POST /api/v1/banners/:id/impression
// @access  Public
export const trackImpression = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      { $inc: { impressions: 1 } },
      { new: true }
    );
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    res.json({ success: true, impressions: banner.impressions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Increment banner clicks
// @route   POST /api/v1/banners/:id/click
// @access  Public
export const trackClick = async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      { $inc: { clicks: 1 } },
      { new: true }
    );
    if (!banner) {
      return res.status(404).json({ message: 'Banner not found' });
    }
    res.json({ success: true, clicks: banner.clicks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
