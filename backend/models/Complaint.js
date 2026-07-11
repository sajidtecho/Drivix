import mongoose from 'mongoose';

const ComplaintSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: false // Optional, as some complaints may be general or app-related
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    image: {
      type: String,
      default: '' // Base64 or URL
    },
    complaintStatus: {
      type: String,
      enum: {
        values: ['pending', 'in-progress', 'resolved'],
        message: 'Status must be pending, in-progress, or resolved'
      },
      default: 'pending'
    },
    adminRemark: {
      type: String,
      default: ''
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

const Complaint = mongoose.model('Complaint', ComplaintSchema);
export default Complaint;
