import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import Slot from './models/Slot.js';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import morgan from 'morgan';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import parkingRoutes from './routes/parkingRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import placeRoutes from './routes/placeRoutes.js';
import partnerRoutes from './routes/partnerRoutes.js';
import fastagRoutes from './routes/fastagRoutes.js';
import gateRoutes from './routes/gateRoutes.js';
import { seedBanners } from './utils/seedBanners.js';
import { seedPlaces } from './controllers/placeController.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { runDatabaseMigration } from './utils/migration.js';
import { getFloorAvailability } from './controllers/parkingController.js';
import { getSlotRecommendations } from './controllers/bookingController.js';
import { ASSIGNMENT_THRESHOLD_MINUTES } from './services/SlotAllocationService.js';

import mongoose from 'mongoose';
// Load environment variables
dotenv.config();

// Connect to Database
connectDB().then(() => {
  seedBanners();
  seedPlaces();
  runDatabaseMigration();
}).catch(err => console.error('Database connection error during seeding:', err));

const app = express();
// Port configuration
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(morgan('dev'));

// Basic Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Drivix API',
    status: 'online'
  });
});

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Mounted Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/parking', parkingRoutes);
app.get('/api/parking/floors/:floorId/availability', getFloorAvailability);
app.use('/api/v1/bookings', bookingRoutes);
app.get('/api/bookings/:bookingId/slot-recommendations', getSlotRecommendations);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/banners', bannerRoutes);
app.use('/api/v1/places', placeRoutes);
app.use('/api/v1/partners', partnerRoutes);
app.use('/api/v1/fastags', fastagRoutes);
app.use('/api/v1/gate', gateRoutes);

// Centralized Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

// Create HTTP Server and bind Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
app.set('socketio', io);
global.io = io;

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Periodically release expired temporary slot reservations and auto-vacate expired bookings (runs every 10 seconds)
setInterval(async () => {
  // Check if database is connected before querying
  if (mongoose.connection.readyState !== 1) {
    return;
  }

  try {
    const now = new Date();
    const expiredSlots = await Slot.find({
      status: 'temporarily_reserved',
      reservationExpiresAt: { $lt: now }
    });

    if (expiredSlots.length > 0) {
      console.log(`🧹 Releasing ${expiredSlots.length} expired reservations`);
      for (const slot of expiredSlots) {
        slot.status = 'available';
        slot.reservedBy = null;
        slot.reservationExpiresAt = null;
        await slot.save();

        io.emit('slotStatusUpdated', {
          facilityId: slot.facilityId.toString(),
          id: slot.id,
          status: 'available',
          reservationExpiresAt: null,
          reservedBy: null
        });
      }
    }

    // Auto-vacate active bookings that are past their duration
    const Booking = mongoose.model('Booking');
    const expiredBookings = await Booking.find({
      status: { $in: ['booked', 'Confirmed', 'Slot Assigned', 'Checked In'] }
    });

    for (const booking of expiredBookings) {
      let endDateTime;
      if (booking.bookingDate && booking.endTime) {
        endDateTime = new Date(`${booking.bookingDate}T${booking.endTime}:00`);
      } else {
        endDateTime = new Date(booking.createdAt.getTime() + booking.duration * 60 * 60 * 1000);
      }

      if (endDateTime < now) {
        console.log(`🧹 Auto-vacating/expiring booking: ${booking.bookingId}`);
        const oldStatus = booking.status;
        
        if (oldStatus === 'Checked In') {
          booking.status = 'Checked Out';
        } else {
          booking.status = 'Expired';
        }
        await booking.save();

        if (booking.slotId) {
          const slot = await Slot.findOne({ facilityId: booking.locationId, id: booking.slotId });
          if (slot) {
            slot.status = 'available';
            await slot.save();

            io.emit('slotStatusUpdated', {
              facilityId: booking.locationId.toString(),
              id: booking.slotId,
              status: 'available',
              reservationExpiresAt: null,
              reservedBy: null
            });
          }
        }

        // Update floor capacity counters
        try {
          const { updateFloorCounters } = await import('./controllers/bookingController.js');
          await updateFloorCounters(booking.parkingHubId, booking.floorId);
        } catch (err) {
          console.warn('Error dynamically importing updateFloorCounters in background task:', err.message);
        }
      }
    }

    // Prompt arrival confirmation for bookings starting in <= 30 mins
    const upcomingBookings = await Booking.find({
      status: 'Confirmed',
      arrivalConfirmed: false
    });

    for (const booking of upcomingBookings) {
      if (booking.bookingDate && booking.startTime) {
        const startDateTime = new Date(`${booking.bookingDate}T${booking.startTime}:00`);
        const timeDiffMs = startDateTime.getTime() - now.getTime();
        const timeDiffMins = timeDiffMs / (1000 * 60);

        // Auto-allocate slot if time is within threshold and slot is not yet assigned
        if (timeDiffMins <= ASSIGNMENT_THRESHOLD_MINUTES && timeDiffMins > 0 && !booking.slotId) {
          console.log(`[Auto-Allocation] Triggering slot allocation for booking: ${booking.bookingId} starting in ${Math.round(timeDiffMins)} mins`);
          try {
            const { SlotAllocationService } = await import('./services/SlotAllocationService.js');
            await SlotAllocationService.allocateSlot(booking._id);
          } catch (err) {
            console.error(`[Auto-Allocation] Failed for booking ${booking.bookingId}:`, err.message);
          }
        }

        // If booking starts in <= 30 minutes, and we haven't prompted them yet
        if (timeDiffMins <= 30 && timeDiffMins > 0) {
          console.log(`[Arrival Check] Prompting arrival check for: ${booking.bookingId} (starts in ${Math.round(timeDiffMins)} mins)`);
          
          io.emit('arrivalConfirmationPrompt', {
            bookingId: booking._id.toString(),
            customId: booking.bookingId,
            message: 'Are you still coming? Your reservation starts in 30 minutes.',
            options: ['yes', 'delay', 'cancel']
          });

          // Store temporary ETA prompt tracking to avoid spamming
          booking.ETA = Math.round(timeDiffMins);
          await booking.save();
        }
        
        // Auto-expire unconfirmed bookings if they are 15 minutes past their start time
        if (timeDiffMins < -15) {
          console.log(`🧹 Auto-cancelling unconfirmed booking: ${booking.bookingId}`);
          booking.status = 'Expired';
          await booking.save();
          
          try {
            const { updateFloorCounters } = await import('./controllers/bookingController.js');
            await updateFloorCounters(booking.parkingHubId, booking.floorId);
          } catch (err) {
            console.warn('Error dynamically importing updateFloorCounters in background task:', err.message);
          }
        }
      }
    }
  } catch (err) {
    if (err.name === 'MongoServerSelectionError' || err.name === 'MongoNetworkError' || err.name === 'MongoNetworkTimeoutError') {
      console.warn(`⚠️ Database connection issues during cleanup: ${err.message}`);
    } else {
      console.error('Error during expired slot/booking cleanup:', err);
    }
  }
}, 10000);

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
// Trigger nodemon reload
