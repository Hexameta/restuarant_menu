const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    branch_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    Password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['waiter', 'admin', 'manager', 'kitchen', 'superadmin'],
        default: 'admin'
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = { User };
