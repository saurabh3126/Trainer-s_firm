const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contact_method: { type: String, enum: ['whatsapp', 'email', 'phone'], required: true },
    contact_value: { type: String, required: true, unique: true }, // The phone number or email
    rating_placeholder: { type: Number, default: 0 } // Schema-ready for V2
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);