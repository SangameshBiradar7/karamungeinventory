const session = require('express-session');
const MongoStore = require('connect-mongo');

function createSessionMiddleware() {
  const store = process.env.DATABASE_URL
    ? MongoStore.create({
        mongoUrl: process.env.DATABASE_URL,
        collectionName: 'sessions',
        ttl: 7 * 24 * 60 * 60,
        autoRemove: 'native',
      })
    : undefined;

  return session({
    store,
    secret: process.env.SESSION_SECRET || 'karamunge-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  });
}

module.exports = { createSessionMiddleware };
