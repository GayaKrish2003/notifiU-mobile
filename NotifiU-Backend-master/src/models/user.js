const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema = new mongoose.Schema(
    {
        // ──────────────── Core Identity ────────────────
        name: {
            type: String,
            required: [true, 'Please add a name'],
            trim: true,
        },
        username: {
            type: String,
            unique: true,
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [
                /^\S+@\S+\.\S+$/,
                'Please add a valid email',
            ],
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
            minlength: 8,
            select: false, // Security: Don't return password by default
        },

        // ──────────────── Role & Access ────────────────
        role: {
            type: String,
            enum: ['superadmin', 'student', 'lecturer', 'jobprovider'],
            default: 'student',
        },
        accountStatus: {
            type: String,
            enum: ['pending', 'active', 'suspended', 'deactivated'],
            default: 'pending',
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'process', 'paid'],
            default: 'pending',
        },

        // ──────────────── Personal Details ────────────────
        address: {
            type: String,
            required: [true, 'Please add your address'],
        },
        age: {
            type: Number,
            required: [true, 'Please add your age'],
        },
        nic: {
            type: String,
            required: [true, 'Please add your NIC'],
            unique: true,
        },
        phonenumber: {
            type: String,
            required: [true, 'Please add your phone number'],
        },
        profileImage: {
            type: String,
            default: '',
        },

        // ──────────────── Student-Specific Fields ────────────────
        university: {
            type: String,
        },
        faculty: {
            type: String,
        },
        academicYear: {
            type: String,
        },
        studentId: {
            type: String,
        },

        // ──────────────── Lecturer-Specific Fields ────────────────
        department: {
            type: String,
        },
        lecturerId: {
            type: String,
        },

        // ──────────────── Job Provider-Specific Fields ────────────────
        companyName: {
            type: String,
        },
        designation: {
            type: String,
        },
        companyWebsite: {
            type: String,
        },

        // ──────────────── Auth Tokens ────────────────
        refreshToken: {
            type: String,
        },
        resetPasswordOTP: {
            type: String,
        },
        resetPasswordExpire: {
            type: Date,
        },

        // ──────────────── Activity Tracking ────────────────
        lastLogin: {
            type: Date,
        },
        loginHistory: [
            {
                timestamp: { type: Date, default: Date.now },
                ipAddress: { type: String },
                userAgent: { type: String },
            },
        ],
        activityLog: [
            {
                action: { type: String },
                timestamp: { type: Date, default: Date.now },
                details: { type: String },
            },
        ],

        // ──────────────── Soft Delete ────────────────
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// ──────────────── Virtual: Profile Completion ────────────────
userSchema.virtual('profileCompletion').get(function () {
    const coreFields = ['name', 'email', 'address', 'age', 'nic', 'phonenumber', 'profileImage'];
    let totalFields = [...coreFields];

    // Add role-specific fields
    if (this.role === 'student') {
        totalFields.push('university', 'faculty', 'academicYear', 'studentId');
    } else if (this.role === 'lecturer') {
        totalFields.push('university', 'department', 'lecturerId');
    } else if (this.role === 'jobprovider') {
        totalFields.push('companyName', 'designation', 'companyWebsite');
    }

    let filled = 0;
    totalFields.forEach((field) => {
        if (this[field] && String(this[field]).trim() !== '') {
            filled++;
        }
    });

    return Math.round((filled / totalFields.length) * 100);
});

// ──────────────── Pre-save: Hash Password ────────────────
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// ──────────────── Method: Compare Password ────────────────
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// ──────────────── Method: Log Activity ────────────────
userSchema.methods.logActivity = function (action, details = '') {
    this.activityLog.push({ action, details, timestamp: new Date() });
    // Keep only last 50 activity entries to prevent bloat
    if (this.activityLog.length > 50) {
        this.activityLog = this.activityLog.slice(-50);
    }
};

// ──────────────── Method: Record Login ────────────────
userSchema.methods.recordLogin = function (ipAddress = '', userAgent = '') {
    this.lastLogin = new Date();
    this.loginHistory.push({
        timestamp: new Date(),
        ipAddress,
        userAgent,
    });
    // Keep only last 20 login records
    if (this.loginHistory.length > 20) {
        this.loginHistory = this.loginHistory.slice(-20);
    }
};

// ──────────────── Query: Exclude Soft-Deleted by Default ────────────────
userSchema.pre(/^find/, function () {
    // Only add the filter if not explicitly looking for deleted users
    if (typeof this.getOptions === 'function' && this.getOptions().includeDeleted !== true) {
        this.where({ isDeleted: { $ne: true } });
    }
});

module.exports = mongoose.model('User', userSchema);
