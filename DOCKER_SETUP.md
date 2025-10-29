# Docker Setup for Multi-Tenant Testing

Quick start guide for setting up and testing the multi-tenant system with Docker.

## Quick Start

```bash
# 1. Start MongoDB
npm run docker:up

# 2. Seed test data
npm run seed:test

# 3. Start Next.js
npm run dev

# 4. Open browser
# http://localhost:3000/login
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run docker:up` | Start MongoDB container |
| `npm run docker:down` | Stop MongoDB container |
| `npm run docker:logs` | View MongoDB logs |
| `npm run seed:test` | Seed test data (platforms, products, admins) |
| `npm run test:tenant` | Test data isolation |
| `npm run dev` | Start Next.js development server |

## Docker Container Management

### Start/Stop Container

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View running containers
docker ps

# View MongoDB logs
docker logs catalogue-mongodb -f
```

### Database Access

**Using MongoDB Compass (GUI):**
```
mongodb://admin:password123@localhost:27017/?authSource=admin
```

**Using MongoDB Shell:**
```bash
# Connect to MongoDB
docker exec -it catalogue-mongodb mongosh -u admin -p password123 --authenticationDatabase admin

# Switch to catalogue database
use catalogue

# View collections
show collections

# Count documents
db.products.countDocuments({platform: 'roze'})
db.orders.countDocuments({platform: 'jador'})

# View data
db.products.find({platform: 'roze'}).pretty()
db.platforms.find().pretty()
```

## Testing Flow

### 1. Initial Setup

```bash
# Clone/navigate to project
cd catalogue

# Install dependencies (if not done)
npm install

# Start Docker MongoDB
npm run docker:up

# Wait for MongoDB to be ready (about 10 seconds)
sleep 10

# Seed test data
npm run seed:test

# Start application
npm run dev
```

### 2. Test Super Admin

1. Open http://localhost:3000/login
2. Login:
   - Username: `super_admin`
   - Password: `super_admin876635`
3. You'll be redirected to `/super-admin`
4. Create a new platform
5. Create admin for the platform

### 3. Test Platform Admin (Roze)

1. Logout from super admin
2. Login as:
   - Username: `admin`
   - Password: `adminrozeplatform`
3. Navigate to Products - should see 3 Roze products
4. Add a new product - automatically tagged with "roze" platform
5. Complete an order in POS - order saved with "roze" platform

### 4. Test Platform Admin (Jador)

1. Logout
2. Login as:
   - Username: `admin`
   - Password: `adminjadorplatform`
3. Navigate to Products - should see 3 Jador products (different from Roze)
4. Add a new product - automatically tagged with "jador" platform
5. Complete an order in POS - order saved with "jador" platform

### 5. Verify Data Isolation

```bash
npm run test:tenant
```

Expected output shows:
- Roze has 3 products (plus any you added)
- Jador has 3 products (plus any you added)
- Each platform sees only its own data

## Manual Database Queries

### Check Platform Separation

```bash
# Count products per platform
docker exec -it catalogue-mongodb mongosh -u admin -p password123 --authenticationDatabase admin catalogue --eval "
db.products.aggregate([
  { \$group: { _id: '\$platform', count: { \$sum: 1 } } },
  { \$sort: { _id: 1 } }
]).forEach(p => print(p._id + ': ' + p.count + ' products'))
"

# View all platforms
docker exec -it catalogue-mongodb mongosh -u admin -p password123 --authenticationDatabase admin catalogue --eval "db.platforms.find().pretty()"

# Count orders per platform
docker exec -it catalogue-mongodb mongosh -u admin -p password123 --authenticationDatabase admin catalogue --eval "
db.orders.aggregate([
  { \$group: { _id: '\$platform', count: { \$sum: 1 } } },
  { \$sort: { _id: 1 } }
]).forEach(p => print(p._id + ': ' + p.count + ' orders'))
"
```

## Environment Setup

### .env.local File

```env
# MongoDB Connection
MONGODB_URI=mongodb://admin:password123@localhost:27017/catalogue?authSource=admin
DB_NAME=catalogue

# Environment
NODE_ENV=development

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Troubleshooting

### Cannot connect to MongoDB

```bash
# Check if container is running
docker ps

# If not running, start it
npm run docker:up

# Check logs
docker logs catalogue-mongodb
```

### Seed script fails

```bash
# Drop database and try again
docker exec -it catalogue-mongodb mongosh -u admin -p password123 --authenticationDatabase admin --eval "db.dropDatabase()"

# Re-run seed
npm run seed:test
```

### Port conflicts

If port 27017 is in use, change it in `docker-compose.yml`:

```yaml
ports:
  - "27018:27017"  # Use 27018 instead
```

And update `.env.local`:
```env
MONGODB_URI=mongodb://admin:password123@localhost:27018/catalogue?authSource=admin
```

## Clean Slate

To start completely fresh:

```bash
# Stop containers
npm run docker:down

# Remove volumes (deletes all data)
docker-compose down -v

# Start fresh
npm run docker:up
npm run seed:test
```

## Next.js Dev Server

The development server uses environment variables from `.env.local`:

```bash
npm run dev
```

Open http://localhost:3000

## Useful Docker Commands

```bash
# View all containers (including stopped)
docker ps -a

# View MongoDB container status
docker stats catalogue-mongodb

# Execute command in container
docker exec -it catalogue-mongodb mongosh ...

# Remove everything (cleanup)
docker-compose down -v

# Rebuild containers
docker-compose up -d --force-recreate
```

## Production Considerations

For production deployment:

1. Use environment-specific MongoDB credentials
2. Enable MongoDB authentication properly
3. Use connection pooling
4. Set up proper backup strategy
5. Monitor database performance
6. Use production-ready database (MongoDB Atlas, etc.)
