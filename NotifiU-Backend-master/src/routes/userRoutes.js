const express = require('express');
const router = express.Router();

const {
    // Registration
    registerUser,
    registerStudent,
    registerLecturer,
    registerJobProvider,
    registerClubPresident,
    // Login
    loginUser,
    loginStudent,
    loginLecturer,
    loginJobProvider,

    refreshToken,
    logoutUser,
    getUserProfile,
    getUserById,
    getUserProfileById,
    updateProfile,
    updateUserProfile,
    uploadProfileImage,
    changePassword,
    getProfileCompletion,
    // Admin
    getAllUsers,
    adminCreateUser,
    updateUserRole,
    updateAccountStatus,
    updatePaymentStatus,
    updateUserByAdmin,
    softDeleteUser,
    deleteUser,
    // Activity
    getUserActivity,
    // Export
    exportUsersCSV,
    exportUsersExcel,
} = require('../controllers/userController');

// Import middlewares
const { protect, authorize } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// ═══════════════════════════════════════════════════════════════
//  PUBLIC AUTH ROUTES
// ═══════════════════════════════════════════════════════════════

// Registration routes (multi-role)
router.post('/register', registerUser);
router.post('/register/student', registerStudent);
router.post('/register/lecturer', registerLecturer);
router.post('/register/jobprovider', registerJobProvider);
router.post('/register/clubpresident', registerClubPresident); 

// Login routes (role-specific)
router.post('/login', loginUser);
router.post('/login/student', loginStudent);
router.post('/login/lecturer', loginLecturer);
router.post('/login/jobprovider', loginJobProvider);

// Token management
router.get('/refresh', refreshToken);
router.post('/logout', logoutUser);


// ═══════════════════════════════════════════════════════════════
//  PRIVATE PROFILE ROUTES (Authenticated Users)
// ═══════════════════════════════════════════════════════════════

router.get('/profile', protect, getUserProfile);
router.get('/profile/:id', protect, getUserProfileById);
router.get('/details/:id', protect, getUserById);
router.put('/profile', protect, updateUserProfile);
router.put('/profile/image', protect, upload.single('profileImage'), uploadProfileImage);
router.put('/profile/password', protect, changePassword);
router.put('/profile/:id', protect, updateProfile);
router.get('/profile/completion', protect, getProfileCompletion);

// ═══════════════════════════════════════════════════════════════
//  ADMIN ROUTES (SuperAdmin Only)
// ═══════════════════════════════════════════════════════════════

// Export routes (must be before /:id routes to avoid conflicts)
router.get('/export/csv', protect, authorize(['superadmin']), exportUsersCSV);
router.get('/export/excel', protect, authorize(['superadmin']), exportUsersExcel);

// Admin manual user creation
router.post('/admin/create', protect, authorize(['superadmin']), adminCreateUser);

// User listing with search, filter, pagination
router.get('/', protect, authorize(['superadmin']), getAllUsers);

// User management by ID
router.put('/:id', protect, authorize(['superadmin']), updateUserByAdmin);
router.patch('/:id/role', protect, authorize(['superadmin']), updateUserRole);
router.patch('/:id/status', protect, authorize(['superadmin']), updateAccountStatus);
router.patch('/:id/payment-status', protect, authorize(['superadmin']), updatePaymentStatus);
router.get('/:id/activity', protect, authorize(['superadmin']), getUserActivity);
router.delete('/:id/soft', protect, authorize(['superadmin']), softDeleteUser);
router.delete('/:id', protect, authorize(['superadmin']), deleteUser);

module.exports = router;
