const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password_hash: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.virtual('password').set(function(password) {
  this.password_hash = password;
});

userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password_hash);
};

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  if (this.password) {
    this.password_hash = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

const Vendor = mongoose.model('Vendor', vendorSchema);

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
}, { timestamps: true });

const Location = mongoose.model('Location', locationSchema);

const inventoryTransactionSchema = new mongoose.Schema({
  transaction_type: { type: String, enum: ['STOCK_IN', 'STOCK_OUT', 'TRANSFER', 'ADJUSTMENT'], required: true },
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
  vendor_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: false },
  item_name_snapshot: { type: String, trim: true },
  quantity: { type: Number, required: true },
  source_location_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: false },
  destination_location_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: false },
  transaction_date: { type: Date, default: Date.now },
  reason: { type: String, trim: true },
  is_deleted: { type: Boolean, default: false },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
}, { timestamps: true });

inventoryTransactionSchema.index({ product_id: 1, transaction_date: -1 });
inventoryTransactionSchema.index({ vendor_id: 1, transaction_date: -1 });
inventoryTransactionSchema.index({ transaction_type: 1 });
inventoryTransactionSchema.index({ transaction_date: -1 });
inventoryTransactionSchema.index({ source_location_id: 1 });
inventoryTransactionSchema.index({ destination_location_id: 1 });
inventoryTransactionSchema.index({ is_deleted: 1 });

const InventoryTransaction = mongoose.model('InventoryTransaction', inventoryTransactionSchema);

const auditLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  action: { type: String, required: true, trim: true },
  entity_type: { type: String, required: true, trim: true },
  entity_id: { type: mongoose.Schema.Types.ObjectId, required: false },
  old_values: { type: mongoose.Schema.Types.Mixed },
  new_values: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

auditLogSchema.index({ entity_type: 1, entity_id: 1 });
auditLogSchema.index({ user_id: 1 });
auditLogSchema.index({ created_at: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = {
  mongoose,
  User,
  Product,
  Vendor,
  Location,
  InventoryTransaction,
  AuditLog,
};
