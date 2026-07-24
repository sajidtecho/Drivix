import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Creates an in-app notification record and dispatches simulated Email and SMS alerts.
 * 
 * @param {Object} params
 * @param {string} params.userId - Target user's database ID
 * @param {string} params.title - Title of the notification
 * @param {string} params.message - Notification message content
 * @param {string} [params.type='booking'] - Category type ('booking'|'payment'|'complaint'|'system')
 */
export const sendBookingNotification = async ({ userId, title, message, type = 'booking' }) => {
  try {
    // 1. Fetch user email and mobile from database
    const user = await User.findById(userId);
    if (!user) {
      console.warn(`[Notification Warning] User not found for ID: ${userId}. Skipping notification dispatch.`);
      return;
    }

    const email = user.email || 'no-email@drivix.com';
    const mobile = user.mobile || 'No mobile registered';
    const name = user.fullName || user.name || 'Drivix User';

    // 2. Create in-app Notification record in DB
    const dbNotif = await Notification.create({
      userId,
      title,
      message,
      type
    });

    // 3. Dispatch Simulated Email Notification to console
    console.log(`
┌────────────────────────────────────────────────────────────────────────┐
│ [EMAIL NOTIFICATION DISPATCHED]                                        │
├────────────────────────────────────────────────────────────────────────┤
│ To:      ${email.padEnd(54)} │
│ Name:    ${name.padEnd(54)} │
│ Subject: ${(title + ' - Drivix Smart Parking').padEnd(54)} │
├────────────────────────────────────────────────────────────────────────┤
│ Message Body:                                                          │
│                                                                        │
│ ${message.padEnd(70)} │
│                                                                        │
│ Thanks for choosing us!                                                │
│ - The Drivix Team                                                      │
└────────────────────────────────────────────────────────────────────────┘
`);

    // 4. Dispatch Simulated SMS Notification to console
    console.log(`
┌────────────────────────────────────────────────────────────────────────┐
│ [SMS NOTIFICATION DISPATCHED]                                          │
├────────────────────────────────────────────────────────────────────────┤
│ Recipient: ${mobile.padEnd(51)} │
├────────────────────────────────────────────────────────────────────────┤
│ Body: Drivix - ${message.slice(0, 120)}...                             │
│ Thanks for choosing us!                                                │
└────────────────────────────────────────────────────────────────────────┘
`);

    return dbNotif;
  } catch (error) {
    console.error(`[Notification Error] Failed to dispatch notifications: ${error.message}`);
  }
};
