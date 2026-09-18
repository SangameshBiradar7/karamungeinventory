# Karamunge Traders - Inventory Management System

A production-ready mobile-first inventory management web application for Karamunge Traders dairy business.

## Features

- **Stock Management**: Stock IN, Stock OUT, Transfer, and Adjustment
- **Real-time Inventory**: Calculated from transactions, not cached
- **Product & Vendor Management**: Search, add, edit, delete
- **Reports**: Receiving, Stock IN/OUT, Inventory, Transfers, Vendor reports
- **Export**: CSV and Excel (XLSX) exports
- **Audit Logs**: Track all changes
- **User Management**: Admin and staff roles
- **Mobile-first Design**: Responsive, touch-optimized UI

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: Vanilla HTML/CSS/JS (no frameworks)
- **Auth**: Express sessions with connect-mongo
- **Export**: SheetJS (xlsx)

## Setup Instructions

### 1. MongoDB

This application uses MongoDB. You can use:
- Local MongoDB installation
- MongoDB Atlas (cloud)

### 2. Configure Environment

```bash
# Copy environment template
copy .env.example .env
```

Edit `.env` and fill in:
- `DATABASE_URL`: MongoDB connection string
- `SESSION_SECRET`: Random secret key for sessions
- `PORT`: Server port (default: 5000)

Example `.env`:
```
DATABASE_URL="mongodb+srv://username:password@cluster0.mongodb.net/karamunge"
SESSION_SECRET="your-secret-key-here"
PORT=5000
NODE_ENV=development
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Seed Database

```bash
npm run seed
```

This creates:
- Two locations: Main Store, Cold Room
- Default admin user: `admin@karamunge.com` / `admin123`

### 5. Start the Application

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

### 6. Open Browser

Navigate to http://localhost:5000

## Default Login

- **Email**: admin@karamunge.com
- **Password**: admin123

## Available Scripts

- `npm start` - Start the server
- `npm run dev` - Start with nodemon (auto-reload)
- `npm run seed` - Seed the database

## API Endpoints

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Products
- `GET /api/products`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

### Vendors
- `GET /api/vendors`
- `POST /api/vendors`
- `PUT /api/vendors/:id`
- `DELETE /api/vendors/:id`

### Transactions
- `POST /api/transactions/stock-in`
- `POST /api/transactions/stock-out`
- `POST /api/transactions/transfer`
- `POST /api/transactions/adjustment`
- `GET /api/transactions`
- `PUT /api/transactions/:id`
- `DELETE /api/transactions/:id`

### Inventory
- `GET /api/inventory`
- `GET /api/inventory/:productId`

### Reports
- `GET /api/reports/receiving`
- `GET /api/reports/stock-in`
- `GET /api/reports/stock-out`
- `GET /api/reports/inventory`
- `GET /api/reports/product-movement/:productId`
- `GET /api/reports/transfer`
- `GET /api/reports/vendor/:vendorId`

### Export
- `GET /api/export/inventory`
- `GET /api/export/receiving`
- `GET /api/export/stock-in`
- `GET /api/export/stock-out`
- `GET /api/export/vendor/:vendorId`

### Users (Admin only)
- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

### Audit Logs (Admin only)
- `GET /api/audit-logs`

## Database Schema

### Users
- id, email, password_hash, name, role, is_active, created_at, updated_at

### Products
- id, name, is_active, created_at, updated_at

### Vendors
- id, name, is_active, created_at, updated_at

### Locations
- id, name, created_at

### Inventory Transactions
- id, transaction_type, product_id, vendor_id, item_name_snapshot, quantity
- source_location_id, destination_location_id, transaction_date
- reason, is_deleted, created_by, updated_by, created_at, updated_at

### Audit Logs
- id, user_id, action, entity_type, entity_id, old_values, new_values, created_at

## Inventory Calculation

Stock is calculated in real-time from transactions:

```
current_stock = SUM(STOCK_IN + TRANSFER_IN) - SUM(STOCK_OUT + TRANSFER_OUT) + SUM(ADJUSTMENTS)
```

No cached values - all calculations happen at query time.

## Project Structure

```
karamunge/
├── src/
│   ├── server.js
│   ├── config/
│   │   ├── database.js
│   │   └── session.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   └── index.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── vendorController.js
│   │   ├── transactionController.js
│   │   ├── inventoryController.js
│   │   ├── reportController.js
│   │   ├── exportController.js
│   │   ├── userController.js
│   │   ├── auditController.js
│   │   └── locationController.js
│   ├── models/
│   │   └── index.js
│   └── seed.js
├── public/
│   ├── index.html
│   ├── css/
│   │   └── app.css
│   ├── js/
│   │   └── app.js
│   ├── pages/
│   │   ├── login.js
│   │   ├── dashboard.js
│   │   ├── stockIn.js
│   │   ├── stockOut.js
│   │   ├── transfer.js
│   │   ├── inventory.js
│   │   ├── history.js
│   │   ├── products.js
│   │   ├── vendors.js
│   │   ├── receiving.js
│   │   ├── reports.js
│   │   ├── reportDetail.js
│   │   ├── more.js
│   │   ├── users.js
│   │   ├── auditLogs.js
│   │   ├── productDetail.js
│   │   └── vendorDetail.js
│   └── components/
├── uploads/
├── package.json
├── .env.example
└── README.md
```

## Security

- All API routes (except login) require authentication
- Admin-only routes check user role
- Passwords hashed with bcrypt
- MongoDB injection protected by Mongoose ODM
- Input validation on every endpoint
- Session-based authentication with connect-mongo store

## License

MIT
