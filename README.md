# Interactive Urban Farming Platform Backend

Node.js + Express + MongoDB backend for an urban farming ecosystem with authentication, role-based access control, rental spaces, produce marketplace, sustainability verification, community forum, and real-time plant tracking.

## Core Features
- JWT authentication with RBAC (`admin`, `vendor`, `customer`)
- Vendor profile and admin approval flow
- Garden rental space listing, location-based search, and booking
- Produce marketplace with certification status workflow
- Order creation and status tracking with pagination
- Community forum posts with ownership checks
- Sustainability certification submission and admin review
- Real-time plant updates via Socket.IO (`plant:update`)
- Standardized JSON responses and centralized error handling
- Route-level rate limiting for sensitive auth endpoints
- Swagger API docs at `/api/docs`
- MongoDB migration workflow for schema evolution and indexes
- Seed script with admin, customer, vendor, product, order, forum, and plant data
- Postman collection with sample requests and responses
- Benchmark script and report generation (`npm run benchmark`)

## Project Structure
```text
src/
  app.js
  server.js
  config/
  controllers/
  docs/
  middlewares/
  models/
  routes/
  utils/
scripts/
  benchmark.js
  seed.js
docs/
  BENCHMARK_REPORT.md
  API_RESPONSE_AND_PERFORMANCE.md
  DATABASE_SCHEMA_AND_MIGRATIONS.md
  UrbanFarming.postman_collection.json
```

## Setup
1. Install dependencies:
```bash
npm install
```
2. Create environment file:
```bash
Copy-Item .env.example .env
```
3. Update `.env` values.
4. Run in development:
```bash
npm run dev
```

## Local MongoDB Requirement

The API needs a live MongoDB connection before the server will start.

Option 1: local MongoDB
```bash
MONGO_URI=mongodb://127.0.0.1:27017/urban_farming
```

Option 2: MongoDB Atlas
```bash
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/urban_farming
```

If MongoDB is not running, startup will fail with `ECONNREFUSED 127.0.0.1:27017`.

## Database Schema And Migrations

The app uses Mongoose schemas for validation and document shape, while migrations handle data backfills and index evolution.

Commands:
```bash
npm run migrate:status
npm run migrate:up
npm run migrate:down
```

Reference:
- `docs/DATABASE_SCHEMA_AND_MIGRATIONS.md`

## Seeder

Populate the database with seed data:
```bash
npm run seed
```

Reset and reseed:
```bash
npm run seed:reset
```

The seed script creates:
- 1 admin
- 10 vendors
- 12 customers
- 100 products
- supporting rental spaces, orders, community posts, certifications, and plant records

Seed credentials:
- `admin@seed.urbanfarm.local` / `AdminPass123!`
- `vendor01@seed.urbanfarm.local` to `vendor10@seed.urbanfarm.local` / `VendorPass123!`
- `customer01@seed.urbanfarm.local` to `customer12@seed.urbanfarm.local` / `CustomerPass123!`

## Main API Groups
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/vendors`
- `PUT /api/vendors/me/profile`
- `GET /api/produce`
- `POST /api/produce`
- `GET /api/rental-spaces`
- `POST /api/rental-spaces/:rentalSpaceId/book`
- `POST /api/orders`
- `GET /api/community-posts`
- `POST /api/community-posts`
- `POST /api/sustainability-certs`
- `GET /api/plants`
- `POST /api/plants/:plantId/updates`
- `GET /api/admin/dashboard`

## Real-time Plant Events
Clients can connect to Socket.IO and subscribe to plant-specific rooms:
- `join:plant` with `plantId`
- `leave:plant` with `plantId`
- server emits `plant:update`

## Standard Response Shape
Success:
```json
{
  "success": true,
  "message": "Request successful",
  "data": {},
  "meta": {}
}
```

Error:
```json
{
  "success": false,
  "message": "Validation failed",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": []
  }
}
```

## Benchmark
Run:
```bash
npm run benchmark
```
Generated report:
- `docs/BENCHMARK_REPORT.md`

## API Examples

- Swagger UI: `/api/docs`
- Postman collection: `docs/UrbanFarming.postman_collection.json`

## Response Control And Performance

See:
- `docs/API_RESPONSE_AND_PERFORMANCE.md`
