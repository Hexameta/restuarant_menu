const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const optionsSchema = new Schema({
    option_name: String,
    option_price: Number,
    option_offer_price: Number
}, { _id: true }); // Keep ID for specific option reference if needed

const menuItemSchema = new Schema({
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    name: String,
    description: String,
    image_url: String,
    is_available: Boolean,
    special_note: String,

    tag: {
        type: String,
        enum: ["veg", "non-veg", "cool", "hot"]
    },
    no_price: String,
    options: [optionsSchema] // Embedded Options
}, { timestamps: true });

// Indexes for performance
menuItemSchema.index({ category_id: 1, is_available: 1 });
menuItemSchema.index({ name: 1 }); // For search

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

module.exports = { MenuItem };
