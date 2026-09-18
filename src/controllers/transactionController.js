const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const { Product, Vendor, Location, InventoryTransaction, AuditLog } = require('../models');

async function stockIn(req, res) {
  const { product_id, vendor_id, quantity, location_id } = req.body;

  if (!product_id || !vendor_id || !quantity || !location_id) {
    return res.status(400).json({ error: 'Product, vendor, quantity, and location are required' });
  }

  if (parseFloat(quantity) <= 0) {
    return res.status(400).json({ error: 'Quantity must be greater than 0' });
  }

  const [product, vendor, location] = await Promise.all([
    Product.findById(product_id),
    Vendor.findById(vendor_id),
    Location.findById(location_id),
  ]);

  if (!product || !product.is_active) {
    return res.status(400).json({ error: 'Product not found' });
  }
  if (!vendor || !vendor.is_active) {
    return res.status(400).json({ error: 'Vendor not found' });
  }
  if (!location) {
    return res.status(400).json({ error: 'Location not found' });
  }

  const qty = parseFloat(quantity);

  const transaction = await InventoryTransaction.create({
    transaction_type: 'STOCK_IN',
    product_id: product_id,
    vendor_id: vendor_id,
    quantity: qty,
    destination_location_id: location_id,
    transaction_date: new Date(),
    created_by: req.user._id,
  });

  const populated = await InventoryTransaction.findById(transaction._id)
    .populate('product_id', 'name')
    .populate('vendor_id', 'name')
    .populate('destination_location_id', 'name');

  await AuditLog.create({
    user_id: req.user._id,
    action: 'CREATE',
    entity_type: 'InventoryTransaction',
    entity_id: transaction._id,
    new_values: populated,
  });

  res.status(201).json(populated);
}

async function stockOut(req, res) {
  const { product_id, item_name_snapshot, quantity, location_id, is_manual_item } = req.body;

  if (!quantity || !location_id) {
    return res.status(400).json({ error: 'Quantity and location are required' });
  }

  if (parseFloat(quantity) <= 0) {
    return res.status(400).json({ error: 'Quantity must be greater than 0' });
  }

  const qty = parseFloat(quantity);
  const location = await Location.findById(location_id);

  if (!location) {
    return res.status(400).json({ error: 'Location not found' });
  }

  let product = null;
  if (!is_manual_item && product_id) {
    product = await Product.findById(product_id);
    if (!product || !product.is_active) {
      return res.status(400).json({ error: 'Product not found' });
    }

    const availableStock = await getStockAtLocation(product._id.toString(), location_id);
    if (availableStock < qty) {
      return res.status(400).json({ error: `Insufficient stock. Available: ${availableStock}` });
    }
  } else if (is_manual_item) {
    if (!item_name_snapshot || !item_name_snapshot.trim()) {
      return res.status(400).json({ error: 'Item name is required for manual items' });
    }
  } else if (!product_id && !is_manual_item) {
    return res.status(400).json({ error: 'Product ID or manual item flag is required' });
  }

  const transaction = await InventoryTransaction.create({
    transaction_type: 'STOCK_OUT',
    product_id: product ? product_id : null,
    item_name_snapshot: is_manual_item ? item_name_snapshot.trim() : (product ? product.name : null),
    quantity: qty,
    source_location_id: location_id,
    transaction_date: new Date(),
    created_by: req.user._id,
  });

  const populated = await InventoryTransaction.findById(transaction._id)
    .populate('product_id', 'name')
    .populate('vendor_id', 'name')
    .populate('source_location_id', 'name');

  await AuditLog.create({
    user_id: req.user._id,
    action: 'CREATE',
    entity_type: 'InventoryTransaction',
    entity_id: transaction._id,
    new_values: populated,
  });

  res.status(201).json(populated);
}

async function transfer(req, res) {
  const { product_id, quantity, from_location_id, to_location_id } = req.body;

  if (!product_id || !quantity || !from_location_id || !to_location_id) {
    return res.status(400).json({ error: 'Product, quantity, and locations are required' });
  }

  if (parseFloat(quantity) <= 0) {
    return res.status(400).json({ error: 'Quantity must be greater than 0' });
  }

  if (from_location_id === to_location_id) {
    return res.status(400).json({ error: 'Source and destination locations must be different' });
  }

  const qty = parseFloat(quantity);
  const product = await Product.findById(product_id);

  if (!product || !product.is_active) {
    return res.status(400).json({ error: 'Product not found' });
  }

  const availableStock = await getStockAtLocation(product._id.toString(), from_location_id);
  if (availableStock < qty) {
    return res.status(400).json({ error: `Insufficient stock at source. Available: ${availableStock}` });
  }

  const transaction = await InventoryTransaction.create({
    transaction_type: 'TRANSFER',
    product_id: product_id,
    quantity: qty,
    source_location_id: from_location_id,
    destination_location_id: to_location_id,
    transaction_date: new Date(),
    created_by: req.user._id,
  });

  const populated = await InventoryTransaction.findById(transaction._id)
    .populate('product_id', 'name')
    .populate('source_location_id', 'name')
    .populate('destination_location_id', 'name');

  await AuditLog.create({
    user_id: req.user._id,
    action: 'CREATE',
    entity_type: 'InventoryTransaction',
    entity_id: transaction._id,
    new_values: populated,
  });

  res.status(201).json(populated);
}

async function adjustment(req, res) {
  const { product_id, quantity, location_id, reason } = req.body;

  if (!product_id || !quantity || !location_id) {
    return res.status(400).json({ error: 'Product, quantity, and location are required' });
  }

  if (parseFloat(quantity) === 0) {
    return res.status(400).json({ error: 'Quantity cannot be zero' });
  }

  const product = await Product.findById(product_id);
  if (!product || !product.is_active) {
    return res.status(400).json({ error: 'Product not found' });
  }

  const location = await Location.findById(location_id);
  if (!location) {
    return res.status(400).json({ error: 'Location not found' });
  }

  const transaction = await InventoryTransaction.create({
    transaction_type: 'ADJUSTMENT',
    product_id: product_id,
    quantity: parseFloat(quantity),
    source_location_id: location_id,
    reason: reason || null,
    transaction_date: new Date(),
    created_by: req.user._id,
  });

  const populated = await InventoryTransaction.findById(transaction._id)
    .populate('product_id', 'name')
    .populate('source_location_id', 'name');

  await AuditLog.create({
    user_id: req.user._id,
    action: 'CREATE',
    entity_type: 'InventoryTransaction',
    entity_id: transaction._id,
    new_values: populated,
  });

  res.status(201).json(populated);
}

async function getTransactions(req, res) {
  const { type, productId, vendorId, locationId, startDate, endDate, search, page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = { is_deleted: false };

  if (type) {
    where.transaction_type = type;
  }

  if (productId) {
    where.product_id = productId;
  }

  if (vendorId) {
    where.vendor_id = vendorId;
  }

  if (locationId) {
    where.$or = [
      { source_location_id: locationId },
      { destination_location_id: locationId },
    ];
  }

  if (startDate || endDate) {
    where.transaction_date = {};
    if (startDate) {
      where.transaction_date.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.transaction_date.$lte = end;
    }
  }

  if (search) {
    const searchRegex = { $regex: search, $options: 'i' };
    where.$or = [
      ...(where.$or || []),
      { item_name_snapshot: searchRegex },
    ];
  }

  const [transactions, total] = await Promise.all([
    InventoryTransaction.find(where)
      .populate('product_id', 'name')
      .populate('vendor_id', 'name')
      .populate('source_location_id', 'name')
      .populate('destination_location_id', 'name')
      .populate('created_by', 'name')
      .sort({ transaction_date: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    InventoryTransaction.countDocuments(where),
  ]);

  res.json({ transactions, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) });
}

async function updateTransaction(req, res) {
  const { id } = req.params;
  const updates = req.body;

  const existing = await InventoryTransaction.findById(id).populate('product_id', 'name');
  if (!existing || existing.is_deleted) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  await mongoose.startSession().then(session => {
    session.startTransaction();
    return (async () => {
      try {
        if (updates.quantity && parseFloat(updates.quantity) !== parseFloat(existing.quantity)) {
          const oldQty = parseFloat(existing.quantity);
          const newQty = parseFloat(updates.quantity);
          const diff = newQty - oldQty;

          if (existing.transaction_type === 'STOCK_IN') {
            if (existing.destination_location_id) {
              await InventoryTransaction.create([{
                transaction_type: 'ADJUSTMENT',
                product_id: existing.product_id,
                quantity: diff,
                destination_location_id: existing.destination_location_id,
                reason: `Edit transaction #${id}`,
                transaction_date: new Date(),
                created_by: req.user._id,
              }], { session });
            }
          } else if (existing.transaction_type === 'STOCK_OUT') {
            if (existing.source_location_id) {
              await InventoryTransaction.create([{
                transaction_type: 'ADJUSTMENT',
                product_id: existing.product_id,
                quantity: diff,
                source_location_id: existing.source_location_id,
                reason: `Edit transaction #${id}`,
                transaction_date: new Date(),
                created_by: req.user._id,
              }], { session });
            }
          } else if (existing.transaction_type === 'TRANSFER') {
            if (existing.source_location_id) {
              await InventoryTransaction.create([{
                transaction_type: 'TRANSFER',
                product_id: existing.product_id,
                quantity: Math.abs(diff),
                source_location_id: existing.source_location_id,
                destination_location_id: existing.destination_location_id,
                transaction_date: new Date(),
                created_by: req.user._id,
              }], { session });
            }
          }
        }

        const updateData = {};
        if (updates.quantity) updateData.quantity = parseFloat(updates.quantity);
        if (updates.reason) updateData.reason = updates.reason;
        updateData.updated_by = req.user._id;

        const updated = await InventoryTransaction.findByIdAndUpdate(id, updateData, { new: true, session })
          .populate('product_id', 'name')
          .populate('vendor_id', 'name')
          .populate('source_location_id', 'name')
          .populate('destination_location_id', 'name');

        await AuditLog.create([{
          user_id: req.user._id,
          action: 'UPDATE',
          entity_type: 'InventoryTransaction',
          entity_id: id,
          old_values: existing,
          new_values: updated,
        }], { session });

        await session.commitTransaction();
        res.json(updated);
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    })();
  }).catch(async (error) => {
    console.error('Transaction update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  });
}

async function deleteTransaction(req, res) {
  const { id } = req.params;

  const transaction = await InventoryTransaction.findById(id).populate('product_id', 'name');
  if (!transaction || transaction.is_deleted) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  await mongoose.startSession().then(session => {
    session.startTransaction();
    return (async () => {
      try {
        const qty = parseFloat(transaction.quantity);

        if (transaction.transaction_type === 'STOCK_IN' && transaction.destination_location_id) {
          await InventoryTransaction.create([{
            transaction_type: 'ADJUSTMENT',
            product_id: transaction.product_id,
            quantity: -qty,
            destination_location_id: transaction.destination_location_id,
            reason: `Delete transaction #${id}`,
            transaction_date: new Date(),
            created_by: req.user._id,
          }], { session });
        } else if (transaction.transaction_type === 'STOCK_OUT' && transaction.source_location_id) {
          await InventoryTransaction.create([{
            transaction_type: 'ADJUSTMENT',
            product_id: transaction.product_id,
            quantity: qty,
            source_location_id: transaction.source_location_id,
            reason: `Delete transaction #${id}`,
            transaction_date: new Date(),
            created_by: req.user._id,
          }], { session });
        } else if (transaction.transaction_type === 'TRANSFER') {
          if (transaction.source_location_id) {
            await InventoryTransaction.create([{
              transaction_type: 'TRANSFER',
              product_id: transaction.product_id,
              quantity: qty,
              source_location_id: transaction.destination_location_id,
              destination_location_id: transaction.source_location_id,
              transaction_date: new Date(),
              created_by: req.user._id,
            }], { session });
          }
        }

        await InventoryTransaction.findByIdAndUpdate(id, { is_deleted: true, updated_by: req.user._id }, { session });

        await AuditLog.create([{
          user_id: req.user._id,
          action: 'DELETE',
          entity_type: 'InventoryTransaction',
          entity_id: id,
          old_values: transaction,
          new_values: { is_deleted: true },
        }], { session });

        await session.commitTransaction();
        res.json({ message: 'Transaction deleted successfully' });
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }
    })();
  }).catch(async (error) => {
    console.error('Transaction delete error:', error);
    res.status(500).json({ error: 'Internal server error' });
  });
}

async function getStockAtLocation(productId, locationId) {
  const pipeline = [
    {
      $match: {
        product_id: new ObjectId(productId),
        is_deleted: false,
        $or: [
          { transaction_type: 'STOCK_IN', destination_location_id: new ObjectId(locationId) },
          { transaction_type: 'TRANSFER', destination_location_id: new ObjectId(locationId) },
          { transaction_type: 'TRANSFER', source_location_id: new ObjectId(locationId) },
          { transaction_type: 'STOCK_OUT', source_location_id: new ObjectId(locationId) },
          { transaction_type: 'ADJUSTMENT', source_location_id: new ObjectId(locationId) },
        ],
      },
    },
    {
      $group: {
        _id: null,
        inTotal: {
          $sum: {
            $cond: [
              { $eq: ['$transaction_type', 'STOCK_IN'] },
              '$quantity',
              {
                $cond: [
                  { $eq: ['$transaction_type', 'TRANSFER'] },
                  {
                    $cond: [
                      { $eq: ['$destination_location_id', new ObjectId(locationId)] },
                      '$quantity',
                      0,
                    ],
                  },
                  0,
                ],
              },
            ],
          },
        },
        outTotal: {
          $sum: {
            $cond: [
              { $eq: ['$transaction_type', 'STOCK_OUT'] },
              '$quantity',
              {
                $cond: [
                  { $eq: ['$transaction_type', 'TRANSFER'] },
                  {
                    $cond: [
                      { $eq: ['$source_location_id', new ObjectId(locationId)] },
                      '$quantity',
                      0,
                    ],
                  },
                  0,
                ],
              },
            ],
          },
        },
      },
    },
  ];

  const result = await InventoryTransaction.aggregate(pipeline);

  if (result.length === 0) {
    return 0;
  }

  return Math.max(0, (result[0].inTotal || 0) - (result[0].outTotal || 0));
}

module.exports = {
  stockIn,
  stockOut,
  transfer,
  adjustment,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getStockAtLocation,
};
