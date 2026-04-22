const mongoose = require('mongoose')

const billingSchema = new mongoose.Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Customer',
            required: true
        },
        image: {
            type: [String],
            default: []
        },
        invoice: {
            items: [
                {
                    itemName: {
                        type: String,
                        required: true
                    },
                    metal: {
                        type: String,
                        enum: ['gold', 'silver', 'diamond'],
                        required: true
                    },
                    purity: {
                        type: String,
                    },
                    weight: {
                        type: Number,
                        min: 0
                    },
                    ratePerGram: {
                        type: Number,
                        min: 0
                    },
                    makingChargePercent: {
                        type: Number,
                        min: 0
                    },
                    gstPercent: {
                        type: Number,
                        default: 3,
                        min: 0
                    },
                    manualAdjustment: {
                        type: Number,
                        default: 0
                    },
                    finalPrice: {
                        type: Number,
                        required: true,
                        min: 0
                    }
                }
            ],
            grandTotal: {
                type: Number,
                required: true,
                min: 0
            }
        },
        payment: {
            _id: false,
            amountPaid: {
                type: Number,
                default: 0,
                min: 0
            },
            paymentStatus: {
                type: String,
                enum: ['unpaid', 'partially_paid', 'paid'],
                default: 'unpaid'
            },
            remainingAmount: {
                type: Number,
                default: 0,
                min: 0
            },
            paymentMethod: {
                type: String,
                enum: ['cash', 'upi', 'card', 'bank_transfer'],
                default: null
            }
        },
        paymentHistory: [
            {
                amount: Number,
                method: String,
                date: { type: Date, default: Date.now },
                notes: String
            }
        ]


    },
    { timestamps: true }
)


module.exports = mongoose.model('Bill', billingSchema)

