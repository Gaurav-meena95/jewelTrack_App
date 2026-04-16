const express = require('express')
require('dotenv').config()
const app = express()
app.use(express.json())
const cors = require('cors')
const connectDB = require('./db/config')
app.use(cors())

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

app.use('/api/auth',AuthRoutes)
app.use(verifyUserMiddleware)
app.use('/api/customers',GenerateBill)
app.use('/api/customers',CustomerRegister)
app.use('/api/customers',Colletral)
app.use('/api/customers',JweleOrders)
app.use('/api/shops',JweleInventoryManagment)







const PORT = process.env.PORT || 3000
app.listen(PORT ,()=>{
    console.log(`server is running on port ${PORT}`)
})