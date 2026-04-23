const express = require('express')
const router = express.Router()
const {signup, login, setting} = require('./controllers')
const {verifyUserMiddleware} = require('./middleware')
const jwt = require('jsonwebtoken')
const sec_key = process.env.sec_key

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

// Dedicated token refresh — only needs a valid refresh token in x-refresh-token header
router.post('/refresh', (req, res) => {
    const refreshToken = req.headers['x-refresh-token']
    if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Refresh token missing' })
    }
    jwt.verify(refreshToken, sec_key, (err, decode) => {
        if (err) {
            console.log('[Refresh] Invalid refresh token:', err.message)
            return res.status(401).json({ success: false, message: 'Refresh token invalid or expired' })
        }
        const newAccessToken = jwt.sign(
            { id: decode.id, email: decode.email, role: decode.role },
            sec_key,
            { expiresIn: '1h' }
        )
        const newRefreshToken = jwt.sign(
            { id: decode.id, email: decode.email, role: decode.role },
            sec_key,
            { expiresIn: '7d' }
        )
        console.log('[Refresh] Tokens refreshed for user:', decode.email)
        res.set('x-access-token', newAccessToken)
        res.set('x-refresh-token', newRefreshToken)
        return res.status(200).json({ success: true, message: 'Tokens refreshed' })
    })
})

module.exports = router


