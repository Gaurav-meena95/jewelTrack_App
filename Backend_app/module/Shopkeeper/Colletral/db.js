const mongoose = require('mongoose')

const colletralSchema = new mongoose.Schema(

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
    jewellery: {
      type: String,
      required: true
    },
    image: {
      type: [String],
      default: []
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    interestRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active'
    },
    weight: {
      type: Number,
      required: true
    },
    phone: {
      type: Number
    },
    paymentHistory: [
      {
        amount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        type: { type: String, enum: ['payment', 'adjustment'], default: 'payment' },
        note: { type: String }
      }
    ],
    totalPaid: {
      type: Number,
      default: 0
    },
    remainingAmount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
)
module.exports = mongoose.model('Collateral', colletralSchema)
