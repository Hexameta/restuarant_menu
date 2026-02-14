const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tableSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    branch_id: {
        type: Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    created_by: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    updated_by: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

const Table = mongoose.model('Table', tableSchema);

module.exports = { Table };
