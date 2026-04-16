const express = require('express')
const { registerCustomer, updateCustomer, getCustomer, deleteCustomer, getCustomerDetails } = require('./controllers')
const { verifyUserMiddleware } = require('../../Auth/middleware')
const router = express.Router()


router.post('/register',registerCustomer)
router.patch('/register/update',updateCustomer)
router.get('/register/get',getCustomer)
router.get('/register/detail', getCustomerDetails)
router.delete('/register/delete',deleteCustomer)


module.exports = router