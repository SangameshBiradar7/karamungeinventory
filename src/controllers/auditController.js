const { AuditLog } = require('../models');

async function getAuditLogs(req, res) {
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [logs, total] = await Promise.all([
    AuditLog.find({})
      .populate('user_id', 'name email')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    AuditLog.countDocuments(),
  ]);

  res.json({ logs, total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) });
}

module.exports = { getAuditLogs };
