const mongoose = require('mongoose')

const customerSchema = new mongoose.Schema({
    shopkeeperId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    father_name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        unique: true,
        maxLength: 10
    },
    email: {
        type: String
    },
    address: {
        type: String,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema)
