const User = require('../models/User');

// ═══════════════════════════════════════════════════════════════
//  LECTURER CONTROLLER
// ═══════════════════════════════════════════════════════════════

/**
 * @desc    Get lecturer profile
 * @route   GET /api/lecturer/profile
 * @access  Private (Lecturer only)
 */
const getLecturerProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Lecturer not found' });
        }

        if (user.role !== 'lecturer') {
            return res.status(403).json({ success: false, message: 'Access denied. Lecturer only.' });
        }

        res.json({
            success: true,
            user: {
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
                university: user.university,
                department: user.department,
                lecturerId: user.lecturerId,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update lecturer profile
 * @route   PUT /api/lecturer/profile
 * @access  Private (Lecturer only)
 */
const updateLecturerProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Lecturer not found' });
        }

        if (user.role !== 'lecturer') {
            return res.status(403).json({ success: false, message: 'Access denied. Lecturer only.' });
        }

        // Update core fields
        user.name = req.body.name || user.name;
        user.address = req.body.address || user.address;
        user.age = req.body.age || user.age;
        user.nic = req.body.nic || user.nic;
        user.phonenumber = req.body.phonenumber || user.phonenumber;

        // Update lecturer-specific fields
        user.university = req.body.university || user.university;
        user.department = req.body.department || user.department;

        // Update password if provided
        if (req.body.password) {
            user.password = req.body.password;
        }

        user.logActivity('profile_update', 'Lecturer profile details updated');
        const updatedUser = await user.save();

        res.json({
            success: true,
            message: 'Lecturer profile updated successfully',
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
                department: updatedUser.department,
                lecturerId: updatedUser.lecturerId,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getLecturerProfile,
    updateLecturerProfile,
};
