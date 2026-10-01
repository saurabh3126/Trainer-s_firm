const mongoose = require('mongoose');

const trainerContactEventSchema = new mongoose.Schema({
    job_post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPost', required: true },
    trainer_name: { type: String, required: true }, // Captured Just-In-Time
    trainer_contact: { type: String, required: true }, // Captured Just-In-Time
    interest_reason: { type: String },
    followed_up: { type: Boolean, default: false },
    confirmed_outcome: { type: Boolean, default: false } // Manual loop-close
}, { timestamps: true }); // Automatically handles clicked_at (createdAt)

module.exports = mongoose.model('TrainerContactEvent', trainerContactEventSchema);