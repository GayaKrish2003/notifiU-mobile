const mongoose = require('mongoose');

const jobPostSchema = new mongoose.Schema(
    {
        // ──────────────── Who posted this job ────────────────
        // This links the job post back to the job provider's User document
        // ref: 'User' means Mongoose knows to look in the User collection
        postedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },

        // ──────────────── Basic Job Info ────────────────
        title: {
            type: String,
            required: [true, 'Job title is required'],
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters'],
        },
        description: {
            type: String,
            required: [true, 'Job description is required'],
            trim: true,
        },
        companyName: {
            type: String,
            required: [true, 'Company name is required'],
            trim: true,
        },

        // ──────────────── Richer Fields ────────────────
        jobType: {
            type: String,
            enum: ['full-time', 'part-time', 'internship', 'remote'],
            required: [true, 'Job type is required'],
        },
        location: {
            type: String,
            trim: true,
            default: 'Remote',
        },
        // Skills are stored as an array of strings e.g. ['React', 'Node.js']
        skills: {
            type: [String],
            default: [],
        },
        salaryRange: {
            type: String,
            trim: true,
            default: 'Not specified',
        },

        // ──────────────── The external application link ────────────────
        applicationLink: {
            type: String,
            required: [true, 'Application link is required'],
            trim: true,
            validate: {
                validator: function (value) {
                    // Check that the link starts with http:// or https://
                    return /^https?:\/\/.+/.test(value);
                },
                message: 'Application link must start with http:// or https://',
            },
        },

        // ──────────────── Deadline & Auto-expiry ────────────────
        deadline: {
            type: Date,
            required: [true, 'Application deadline is required'],
            validate: {
                validator: function (value) {
                    // Check that the deadline is in the future
                    return value > new Date();
                },
                message: 'Deadline must be a future date',
            },
        },
        isExpired: {
            type: Boolean,
            default: false,
        },

        // ──────────────── Admin Approval ────────────────
        // Every new post starts as 'pending' — admin must approve it
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },
        // If admin rejects, they write a reason here so the job provider knows why
        rejectionReason: {
            type: String,
            default: '',
        },

        // ──────────────── View Count ────────────────
        // Every time a student clicks "Apply Now", we add 1 here
        // This gives the job provider simple analytics
        viewCount: {
            type: Number,
            default: 0,
        },
    },
    {
        // timestamps: true automatically adds createdAt and updatedAt fields
        timestamps: true,
    }
);

// ──────────────── Auto-expiry Logic ────────────────
// This is a Mongoose "pre" hook — it runs BEFORE every find query
// It automatically marks jobs as expired if their deadline has passed
// This way you never need a cron job or scheduler
jobPostSchema.pre(/^find/, function () {
    const now = new Date();
    // This updates any job whose deadline passed AND isn't already marked expired
    this.model.updateMany(
        { deadline: { $lt: now }, isExpired: false },
        { $set: { isExpired: true } }
    ).exec();
});

module.exports = mongoose.model('JobPost', jobPostSchema);