const mongoose = require('mongoose');
const XLSX = require('xlsx');
const { Product, Location, InventoryTransaction } = require('../models');
const ObjectId = mongoose.Types.ObjectId;

async function exportInventory(req, res) {
  const format = req.query.format || 'csv';

  const products = await Product.find({ is_active: true }).sort({ name: 1 });
  const locations = await Location.find({});

  const data = [];
  for (const product of products) {
    const row = { 'Product Name': product.name };
    let total = 0;

    for (const location of locations) {
      const inQty = await getQuantityByType(product._id.toString(), location._id.toString(), ['STOCK_IN', 'TRANSFER'], 'destination');
      const outQty = await getQuantityByType(product._id.toString(), location._id.toString(), ['STOCK_OUT', 'TRANSFER'], 'source');
      const adjQty = await getQuantityByType(product._id.toString(), location._id.toString(), ['ADJUSTMENT'], 'source');
      const qty = Math.max(0, inQty - outQty + adjQty);
      row[location.name] = qty;
      total += qty;
    }

    row['Total'] = total;
    data.push(row);
  }

  return sendExport(res, data, 'inventory', format);
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

async function exportReceiving(req, res) {
  const format = req.query.format || 'csv';
  const { period = 'today', startDate, endDate } = req.query;

  const dateFilter = buildDateFilter(period, startDate, endDate);

  const transactions = await InventoryTransaction.find({
    transaction_type: 'STOCK_IN',
    is_deleted: false,
    transaction_date: dateFilter,
  })
    .populate('product_id', 'name')
    .populate('vendor_id', 'name')
    .populate('destination_location_id', 'name')
    .populate('created_by', 'name')
    .sort({ transaction_date: -1 });

  const data = transactions.map(t => ({
    'Date': formatDate(t.transaction_date),
    'Product': t.product_id?.name || t.item_name_snapshot || 'Unknown',
    'Vendor': t.vendor_id?.name || 'Unknown',
    'Quantity': parseFloat(t.quantity),
    'Location': t.destination_location_id?.name || 'Unknown',
    'Received By': t.created_by?.name || 'Unknown',
  }));

  return sendExport(res, data, 'receiving', format);
}

async function exportStockIn(req, res) {
  const format = req.query.format || 'csv';
  const { period = 'today', startDate, endDate } = req.query;

  const dateFilter = buildDateFilter(period, startDate, endDate);

  const transactions = await InventoryTransaction.find({
    transaction_type: 'STOCK_IN',
    is_deleted: false,
    transaction_date: dateFilter,
  })
    .populate('product_id', 'name')
    .populate('vendor_id', 'name')
    .populate('destination_location_id', 'name')
    .sort({ transaction_date: -1 });

  const data = transactions.map(t => ({
    'Date': formatDate(t.transaction_date),
    'Product': t.product_id?.name || 'Unknown',
    'Vendor': t.vendor_id?.name || 'Unknown',
    'Quantity': parseFloat(t.quantity),
    'Location': t.destination_location_id?.name || 'Unknown',
  }));

  return sendExport(res, data, 'stock-in', format);
}

async function exportStockOut(req, res) {
  const format = req.query.format || 'csv';
  const { period = 'today', startDate, endDate } = req.query;

  const dateFilter = buildDateFilter(period, startDate, endDate);

  const transactions = await InventoryTransaction.find({
    transaction_type: 'STOCK_OUT',
    is_deleted: false,
    transaction_date: dateFilter,
  })
    .populate('product_id', 'name')
    .populate('source_location_id', 'name')
    .populate('created_by', 'name')
    .sort({ transaction_date: -1 });

  const data = transactions.map(t => ({
    'Date': formatDate(t.transaction_date),
    'Product': t.product_id?.name || t.item_name_snapshot || 'Unknown',
    'Quantity': parseFloat(t.quantity),
    'Location': t.source_location_id?.name || 'Unknown',
    'Type': t.item_name_snapshot && !t.product_id ? 'Manual' : 'Registered',
  }));

  return sendExport(res, data, 'stock-out', format);
}

async function exportVendor(req, res) {
  const { vendorId } = req.params;
  const format = req.query.format || 'csv';

  const transactions = await InventoryTransaction.find({
    vendor_id: vendorId,
    is_deleted: false,
  })
    .populate('product_id', 'name')
    .populate('destination_location_id', 'name')
    .sort({ transaction_date: -1 });

  const data = transactions.map(t => ({
    'Date': formatDate(t.transaction_date),
    'Product': t.product_id?.name || 'Unknown',
    'Quantity': parseFloat(t.quantity),
    'Location': t.destination_location_id?.name || 'Unknown',
  }));

  return sendExport(res, data, `vendor-${vendorId}`, format);
}

function buildDateFilter(period, startDate, endDate) {
  const now = new Date();
  const start = new Date();

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      return { $gte: start, $lte: now };
    case 'week':
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { $gte: start, $lte: now };
    case 'month':
      start.setMonth(now.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      return { $gte: start, $lte: now };
    case 'custom':
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      return { $gte: s, $lte: e };
    default:
      start.setHours(0, 0, 0, 0);
      return { $gte: start, $lte: now };
  }
}

function sendExport(res, data, filename, format) {
  if (format === 'xlsx' || format === 'excel') {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
    return res.send(buf);
  } else {
    if (!data || data.length === 0) {
      return res.type('text/csv').send('');
    }
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    return res.send(csv);
  }
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

module.exports = {
  exportInventory,
  exportReceiving,
  exportStockIn,
  exportStockOut,
  exportVendor,
};
