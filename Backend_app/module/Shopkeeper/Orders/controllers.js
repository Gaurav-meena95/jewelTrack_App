const Order = require('../Orders/db')
const Customer = require('../CustomerRegister/db')

// Helper: compute payment status
const computePaymentStatus = (total, advancePaid) => {
    if (advancePaid <= 0) return 'unpaid'
    if (advancePaid >= total) return 'paid'
    return 'partially_paid'
}

const createOrders = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' })
        }
        const shopkeeper_id = req.user.id
        const { phone } = req.query
        const { items, image, AdvancePayment, Total, orderStatus, notes, deliveryDate } = req.body

        if (!phone) return res.status(400).json({ success: false, message: 'Customer phone is required' })
        if (!items || items.length === 0) return res.status(400).json({ success: false, message: 'Order must have at least one item' })
        if (!image || image.length === 0) return res.status(400).json({ success: false, message: 'At least one image is required for the order' })
        if (Total === undefined || Total === null) return res.status(400).json({ success: false, message: 'Total estimated price is required' })

        const existing = await Customer.findOne({ phone })
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Customer not found. Please register the customer first.' })
        }

        const advance = Math.round(Number(AdvancePayment) || 0)
        const total = Math.round(Number(Total))
        if (advance > total) {
            return res.status(400).json({ success: false, message: 'Advance payment cannot exceed total amount' })
        }

        const RemainingAmount = Math.round(total - advance)
        const paymentStatus = computePaymentStatus(total, advance)

        const newOrder = await Order.create({
            shopkeeperId: shopkeeper_id,
            customerId: existing._id,
            items,
            image,
            AdvancePayment: advance,
            Total: total,
            RemainingAmount,
            paymentStatus,
            orderStatus: orderStatus || 'accept',
            notes: notes || '',
            deliveryDate: deliveryDate || null
        })

        const populated = await Order.findById(newOrder._id).populate('customerId', 'name phone address')
        return res.status(201).json({ success: true, message: 'Order created successfully', data: { order: populated } })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

const allOrders = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' })
        }
        const shopkeeperCustomers = await Customer.find({ shopkeeperId: req.user.id }).select('_id')
        const customerIds = shopkeeperCustomers.map(c => c._id)

        const orders = await Order.find({ customerId: { $in: customerIds } })
            .populate('customerId', 'name phone address')
            .sort({ updatedAt: -1 })

        return res.status(200).json({ success: true, message: 'Orders fetched successfully', data: { data: orders } })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

const updateOrders = async (req, res) => {
    try {
        const { order_id } = req.query
        const { items, image, AdvancePayment, Total, orderStatus, paymentHistory, notes, deliveryDate } = req.body
        console.log(req.body)
        if (!order_id) return res.status(400).json({ success: false, message: 'order_id is required' })

        const existingOrder = await Order.findById(order_id)
        if (!existingOrder) return res.status(404).json({ success: false, message: 'Order not found' })

        const advance = AdvancePayment !== undefined ? Math.round(Number(AdvancePayment)) : existingOrder.AdvancePayment
        const total = Total !== undefined ? Math.round(Number(Total)) : existingOrder.Total
        const history = paymentHistory || existingOrder.paymentHistory || []
        
        const totalPaymentsFromHistory = Math.round(history.reduce((sum, payment) => sum + Number(payment.amount), 0))
        const totalPaid = advance + totalPaymentsFromHistory
        
        const RemainingAmount = Math.round(total - totalPaid)
        
        if (totalPaid > total) {
            return res.status(400).json({ success: false, message: `Total paid amount cannot exceed the order total amount remaining amount is ${RemainingAmount}` })
        }
    
        const paymentStatus = computePaymentStatus(total, totalPaid)

        const updated = await Order.findByIdAndUpdate(
            order_id,
            { items, image, AdvancePayment: advance, Total: total, orderStatus, paymentHistory: history, notes, deliveryDate, RemainingAmount, paymentStatus },
            { new: true }
        ).populate('customerId', 'name phone address')

        return res.status(200).json({ success: true, message: 'Order updated successfully', data: { order: updated } })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

const deleteOrders = async (req, res) => {
    try {
        const { order_id } = req.query
        if (!order_id) return res.status(400).json({ success: false, message: 'order_id is required' })

        const existing = await Order.findById(order_id)
        if (!existing) return res.status(404).json({ success: false, message: 'Order not found' })

        await Order.deleteOne({ _id: order_id })
        return res.status(200).json({ success: true, message: 'Order deleted successfully' })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

const recordOrderPayment = async (req, res) => {
    try {
        const { order_id } = req.query
        const { additionalPayment, paymentMethod, orderStatus, note } = req.body

        if (!order_id) return res.status(400).json({ success: false, message: 'order_id is required' })

        const existingOrder = await Order.findById(order_id)
        if (!existingOrder) return res.status(404).json({ success: false, message: 'Order not found' })

        const total = Math.round(Number(existingOrder.Total) || 0)
        const advance = Math.round(Number(existingOrder.AdvancePayment) || 0)
        const history = existingOrder.paymentHistory || []
        
        const totalPaymentsFromHistory = Math.round(history.reduce((sum, p) => sum + Number(p.amount), 0))
        const currentTotalPaid = advance + totalPaymentsFromHistory
        
        const newPaymentAmount = Math.round(Number(additionalPayment) || 0)
        const newTotalPaid = currentTotalPaid + newPaymentAmount

        if (newTotalPaid > total) {
            return res.status(400).json({ success: false, message: 'Total payment exceeds order total' })
        }

        const newRemaining = Math.round(total - newTotalPaid)
        const newPaymentStatus = computePaymentStatus(total, newTotalPaid)

        history.push({
            amount: newPaymentAmount,
            method: paymentMethod || 'cash',
            date: new Date(),
            note: note || 'Payment recorded'
        })

        const updated = await Order.findByIdAndUpdate(
            order_id,
            {
                paymentHistory: history,
                RemainingAmount: newRemaining,
                paymentStatus: newPaymentStatus,
                orderStatus: orderStatus || existingOrder.orderStatus
            },
            { new: true }
        ).populate('customerId', 'name phone')

        return res.status(200).json({ success: true, message: 'Payment recorded successfully', data: { order: updated } })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

module.exports = { createOrders, updateOrders, deleteOrders, allOrders, recordOrderPayment }
