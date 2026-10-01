const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true }
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);