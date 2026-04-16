const mongoose = require('mongoose')

const inventorySchema = new mongoose.Schema(
    {
        shopkeeperId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        jewelleryType: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        metalType: {
            type: String,
            required: true

        },
        totalWeight: {
            type: Number,
            required: true
        }

    },
    { timestamps: true }
)

module.exports = mongoose.model('Inventory', inventorySchema)
