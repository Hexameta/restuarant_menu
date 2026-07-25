const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const adsSchema = new Schema({
    branch_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    },
    title: String,
    ad_type: {
        type: String,
        enum: ["carousel", "banner"]
    },
    is_expired: {
        type: Boolean,
        default: false
    },
    valid_from: Date,
    valid_to: Date,
    image_url: String,
    is_admin: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Compound index covering carousel/banner queries
adsSchema.index({ branch_id: 1, is_expired: 1, valid_from: 1, valid_to: 1 });

const Ads = mongoose.model('Ads', adsSchema);

module.exports = { Ads };
