const { validationInput } = require('../../../utils/utils')
const Customer = require('../CustomerRegister/db')
const Bill = require('./db')

const createBilling = async (req, res) => {
    try {
        const { phone } = req.query
        const { amountPaid, paymentMethod, image, items, oldItems } = req.body

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart cannot be empty" })
        }
        const existingUser = await Customer.findOne({ phone })
        if (!existingUser) {
            return res.status(404).json({ success: false, message: "Customer not found register user" })
        }

        let newItemsTotal = 0;
        const processedItems = items.map(item => {
            const basePrice = (Number(item.weight) * Number(item.ratePerGram))
            const finalPrice = Math.round(basePrice + (basePrice * (Number(item.makingChargePercent) || 0) / 100) + (basePrice * (Number(item.gstPercent) || 0) / 100) - (Number(item.manualAdjustment) || 0))
            newItemsTotal += finalPrice;
            return { ...item, finalPrice }
        });

        let oldItemsTotal = 0;
        const processedOldItems = (oldItems || []).map(item => {
            const value = Math.round(Number(item.weight || 0) * Number(item.ratePerGram || 0));
            oldItemsTotal += value;
            return { ...item, totalValue: value };
        });

        let grandTotal = Math.round(newItemsTotal - oldItemsTotal);
        if (grandTotal < 0) grandTotal = 0; // Bill cannot be negative

        if (amountPaid > grandTotal) {
            return res.status(401).json({ success: false, message: 'Amount paid cannot exceed grand total' })
        }

        let paymentStatus = 'unpaid'
        const roundedAmountPaid = Math.round(Number(amountPaid) || 0)
        let remainingAmount = Math.round(grandTotal - roundedAmountPaid)

        if (roundedAmountPaid === 0) {
            paymentStatus = 'unpaid'
            remainingAmount = grandTotal
        } else if (roundedAmountPaid < grandTotal) {
            paymentStatus = 'partially_paid'
        } else {
            paymentStatus = 'paid'
            remainingAmount = 0
        }

        const createBill = await Bill.create({
            customerId: existingUser._id,
            image: image || [],
            invoice: {
                items: processedItems,
                oldItems: processedOldItems,
                oldItemsTotal: Math.round(oldItemsTotal),
                grandTotal
            },
            payment: {
                amountPaid: roundedAmountPaid,
                remainingAmount,
                paymentStatus,
                paymentMethod,
                paymentHistory: roundedAmountPaid > 0 ? [{
                    amount: roundedAmountPaid,
                    method: paymentMethod || 'cash',
                    date: new Date(),
                    note: 'Initial payment'
                }] : []
            }
        })
        console.log('Bill Generate SuccessFully', createBill)
        return res.status(201).json({ success: true, message: 'Bill Generate SuccessFully', data: { Bill: createBill } })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}

const updateBilling = async (req, res) => {
    try {
        const { phone, bill_id } = req.query
        const { amountPaid, paymentMethod, image, items, oldItems } = req.body

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart cannot be empty" })
        }

        const existingUser = await Customer.findOne({ phone })
        if (!existingUser) {
            return res.status(404).json({ success: false, message: "Customer not found register user" })
        }

        const existingBills = await Bill.findById({ _id: bill_id })
        if (!existingBills) {
            return res.status(400).json({ success: false, message: "Bill not exist" })
        }

        let newItemsTotal = 0;
        const processedItems = items.map(item => {
            const basePrice = (Number(item.weight) * Number(item.ratePerGram))
            const finalPrice = Math.round(basePrice + (basePrice * (Number(item.makingChargePercent) || 0) / 100) + (basePrice * (Number(item.gstPercent) || 0) / 100) - (Number(item.manualAdjustment) || 0))
            newItemsTotal += finalPrice;
            return {
                ...item,
                finalPrice
            }
        });

        let oldItemsTotal = 0;
        const processedOldItems = (oldItems || []).map(item => {
            const value = Math.round(Number(item.weight || 0) * Number(item.ratePerGram || 0));
            oldItemsTotal += value;
            return { ...item, totalValue: value };
        });

        let grandTotal = Math.round(newItemsTotal - oldItemsTotal);
        if (grandTotal < 0) grandTotal = 0;

        if (amountPaid > grandTotal) {
            return res.status(401).json({ success: false, message: 'Amount paid cannot exceed grand total' })
        }

        let paymentStatus = 'unpaid'
        const roundedAmountPaid = Math.round(Number(amountPaid) || 0)
        let remainingAmount = Math.round(grandTotal - roundedAmountPaid)

        if (roundedAmountPaid === 0) {
            paymentStatus = 'unpaid'
            remainingAmount = grandTotal
        } else if (roundedAmountPaid < grandTotal) {
            paymentStatus = 'partially_paid'
        } else {
            paymentStatus = 'paid'
            remainingAmount = 0
        }

        const updateBill = await Bill.findByIdAndUpdate(
            bill_id,
            {
                image: image || [],
                invoice: {
                    items: processedItems,
                    oldItems: processedOldItems,
                    oldItemsTotal: Math.round(oldItemsTotal),
                    grandTotal
                },
                payment: {
                    amountPaid: roundedAmountPaid,
                    remainingAmount,
                    paymentStatus,
                    paymentMethod
                }
            },
            { new: true }
        )
        console.log('Bill Generate SuccessFully', updateBill)
        return res.status(200).json({ success: true, message: 'Bill Generate SuccessFully', data: { Bill: updateBill } })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

const recordBillPayment = async (req, res) => {
    try {
        const { bill_id } = req.query
        const { additionalPayment, paymentMethod } = req.body

        if (!bill_id) return res.status(400).json({ success: false, message: 'bill_id is required' })

        const existingBill = await Bill.findById(bill_id).lean()
        if (!existingBill) return res.status(404).json({ success: false, message: 'Bill not found' })

        const grandTotal = Math.round(existingBill.invoice.finalPrice || existingBill.invoice.grandTotal)
        const additionalAmt = Math.round(Number(additionalPayment) || 0)
        const newTotalPaid = Math.round(existingBill.payment.amountPaid + additionalAmt)

        if (newTotalPaid > grandTotal) {
            return res.status(400).json({ success: false, message: 'Payment exceeds grand total of bill' })
        }

        const remainingAmount = Math.round(grandTotal - newTotalPaid)
        let paymentStatus = 'unpaid'
        if (newTotalPaid <= 0) paymentStatus = 'unpaid'
        else if (newTotalPaid < grandTotal) paymentStatus = 'partially_paid'
        else paymentStatus = 'paid'

        const history = existingBill.payment.paymentHistory || []
        history.push({
            amount: additionalAmt,
            method: paymentMethod || 'cash',
            date: new Date(),
            note: req.body.note || 'Payment recorded'
        })

        const updated = await Bill.findByIdAndUpdate(
            bill_id,
            {
                'payment.amountPaid': newTotalPaid,
                'payment.remainingAmount': remainingAmount,
                'payment.paymentStatus': paymentStatus,
                'payment.paymentHistory': history,
                ...(paymentMethod ? { 'payment.paymentMethod': paymentMethod } : {})
            },
            { new: true }
        ).populate('customerId', 'name phone')

        return res.status(200).json({ success: true, message: 'Payment recorded successfully', data: { Bill: updated } })
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

const getBillingProfile = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' })
        }
        const { phone } = req.query

        if (phone) {
            const existingUser = await Customer.findOne({ phone })
            if (!existingUser) {
                return res.status(404).json({ success: false, message: "Customer not found register user" })
            }
            const bills = await Bill.find({ customerId: existingUser._id }).populate("customerId", "name phone").sort({ createdAt: -1 })

            return res.status(200).json({ success: true, message: 'Customer profile fetched successfully', data: {
                customer: existingUser,
                data: bills
            } })
        } else {
            const shopkeeperCustomers = await Customer.find({ shopkeeperId: req.user.id }).select("_id")
            const customerIds = shopkeeperCustomers.map(c => c._id)

            const allBills = await Bill.find({ customerId: { $in: customerIds } }).populate("customerId", "name phone").sort({ createdAt: -1 })

            return res.status(200).json({ success: true, message: 'All bills fetched successfully', data: {
                data: allBills
            } })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}

module.exports = { createBilling, getBillingProfile, updateBilling, recordBillPayment }
