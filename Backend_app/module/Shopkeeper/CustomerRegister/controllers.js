const { validationInput } = require('../../../utils/utils')
const Customer = require('./db')
const Bill = require('../Billing/db')
const Order = require('../Orders/db')
const Collateral = require('../Colletral/db')

const registerCustomer = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' })
        }
        const { id } = req.user
        const { name, email, phone, father_name, address } = req.body
        const value = validationInput({ name, phone, father_name, address })
        if (value) {
            return res.status(403).json({ success: false, message: `Check missing value ${value}` })
        }
        const existing = await Customer.findOne({ phone })
        if (existing) {
            return res.status(400).json({ success: false, message: 'Customer Already Exist please search' })
        }
        const newCustomer = await Customer.create({ shopkeeperId: id, name, email, phone, father_name, address })
        console.log('[Customer] Registered —', name, '| phone:', phone)
        return res.status(201).json({ success: true, message: 'Customer Create successfully', data: { customer: newCustomer } })
    } catch (error) {
        console.log('[Customer] registerCustomer ERROR —', error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

const getCustomer = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' })
        }
        const { phone } = req.query
        if (phone) {
            const existing = await Customer.findOne({ phone })
            if (existing) {
                console.log('[Customer] Found —', existing.name, '| phone:', phone)
                return res.status(201).json({ success: true, message: 'Customer fetch successfully', data: { customer: existing } })
            } else {
                console.log('[Customer] Not found — phone:', phone)
                return res.status(404).json({ success: false, message: "Customer not found register user" })
            }
        } else {
            const allCustomer = await Customer.find()
            console.log('[Customer] Fetched all —', allCustomer.length, 'customers')
            return res.status(201).json({ success: true, message: 'All Customer fetch successfully', data: { customer: allCustomer } })
        }
    } catch (error) {
        console.log('[Customer] getCustomer ERROR —', error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

const updateCustomer = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' })
        }
        const { id } = req.user
        const { name, email, phone, father_name, address } = req.body
        const value = validationInput({ name, phone, father_name, address })
        if (value) {
            return res.status(403).json({ success: false, message: `Check missing value ${value}` })
        }
        const existing = await Customer.findOne({ phone })
        if (!existing) {
            return res.status(400).json({ success: false, message: 'Customer Doesnot Exist please register' })
        }
        const updatedCustomer = await Customer.updateOne({ shopkeeperId: id, name, email, father_name, address })
        console.log('[Customer] Updated — phone:', phone)
        return res.status(201).json({ success: true, message: 'Customer update successfully', data: { customer: updatedCustomer } })
    } catch (error) {
        console.log('[Customer] updateCustomer ERROR —', error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

const deleteCustomer = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' })
        }
        const { phone } = req.query
        const existing = await Customer.findOne({ phone })
        if (!existing) {
            return res.status(404).json({ success: false, message: "Customer not found " })
        }
        const deleteResult = await Customer.deleteOne({ _id: existing.id })
        console.log('[Customer] Deleted — phone:', phone)
        return res.status(201).json({ success: true, message: 'Customer delete successfully', data: { customer: deleteResult } })
    } catch (error) {
        console.log('[Customer] deleteCustomer ERROR —', error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

const getCustomerDetails = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' })
        }
        const { id } = req.query
        
        if (!id) {
             return res.status(400).json({ success: false, message: 'Customer ID is required' })
        }

        const customer = await Customer.findById(id)
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Customer not found' })
        }

        // Fetch associated data
        const bills = await Bill.find({ customerId: id }).sort({ createdAt: -1 })
        const orders = await Order.find({ customerId: id }).sort({ createdAt: -1 })
        const collaterals = await Collateral.find({ customerId: id }).sort({ createdAt: -1 })

        return res.status(200).json({ success: true, message: 'Customer details fetched successfully', data: { 
            customer,
            bills,
            orders,
            collaterals
        } })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

module.exports = { registerCustomer, updateCustomer, getCustomer, deleteCustomer, getCustomerDetails }