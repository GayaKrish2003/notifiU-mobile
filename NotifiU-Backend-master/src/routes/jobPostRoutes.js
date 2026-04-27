const express = require('express');
const router = express.Router();


const {
    createJobPost,
    getMyJobPosts,
    deleteJobPost,
    getApprovedJobPosts,
    toggleBookmark,
    toggleMarkApplied,
    getBookmarkedJobs,
    getAppliedJobs,
    incrementViewCount,
    getAllJobPostsAdmin,
    approveJobPost,
    rejectJobPost,
    updateJobPost,
} = require('../controllers/jobPostController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// ═══════════════════════════════════════════════════════
//  JOB PROVIDER ROUTES
//  Must be logged in + must have jobprovider role
// ═══════════════════════════════════════════════════════

// Create a new job post
router.post(
    '/',
    protect,
    authorize(['jobprovider']),
    createJobPost
);

// Get all their own job posts
router.get(
    '/my-posts',
    protect,
    authorize(['jobprovider']),
    getMyJobPosts
);

// Delete their own job post
router.delete(
    '/:id',
    protect,
    authorize(['jobprovider', 'superadmin']), // admin can also delete if needed
    deleteJobPost
);

router.patch('/:id/edit', protect, authorize(['jobprovider']), updateJobPost);

// ═══════════════════════════════════════════════════════
//  STUDENT ROUTES
//  Must be logged in + must have student role
// ═══════════════════════════════════════════════════════

// Browse all approved non-expired jobs (with search & filter)
router.get(
    '/',
    protect,
    authorize(['student']),
    getApprovedJobPosts
);

// Get their bookmarked jobs
router.get(
    '/bookmarks',
    protect,
    authorize(['student']),
    getBookmarkedJobs
);

// Get their applied jobs
router.get(
    '/applied',
    protect,
    authorize(['student']),
    getAppliedJobs
);

// Toggle bookmark on a job
router.patch(
    '/:id/bookmark',
    protect,
    authorize(['student']),
    toggleBookmark
);

// Toggle mark as applied on a job
router.patch(
    '/:id/mark-applied',
    protect,
    authorize(['student']),
    toggleMarkApplied
);

// Increment view count when student clicks Apply Now
router.patch(
    '/:id/view',
    protect,
    authorize(['student']),
    incrementViewCount
);

// ═══════════════════════════════════════════════════════
//  SUPERADMIN ROUTES
//  Must be logged in + must have superadmin role
// ═══════════════════════════════════════════════════════

// Get all job posts (any status) for review
router.get(
    '/admin',
    protect,
    authorize(['superadmin']),
    getAllJobPostsAdmin
);

// Approve a job post
router.patch(
    '/:id/approve',
    protect,
    authorize(['superadmin']),
    approveJobPost
);

// Reject a job post with a reason
router.patch(
    '/:id/reject',
    protect,
    authorize(['superadmin']),
    rejectJobPost
);

module.exports = router;