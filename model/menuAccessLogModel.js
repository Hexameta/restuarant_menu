const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const menuAccessLogSchema = new Schema({
    branch_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    accessed_at: {
        type: Date,
        default: Date.now,
        required: true
    }
}, { timestamps: true });

// Compound index for analytics aggregation
menuAccessLogSchema.index({ branch_id: 1, accessed_at: -1 });

const MenuAccessLog = mongoose.model('MenuAccessLog', menuAccessLogSchema);

module.exports = { MenuAccessLog };
