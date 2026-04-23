const express = require('express')
require('dotenv').config()
const app = express()
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))
const cors = require('cors')
const connectDB = require('./db/config')
app.use(cors({
    origin: '*',
    exposedHeaders: ['x-access-token', 'x-refresh-token'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token'],
}))

const AuthRoutes = require('./module/Auth/routes')
const GenerateBill = require('./module/Shopkeeper/Billing/routes')
const CustomerRegister = require('./module/Shopkeeper/CustomerRegister/routes')
const Colletral = require('./module/Shopkeeper/Colletral/routes')
const JweleOrders = require('./module/Shopkeeper/Orders/routes')
const JweleInventoryManagment = require('./module/Shopkeeper/Inventory/routes')
const { verifyUserMiddleware } = require('./module/Auth/middleware')


connectDB();
app.get('/',(req,res)=>{
    res.status(200).json('Welcome to Jewel Track')
})

app.use('/api/auth', AuthRoutes)
app.use('/api/customers', verifyUserMiddleware, GenerateBill)
app.use('/api/customers', verifyUserMiddleware, CustomerRegister)
app.use('/api/customers', verifyUserMiddleware, Colletral)
app.use('/api/customers', verifyUserMiddleware, JweleOrders)
app.use('/api/shops', verifyUserMiddleware, JweleInventoryManagment)







const PORT = process.env.PORT || 3000
app.listen(PORT ,()=>{
    console.log(`server is running on port ${PORT}`)
})