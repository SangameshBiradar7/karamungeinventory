const express = require('express');
const router = express.Router();

const { login, logout, getMe } = require('../controllers/authController');
const { getProducts, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { getVendors, createVendor, updateVendor, deleteVendor } = require('../controllers/vendorController');
const { getTransactions, updateTransaction, deleteTransaction } = require('../controllers/transactionController');
const { getInventory, getInventoryByProduct } = require('../controllers/inventoryController');
const {
  getReceivingReport, getStockInReport, getStockOutReport,
  getInventoryReport, getProductMovement, getTransferReport, getVendorReport,
} = require('../controllers/reportController');
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { getAuditLogs } = require('../controllers/auditController');
const {
  exportInventory, exportReceiving, exportStockIn, exportStockOut, exportVendor,
} = require('../controllers/exportController');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const { getLocations } = require('../controllers/locationController');

router.get('/locations', authMiddleware, getLocations);

router.post('/auth/login', login);
router.post('/auth/logout', logout);
router.get('/auth/me', authMiddleware, getMe);

router.get('/products', authMiddleware, getProducts);
router.post('/products', authMiddleware, createProduct);
router.put('/products/:id', authMiddleware, updateProduct);
router.delete('/products/:id', authMiddleware, deleteProduct);

router.get('/vendors', authMiddleware, getVendors);
router.post('/vendors', authMiddleware, createVendor);
router.put('/vendors/:id', authMiddleware, updateVendor);
router.delete('/vendors/:id', authMiddleware, deleteVendor);

router.post('/transactions/stock-in', authMiddleware, require('../controllers/transactionController').stockIn);
router.post('/transactions/stock-out', authMiddleware, require('../controllers/transactionController').stockOut);
router.post('/transactions/transfer', authMiddleware, require('../controllers/transactionController').transfer);
router.post('/transactions/adjustment', authMiddleware, require('../controllers/transactionController').adjustment);
router.get('/transactions', authMiddleware, getTransactions);
router.put('/transactions/:id', authMiddleware, updateTransaction);
router.delete('/transactions/:id', authMiddleware, deleteTransaction);

router.get('/inventory', authMiddleware, getInventory);
router.get('/inventory/:productId', authMiddleware, getInventoryByProduct);

router.get('/reports/receiving', authMiddleware, getReceivingReport);
router.get('/reports/stock-in', authMiddleware, getStockInReport);
router.get('/reports/stock-out', authMiddleware, getStockOutReport);
router.get('/reports/inventory', authMiddleware, getInventoryReport);
router.get('/reports/product-movement/:productId', authMiddleware, getProductMovement);
router.get('/reports/transfer', authMiddleware, getTransferReport);
router.get('/reports/vendor/:vendorId', authMiddleware, getVendorReport);

router.get('/export/inventory', authMiddleware, exportInventory);
router.get('/export/receiving', authMiddleware, exportReceiving);
router.get('/export/stock-in', authMiddleware, exportStockIn);
router.get('/export/stock-out', authMiddleware, exportStockOut);
router.get('/export/vendor/:vendorId', authMiddleware, exportVendor);

router.get('/users', authMiddleware, adminOnly, getUsers);
router.post('/users', authMiddleware, adminOnly, createUser);
router.put('/users/:id', authMiddleware, adminOnly, updateUser);
router.delete('/users/:id', authMiddleware, adminOnly, deleteUser);

router.get('/audit-logs', authMiddleware, adminOnly, getAuditLogs);

module.exports = router;
