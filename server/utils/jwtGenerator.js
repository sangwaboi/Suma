const jwt = require('jsonwebtoken');

const generateAuthToken = (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to generate a token');
    }
    
    if (!process.env.JWT_SECRET) {
      console.warn('Warning: JWT_SECRET not found in environment variables. Using fallback secret.');
    }
    
    const jwtSecret = process.env.JWT_SECRET || 'jira-clone-super-secret-key-for-authentication-12345';
    
    const payload = {
      user: {
        id: userId
      }
    };

    return jwt.sign(payload, jwtSecret, { expiresIn: '24h' });
  } catch (error) {
    console.error('Error generating auth token:', error);
    throw error;
  }
};

const generateEmailVerificationToken = (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to generate a verification token');
    }
    
    if (!process.env.JWT_EMAIL_SECRET) {
      console.warn('Warning: JWT_EMAIL_SECRET not found in environment variables. Using fallback secret.');
    }
    
    const jwtEmailSecret = process.env.JWT_EMAIL_SECRET || 'jira-clone-email-verification-secret-67890';
    
    const payload = {
      user: {
        id: userId
      }
    };

    return jwt.sign(payload, jwtEmailSecret, { expiresIn: '1h' });
  } catch (error) {
    console.error('Error generating email verification token:', error);
    throw error;
  }
};

const generatePasswordResetToken = (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to generate a reset token');
    }
    
    if (!process.env.JWT_RESET_SECRET) {
      console.warn('Warning: JWT_RESET_SECRET not found in environment variables. Using fallback secret.');
    }
    
    const jwtResetSecret = process.env.JWT_RESET_SECRET || 'jira-clone-password-reset-secret-09876';
    
    const payload = {
      user: {
        id: userId
      }
    };

    return jwt.sign(payload, jwtResetSecret, { expiresIn: '1h' });
  } catch (error) {
    console.error('Error generating password reset token:', error);
    throw error;
  }
};

module.exports = {
  generateAuthToken,
  generateEmailVerificationToken,
  generatePasswordResetToken
}; 