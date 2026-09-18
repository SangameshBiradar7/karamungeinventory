const { Product, AuditLog } = require('../models');

async function getProducts(req, res) {
  const { search, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { is_active: true };
  if (search) {
    where.name = { $regex: search, $options: 'i' };
  }

  const [products, total] = await Promise.all([
    Product.find(where).sort({ name: 1 }).skip(skip).limit(parseInt(limit)),
    Product.countDocuments(where),
  ]);

  res.json({ products, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) });
}

async function createProduct(req, res) {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Product name is required' });
  }

  const existing = await Product.findOne({ name: { $regex: new RegExp('^' + name.trim() + '$', 'i') }, is_active: true });
  if (existing) {
    return res.status(400).json({ error: 'Product already exists' });
  }

  const product = await Product.create({ name: name.trim() });

  await AuditLog.create({
    user_id: req.user._id,
    action: 'CREATE',
    entity_type: 'Product',
    entity_id: product._id,
    new_values: { id: product._id, name: product.name },
  });

  res.status(201).json({ id: product._id, name: product.name, is_active: product.is_active, created_at: product.created_at, updated_at: product.updated_at });
}

async function updateProduct(req, res) {
  const { id } = req.params;
  const { name } = req.body;

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Product name is required' });
  }

  const existing = await Product.findOne({ name: { $regex: new RegExp('^' + name.trim() + '$', 'i') }, is_active: true, _id: { $ne: id } });
  if (existing) {
    return res.status(400).json({ error: 'Product already exists' });
  }

  const oldValues = { name: product.name };

  const updated = await Product.findByIdAndUpdate(id, { name: name.trim() }, { new: true });

  await AuditLog.create({
    user_id: req.user._id,
    action: 'UPDATE',
    entity_type: 'Product',
    entity_id: id,
    old_values: oldValues,
    new_values: { name: updated.name },
  });

  res.json({ id: updated._id, name: updated.name, is_active: updated.is_active, created_at: updated.created_at, updated_at: updated.updated_at });
}

async function deleteProduct(req, res) {
  const { id } = req.params;

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const oldValues = { name: product.name, is_active: product.is_active };

  await Product.findByIdAndUpdate(id, { is_active: false });

  await AuditLog.create({
    user_id: req.user._id,
    action: 'DELETE',
    entity_type: 'Product',
    entity_id: id,
    old_values: oldValues,
    new_values: { is_active: false },
  });

  res.json({ message: 'Product deleted successfully' });
}

module.exports = { getProducts, createProduct, updateProduct, deleteProduct };
