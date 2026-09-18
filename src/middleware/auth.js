const { User } = require('../models');

async function authMiddleware(req, res, next) {
  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId).select('id email name role is_active');
      if (!user || !user.is_active) {
        req.session.destroy(() => {});
        return res.status(401).json({ error: 'Unauthorized' });
      }
      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

function adminOnly(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden - Admin access required' });
  }
}

module.exports = { authMiddleware, adminOnly };
