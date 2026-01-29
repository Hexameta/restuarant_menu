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

const MenuAccessLog = mongoose.model('MenuAccessLog', menuAccessLogSchema);

module.exports = { MenuAccessLog };
