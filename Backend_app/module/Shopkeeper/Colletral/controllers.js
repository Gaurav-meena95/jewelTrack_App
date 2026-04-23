const { validationInput } = require("../../../utils/utils")
const Customer = require('../CustomerRegister/db')
const Collateral = require('../Colletral/db')

const createCollatral = async (req, res) => {
    try {
        if (!req.user || !req.user.id){
            return res.status(401).json({ success: false, message: 'Unauthorized' })
        }
        const shopkeeper_id = req.user.id
        const { phone } = req.query
        const { weight, jewellery, image, price, interestRate, status } = req.body
        const value = validationInput({ jewellery, image, price, interestRate, status, weight })
        if (value) {
            return res.status(403).json({ success: false, message: `Check missing value ${value}` })
        }
        const existing = await Customer.findOne({ phone })
        if (!existing) {
            return res.status(400).json({ success: false, message: 'User is not exist!' })
        }
        const newCollatral = await Collateral.create({ phone, shopkeeperId: shopkeeper_id, customerId: existing._id, jewellery, image, price, interestRate, status, remainingAmount: price, weight })
        console.log('[Collateral] Created — ID:', newCollatral._id, '| customer:', phone)
        return res.status(200).json({ success: true, message: 'collatral create successfully', data: { newCollatral } })
    } catch (error) {
        console.log('[Collateral] createCollatral ERROR —', error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

const updateCollatral = async (req, res) => {
    try {
        const { phone, collatral_id } = req.query
        const { weight, jewellery, image, price, interestRate, status, paymentHistory, totalPaid, remainingAmount } = req.body
        const existing = await Customer.findOne({ phone })
        if (!existing) {
            return res.status(402).json({ success: false, message: 'customer collatral doest not exist' })
        }
        const exsitingCollateral = await Collateral.findById(collatral_id)
        if (!exsitingCollateral) {
            return res.status(404).json({ success: false, message: 'Collateral does not exist' })
        }
        const updated = await Collateral.updateOne(
            { _id: collatral_id },
            { weight, jewellery, image, price, interestRate, status, paymentHistory, totalPaid, remainingAmount }
        )
        console.log('[Collateral] Updated — ID:', collatral_id, '| status:', status)
        return res.status(200).json({ success: true, message: "Collateral upadate successfully", data: { updated } })
    } catch (error) {
        console.log('[Collateral] updateCollatral ERROR —', error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

const deleteCollatral = async (req, res) => {
    try {
        const { phone, collatral_id } = req.query
        const existing = Customer.findOne({ phone })
        if (!existing) {
            return res.status(402).json({ success: false, message: 'customer collatral doest not exist' })
        }
        const exsitingCollateral = await Collateral.find({ _id: collatral_id })
        if (exsitingCollateral.length === 0) {
            return res.status(404).json({ success: false, message: 'collatral does not exist' })
        }
        const deleted = await Collateral.deleteOne({ _id: exsitingCollateral[0]._id })
        console.log('[Collateral] Deleted — ID:', collatral_id)
        return res.status(200).json({ success: true, message: 'collatral successfully deleted', data: { deleted } })
    } catch (error) {
        console.log('[Collateral] deleteCollatral ERROR —', error)
        return res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
}

const allCollatral = async (req, res) => {
    try {
        const { phone } = req.query;
        let data;
        if (phone) {
            data = await Collateral.find({ phone }).populate("customerId", "name phone");
        } else {
            data = await Collateral.find().populate("customerId", "name phone");
        }
        console.log('[Collateral] Fetched', data.length, 'records | phone filter:', phone || 'none')
        return res.status(200).json({ success: true, message: "Collaterals fetched", data: { data } })
    } catch (error) {
        console.log('[Collateral] allCollatral ERROR —', error);
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
};


module.exports = { createCollatral, updateCollatral, deleteCollatral, allCollatral }

