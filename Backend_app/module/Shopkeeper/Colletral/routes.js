const express = require('express')
const { createCollatral, updateCollatral, deleteCollatral, allCollatral, } = require('./controllers')

const router = express.Router()


router.post('/collatral/create', createCollatral)
router.patch('/collatral/update', updateCollatral)
router.delete('/collatral/delete', deleteCollatral)
router.get('/collatral/me', allCollatral)
module.exports = router