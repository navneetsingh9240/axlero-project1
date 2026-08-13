const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserModel = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

router.post('/register', async (req, res) => {
    const username = typeof 
    req.body.username === 'string'
        ? req.body.username.trim()
        : '';
    const password = typeof 
    req.body.password === 'string'
        ? req.body.password.trim()
        : '';
    if (
        typeof username !=='string' ||
        typeof password !=='string' ||
        !username.trim() ||
        !password.trim()
    ) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    if (password.length<6){
        return res.status(400).json({
            error:'Password must be at least 6 characters long'
        });
    }

    try {
        const userModel = new UserModel(req.app.locals.db);
        await userModel.createIndex(); 
        
        const existingUser = await userModel.findByUsername(username);
        if (existingUser) {
            return res.status(409).json({ error: 'Username already taken' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const userId = await userModel.createUser(username, passwordHash);

        const token = jwt.sign({ userId: userId.toString(), username }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({ message: 'User registered', token, user: { id: userId, username } });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        const userModel = new UserModel(req.app.locals.db);
        const user = await userModel.findByUsername(username);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id.toString(), username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.status(200).json({ message: 'Login successful', token, user: { id: user._id, username: user.username } });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Endpoint to transition from authenticated user to a specific session role
router.post('/join', async (req, res) => {
    const { handle, role, roomId } = req.body;
    
    if (!handle || !role || !roomId) {
        return res.status(400).json({ error: 'Handle, role, and roomId are required' });
    }
    const allowedRoles=['editor','viewer'];
        if (!allowerdRoles.includes(role)){
            return req.status(400).json({
                error: 'Invalid role. Use editor or viewer'});
        }
        if (typeof handle !== 'string' || handle.trim().length<7){
            return req.status(400).json({
                error: 'Handle must be at least 7 characters long'
            })
        }

    try {
        const tempUserId = Math.random().toString(36).substring(2, 15);
        
        const token = jwt.sign(
            { 
                userId: tempUserId, 
                username: handle, 
                role: role,
                roomId: roomId 
            }, 
            JWT_SECRET, 
            { expiresIn: '24h' }
        );
        
        res.status(200).json({ 
            message: 'Joined successfully', 
            token, 
            user: { id: tempUserId, username: handle, role: role } 
        });
    } catch (err) {
        console.error('Join error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;