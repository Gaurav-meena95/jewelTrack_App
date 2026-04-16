const express = require('express')
const { createInventory, updateInventory, deleteInventory, allInventory } = require('./controllers')
const { verifyUserMiddleware } = require('../../Auth/middleware')
const router = express.Router()

router.use(verifyUserMiddleware)
router.post('/inventory/create',createInventory)
router.patch('/inventory/update',updateInventory)
router.delete('/inventory/delete',deleteInventory)
router.get('/inventory/me',allInventory)

module.exports = router