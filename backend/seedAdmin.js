require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: String, enum: ['vendor', 'trainer', 'admin'], required: true },
    isVerified: { type: Boolean, default: false },
});

const User = mongoose.model('User', userSchema);

async function seedAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const email = 'trainersfirm@gmail.com';
        const password = '$Trainerfirm*7';
        
        const existingAdmin = await User.findOne({ email });
        if (existingAdmin) {
            console.log('Admin already exists, updating password...');
            existingAdmin.password = await bcrypt.hash(password, 10);
            existingAdmin.role = 'admin';
            existingAdmin.isVerified = true;
            await existingAdmin.save();
            console.log('Admin password updated!');
        } else {
            console.log('Creating new admin...');
            const hashedPassword = await bcrypt.hash(password, 10);
            const admin = new User({
                name: 'Admin',
                email: email,
                password: hashedPassword,
                phone: '0000000000',
                role: 'admin',
                isVerified: true
            });
            await admin.save();
            console.log('Admin created successfully!');
        }
    } catch (error) {
        console.error('Error seeding admin:', error);
    } finally {
        mongoose.disconnect();
    }
}

seedAdmin();
