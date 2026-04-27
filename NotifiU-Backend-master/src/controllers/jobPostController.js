const JobPost = require('../models/jobPost');

// @desc    Create a new job post
// @route   POST /api/jobs
// @access  Job Provider only
const createJobPost = async (req, res) => {
    try {
        // req.body contains everything the job provider typed in the form
        const {
            title,
            description,
            companyName,
            jobType,
            location,
            skills,
            salaryRange,
            applicationLink,
            deadline,
        } = req.body;

        // req.user is set by the protect middleware automatically
        // It contains the logged-in user's data including their _id
        const jobPost = await JobPost.create({
            postedBy: req.user._id,
            title,
            description,
            companyName,
            jobType,
            location,
            skills,
            salaryRange,
            applicationLink,
            deadline,
        });

        res.status(201).json({
            success: true,
            message: 'Job post created successfully. Waiting for admin approval.',
            data: jobPost,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



// @desc    Get all job posts by the logged-in job provider
// @route   GET /api/jobs/my-posts
// @access  Job Provider only
const getMyJobPosts = async (req, res) => {
    try {
        // Find only posts where postedBy matches the logged-in user's id
        const jobPosts = await JobPost.find({ postedBy: req.user._id })
            .sort({ createdAt: -1 }); // newest first

        res.status(200).json({
            success: true,
            count: jobPosts.length,
            data: jobPosts,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



// @desc    Delete a job post (only the owner can delete it)
// @route   DELETE /api/jobs/:id
// @access  Job Provider only
const deleteJobPost = async (req, res) => {
    try {
        const jobPost = await JobPost.findById(req.params.id);

        // Check if the post actually exists
        if (!jobPost) {
            return res.status(404).json({
                success: false,
                message: 'Job post not found',
            });
        }

        // Security check — make sure this job provider owns this post
        // .toString() is needed because one is an ObjectId and one is a string
        if (jobPost.postedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete this post',
            });
        }

        await jobPost.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Job post deleted successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



// @desc    Get all approved and non-expired job posts (with search & filter)
// @route   GET /api/jobs
// @access  Student only
const getApprovedJobPosts = async (req, res) => {
    try {
        // req.query contains URL parameters like ?jobType=internship&search=react
        const { search, jobType, skills } = req.query;

        // Start with the base filter — only approved, non-expired posts
        const filter = {
            status: 'approved',
            isExpired: false,
        };

        // If student typed something in the search bar
        // $regex does a partial match (like SQL LIKE)
        // $options: 'i' makes it case-insensitive
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { companyName: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        // If student filtered by job type
        if (jobType) {
            filter.jobType = jobType;
        }

        // If student filtered by a skill
        if (skills) {
            // $in checks if the skills array contains the searched skill
            filter.skills = { $in: [skills] };
        }

        const jobPosts = await JobPost.find(filter)
            .populate('postedBy', 'companyName companyWebsite')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: jobPosts.length,
            data: jobPosts,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



// @desc    Toggle bookmark on a job post
// @route   PATCH /api/jobs/:id/bookmark
// @access  Student only
const toggleBookmark = async (req, res) => {
    try {
        const jobPost = await JobPost.findById(req.params.id);

        if (!jobPost) {
            return res.status(404).json({
                success: false,
                message: 'Job post not found',
            });
        }

        const User = require('../models/user');
        const user = await User.findById(req.user._id);

        // Check if this job is already in the student's bookmarks
        const alreadyBookmarked = user.bookmarkedJobs.includes(req.params.id);

        if (alreadyBookmarked) {
            // Remove it — filter out this jobId from the array
            user.bookmarkedJobs = user.bookmarkedJobs.filter(
                (id) => id.toString() !== req.params.id
            );
        } else {
            // Add it
            user.bookmarkedJobs.push(req.params.id);
        }

        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: alreadyBookmarked ? 'Bookmark removed' : 'Job bookmarked successfully',
            isBookmarked: !alreadyBookmarked,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



// @desc    Toggle mark as applied on a job post
// @route   PATCH /api/jobs/:id/mark-applied
// @access  Student only
const toggleMarkApplied = async (req, res) => {
    try {
        const jobPost = await JobPost.findById(req.params.id);

        if (!jobPost) {
            return res.status(404).json({
                success: false,
                message: 'Job post not found',
            });
        }

        const User = require('../models/user');
        const user = await User.findById(req.user._id);

        const alreadyApplied = user.appliedJobs.includes(req.params.id);

        if (alreadyApplied) {
            user.appliedJobs = user.appliedJobs.filter(
                (id) => id.toString() !== req.params.id
            );
        } else {
            user.appliedJobs.push(req.params.id);
        }

        await user.save({ validateBeforeSave: false });

        res.status(200).json({
            success: true,
            message: alreadyApplied ? 'Removed from applied jobs' : 'Marked as applied',
            isApplied: !alreadyApplied,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



// @desc    Get all bookmarked jobs for the logged-in student
// @route   GET /api/jobs/bookmarks
// @access  Student only
const getBookmarkedJobs = async (req, res) => {
    try {
        const User = require('../models/user');

        // populate() replaces each ObjectId in bookmarkedJobs
        // with the actual full JobPost document
        const user = await User.findById(req.user._id)
            .populate({
                path: 'bookmarkedJobs',
                match: { isExpired: false }, // don't show expired bookmarks
            });

        res.status(200).json({
            success: true,
            count: user.bookmarkedJobs.length,
            data: user.bookmarkedJobs,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



// @desc    Get all applied jobs for the logged-in student
// @route   GET /api/jobs/applied
// @access  Student only
const getAppliedJobs = async (req, res) => {
    try {
        const User = require('../models/user');

        const user = await User.findById(req.user._id)
            .populate('appliedJobs');

        res.status(200).json({
            success: true,
            count: user.appliedJobs.length,
            data: user.appliedJobs,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



// @desc    Increment view count when student clicks Apply Now
// @route   PATCH /api/jobs/:id/view
// @access  Student only
const incrementViewCount = async (req, res) => {
    try {
        const jobPost = await JobPost.findByIdAndUpdate(
            req.params.id,
            { $inc: { viewCount: 1 } }, // $inc adds 1 to viewCount
            { new: true }               // return the updated document
        );

        if (!jobPost) {
            return res.status(404).json({
                success: false,
                message: 'Job post not found',
            });
        }

        res.status(200).json({
            success: true,
            data: jobPost,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



// @desc    Get all job posts for admin review
// @route   GET /api/jobs/admin
// @access  SuperAdmin only
const getAllJobPostsAdmin = async (req, res) => {
    try {
        const { status } = req.query; // admin can filter by ?status=pending

        const filter = {};
        if (status) {
            filter.status = status;
        }

        const jobPosts = await JobPost.find(filter)
            .populate('postedBy', 'name email companyName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: jobPosts.length,
            data: jobPosts,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



// @desc    Approve a job post
// @route   PATCH /api/jobs/:id/approve
// @access  SuperAdmin only
const approveJobPost = async (req, res) => {
    try {
        const jobPost = await JobPost.findByIdAndUpdate(
            req.params.id,
            {
                status: 'approved',
                rejectionReason: '', // clear any previous rejection reason
            },
            { new: true }
        );

        if (!jobPost) {
            return res.status(404).json({
                success: false,
                message: 'Job post not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Job post approved successfully',
            data: jobPost,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};



// @desc    Reject a job post with a reason
// @route   PATCH /api/jobs/:id/reject
// @access  SuperAdmin only
const rejectJobPost = async (req, res) => {
    try {
        const { rejectionReason } = req.body;

        if (!rejectionReason) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a rejection reason',
            });
        }

        const jobPost = await JobPost.findByIdAndUpdate(
            req.params.id,
            {
                status: 'rejected',
                rejectionReason,
            },
            { new: true }
        );

        if (!jobPost) {
            return res.status(404).json({
                success: false,
                message: 'Job post not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Job post rejected',
            data: jobPost,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


// @desc    Update a job post (only owner, only if pending or rejected)
// @route   PATCH /api/jobs/:id/edit
// @access  Job Provider only
const updateJobPost = async (req, res) => {
  try {
    const jobPost = await JobPost.findById(req.params.id);

    if (!jobPost)
      return res.status(404).json({ success: false, message: "Job post not found" });

    if (jobPost.postedBy.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: "Not authorized" });

    if (jobPost.status === "approved")
      return res.status(400).json({ success: false, message: "Cannot edit an approved post" });

    const fields = ["title", "description", "companyName", "jobType", "location", "skills", "salaryRange", "applicationLink", "deadline"];
    fields.forEach(f => { if (req.body[f] !== undefined) jobPost[f] = req.body[f]; });

    jobPost.status = "pending";
    await jobPost.save();

    res.status(200).json({ success: true, message: "Post updated. Pending re-review.", data: jobPost });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



module.exports = {
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
};