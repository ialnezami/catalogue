# Docker MongoDB Setup Guide

This guide explains how to run MongoDB locally using Docker for the Catalogue application.

## Prerequisites

- Docker and Docker Compose installed on your system
- Node.js and npm installed

## Quick Start

1. **Start MongoDB with Docker**:
   ```bash
   docker-compose up -d
   ```

2. **Verify MongoDB is running**:
   ```bash
   docker ps
   ```
   You should see the `catalogue-mongodb` container running.

3. **Create environment file**:
   Create a `.env.local` file in the project root:
   ```bash
   cp .env.example .env.local
   ```

   Or manually create `.env.local` with:
   ```bash
   MONGODB_URI=mongodb://admin:admin123@localhost:27017/catalogue?authSource=admin
   DB_NAME=catalogue
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

## Docker Commands

### Start MongoDB
```bash
docker-compose up -d
```

### Stop MongoDB
```bash
docker-compose down
```

### Stop and Remove All Data
```bash
docker-compose down -v
```

### View MongoDB Logs
```bash
docker-compose logs -f mongodb
```

### Connect to MongoDB Shell
```bash
docker exec -it catalogue-mongodb mongosh -u admin -p admin123
```

### Access MongoDB with mongosh
```bash
mongosh mongodb://admin:admin123@localhost:27017/catalogue?authSource=admin
```

## MongoDB Configuration

The Docker setup includes:
- **Container Name**: `catalogue-mongodb`
- **Port**: `27017` (mapped to host)
- **Database**: `catalogue`
- **Root Username**: `admin`
- **Root Password**: `admin123`
- **Data Persistence**: Docker volume `mongodb_data`

## Connection String

For local development with Docker:
```
mongodb://admin:admin123@localhost:27017/catalogue?authSource=admin
```

## Troubleshooting

### Port Already in Use
If port 27017 is already in use:
```bash
# Find the process using the port
lsof -i :27017

# Stop the existing MongoDB process
# Then start Docker MongoDB
docker-compose up -d
```

### Reset Database
To completely reset the MongoDB data:
```bash
docker-compose down -v
docker-compose up -d
```

### Connection Issues
1. Verify MongoDB is running: `docker ps`
2. Check logs: `docker-compose logs mongodb`
3. Test connection: `mongosh mongodb://admin:admin123@localhost:27017/catalogue?authSource=admin`

### Environment Variables Not Loading
- Make sure `.env.local` exists in the project root
- Restart your development server after creating `.env.local`
- Check that the `MONGODB_URI` matches the Docker setup

## Production Deployment

For production, use a managed MongoDB service such as:
- MongoDB Atlas (recommended)
- AWS DocumentDB
- Azure Cosmos DB

Update your `.env.production` with the appropriate connection string.

## Security Notes

⚠️ **Important**: The default credentials (`admin`/`admin123`) are for local development only. 

For production:
1. Use strong, unique passwords
2. Enable authentication
3. Use MongoDB Atlas or another managed service
4. Never commit `.env` files to version control

