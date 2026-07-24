import mongoose from 'mongoose';

const BannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Banner title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Banner description is required'],
    trim: true
  },
  imageUrl: {
    type: String,
    required: [true, 'Banner image URL is required'],
    trim: true
  },
  ctaText: {
    type: String,
    default: 'Learn More',
    trim: true
  },
  redirectUrl: {
    type: String,
    required: [true, 'Banner redirect URL is required'],
    trim: true
  },
  priority: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startDate: {
    type: Date,
    default: null
  },
  endDate: {
    type: Date,
    default: null
  },
  // Analytics
  impressions: {
    type: Number,
    default: 0
  },
  clicks: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Banner = mongoose.model('Banner', BannerSchema);
export default Banner;
