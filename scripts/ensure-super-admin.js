/**
 * Ensure Super Admin Script
 * 
 * This script ensures that a super admin user exists in the database after deployment.
 * It's safe to run multiple times (idempotent).
 * 
 * Usage:
 *   NODE_ENV=production node scripts/ensure-super-admin.js
 *   OR
 *   npm run ensure:super-admin
 * 
 * Environment Variables:
 *   MONGODB_URI - MongoDB connection string (optional, uses default if not set)
 *   DB_NAME - Database name (optional, defaults to 'catalogue')
 *   SUPER_ADMIN_USERNAME - Super admin username (defaults to 'super_admin')
 *   SUPER_ADMIN_PASSWORD - Super admin password (defaults to 'super_admin876635')
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Try to load dotenv if available (for local development)
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not available, use environment variables directly
  console.log('📝 Using environment variables directly (dotenv not available)');
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/catalogue?authSource=admin';
const DB_NAME = process.env.DB_NAME || 'catalogue';
const SUPER_ADMIN_USERNAME = process.env.SUPER_ADMIN_USERNAME || 'super_admin';
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'super_admin876635';

async function ensureSuperAdmin() {
  let client;
  
  try {
    console.log('🔄 Ensuring super admin exists...');
    console.log(`📊 Database: ${DB_NAME}`);
    console.log(`🔗 URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`); // Hide credentials
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const adminsCollection = db.collection('admins');
    
    // Check if super admin already exists
    const existingSuperAdmin = await adminsCollection.findOne({ 
      username: SUPER_ADMIN_USERNAME,
      role: 'super_admin'
    });
    
    if (existingSuperAdmin) {
      console.log('✅ Super admin already exists');
      console.log(`   Username: ${SUPER_ADMIN_USERNAME}`);
      console.log('   Status: Active');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
    
    // Create super admin
    const superAdmin = {
      username: SUPER_ADMIN_USERNAME,
      password: hashedPassword,
      role: 'super_admin',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await adminsCollection.insertOne(superAdmin);
    
    console.log('✅ Super admin created successfully!');
    console.log(`   Username: ${SUPER_ADMIN_USERNAME}`);
    console.log(`   Password: ${SUPER_ADMIN_PASSWORD}`);
    console.log('   Role: super_admin');
    console.log('   Status: Active');
    console.log('\n⚠️  IMPORTANT: Change the default password after first login!');
    
  } catch (error) {
    console.error('\n❌ Error ensuring super admin:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

// Run script
if (require.main === module) {
  ensureSuperAdmin()
    .then(() => {
      console.log('\n🎉 Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { ensureSuperAdmin };

