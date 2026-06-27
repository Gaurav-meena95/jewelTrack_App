const express = require('express');
const router = express.Router();
const { 
    getAdminStats, 
    getAllShopkeepers, 
    blockShopkeeper, 
    sendAlert, 
    getFeedback, 
    submitFeedback 
} = require('./controllers');
const { verifyUserMiddleware } = require('../Auth/middleware');

// Helper middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: "Access denied. Admin only." });
    }
};

// Admin Routes
router.get('/stats', verifyUserMiddleware, isAdmin, getAdminStats);
router.get('/shopkeepers', verifyUserMiddleware, isAdmin, getAllShopkeepers);
router.patch('/shopkeepers/:shopkeeperId/block', verifyUserMiddleware, isAdmin, blockShopkeeper);
router.post('/shopkeepers/:shopkeeperId/alert', verifyUserMiddleware, isAdmin, sendAlert);
router.get('/feedback', verifyUserMiddleware, isAdmin, getFeedback);

// Shopkeeper Routes (for feedback submission)
router.post('/feedback', verifyUserMiddleware, submitFeedback);

module.exports = router;
