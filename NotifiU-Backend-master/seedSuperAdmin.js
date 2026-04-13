require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected for seeding...');

        const adminEmail = 'superadmin@unistay.com';
        const adminUsername = 'superadmin';
        const adminPassword = 'superadmin';

        let admin = await User.findOne({
            $or: [{ email: adminEmail }, { username: adminUsername }]
        });

        if (admin) {
            console.log('Super Admin already exists. Updating password...');
            admin.password = adminPassword;
            admin.accountStatus = 'active';
            await admin.save();
        } else {
            admin = await User.create({
                name: 'Main Super Admin',
                username: 'superadmin',
                email: 'superadmin@unistay.com',
                password: 'superadmin',
                role: 'superadmin',
                accountStatus: 'active',
                university: 'System',
                address: 'Main Office',
                age: 30,
                nic: '000000000V',
                phonenumber: '0000000000'
            });
        }

        console.log("✅ Super Admin Ready");
        process.exit();

    } catch (error) {
        console.error("Seeding Error:", error);
        process.exit(1);
    }
};

seedSuperAdmin();