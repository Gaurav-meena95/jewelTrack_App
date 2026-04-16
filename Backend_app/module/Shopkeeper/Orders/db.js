const mongoose = require('mongoose')

const orderItemSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    description: { type: String, default: '' },
    metal: { type: String, enum: ['gold', 'silver', 'diamond', 'platinum', 'other'], required: true },
    purity: { type: String, default: '' },
    weight: { type: Number, min: 0, default: 0 },
    size: { type: String, default: '' },
}, { _id: false })

const orderSchema = new mongoose.Schema(
    {
        shopkeeperId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: true
        },
        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator: function (v) { return v.length > 0 },
                message: 'Order must have at least one item'
            }
        },

        image: {
            type: [String],
            required: true,
            validate: {
                validator: function (v) { return v.length > 0 },
                message: 'At least one image is required for an order'
            }
        },

        Total: {
            type: Number,
            required: true,
            min: 0
        },

        AdvancePayment: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },

        RemainingAmount: {
            type: Number,
            required: true,
            default: 0
        },

        paymentStatus: {
            type: String,
            enum: ['unpaid', 'partially_paid', 'paid'],
            default: 'unpaid'
        },
        paymentHistory: [
            {
                amount: { type: Number, required: true },
                date: { type: Date, default: Date.now },
                orderStatus: {
                    type: String,
                    enum: ['accept', 'progress', 'complete'],
                    default: 'accept'
                },
                note: { type: String }
            }
        ],



        notes: {
            type: String,
            default: ''
        },

        deliveryDate: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Order', orderSchema)