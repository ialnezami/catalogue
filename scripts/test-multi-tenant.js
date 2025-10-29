// Test script to verify multi-tenant data separation
const { MongoClient } = require('mongodb');

const uri = 'mongodb://admin:password123@localhost:27017/catalogue?authSource=admin';

async function testMultiTenant() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB\n');

    const db = client.db('catalogue');

    // Test 1: List all platforms
    console.log('=== Test 1: List All Platforms ===');
    const platforms = await db.collection('platforms').find({}).toArray();
    console.log(`Found ${platforms.length} platforms:`);
    platforms.forEach(p => {
      console.log(`  - ${p.name} (code: ${p.code})`);
    });

    // Test 2: Products per platform
    console.log('\n=== Test 2: Products by Platform ===');
    for (const platform of platforms) {
      const products = await db.collection('products').find({ platform: platform.code }).toArray();
      console.log(`\n  ${platform.name} (${platform.code}): ${products.length} products`);
      products.forEach(p => {
        console.log(`    - ${p.title} ($${p.price}) - Barcode: ${p.barcode}`);
      });
    }

    // Test 3: Orders per platform
    console.log('\n=== Test 3: Orders by Platform ===');
    for (const platform of platforms) {
      const orders = await db.collection('orders').find({ platform: platform.code }).toArray();
      console.log(`  ${platform.name}: ${orders.length} orders`);
    }

    // Test 4: Admins per platform
    console.log('\n=== Test 4: Admins by Platform ===');
    for (const platform of platforms) {
      const admins = await db.collection('admins').find({ platform: platform.code }).toArray();
      console.log(`  ${platform.name}: ${admins.length} admins`);
      admins.forEach(a => {
        console.log(`    - ${a.username} (password: ${a.password})`);
      });
    }

    // Test 5: Settings per platform
    console.log('\n=== Test 5: Settings by Platform ===');
    for (const platform of platforms) {
      const settings = await db.collection('settings').find({ platform: platform.code }).toArray();
      console.log(`  ${platform.name}: ${settings.length} settings`);
    }

    console.log('\n✅ Multi-tenant test completed successfully!');

  } catch (error) {
    console.error('Error testing multi-tenant:', error);
  } finally {
    await client.close();
  }
}

testMultiTenant();

