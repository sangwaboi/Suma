const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header (multiple ways to extract it)
    let token = req.header('x-auth-token');
    
    // If token not found in x-auth-token header, check the Authorization header
    if (!token && req.headers.authorization) {
      // Format: "Bearer token"
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    // Check if no token
    if (!token) {
      console.log('Auth middleware: No token provided in headers', req.headers);
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    console.log('Auth middleware: Token received, attempting to verify', { tokenLength: token.length });

    // Make sure we have a JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.warn('Warning: JWT_SECRET not found in environment variables. Using fallback secret.');
    }
    
    const jwtSecret = process.env.JWT_SECRET || 'jira-clone-super-secret-key-for-authentication-12345';

    // Verify token
    try {
      // Make sure to use the right secret key
      const decoded = jwt.verify(token, jwtSecret);
      console.log('Auth middleware: Token verified successfully', { userId: decoded.user.id });

      // Add user from payload
      const user = await User.findById(decoded.user.id).select('-password');
      
      if (!user) {
        console.log('Auth middleware: User not found with token ID', decoded.user.id);
        return res.status(401).json({ msg: 'User not found' });
      }
      
      req.user = user;
      next();
    } catch (jwtError) {
      console.error('Auth middleware: JWT verification failed', jwtError);
      
      // Handle specific JWT errors
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ msg: 'Token has expired' });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ msg: 'Invalid token' });
      }
      
      return res.status(401).json({ msg: 'Token is not valid', error: jwtError.message });
    }
  } catch (err) {
    console.error('Auth middleware: Unexpected error', err);
    res.status(500).json({ msg: 'Server error during authentication', error: err.message });
  }
};

module.exports = auth; 