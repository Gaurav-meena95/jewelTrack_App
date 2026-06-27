const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    shopkeeperId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['feedback', 'issue'],
        default: 'feedback'
    },
    status: {
        type: String,
        enum: ['unread', 'read', 'resolved'],
        default: 'unread'
    }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
