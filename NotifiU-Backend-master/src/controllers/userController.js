const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');


// ═══════════════════════════════════════════════════════════════
//  TOKEN GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate Access Token (Long-lived: 7d)
 */
const generateAccessToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '7d',
    });
};

/**
 * Generate Refresh Token (Long-lived: 7d)
 */
const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: '7d',
    });
};

// ═══════════════════════════════════════════════════════════════
//  HELPER: Set Cookie + Return Auth Response
// ═══════════════════════════════════════════════════════════════
const setTokenCookie = (res, refreshToken) => {
    res.cookie('jwt', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
};

// ═══════════════════════════════════════════════════════════════
//  REGISTRATION CONTROLLERS
// ═══════════════════════════════════════════════════════════════

/**
 * @desc    Register new user (Generic/Legacy)
 * @route   POST /api/users/register
 * @access  Public
 */
const registerUser = async (req, res) => {
    return registerStudent(req, res);
};

/**
 * @desc    Register new student
 * @route   POST /api/users/register/student
 * @access  Public
 */
const registerStudent = async (req, res) => {
    try {
        const {
            name, username, email, password,
            university, faculty, academicYear, studentId,
            address, age, nic, phonenumber,
        } = req.body;

        if (!university) {
            return res.status(400).json({ success: false, message: 'University is required for students' });
        }

        // Check for duplicate email, username, or NIC
        const userExists = await User.findOne({
            $or: [
                { email },
                { username: username || email },
                { nic },
            ],
        });

        if (userExists) {
            if (userExists.email === email) {
                return res.status(400).json({ success: false, message: 'Email already registered' });
            }
            if (userExists.nic === nic) {
                return res.status(400).json({ success: false, message: 'NIC already registered' });
            }
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }

        const user = await User.create({
            name,
            username: username || email,
            email,
            password,
            role: 'student',
            university,
            faculty,
            academicYear,
            studentId,
            address,
            age,
            nic,
            phonenumber,
            accountStatus: 'active',
        });

        if (user) {
            const accessToken = generateAccessToken(user._id, user.role);
            const refreshToken = generateRefreshToken(user._id);

            user.refreshToken = refreshToken;
            user.recordLogin(req.ip, req.headers['user-agent']);
            user.logActivity('register', 'Student account created');
            await user.save();

            setTokenCookie(res, refreshToken);

            res.status(201).json({
                success: true,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus,
                accessToken,
                refreshToken,
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Register new lecturer
 * @route   POST /api/users/register/lecturer
 * @access  Public
 */
const registerLecturer = async (req, res) => {
    try {
        const {
            name, username, email, password,
            university, department, lecturerId,
            address, age, nic, phonenumber,
        } = req.body;

        const userExists = await User.findOne({
            $or: [{ email }, { username: username || email }, { nic }],
        });

        if (userExists) {
            if (userExists.email === email) {
                return res.status(400).json({ success: false, message: 'Email already registered' });
            }
            if (userExists.nic === nic) {
                return res.status(400).json({ success: false, message: 'NIC already registered' });
            }
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }

        // Auto-generate Lecturer ID if not provided
        const generatedLecturerId = lecturerId || `LEC-${Math.floor(100000 + Math.random() * 900000)}`;

        const user = await User.create({
            name,
            username: username || email,
            email,
            password,
            role: 'lecturer',
            department,
            lecturerId: generatedLecturerId,
            address,
            age,
            nic,
            phonenumber,
            accountStatus: 'active',
        });

        if (user) {
            const accessToken = generateAccessToken(user._id, user.role);
            const refreshToken = generateRefreshToken(user._id);

            user.refreshToken = refreshToken;
            user.recordLogin(req.ip, req.headers['user-agent']);
            user.logActivity('register', 'Lecturer account created');
            await user.save();

            setTokenCookie(res, refreshToken);

            res.status(201).json({
                success: true,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus,
                accessToken,
                refreshToken,
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Register new job provider
 * @route   POST /api/users/register/jobprovider
 * @access  Public
 */
const registerJobProvider = async (req, res) => {
    try {
        const {
            name, username, email, password,
            companyName, designation, companyWebsite,
            address, age, nic, phonenumber,
        } = req.body;

        if (!companyName) {
            return res.status(400).json({ success: false, message: 'Company name is required for job providers' });
        }

        const userExists = await User.findOne({
            $or: [{ email }, { username: username || email }, { nic }],
        });

        if (userExists) {
            if (userExists.email === email) {
                return res.status(400).json({ success: false, message: 'Email already registered' });
            }
            if (userExists.nic === nic) {
                return res.status(400).json({ success: false, message: 'NIC already registered' });
            }
            return res.status(400).json({ success: false, message: 'Username already exists' });
        }

        const user = await User.create({
            name,
            username: username || email,
            email,
            password,
            role: 'jobprovider',
            companyName,
            designation,
            companyWebsite,
            address,
            age,
            nic,
            phonenumber,
            accountStatus: 'active',
        });

        if (user) {
            const accessToken = generateAccessToken(user._id, user.role);
            const refreshToken = generateRefreshToken(user._id);

            user.refreshToken = refreshToken;
            user.recordLogin(req.ip, req.headers['user-agent']);
            user.logActivity('register', 'Job provider account created');
            await user.save();

            setTokenCookie(res, refreshToken);

            res.status(201).json({
                success: true,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus,
                accessToken,
                refreshToken,
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  LOGIN CONTROLLERS
// ═══════════════════════════════════════════════════════════════

/**
 * @desc    Authenticate user & get tokens (Generic login)
 * @route   POST /api/users/login
 * @access  Public
 */
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Check account status before allowing login
        if (user.accountStatus === 'pending') {
            return res.status(403).json({ success: false, message: 'Your account is pending approval. Please wait for administrator activation.' });
        }
        if (user.accountStatus === 'deactivated') {
            return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact the administrator.' });
        }
        if (user.accountStatus === 'suspended') {
            return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact the administrator.' });
        }

        if (await user.matchPassword(password)) {
            const accessToken = generateAccessToken(user._id, user.role);
            const refreshToken = generateRefreshToken(user._id);

            user.refreshToken = refreshToken;
            user.recordLogin(req.ip, req.headers['user-agent']);
            user.logActivity('login', 'User logged in');
            await user.save();

            setTokenCookie(res, refreshToken);

            res.json({
                success: true,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus,
                profileImage: user.profileImage,
                studentId: user.studentId,
                lecturerId: user.lecturerId,
                address: user.address,
                age: user.age,
                nic: user.nic,
                phonenumber: user.phonenumber,
                university: user.university,
                faculty: user.faculty,
                academicYear: user.academicYear,
                accessToken,
                refreshToken,
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Authenticate student
 * @route   POST /api/users/login/student
 * @access  Public
 */
const loginStudent = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, role: 'student' }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email, password or role' });
        }

        if (user.accountStatus === 'pending') {
            return res.status(403).json({ success: false, message: 'Your account is pending approval. Please wait for administrator activation.' });
        }
        if (user.accountStatus === 'deactivated') {
            return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact the administrator.' });
        }
        if (user.accountStatus === 'suspended') {
            return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact the administrator.' });
        }

        if (await user.matchPassword(password)) {
            const accessToken = generateAccessToken(user._id, user.role);
            const refreshToken = generateRefreshToken(user._id);

            user.refreshToken = refreshToken;
            user.recordLogin(req.ip, req.headers['user-agent']);
            user.logActivity('login', 'Student logged in');
            await user.save();

            setTokenCookie(res, refreshToken);

            res.json({
                success: true,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus,
                studentId: user.studentId,
                address: user.address,
                age: user.age,
                nic: user.nic,
                phonenumber: user.phonenumber,
                university: user.university,
                faculty: user.faculty,
                academicYear: user.academicYear,
                accessToken,
                refreshToken,
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email, password or role' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Authenticate lecturer
 * @route   POST /api/users/login/lecturer
 * @access  Public
 */
const loginLecturer = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, role: 'lecturer' }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email, password or role' });
        }

        if (user.accountStatus === 'pending') {
            return res.status(403).json({ success: false, message: 'Your account is pending approval. Please wait for administrator activation.' });
        }
        if (user.accountStatus === 'deactivated') {
            return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact the administrator.' });
        }
        if (user.accountStatus === 'suspended') {
            return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact the administrator.' });
        }

        if (await user.matchPassword(password)) {
            const accessToken = generateAccessToken(user._id, user.role);
            const refreshToken = generateRefreshToken(user._id);

            user.refreshToken = refreshToken;
            user.recordLogin(req.ip, req.headers['user-agent']);
            user.logActivity('login', 'Lecturer logged in');
            await user.save();

            setTokenCookie(res, refreshToken);

            res.json({
                success: true,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus,
                lecturerId: user.lecturerId,
                address: user.address,
                age: user.age,
                nic: user.nic,
                phonenumber: user.phonenumber,
                department: user.department,
                accessToken,
                refreshToken,
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email, password or role' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Authenticate job provider
 * @route   POST /api/users/login/jobprovider
 * @access  Public
 */
const loginJobProvider = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, role: 'jobprovider' }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email, password or role' });
        }

        if (user.accountStatus === 'pending') {
            return res.status(403).json({ success: false, message: 'Your account is pending approval. Please wait for administrator activation.' });
        }
        if (user.accountStatus === 'deactivated') {
            return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact the administrator.' });
        }
        if (user.accountStatus === 'suspended') {
            return res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact the administrator.' });
        }

        if (await user.matchPassword(password)) {
            const accessToken = generateAccessToken(user._id, user.role);
            const refreshToken = generateRefreshToken(user._id);

            user.refreshToken = refreshToken;
            user.recordLogin(req.ip, req.headers['user-agent']);
            user.logActivity('login', 'Job provider logged in');
            await user.save();

            setTokenCookie(res, refreshToken);

            res.json({
                success: true,
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus,
                accessToken,
                refreshToken,
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid email, password or role' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  TOKEN & SESSION CONTROLLERS
// ═══════════════════════════════════════════════════════════════

/**
 * @desc    Get new Access Token using Refresh Token
 * @route   GET /api/users/refresh
 * @access  Public (Requires Cookie)
 */
const refreshToken = async (req, res) => {
    try {
        const cookies = req.cookies;

        if (!cookies?.jwt) {
            return res.status(401).json({ success: false, message: 'Refresh token missing' });
        }

        const token = cookies.jwt;

        jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err) return res.status(403).json({ success: false, message: 'Forbidden: Invalid refresh token' });

            const user = await User.findById(decoded.id);
            if (!user) return res.status(401).json({ success: false, message: 'User not found' });

            // Check account status
            if (user.accountStatus !== 'active') {
                return res.status(403).json({
                    success: false,
                    message: `Account is ${user.accountStatus}. Cannot refresh token.`,
                });
            }

            const accessToken = generateAccessToken(user._id, user.role);
            res.json({ success: true, accessToken });
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Logout user & clear cookie
 * @route   POST /api/users/logout
 * @access  Private
 */
const logoutUser = async (req, res) => {
    res.clearCookie('jwt', { httpOnly: true, sameSite: 'Strict', secure: process.env.NODE_ENV === 'production' });
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// ═══════════════════════════════════════════════════════════════
//  PROFILE CONTROLLERS
// ═══════════════════════════════════════════════════════════════

/**
 * @desc    Get user profile (with profile completion)
 * @route   GET /api/users/profile
 * @access  Private
 */
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            const profileData = {
                _id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus,
                address: user.address,
                age: user.age,
                nic: user.nic,
                phonenumber: user.phonenumber,
                profileImage: user.profileImage,
                profileCompletion: user.profileCompletion,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            };

            // Add role-specific fields
            if (user.role === 'student') {
                profileData.university = user.university;
                profileData.faculty = user.faculty;
                profileData.academicYear = user.academicYear;
                profileData.studentId = user.studentId;
            } else if (user.role === 'lecturer') {
                profileData.university = user.university;
                profileData.department = user.department;
                profileData.lecturerId = user.lecturerId;
            } else if (user.role === 'jobprovider') {
                profileData.companyName = user.companyName;
                profileData.designation = user.designation;
                profileData.companyWebsite = user.companyWebsite;
            }

            res.json({ success: true, user: profileData });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get user details by ID
 * @route   GET /api/users/details/:id
 * @access  Private
 */
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            const userData = {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                address: user.address,
                age: user.age,
                nic: user.nic,
                phonenumber: user.phonenumber,
                profileImage: user.profileImage,
            };

            if (user.role === 'student') {
                userData.university = user.university;
                userData.faculty = user.faculty;
                userData.academicYear = user.academicYear;
                userData.studentId = user.studentId;
            } else if (user.role === 'lecturer') {
                userData.university = user.university;
                userData.department = user.department;
                userData.lecturerId = user.lecturerId;
            } else if (user.role === 'jobprovider') {
                userData.companyName = user.companyName;
                userData.designation = user.designation;
                userData.companyWebsite = user.companyWebsite;
            }

            res.json({ success: true, user: userData });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if updating email and if it's already taken
        if (req.body.email && req.body.email !== user.email) {
            const newEmail = req.body.email.toLowerCase();
            const emailExists = await User.findOne({ email: newEmail });
            if (emailExists) {
                return res.status(400).json({ success: false, message: 'Email address already in use by another account' });
            }

            // Sync username if it was same as email
            if (user.username === user.email) {
                user.username = newEmail;
            }

            user.email = newEmail;
        }

        // Update core fields
        user.name = req.body.name || user.name;
        user.address = req.body.address || user.address;
        user.age = req.body.age || user.age;
        user.nic = req.body.nic || user.nic;
        user.phonenumber = req.body.phonenumber || user.phonenumber;
        user.profileImage = req.body.profileImage || user.profileImage;

        // Update role-specific fields
        if (user.role === 'student') {
            user.university = req.body.university || user.university;
            user.faculty = req.body.faculty || user.faculty;
            user.academicYear = req.body.academicYear || user.academicYear;
            user.studentId = req.body.studentId || user.studentId;
        } else if (user.role === 'lecturer') {
            user.university = req.body.university || user.university;
            user.department = req.body.department || user.department;
            user.lecturerId = req.body.lecturerId || user.lecturerId;
        } else if (user.role === 'jobprovider') {
            user.companyName = req.body.companyName || user.companyName;
            user.designation = req.body.designation || user.designation;
            user.companyWebsite = req.body.companyWebsite || user.companyWebsite;
        }

        if (req.body.password) {
            user.password = req.body.password;
        }

        user.logActivity('profile_update', 'Profile details updated');
        const updatedUser = await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                accountStatus: updatedUser.accountStatus,
                profileCompletion: updatedUser.profileCompletion,
                address: updatedUser.address,
                age: updatedUser.age,
                nic: updatedUser.nic,
                phonenumber: updatedUser.phonenumber,
                profileImage: updatedUser.profileImage,
                university: updatedUser.university,
                faculty: updatedUser.faculty,
                academicYear: updatedUser.academicYear,
                studentId: updatedUser.studentId,
                department: updatedUser.department,
                lecturerId: updatedUser.lecturerId,
                companyName: updatedUser.companyName,
                designation: updatedUser.designation,
                companyWebsite: updatedUser.companyWebsite,
            },
        });
    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Upload profile image
 * @route   PUT /api/users/profile/image
 * @access  Private
 */
const uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload an image file' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.profileImage = `/uploads/profiles/${req.file.filename}`;
        user.logActivity('profile_image_upload', 'Profile image updated');
        await user.save();

        res.json({
            success: true,
            message: 'Profile image uploaded successfully',
            profileImage: user.profileImage,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Change password
 * @route   PUT /api/users/profile/password
 * @access  Private
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide current and new password' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
        }

        const user = await User.findById(req.user._id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        user.password = newPassword;
        user.logActivity('password_change', 'Password changed successfully');
        await user.save();

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get profile completion percentage
 * @route   GET /api/users/profile/completion
 * @access  Private
 */
const getProfileCompletion = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            profileCompletion: user.profileCompletion,
            role: user.role,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  ADMIN CONTROLLERS
// ═══════════════════════════════════════════════════════════════

/**
 * @desc    Get all users with search, filter, pagination
 * @route   GET /api/users
 * @access  Private/SuperAdmin
 * @query   page, limit, search, role, status, sortBy, order
 */
const getAllUsers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            role,
            status,
            sortBy = 'createdAt',
            order = 'desc',
        } = req.query;

        // Build filter query
        const query = {};

        // Search by name, email, or username
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
                { nic: { $regex: search, $options: 'i' } },
            ];
        }

        // Filter by role
        if (role && role !== 'all') {
            query.role = role;
        }

        // Filter by account status
        if (status && status !== 'all') {
            query.accountStatus = status;
        }

        // Sort
        const sortObj = {};
        sortObj[sortBy] = order === 'asc' ? 1 : -1;

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select('-password -refreshToken -loginHistory -activityLog')
            .sort(sortObj)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));

        res.json({
            success: true,
            users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Admin creates a new user manually
 * @route   POST /api/users/admin/create
 * @access  Private/SuperAdmin
 */
const adminCreateUser = async (req, res) => {
    try {
        const {
            name, username, email, password, role,
            university, faculty, academicYear, studentId,
            department, lecturerId,
            companyName, designation, companyWebsite,
            address, age, nic, phonenumber, accountStatus,
        } = req.body;

        // Validate role
        if (!['student', 'lecturer', 'jobprovider', 'superadmin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role specified' });
        }

        // Check duplicates
        const userExists = await User.findOne({
            $or: [{ email }, { nic }],
        });

        if (userExists) {
            if (userExists.email === email) {
                return res.status(400).json({ success: false, message: 'Email already registered' });
            }
            return res.status(400).json({ success: false, message: 'NIC already registered' });
        }

        const userData = {
            name,
            username: username || email,
            email,
            password: password || 'TempPass123!', // Default password if not provided
            role,
            address,
            age,
            nic,
            phonenumber,
            accountStatus: accountStatus || 'active',
        };

        // Add role-specific fields
        if (role === 'student') {
            userData.university = university;
            userData.faculty = faculty;
            userData.academicYear = academicYear;
            userData.studentId = studentId;
        } else if (role === 'lecturer') {
            userData.university = university;
            userData.department = department;
            userData.lecturerId = lecturerId;
        } else if (role === 'jobprovider') {
            userData.companyName = companyName;
            userData.designation = designation;
            userData.companyWebsite = companyWebsite;
        }

        const user = await User.create(userData);

        user.logActivity('admin_create', `Account created by admin ${req.user.email}`);
        await user.save();

        res.status(201).json({
            success: true,
            message: 'User created successfully by admin',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update user role (Super Admin Only)
 * @route   PATCH /api/users/:id/role
 * @access  Private/SuperAdmin
 */
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const { id } = req.params;

        if (!['superadmin', 'student', 'lecturer', 'jobprovider'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const oldRole = user.role;
        user.role = role;
        user.logActivity('role_change', `Role changed from ${oldRole} to ${role} by admin`);
        await user.save();

        res.json({
            success: true,
            message: `User role updated from ${oldRole} to ${role}`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update account status (Activate/Suspend/Deactivate)
 * @route   PATCH /api/users/:id/status
 * @access  Private/SuperAdmin
 */
const updateAccountStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        if (!['pending', 'active', 'suspended', 'deactivated'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status. Use: pending, active, suspended, deactivated' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent deactivating superadmins
        if (user.role === 'superadmin' && (status === 'deactivated' || status === 'suspended')) {
            return res.status(400).json({ success: false, message: 'Cannot deactivate or suspend a superadmin account' });
        }

        const oldStatus = user.accountStatus;
        user.accountStatus = status;
        user.logActivity('status_change', `Status changed from ${oldStatus} to ${status} by admin`);
        await user.save();

        res.json({
            success: true,
            message: `Account status changed from '${oldStatus}' to '${status}'`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update payment status (pending/process/paid)
 * @route   PATCH /api/users/:id/payment-status
 * @access  Private/SuperAdmin
 */
const updatePaymentStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        if (!['pending', 'process', 'paid'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid payment status. Use: pending, process, paid' });
        }

        // Explicitly include deleted users in case we need to restore them or update them
        const user = await User.findOne({ _id: id }).setOptions({ includeDeleted: true });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const oldStatus = user.paymentStatus || 'pending';
        user.paymentStatus = status;
        user.logActivity('payment_status_change', `Payment status changed from ${oldStatus} to ${status} by admin`);
        await user.save();

        res.json({
            success: true,
            message: `Payment status changed from '${oldStatus}' to '${status}'`,
            user: {
                _id: user._id,
                name: user.name,
                paymentStatus: user.paymentStatus,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update any user details (Super Admin Only)
 * @route   PUT /api/users/:id
 * @access  Private/SuperAdmin
 */
const updateUserByAdmin = async (req, res) => {
    try {
        // Explicitly include deleted users in case we need to restore them or update them
        const user = await User.findOne({ _id: req.params.id }).setOptions({ includeDeleted: true });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update core fields
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.address = req.body.address || user.address;
        user.age = req.body.age || user.age;
        user.nic = req.body.nic || user.nic;
        user.phonenumber = req.body.phonenumber || user.phonenumber;
        user.profileImage = req.body.profileImage || user.profileImage;

        // Update role
        if (req.body.role) {
            user.role = req.body.role;
        }

        // Update account status
        if (req.body.accountStatus) {
            user.accountStatus = req.body.accountStatus;
        }

        // Update role-specific fields
        user.university = req.body.university || user.university;
        user.faculty = req.body.faculty || user.faculty;
        user.academicYear = req.body.academicYear || user.academicYear;
        user.studentId = req.body.studentId || user.studentId;
        user.department = req.body.department || user.department;
        user.lecturerId = req.body.lecturerId || user.lecturerId;
        user.companyName = req.body.companyName || user.companyName;
        user.designation = req.body.designation || user.designation;
        user.companyWebsite = req.body.companyWebsite || user.companyWebsite;

        if (req.body.password) {
            user.password = req.body.password;
        }

        user.logActivity('admin_update', `Profile updated by admin ${req.user.email}`);
        const updatedUser = await user.save();

        res.json({
            success: true,
            message: 'User updated successfully',
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                accountStatus: updatedUser.accountStatus,
                university: updatedUser.university,
                address: updatedUser.address,
                age: updatedUser.age,
                nic: updatedUser.nic,
                phonenumber: updatedUser.phonenumber,
                profileImage: updatedUser.profileImage,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Soft delete user (deactivate)
 * @route   DELETE /api/users/:id/soft
 * @access  Private/SuperAdmin
 */
const softDeleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role === 'superadmin') {
            return res.status(400).json({ success: false, message: 'Cannot soft delete a superadmin' });
        }

        user.isDeleted = true;
        user.deletedAt = new Date();
        user.accountStatus = 'deactivated';
        user.logActivity('soft_delete', `Account soft deleted by admin ${req.user.email}`);
        await user.save();

        res.json({
            success: true,
            message: 'User has been soft deleted (deactivated)',
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Permanently delete user
 * @route   DELETE /api/users/:id
 * @access  Private/SuperAdmin
 */
const deleteUser = async (req, res) => {
    try {
        // Use findOne with includeDeleted: true to find user even if soft-deleted
        const user = await User.findOne({ _id: req.params.id }).setOptions({ includeDeleted: true });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent self-deletion
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot delete your own superadmin account' });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'User permanently deleted',
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  ACTIVITY MONITORING CONTROLLERS
// ═══════════════════════════════════════════════════════════════

/**
 * @desc    Get user activity log & login history
 * @route   GET /api/users/:id/activity
 * @access  Private/SuperAdmin
 */
const getUserActivity = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select(
            'name email role accountStatus lastLogin loginHistory activityLog'
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus,
                lastLogin: user.lastLogin,
                loginHistory: user.loginHistory,
                activityLog: user.activityLog,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ═══════════════════════════════════════════════════════════════
//  EXPORT CONTROLLERS
// ═══════════════════════════════════════════════════════════════

/**
 * @desc    Export users to CSV
 * @route   GET /api/users/export/csv
 * @access  Private/SuperAdmin
 * @query   role, status (optional filters)
 */
const exportUsersCSV = async (req, res) => {
    try {
        const { role, status } = req.query;
        const query = {};

        if (role && role !== 'all') query.role = role;
        if (status && status !== 'all') query.accountStatus = status;

        const users = await User.find(query).select(
            '-password -refreshToken -loginHistory -activityLog'
        );

        const fields = [
            { label: 'ID', value: '_id' },
            { label: 'Name', value: 'name' },
            { label: 'Username', value: 'username' },
            { label: 'Email', value: 'email' },
            { label: 'Role', value: 'role' },
            { label: 'Account Status', value: 'accountStatus' },
            { label: 'University', value: 'university' },
            { label: 'Faculty', value: 'faculty' },
            { label: 'Department', value: 'department' },
            { label: 'Company', value: 'companyName' },
            { label: 'Address', value: 'address' },
            { label: 'Age', value: 'age' },
            { label: 'NIC', value: 'nic' },
            { label: 'Phone', value: 'phonenumber' },
            { label: 'Last Login', value: 'lastLogin' },
            { label: 'Created At', value: 'createdAt' },
        ];

        const parser = new Parser({ fields });
        const csv = parser.parse(users);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=users_export_${Date.now()}.csv`);
        res.status(200).send(csv);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Export users to Excel
 * @route   GET /api/users/export/excel
 * @access  Private/SuperAdmin
 * @query   role, status (optional filters)
 */
const exportUsersExcel = async (req, res) => {
    try {
        const { role, status } = req.query;
        const query = {};

        if (role && role !== 'all') query.role = role;
        if (status && status !== 'all') query.accountStatus = status;

        const users = await User.find(query).select(
            '-password -refreshToken -loginHistory -activityLog'
        );

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'UniStay Admin';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Users');

        // Define columns with headers and widths
        worksheet.columns = [
            { header: 'ID', key: '_id', width: 28 },
            { header: 'Name', key: 'name', width: 25 },
            { header: 'Username', key: 'username', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Role', key: 'role', width: 15 },
            { header: 'Account Status', key: 'accountStatus', width: 15 },
            { header: 'University', key: 'university', width: 25 },
            { header: 'Faculty', key: 'faculty', width: 20 },
            { header: 'Department', key: 'department', width: 20 },
            { header: 'Company', key: 'companyName', width: 25 },
            { header: 'Address', key: 'address', width: 30 },
            { header: 'Age', key: 'age', width: 8 },
            { header: 'NIC', key: 'nic', width: 15 },
            { header: 'Phone', key: 'phonenumber', width: 15 },
            { header: 'Last Login', key: 'lastLogin', width: 22 },
            { header: 'Created At', key: 'createdAt', width: 22 },
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2563EB' },
        };

        // Add data rows
        users.forEach((user) => {
            worksheet.addRow({
                _id: user._id.toString(),
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
                accountStatus: user.accountStatus,
                university: user.university || '',
                faculty: user.faculty || '',
                department: user.department || '',
                companyName: user.companyName || '',
                address: user.address,
                age: user.age,
                nic: user.nic,
                phonenumber: user.phonenumber,
                lastLogin: user.lastLogin ? user.lastLogin.toISOString() : 'Never',
                createdAt: user.createdAt.toISOString(),
            });
        });

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=users_export_${Date.now()}.xlsx`
        );

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get user profile by ID
 * @route   GET /api/users/profile/:id
 * @access  Private
 */
const getUserProfileById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            res.json({
                success: true,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    profileImage: user.profileImage,
                }
            });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update user profile by ID
 * @route   PUT /api/users/profile/:id
 * @access  Private
 */
const updateProfile = async (req, res) => {
    try {
        const { name, email, profileImage } = req.body;

        if (profileImage && profileImage.length > 5 * 1024 * 1024) {
            return res.status(400).json({ success: false, message: 'Image too large' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { name, email, profileImage },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                profileImage: updatedUser.profileImage,
            },
            message: 'Profile updated successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    // Registration
    registerUser,
    registerStudent,
    registerLecturer,
    registerJobProvider,
    // Login
    loginUser,
    loginStudent,
    loginLecturer,
    loginJobProvider,

    // Token & Session
    refreshToken,
    logoutUser,
    // Profile
    getUserProfile,
    getUserById,
    getUserProfileById, // Added
    updateProfile,      // Added
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
};
