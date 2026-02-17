import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role, email: user.email, name: user.name }, process.env.JWT_TOKEN || process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const matched = await user.matchPassword(password);
        if (!matched) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken(user);
        res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login' });
    }
};

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not an admin' });
        }

        const matched = await user.matchPassword(password);
        if (!matched) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken(user);
        res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ success: false, message: 'Server error during admin login' });
    }
};

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists with this email' });
        }

        // Create new user with 'user' role (not admin)
        const user = await User.create({
            name,
            email,
            password,
            role: 'user'
        });

        // Generate token
        const token = generateToken(user);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error during registration' });
    }
};

export { login, adminLogin, register };
