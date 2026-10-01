const mongoose = require('mongoose');

const jobPostSchema = new mongoose.Schema({
    vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    subject: { type: String, required: true },
    city: { type: String, required: true },
    college_area_notes: { type: String }, 
    duration: { type: String },
    mode: { type: String, enum: ['online', 'offline', 'hybrid'] },
    tfa_status: { type: String },
    local_preference: { type: Boolean, default: false },
    pay_disclosed: { type: String },
    raw_text: { type: String, required: true }, // Original WhatsApp message
    cleaned_text: { type: String }, // Formatted by AI
    custom_fields: [{
        key: { type: String },
        value: { type: String }
    }],
    highlights: [{ type: String }],
    status: { type: String, enum: ['open', 'filled', 'expired'], default: 'open' },
    last_nudged_at: { type: Date }
}, { timestamps: true }); // Automatically handles posted_at (createdAt)

module.exports = mongoose.model('JobPost', jobPostSchema);