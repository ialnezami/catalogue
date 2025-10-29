# 🚀 Quick Multi-Tenant Test Guide

## Setup (One-time)

```bash
# 1. Install dependencies
npm install

# 2. Start MongoDB in Docker
npm run docker:up

# 3. Wait for MongoDB (10 seconds)
sleep 10

# 4. Seed test data
npm run seed:test

# 5. Start Next.js
npm run dev
```

Open: http://localhost:3000/login

## Test Credentials

### Super Admin
- Username: `super_admin`
- Password: `super_admin876635`
- URL: http://localhost:3000/super-admin

### Roze Shop Admin
- Username: `admin`
- Password: `adminrozeplatform`
- URL: http://localhost:3000/admin/products

### Jador Shop Admin
- Username: `admin`
- Password: `adminjadorplatform`
- URL: http://localhost:3000/admin/products

## Quick Test Scenarios

### Test 1: Data Separation
1. Login as Roze admin
2. Go to Products → See 3 products
3. Add a product
4. Logout
5. Login as Jador admin
6. Go to Products → See only Jador products (different from Roze)

### Test 2: POS Orders
1. Login as Roze admin
2. Go to POS
3. Add products and complete sale
4. Go to Orders → See Roze orders
5. Logout
6. Login as Jador admin
7. Go to Orders → No Roze orders visible (only Jador)

### Test 3: Super Admin
1. Login as super_admin
2. Go to /super-admin
3. Create new platform "Test Shop"
4. Create admin for "Test Shop"
5. Credentials displayed

### Test 4: Platform URL Parameter
Open in browser:
- `http://localhost:3000?platform=roze` → Shows Roze data
- `http://localhost:3000?platform=jador` → Shows Jador data

## Verify Database

```bash
# Test data isolation
npm run test:tenant
```

Expected output:
- Roze platform: 3+ products
- Jador platform: 3+ products
- Each platform's data is isolated

## Stop Everything

```bash
# Stop Next.js (Ctrl+C)

# Stop MongoDB
npm run docker:down
```

## Reset Everything

```bash
# Clean database and re-seed
docker exec -it catalogue-mongodb mongosh -u admin -p password123 --authenticationDatabase admin --eval "db.dropDatabase()"
npm run seed:test
```

## Common Commands

| Task | Command |
|------|---------|
| Start MongoDB | `npm run docker:up` |
| Stop MongoDB | `npm run docker:down` |
| Seed Data | `npm run seed:test` |
| Test Isolation | `npm run test:tenant` |
| View Logs | `npm run docker:logs` |
| Start App | `npm run dev` |

## What Gets Created?

- **Platforms**: Roze Collection, Jador Boutique
- **Products**: 3 for Roze, 3 for Jador
- **Admins**: One for each platform
- **Database**: MongoDB with proper indexes

## URLs to Test

- Login: http://localhost:3000/login
- Super Admin: http://localhost:3000/super-admin
- Admin Products: http://localhost:3000/admin/products
- Admin Orders: http://localhost:3000/admin/orders
- POS: http://localhost:3000/pos
- Homepage: http://localhost:3000

