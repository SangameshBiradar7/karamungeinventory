const mongoose = require('mongoose');
const { Product, Location, InventoryTransaction } = require('../models');
const ObjectId = mongoose.Types.ObjectId;

function getDateRange(period, startDate, endDate) {
  const now = new Date();
  const start = new Date();

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      break;
    default:
      if (startDate && endDate) {
        start.setTime(new Date(startDate).getTime());
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      start.setHours(0, 0, 0, 0);
  }

  return { start, end: now };
}

async function getReceivingReport(req, res) {
  const { period = 'today', startDate, endDate } = req.query;
  const dateRange = getDateRange(period, startDate, endDate);

  const transactions = await InventoryTransaction.find({
    transaction_type: 'STOCK_IN',
    is_deleted: false,
    transaction_date: { $gte: dateRange.start, $lte: dateRange.end },
  })
    .populate('product_id', 'name')
    .populate('vendor_id', 'name')
    .populate('destination_location_id', 'name')
    .populate('created_by', 'name')
    .sort({ transaction_date: -1 });

  const vendors = new Set(transactions.map(t => t.vendor_id && t.vendor_id._id).filter(Boolean));
  const products = new Set(transactions.map(t => t.product_id && t.product_id._id).filter(Boolean));
  const totalQty = transactions.reduce((sum, t) => sum + parseFloat(t.quantity), 0);

  res.json({
    transactions,
    summary: {
      vendor_count: vendors.size,
      product_count: products.size,
      total_quantity: totalQty,
    },
  });
}

async function getStockInReport(req, res) {
  const { period = 'today', startDate, endDate } = req.query;
  const dateRange = getDateRange(period, startDate, endDate);

  const transactions = await InventoryTransaction.find({
    transaction_type: 'STOCK_IN',
    is_deleted: false,
    transaction_date: { $gte: dateRange.start, $lte: dateRange.end },
  })
    .populate('product_id', 'name')
    .populate('vendor_id', 'name')
    .populate('destination_location_id', 'name')
    .sort({ transaction_date: -1 });

  res.json({ transactions });
}

async function getStockOutReport(req, res) {
  const { period = 'today', startDate, endDate } = req.query;
  const dateRange = getDateRange(period, startDate, endDate);

  const transactions = await InventoryTransaction.find({
    transaction_type: 'STOCK_OUT',
    is_deleted: false,
    transaction_date: { $gte: dateRange.start, $lte: dateRange.end },
  })
    .populate('product_id', 'name')
    .populate('source_location_id', 'name')
    .populate('created_by', 'name')
    .sort({ transaction_date: -1 });

  res.json({ transactions });
}

async function getInventoryReport(req, res) {
  const products = await Product.find({ is_active: true }).sort({ name: 1 });
  const locations = await Location.find({});
  const inventory = [];

  for (const product of products) {
    const stockByLocation = [];
    for (const location of locations) {
      const inQty = await getQuantityByType(product._id.toString(), location._id.toString(), ['STOCK_IN', 'TRANSFER'], 'destination');
      const outQty = await getQuantityByType(product._id.toString(), location._id.toString(), ['STOCK_OUT', 'TRANSFER'], 'source');
      const adjQty = await getQuantityByType(product._id.toString(), location._id.toString(), ['ADJUSTMENT'], 'source');

      const qty = Math.max(0, inQty - outQty + adjQty);
      stockByLocation.push({ location_name: location.name, quantity: qty });
    }

    inventory.push({
      product: { id: product._id, name: product.name },
      stock_by_location: stockByLocation,
      total: stockByLocation.reduce((sum, loc) => sum + loc.quantity, 0),
    });
  }

  res.json({ inventory });
}

async function getQuantityByType(productId, locationId, types, locationField) {
  const match = {
    product_id: new ObjectId(productId),
    is_deleted: false,
    transaction_type: { $in: types },
  };

  if (locationField === 'destination') {
    match.destination_location_id = new ObjectId(locationId);
  } else {
    match.source_location_id = new ObjectId(locationId);
  }

  const result = await InventoryTransaction.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$quantity' } } },
  ]);

  return result.length > 0 ? result[0].total : 0;
}

async function getProductMovement(req, res) {
  const { productId } = req.params;
  const { period = 'month', startDate, endDate } = req.query;
  const dateRange = getDateRange({ period, startDate, endDate });

  const transactions = await InventoryTransaction.find({
    product_id: productId,
    is_deleted: false,
    transaction_date: { $gte: dateRange.start, $lte: dateRange.end },
  })
    .populate('source_location_id', 'name')
    .populate('destination_location_id', 'name')
    .populate('vendor_id', 'name')
    .populate('created_by', 'name')
    .sort({ transaction_date: -1 });

  res.json({ transactions });
}

async function getTransferReport(req, res) {
  const { period = 'month', startDate, endDate } = req.query;
  const dateRange = getDateRange(period, startDate, endDate);

  const transactions = await InventoryTransaction.find({
    transaction_type: 'TRANSFER',
    is_deleted: false,
    transaction_date: { $gte: dateRange.start, $lte: dateRange.end },
  })
    .populate('product_id', 'name')
    .populate('source_location_id', 'name')
    .populate('destination_location_id', 'name')
    .sort({ transaction_date: -1 });

  res.json({ transactions });
}

async function getVendorReport(req, res) {
  const { vendorId } = req.params;

  const transactions = await InventoryTransaction.find({
    vendor_id: vendorId,
    is_deleted: false,
  })
    .populate('product_id', 'name')
    .populate('destination_location_id', 'name')
    .sort({ transaction_date: -1 });

  const totalReceived = transactions.reduce((sum, t) => sum + parseFloat(t.quantity), 0);

  res.json({
    transactions,
    summary: {
      total_transactions: transactions.length,
      total_received: totalReceived,
    },
  });
}

module.exports = {
  getReceivingReport,
  getStockInReport,
  getStockOutReport,
  getInventoryReport,
  getProductMovement,
  getTransferReport,
  getVendorReport,
};
