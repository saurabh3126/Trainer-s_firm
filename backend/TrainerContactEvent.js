const mongoose = require('mongoose');

const trainerContactEventSchema = new mongoose.Schema({
    job_post_id: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPost', required: true },
    vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    trainer_name: { type: String, required: true },
    trainer_contact: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('TrainerContactEvent', trainerContactEventSchema);