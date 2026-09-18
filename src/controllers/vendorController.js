const { Vendor, AuditLog } = require('../models');

async function getVendors(req, res) {
  const { search, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { is_active: true };
  if (search) {
    where.name = { $regex: search, $options: 'i' };
  }

  const [vendors, total] = await Promise.all([
    Vendor.find(where).sort({ name: 1 }).skip(skip).limit(parseInt(limit)),
    Vendor.countDocuments(where),
  ]);

  res.json({ vendors, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) });
}

async function createVendor(req, res) {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Vendor name is required' });
  }

  const existing = await Vendor.findOne({ name: { $regex: new RegExp('^' + name.trim() + '$', 'i') }, is_active: true });
  if (existing) {
    return res.status(400).json({ error: 'Vendor already exists' });
  }

  const vendor = await Vendor.create({ name: name.trim() });

  await AuditLog.create({
    user_id: req.user._id,
    action: 'CREATE',
    entity_type: 'Vendor',
    entity_id: vendor._id,
    new_values: { id: vendor._id, name: vendor.name },
  });

  res.status(201).json({ id: vendor._id, name: vendor.name, is_active: vendor.is_active, created_at: vendor.created_at, updated_at: vendor.updated_at });
}

async function updateVendor(req, res) {
  const { id } = req.params;
  const { name } = req.body;

  const vendor = await Vendor.findById(id);
  if (!vendor) {
    return res.status(404).json({ error: 'Vendor not found' });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Vendor name is required' });
  }

  const existing = await Vendor.findOne({ name: { $regex: new RegExp('^' + name.trim() + '$', 'i') }, is_active: true, _id: { $ne: id } });
  if (existing) {
    return res.status(400).json({ error: 'Vendor already exists' });
  }

  const oldValues = { name: vendor.name };

  const updated = await Vendor.findByIdAndUpdate(id, { name: name.trim() }, { new: true });

  await AuditLog.create({
    user_id: req.user._id,
    action: 'UPDATE',
    entity_type: 'Vendor',
    entity_id: id,
    old_values: oldValues,
    new_values: { name: updated.name },
  });

  res.json({ id: updated._id, name: updated.name, is_active: updated.is_active, created_at: updated.created_at, updated_at: updated.updated_at });
}

async function deleteVendor(req, res) {
  const { id } = req.params;

  const vendor = await Vendor.findById(id);
  if (!vendor) {
    return res.status(404).json({ error: 'Vendor not found' });
  }

  const oldValues = { name: vendor.name, is_active: vendor.is_active };

  await Vendor.findByIdAndUpdate(id, { is_active: false });

  await AuditLog.create({
    user_id: req.user._id,
    action: 'DELETE',
    entity_type: 'Vendor',
    entity_id: id,
    old_values: oldValues,
    new_values: { is_active: false },
  });

  res.json({ message: 'Vendor deleted successfully' });
}

module.exports = { getVendors, createVendor, updateVendor, deleteVendor };
