const cron    = require('node-cron');
const fetch   = require('node-fetch');
const Event   = require('../models/Event');
const User    = require('../models/user');

// Runs every minute
const startEventNotificationCron = () => {
    cron.schedule('* * * * *', async () => {
        try {
            const now        = new Date();
            const in15       = new Date(now.getTime() + 15 * 60 * 1000);
            const windowLow  = new Date(in15.getTime() - 30 * 1000); // 14:30 from now
            const windowHigh = new Date(in15.getTime() + 30 * 1000); // 15:30 from now

            // Find events starting in ~15 minutes
            const events = await Event.find({
                startTime: { $gte: windowLow, $lte: windowHigh },
            });

            if (events.length === 0) return;

            for (const event of events) {
                if (!event.rsvpList || event.rsvpList.length === 0) continue;

                // Get all RSVPed student IDs
                const studentIds = event.rsvpList.map(r => r.studentId);

                // Find their push tokens
                const users = await User.find({
                    studentId: { $in: studentIds },
                    pushToken: { $ne: null },
                }).select('pushToken');

                if (users.length === 0) continue;

                // Build Expo push messages
                const messages = users.map(u => ({
                    to:    u.pushToken,
                    sound: 'default',
                    title: `📅 ${event.title} starts in 15 minutes!`,
                    body:  `📍 ${event.location} — Don't forget to mark your attendance when you arrive.`,
                    data:  { eventId: String(event._id) },
                }));

                // Send to Expo Push API in chunks of 100
                const chunkSize = 100;
                for (let i = 0; i < messages.length; i += chunkSize) {
                    const chunk = messages.slice(i, i + chunkSize);
                    await fetch('https://exp.host/--/api/v2/push/send', {
                        method:  'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body:    JSON.stringify(chunk),
                    });
                }

                console.log(`[CRON] Sent ${users.length} push notifications for event: ${event.title}`);
            }
        } catch (err) {
            console.error('[CRON] Event notification error:', err.message);
        }
    });

    console.log('[CRON] Event notification scheduler started');
};

module.exports = { startEventNotificationCron };