function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];
    return res.status(400).json({ error: `A record with this ${field} already exists` });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({ error: message });
}

module.exports = { errorHandler };
