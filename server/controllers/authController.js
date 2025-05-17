const bcrypt = require('bcrypt');
const User = require('../models/User');
const { generateAuthToken } = require('../utils/jwtGenerator');

// @desc    Register a user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  
  console.log('Registration attempt:', { name, email, passwordLength: password?.length });

  try {
    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      console.log('Registration failed: User already exists');
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create new user
    user = new User({
      name,
      email,
      password
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user to database
    await user.save();
    console.log('User created successfully:', user._id);

    // Generate JWT token
    const token = generateAuthToken(user.id);

    res.json({ token });
  } catch (err) {
    console.error('Registration error:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', { email, passwordProvided: !!password });
    
    if (!email || !password) {
      console.log('Login failed: Missing email or password');
      return res.status(400).json({ msg: 'Please provide both email and password' });
    }
    
    // Check if user exists
    const user = await User.findOne({ email });

    if (!user) {
      console.log('Login failed: User not found');
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    console.log('User found:', { userId: user._id, userEmail: user.email });

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log('Login failed: Password does not match');
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    console.log('Password match successful');

    // Generate JWT token
    const token = generateAuthToken(user.id);
    console.log('Token generated successfully');

    return res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ 
      msg: 'Server error', 
      error: err.message || 'Unknown error during login'
    });
  }
};

// @desc    Get authenticated user
// @route   GET /api/auth
// @access  Private
exports.getAuthUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error('Error getting auth user:', err.message);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
}; 