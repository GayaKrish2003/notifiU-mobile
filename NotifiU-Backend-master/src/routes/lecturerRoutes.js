const express = require('express');
const router = express.Router();

// Import lecturer controller
const {
    getLecturerProfile,
    updateLecturerProfile,
} = require('../controllers/lecturerController');

// Import middlewares
const { protect, authorize } = require('../middlewares/authMiddleware');

// ═══════════════════════════════════════════════════════════════
//  LECTURER PROFILE ROUTES (Authenticated Lecturers Only)
// ═══════════════════════════════════════════════════════════════

router.get('/profile', protect, authorize(['lecturer']), getLecturerProfile);
router.put('/profile', protect, authorize(['lecturer']), updateLecturerProfile);

module.exports = router;
