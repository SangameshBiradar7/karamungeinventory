require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDatabase } = require('./config/database');
const { createSessionMiddleware } = require('./config/session');
const { errorHandler } = require('./middleware/errorHandler');
const routes = require('./routes');
const { mongoose } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

(async () => {
  await connectDatabase();
})();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(createSessionMiddleware());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api', routes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use(errorHandler);

const isVercel = process.env.VERCEL === '1';

if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`Karamunge Traders server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

process.on('SIGINT', async () => {
  await mongoose.disconnect();
  process.exit(0);
});

module.exports = { app };
