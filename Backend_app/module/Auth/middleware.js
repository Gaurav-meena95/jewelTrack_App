const jwt = require('jsonwebtoken')
const sec_key = process.env.sec_key

exports.verifyUserMiddleware = (req, res, next) => {
    try {
        const Authheader = req.headers.authorization
        const refreshToken = req.headers['x-refresh-token']

        if (!Authheader) {
            return res.status(401).json({ message: "Authorization header missing" });
        }

        const [prefix, token] = Authheader.split(' ')
        if (!token) {
            return res.status(401).json({ message: "Token is Absent" })
        }
        if (prefix !== 'JWT') {
            return res.status(401).json({ message: "Invalid Token" })
        }

        jwt.verify(token, sec_key, (err, decode) => {
            if (err && err.name === 'TokenExpiredError') {
                if (!refreshToken) {
                    return res.status(401).json({ message: "Refresh Token required" })
                }
                jwt.verify(refreshToken, sec_key, (err, refreshDecode) => {
                    if (err) {
                        console.log('[MW] Refresh token invalid —', err.message)
                        return res.status(401).json({ msg: 'Invalid Refresh Token' })
                    }
                    const { accessToken, newRefreshToken } = generateNewTokens(refreshDecode)
                    res.set('x-access-token', accessToken)
                    res.set('x-refresh-token', newRefreshToken)
                    req.user = refreshDecode
                    next()
                })
            } else if (err) {
                console.log('[MW] Token invalid —', err.message)
                return res.status(401).json({ message: 'Invalid token' })
            } else {
                const { accessToken, newRefreshToken } = generateNewTokens(decode)
                res.set('x-access-token', accessToken)
                res.set('x-refresh-token', newRefreshToken)
                req.user = decode
                next()
            }
        })

    } catch (error) {
        console.log('[MW] ERROR —', error)
        return res.status(500).json({ message: 'Internal Server Error' })
    }
}

const generateNewTokens = (decode) => {
    const accessToken = jwt.sign(
        { id: decode.id, email: decode.email, role: decode.role },
        sec_key,
        { expiresIn: '1h' }
    )
    const newRefreshToken = jwt.sign(
        { id: decode.id, email: decode.email, role: decode.role },
        sec_key,
        { expiresIn: '7d' }
    )
    return { accessToken, newRefreshToken }
}