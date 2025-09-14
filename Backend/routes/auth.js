// Backend/routes/auth.js
const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google OAuth login
router.post('/google', async (req, res) => {
  try {
    console.log('🔐 Google auth request received');
    const { token } = req.body;
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(400).json({ message: 'Token is required' });
    }

    console.log('🔍 Verifying Google token...');
    
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    
    console.log('✅ Google token verified for user:', email);

    // For now, we'll create a mock user (you can integrate with MongoDB later)
    const user = {
      id: googleId,
      googleId,
      email,
      name,
      picture,
      createdAt: new Date(),
    };

    // Create JWT token
    const authToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        name: user.name 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('🎉 Auth successful, sending response');

    res.json({
      success: true,
      token: authToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (error) {
    console.error('❌ Google auth error:', error);
    res.status(500).json({ 
      message: 'Authentication failed', 
      error: error.message 
    });
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Get current user info
router.get('/me', authenticateToken, (req, res) => {
  res.json(req.user);
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Auth route is working!',
    googleClientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
    jwtSecret: process.env.JWT_SECRET ? 'Set' : 'Not set'
  });
});

module.exports = { router, authenticateToken };