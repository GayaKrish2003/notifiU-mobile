const express = require('express');
const router  = express.Router();
const eventController      = require('../controllers/eventController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const eventPosterUpload    = require('../middlewares/eventPosterUploadMiddleware');

const canManage = ['superadmin', 'clubpresident'];
const allRoles  = ['superadmin', 'clubpresident', 'student', 'lecturer'];

// ── Notifications (student only) ──────────────────────────────────────────────
router.get('/user/notifications',
    protect,
    authorize(['student']),
    eventController.getNotifications
);

// ── My Events (creator's own events) ─────────────────────────────────────────
router.get('/my',
    protect,
    authorize(canManage),
    eventController.getMyEvents
);

// ── All Events ────────────────────────────────────────────────────────────────
router.get('/',
    protect,
    authorize(allRoles),
    eventController.getEvents
);

// ── Single Event ──────────────────────────────────────────────────────────────
router.get('/:id',
    protect,
    authorize(allRoles),
    eventController.getEventById
);

// ── Create Event ──────────────────────────────────────────────────────────────
router.post('/',
    protect,
    authorize(canManage),
    eventPosterUpload.single('posterImage'),
    eventController.createEvent
);

// ── Update Event ──────────────────────────────────────────────────────────────
router.put('/:id',
    protect,
    authorize(canManage),
    eventPosterUpload.single('posterImage'),
    eventController.updateEvent
);

// ── Delete Event ──────────────────────────────────────────────────────────────
router.delete('/:id',
    protect,
    authorize(canManage),
    eventController.deleteEvent
);

// ── RSVP ─────────────────────────────────────────────────────────────────────
router.post('/:id/rsvp',
    protect,
    authorize(['student']),
    eventController.rsvpEvent
);

// ── Mark Attendance ───────────────────────────────────────────────────────────
router.post('/:id/attendance',
    protect,
    authorize(['student']),
    eventController.markAttendance
);

module.exports = router;