const express = require('express')
const { createOrders, updateOrders, deleteOrders, allOrders, recordOrderPayment } = require('./controllers')
const { verifyUserMiddleware } = require('../../Auth/middleware')
const router = express.Router()

router.use(verifyUserMiddleware)
router.post('/orders/create', createOrders)
router.get('/orders/me', allOrders)
router.patch('/orders/update', updateOrders)
router.patch('/orders/pay', recordOrderPayment)
router.delete('/orders/delete', deleteOrders)

module.exports = router
