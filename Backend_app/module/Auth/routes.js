const express = require('express')
const router = express.Router()
const {signup, login, setting} = require('./controllers')
const {verifyUserMiddleware} = require('./middleware')

const User = require('./userdb')


router.post('/signup',signup)

router.post('/login',login)

router.patch('/shopkeeper/setting', verifyUserMiddleware, setting)

router.get('/me', verifyUserMiddleware, async (req, res)=>{
    try {
        const fullUser = await User.findById(req.user.id).select("-password")
        if (!fullUser) return res.status(404).json({ success: false, message: "User not found" })
        res.status(200).json({ success: true, message: 'Profile fetched successfully', data: { user: fullUser } })
    } catch(err) {
        res.status(500).json({ success: false, message: "Error fetching user profile" })
    }
})

module.exports = router


