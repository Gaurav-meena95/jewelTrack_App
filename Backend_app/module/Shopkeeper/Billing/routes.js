const express = require('express')
const router = express.Router()
const { createBilling, getBillingProfile, updateBilling, recordBillPayment } = require('./controllers')

router.post('/bills/create', createBilling)
router.patch('/bills/update', updateBilling)
router.patch('/bills/pay', recordBillPayment)
router.get('/bills/me', getBillingProfile)


module.exports = router


