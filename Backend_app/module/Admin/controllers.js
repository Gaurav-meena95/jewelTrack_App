const User = require('../Auth/userdb');
const Customer = require('../Shopkeeper/CustomerRegister/db');
const Bill = require('../Shopkeeper/Billing/db');
const Feedback = require('./feedbackDb');
const mongoose = require('mongoose');

const getAdminStats = async (req, res) => {
    try {
        const totalShopkeepers = await User.countDocuments({ role: 'shopkeeper' });
        const totalCustomers = await Customer.countDocuments();
        
        // Aggregate total revenue across all bills
        const revenueResult = await Bill.aggregate([
            { $group: { _id: null, total: { $sum: "$invoice.grandTotal" } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        const unreadFeedback = await Feedback.countDocuments({ status: 'unread' });

        res.status(200).json({
            success: true,
            data: {
                totalShopkeepers,
                totalCustomers,
                totalRevenue,
                unreadFeedback
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error fetching admin stats" });
    }
};

const getAllShopkeepers = async (req, res) => {
    try {
        const shopkeepers = await User.find({ role: 'shopkeeper' }).select('-password');
        
        const shopkeeperData = await Promise.all(shopkeepers.map(async (sk) => {
            const customerCount = await Customer.countDocuments({ shopkeeperId: sk._id });
            
            // Get customers for this shopkeeper to aggregate their bills
            const customers = await Customer.find({ shopkeeperId: sk._id }).select('_id');
            const customerIds = customers.map(c => c._id);
            
            const revenueResult = await Bill.aggregate([
                { $match: { customerId: { $in: customerIds } } },
                { $group: { _id: null, total: { $sum: "$invoice.grandTotal" } } }
            ]);
            const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

            return {
                ...sk._doc,
                customerCount,
                totalRevenue
            };
        }));

        res.status(200).json({ success: true, data: shopkeeperData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Error fetching shopkeepers" });
    }
};

const blockShopkeeper = async (req, res) => {
    try {
        const { shopkeeperId } = req.params;
        const { isBlocked } = req.body;

        const user = await User.findByIdAndUpdate(shopkeeperId, { isBlocked }, { new: true });
        if (!user) return res.status(404).json({ success: false, message: "Shopkeeper not found" });

        res.status(200).json({ success: true, message: `Shopkeeper ${isBlocked ? 'blocked' : 'unblocked'} successfully`, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error blocking shopkeeper" });
    }
};

const sendAlert = async (req, res) => {
    try {
        const { shopkeeperId } = req.params;
        const { message } = req.body;

        const user = await User.findByIdAndUpdate(
            shopkeeperId,
            { $push: { alerts: { message, createdAt: new Date() } } },
            { new: true }
        );

        if (!user) return res.status(404).json({ success: false, message: "Shopkeeper not found" });

        res.status(200).json({ success: true, message: "Alert sent successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error sending alert" });
    }
};

const getFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.find().populate('shopkeeperId', 'shopName name email').sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: feedback });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching feedback" });
    }
};

const submitFeedback = async (req, res) => {
    try {
        const { subject, message, type } = req.body;
        const feedback = await Feedback.create({
            shopkeeperId: req.user.id,
            subject,
            message,
            type
        });
        res.status(201).json({ success: true, message: "Feedback submitted successfully", data: feedback });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error submitting feedback" });
    }
};

module.exports = {
    getAdminStats,
    getAllShopkeepers,
    blockShopkeeper,
    sendAlert,
    getFeedback,
    submitFeedback
};
