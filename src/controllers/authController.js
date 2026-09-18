const bcrypt = require('bcrypt');
const { User } = require('../models');

async function login(req, res) {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = await User.findOne({
    $or: [
      { name: name.trim(), is_active: true },
      { email: name.toLowerCase(), is_active: true },
    ],
  });

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const isValid = await user.comparePassword(password);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  req.session.userId = user._id;
  req.session.userRole = user.role;

  res.json({
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  });
}

async function logout(req, res) {
  req.session.destroy(() => {});
  res.json({ message: 'Logged out successfully' });
}

async function getMe(req, res) {
  res.json({ user: req.user });
}

module.exports = { login, logout, getMe };
