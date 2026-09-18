const mongoose = require('mongoose');
const { Product, Location, InventoryTransaction } = require('../models');
const ObjectId = mongoose.Types.ObjectId;

async function getInventory(req, res) {
  const products = await Product.find({ is_active: true }).sort({ name: 1 });
  const locations = await Location.find({});
  const mainStore = locations.find(l => l.name === 'Main Store');
  const coldRoom = locations.find(l => l.name === 'Cold Room');

  const inventory = [];

  for (const product of products) {
    let mainStoreQty = 0;
    let coldRoomQty = 0;

    if (mainStore) {
      mainStoreQty = await calculateStock(product._id.toString(), mainStore._id.toString());
    }
    if (coldRoom) {
      coldRoomQty = await calculateStock(product._id.toString(), coldRoom._id.toString());
    }

    inventory.push({
      product: { id: product._id, name: product.name },
      mainStore: mainStoreQty,
      coldRoom: coldRoomQty,
      total: mainStoreQty + coldRoomQty,
    });
  }

  res.json(inventory);
}

async function getInventoryByProduct(req, res) {
  const { productId } = req.params;

  const product = await Product.findById(productId);
  if (!product || !product.is_active) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const locations = await Location.find({});
  const stockByLocation = [];

  for (const location of locations) {
    const qty = await calculateStock(productId, location._id.toString());
    stockByLocation.push({
      location_id: location._id,
      location_name: location.name,
      quantity: qty,
    });
  }

  const recentTransactions = await InventoryTransaction.find({ product_id: productId, is_deleted: false })
    .populate('vendor_id', 'name')
    .populate('source_location_id', 'name')
    .populate('destination_location_id', 'name')
    .populate('created_by', 'name')
    .sort({ transaction_date: -1 })
    .limit(20);

  res.json({
    product: { id: product._id, name: product.name },
    stock_by_location: stockByLocation,
    total_stock: stockByLocation.reduce((sum, loc) => sum + loc.quantity, 0),
    recent_transactions: recentTransactions,
  });
}

async function calculateStock(productId, locationId) {
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
        inQty: {
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
        outQty: {
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
        adjQty: {
          $sum: {
            $cond: [
              { $eq: ['$transaction_type', 'ADJUSTMENT'] },
              '$quantity',
              0,
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

  const inTotal = result[0].inQty || 0;
  const outTotal = result[0].outQty || 0;
  const adjTotal = result[0].adjQty || 0;

  return Math.max(0, inTotal - outTotal + adjTotal);
}

module.exports = { getInventory, getInventoryByProduct, calculateStock };
