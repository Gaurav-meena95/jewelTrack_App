const { validationInput } = require("../../../utils/utils")
const User = require('../../Auth/userdb')
const Inventory = require('./db')


const createInventory = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' })
        }
        const shopkeeper_id = req.user.id
        const { jewelleryType, totalWeight, quantity, metalType } = req.body
        const value = validationInput({ jewelleryType, totalWeight, quantity, metalType })
        if (value) {
            return res.status(403).json({ success: false, message: `Check missing value ${value}` })
        }
        const existing = await Inventory.findOne({
            shopkeeperId: shopkeeper_id,
            jewelleryType: jewelleryType.trim()
        })

        if (existing) {
            return res.status(400).json({ success: false, message: "Inventory already exists for this jewellery type" })
        }
        const newInventory = await Inventory.create({ shopkeeperId: shopkeeper_id, jewelleryType, totalWeight, quantity, metalType })
        return res.status(200).json({ success: true, message: 'Inventory create successfully', data: { newInventory } })

    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' })

    }
}

const updateInventory = async (req, res) => {
    try {
        const { inventory_id } = req.query
        const { jewelleryType, totalWeight, quantity, metalType } = req.body
        const value = validationInput({ jewelleryType, totalWeight, quantity, metalType })
        if (value) {
            return res.status(403).json({ success: false, message: `Check missing value ${value}` })
        }

        const exsitingInventory = await Inventory.find({ _id: inventory_id })
        const updated = await Inventory.updateOne(
            { _id: exsitingInventory[0]._id },
            { jewelleryType, totalWeight, quantity, metalType }
        )
        return res.status(200).json({ success: true, message: "Inventory upadate successfully", data: { updated } })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' })
    }

}
const deleteInventory = async (req, res) => {
    try {
        const { inventory_id } = req.query
        const exsitingInventory = await Inventory.find({ _id: inventory_id })
        if (exsitingInventory.length === 0) {
            return res.status(401).json({ success: false, message: 'Inventory does not exist' })
        }

        const deleted = await Inventory.deleteOne({ _id: exsitingInventory[0]._id })
        return res.status(200).json({ success: true, message: 'Inventory successfully deleted', data: { deleted } })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' })
    }

}
const allInventory = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ success: false, message: 'Unauthorized' })
        }
        const shopkeeper_id = req.user.id
        const Shopkeeper = await User.find({ _id: shopkeeper_id })
        const allInventorys = await Inventory.find({ shopkeeperId: shopkeeper_id })
        return res.status(200).json({ success: true, message: "All Inventory are :", data: { allInventorys } })


    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' })
    }

}


module.exports = { createInventory, updateInventory, deleteInventory, allInventory }

