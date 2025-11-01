// Audit script to check product platforms
const { MongoClient } = require('mongodb');

// Use environment variable or default
const uri = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/catalogue?authSource=admin';

async function auditPlatforms() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB\n');

    const db = client.db('catalogue');

    // Get all products
    const products = await db.collection('products').find({}).toArray();
    console.log(`\n=== Total Products: ${products.length} ===\n`);

    // Group by platform
    const byPlatform = {};
    const noPlatform = [];

    products.forEach(p => {
      if (!p.platform) {
        noPlatform.push(p);
      } else {
        if (!byPlatform[p.platform]) {
          byPlatform[p.platform] = [];
        }
        byPlatform[p.platform].push(p);
      }
    });

    // Display products by platform
    console.log('=== Products by Platform ===');
    for (const [platform, platformProducts] of Object.entries(byPlatform)) {
      console.log(`\n📦 Platform: "${platform}" - ${platformProducts.length} products`);
      platformProducts.slice(0, 5).forEach(p => {
        console.log(`   - ${p.title} ($${p.price})`);
      });
      if (platformProducts.length > 5) {
        console.log(`   ... and ${platformProducts.length - 5} more`);
      }
    }

    // Display products without platform
    if (noPlatform.length > 0) {
      console.log(`\n⚠️  WARNING: ${noPlatform.length} products WITHOUT platform field`);
      noPlatform.slice(0, 10).forEach(p => {
        console.log(`   - ${p.title} ($${p.price})`);
      });
      if (noPlatform.length > 10) {
        console.log(`   ... and ${noPlatform.length - 10} more`);
      }
      console.log('\n❌ These products will appear in ALL platforms!');
      console.log('💡 Solution: Run the fix script to assign them to a platform\n');
    } else {
      console.log('\n✅ All products have platform assigned!\n');
    }

    console.log('\n=== Platform Summary ===');
    const allPlatforms = Object.keys(byPlatform);
    console.log(`Total platforms with products: ${allPlatforms.length}`);
    allPlatforms.forEach(platform => {
      console.log(`  - "${platform}": ${byPlatform[platform].length} products`);
    });

    if (noPlatform.length > 0) {
      console.log(`  - NO_PLATFORM: ${noPlatform.length} products ⚠️`);
    }

  } catch (error) {
    console.error('Error auditing platforms:', error);
  } finally {
    await client.close();
  }
}

auditPlatforms();

