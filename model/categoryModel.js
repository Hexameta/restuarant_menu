const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const categorySchema = new Schema({
    branch_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    },
    name: String,
    image_url: String,
    is_active: Boolean,
    display_order: Number,
    is_deleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Compound index covering: { branch_id, is_active, is_deleted } sorted by display_order
categorySchema.index({ branch_id: 1, is_active: 1, is_deleted: 1, display_order: 1 });

const Category = mongoose.model('Category', categorySchema);

module.exports = { Category };
