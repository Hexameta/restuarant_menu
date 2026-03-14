const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const restaurantSchema = new Schema({
    name: String,
    email: String,
    phone: String,
    logo: String,
    type: String,
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'inactive'
    }
}, { timestamps: true });

// Indexes for performance
restaurantSchema.index({ status: 1 });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

const emergencySchema = new Schema({
    emegerncy_inactive_title: String,
    emergency_inactive_message: String,
    is_emergency_inactive: {
        type: Boolean,
        default: false
    }
});
const settingsSchema = new Schema({
    logo: String,
    currency: String,
    symbol: String,
    pdf_menu_url: String,
    emergency: emergencySchema,
    symbol_position: {
        type: String,
        enum: ['left', 'right']
    },
    facebook_url: String,
    instagram_url: String,
    google_feedback_url: String
}, { _id: false }); // Embedded in Branch

const branchSchema = new Schema({
    restaurant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant'
    },
    name: String,
    description: String,
    phone: String,
    email: String,
    place: String,
    city: String,
    district: String,
    state: String,
    country: String,
    slug: {
        type: String,
        unique: true
    },
    status: {
        type: String,
        enum: ['active', 'pending', 'inactive', 'block'],
        default: 'pending'
    },
    is_active: {
        type: Boolean,
        default: true
    },
    settings: settingsSchema // Embedded settings
}, { timestamps: true });


// Indexes for performance
branchSchema.index({ restaurant_id: 1 });
branchSchema.index({ slug: 1 });
branchSchema.index({ status: 1 });
branchSchema.index({ is_active: 1 });

const Branch = mongoose.model('Branch', branchSchema);
// No separate Settings model needed if embedded, but keeping export structure consistent
// If Settings logic assumes it has an ID, we might need to adjust or make it a real model. 
// For NoSQL, embedding 1:1 is usually better. 

module.exports = { Restaurant, Branch };
