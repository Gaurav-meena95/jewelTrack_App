const User = require('./userdb.js')
const sec_key = process.env.sec_key
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { validationInput } = require('../../utils/utils')

const signup = async (req, res) => {

    try {
        const { shopName, name, email, phone, password, role } = req.body
        const value = validationInput({ shopName, name, email, phone, password, role })
        if (value) {
            return res.status(403).json({ success: false, message: `Check missing value ${value}` })
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            console.log('gkjfergwergw: 1')
            return res.status(401).json({ success: false, message: "Invalid Email Address" })

        }
        if (!/^\d{10}$/.test(phone)) {
            return res.status(400).json({ success: false, message: "Phone number must be exactly 10 digits" })
        }
        if (!/(?=.*[!@#$%^&*])(?=.{8,})/.test(password)) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters long and contain one special character" })
        }

        const exsiting = await User.findOne({
            $or: [{ email }, { phone }]
        });
        if (exsiting) {
            return res.status(400).json({ success: false, message: 'User is already exists' })
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = await User.create({
            shopName, name, email, phone,
            password: hashedPassword, role,
        });
        return res.status(201).json({ success: true, message: 'Signup successful', data: { user: newUser } })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}


const login = async (req, res) => {
    try {
        const { identifier, password, role } = req.body
        
        const value = validationInput({ identifier, password, role })
        if (value) {
            return res.status(403).json({ success: false, message: `Check missing value ${value}` })
        }
        let existing ;
        if (identifier.includes('@')){
             existing = await User.findOne({ email:identifier, role })
        }else{
            const existing = await User.findOne({ phone:identifier, role })
        }
        
        if (!existing) {
            console.log('User not found:', { email, role });
            return res.status(404).json({ success: false, message: "User not found or Check your Role " })
        } else {
            console.log('User found:', existing.email);
            const isPasswordMatch = bcrypt.compareSync(password, existing.password)
            if (isPasswordMatch) {
                const jwtToken = await jwt.sign(
                    { id: existing.id, email: existing.email, role: existing.role },
                    sec_key,
                    { expiresIn: '1h' }
                )
                const refreshToken = await jwt.sign(
                    { id: existing.id, email: existing.email, role: existing.role },
                    sec_key,
                    { expiresIn: '7d' }
                )
                console.log('Login successful, sending tokens');
                return res.status(200).json({ success: true, message: "Login Successfully", data: { 
                    user: existing,
                    token: jwtToken,
                    refreshToken
                } })

            } else {
                console.log('Password mismatch');
                return res.status(401).json({ success: false, message: 'Invalid credentials' })
            }

        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ success: false, message: 'Login Faild', data: { error: error.message } })
    }
}
const setting =  async(req,res)=>{
     try {
        const { shopName, name, email, phone, password, itemNames, purities } = req.body
        const userId = req.user.id

        const user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' })
        }

        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) return res.status(400).json({ success: false, message: 'Email already in use' })
        }
        if (phone && phone !== user.phone) {
            const existingPhone = await User.findOne({ phone });
            if (existingPhone) return res.status(400).json({ success: false, message: 'Phone number already in use' })
        }

        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid Email Address" })
        }
        if (phone && !/^\d{10}$/.test(phone)) {
            return res.status(400).json({ success: false, message: "Phone number must be exactly 10 digits" })
        }

        let updatedData = {
           shopName: shopName || user.shopName,
           name: name || user.name,
           email: email || user.email,
           phone: phone || user.phone
        }

        if (itemNames !== undefined) updatedData.itemNames = itemNames;
        if (purities !== undefined) updatedData.purities = purities;

        if (password && password.trim() !== '') {
            if (!/(?=.*[!@#$%^&*])(?=.{8,})/.test(password)) {
                return res.status(400).json({ success: false, message: "Password must be at least 8 characters long and contain one special character" })
            }
            updatedData.password = await bcrypt.hash(password, 10)
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updatedData, { new: true })

        return res.status(200).json({ success: true, message: 'Profile updated successfully', data: { user: updatedUser } })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ success: false, message: "Internal Server Error" })
    }
}


module.exports = {signup,login,setting}