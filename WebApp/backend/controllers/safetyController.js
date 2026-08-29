import SafetyLog from '../models/SafetyLog.js';

export const logSafetyAlert = async (req, res) => {
  try {
    const { userId, bookingId, alertType, duration } = req.body;

    if (!alertType) {
      return res.status(400).json({ message: 'alertType is required' });
    }

    const log = await SafetyLog.create({
      userId: userId || null,
      bookingId: bookingId || null,
      alertType,
      duration: duration || 0,
      timestamp: new Date()
    });

    // Broadcast the alert via Socket.IO
    const io = req.app.get('socketio');
    if (io) {
      io.emit('safetyAlertReceived', {
        userId: userId || null,
        bookingId: bookingId || null,
        alertType,
        duration: duration || 0,
        logId: log._id,
        timestamp: log.timestamp
      });
    }

    res.status(201).json({
      success: true,
      message: 'Safety alert logged and broadcasted successfully',
      log
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSafetyLogs = async (req, res) => {
  try {
    const query = {};
    if (req.query.bookingId) query.bookingId = req.query.bookingId;
    if (req.query.userId) query.userId = req.query.userId;

    const logs = await SafetyLog.find(query).sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
