const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderItemSchema = new Schema({
    product_id: {
        type: Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
    },
    qty: {
        type: Number,
        required: true,
        min: 1
    }
}, { _id: false });

const orderSchema = new Schema({
    customer_name: {
        type: String,
        default: ''
    },
    customer_phone: {
        type: String,
        default: ''
    },
    table_id: {
        type: Schema.Types.ObjectId,
        ref: 'Table',
        required: true
    },
    branch_id: {
        type: Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    items: [orderItemSchema],
    status: {
        type: String,
        enum: ['open', 'confirmed', 'cancelled', 'completed'],
        default: 'open'
    },
    cancel_reason: {
        type: String,
        default: ''
    },
    total_amount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = { Order };
