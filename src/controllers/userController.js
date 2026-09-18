const bcrypt = require('bcrypt');
const { User, AuditLog } = require('../models');

async function getUsers(req, res) {
  const users = await User.find({}, 'id email name role is_active created_at').sort({ name: 'asc' });
  res.json({ users });
}

async function createUser(req, res) {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ error: 'Email already exists' });
  }

  const user = await User.create({
    email: email.toLowerCase(),
    password,
    name: name.trim(),
    role: role || 'staff',
  });

  await AuditLog.create({
    user_id: req.user._id,
    action: 'CREATE',
    entity_type: 'User',
    entity_id: user._id,
    new_values: { id: user._id, email: user.email, name: user.name, role: user.role, is_active: user.is_active },
  });

  res.status(201).json({
    id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
  });
}

async function updateUser(req, res) {
  const { id } = req.params;
  const { email, password, name, role, is_active } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (email) {
    const existing = await User.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' });
    }
  }

  const updateData = {};
  if (email) updateData.email = email.toLowerCase();
  if (name) updateData.name = name.trim();
  if (role) updateData.role = role;
  if (is_active !== undefined) updateData.is_active = is_active;
  if (password) updateData.password = password;

  const oldValues = { email: user.email, name: user.name, role: user.role, is_active: user.is_active };

  const updated = await User.findByIdAndUpdate(id, updateData, { new: true }).select('id email name role is_active created_at');

  await AuditLog.create({
    user_id: req.user._id,
    action: 'UPDATE',
    entity_type: 'User',
    entity_id: id,
    old_values: oldValues,
    new_values: { email: updated.email, name: updated.name, role: updated.role, is_active: updated.is_active },
  });

  res.json(updated);
}

async function deleteUser(req, res) {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  await User.findByIdAndUpdate(id, { is_active: false });

  await AuditLog.create({
    user_id: req.user._id,
    action: 'DELETE',
    entity_type: 'User',
    entity_id: id,
    old_values: { id: user._id, email: user.email, name: user.name },
    new_values: { is_active: false },
  });

  res.json({ message: 'User deleted successfully' });
}

module.exports = { getUsers, createUser, updateUser, deleteUser };
