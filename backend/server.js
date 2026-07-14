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
import { seedBanners } from './utils/seedBanners.js';
import { seedPlaces } from './controllers/placeController.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

import mongoose from 'mongoose';
// Load environment variables
dotenv.config();

// Connect to Database
connectDB().then(() => {
  seedBanners();
  seedPlaces();
}).catch(err => console.error('Database connection error during seeding:', err));

const app = express();
// Port configuration
const PORT = process.env.PORT || 5000;

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(cors());
app.use(express.json());
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
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/banners', bannerRoutes);
app.use('/api/v1/places', placeRoutes);

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

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Periodically release expired temporary slot reservations and auto-vacate expired bookings (runs every 10 seconds)
setInterval(async () => {
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
      status: 'booked'
    });

    for (const booking of expiredBookings) {
      const endTime = new Date(booking.createdAt.getTime() + booking.duration * 60 * 60 * 1000);
      if (endTime < now) {
        console.log(`🧹 Auto-vacating expired booking: ${booking.bookingId}`);
        booking.status = 'completed';
        await booking.save();

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
    }
  } catch (err) {
    console.error('Error during expired slot/booking cleanup:', err);
  }
}, 10000);

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
// Trigger nodemon reload
