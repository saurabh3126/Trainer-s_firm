const mongoose = require('mongoose');

const jobPostSchema = new mongoose.Schema({
    vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    raw_text: { type: String, required: true },
    subject: { type: String },
    city: { type: String },
    duration: { type: String },
    mode: { type: String },
    pay_disclosed: { type: String },
    cleaned_text: { type: String },
    status: { type: String, default: 'open' }
}, { timestamps: true });

module.exports = mongoose.model('JobPost', jobPostSchema);