const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const specialTagSchema = new Schema({
    branch_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    },
    title: String,
    display_order: Number,
    is_active: Boolean,
    menu_items: [{ // Direct reference to MenuItems
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem'
    }]
}, { timestamps: true });

// Index for fetching special tags by branch
specialTagSchema.index({ branch_id: 1, is_active: 1 });

const SpecialTag = mongoose.model('SpecialTag', specialTagSchema);

module.exports = { SpecialTag };
