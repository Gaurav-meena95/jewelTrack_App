const mongoose = require('mongoose')

const user = new mongoose.Schema(
    {
        shopName:{
            type:String,
        },
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        phone: {
            type: String,
            required: true,
            unique:true
        },
        role: {
            type: String,
            enum: ["admin", "shopkeeper"]
        },
        itemNames: {
            type: [String],
            default: []
        },
        purities: {
            type: [String],
            default: []
        },
        isBlocked: {
            type: Boolean,
            default: false
        },
        alerts: [
            {
                message: String,
                createdAt: { type: Date, default: Date.now }
            }
        ]
        
    },
    {
        timestamps:true
    }
) ;
module.exports = mongoose.model('User',user)