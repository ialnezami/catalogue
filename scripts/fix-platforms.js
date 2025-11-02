// Fix script to assign platform to products without platform field
const { MongoClient } = require('mongodb');

// Use environment variable or default
const uri = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/catalogue?authSource=admin';

// Default platform for products without platform field
const DEFAULT_PLATFORM = 'default';

async function fixPlatforms() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB\n');

    const db = client.db('catalogue');

    // Get all products without platform
    const productsWithoutPlatform = await db.collection('products').find({ platform: { $exists: false } }).toArray();
    
    console.log(`Found ${productsWithoutPlatform.length} products without platform field\n`);

    if (productsWithoutPlatform.length === 0) {
      console.log('✅ All products already have platform assigned!');
      return;
    }

    // Show which products will be fixed
    console.log('Products to be assigned platform = "' + DEFAULT_PLATFORM + '":');
    productsWithoutPlatform.slice(0, 10).forEach((p, idx) => {
      console.log(`  ${idx + 1}. ${p.title} ($${p.price})`);
    });
    if (productsWithoutPlatform.length > 10) {
      console.log(`  ... and ${productsWithoutPlatform.length - 10} more`);
    }

    console.log(`\n⚠️  About to update ${productsWithoutPlatform.length} products with platform = "${DEFAULT_PLATFORM}"`);
    console.log('Continue? (y/n)');

    // For non-interactive environments, auto-continue after 3 seconds
    let continueUpdate = false;
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('', (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        continueUpdate = true;
      }
      rl.close();
      
      if (continueUpdate) {
        performUpdate();
      } else {
        console.log('\n❌ Update cancelled');
        client.close();
      }
    });

    // Auto-approve for non-interactive scripts
    setTimeout(() => {
      if (!continueUpdate) {
        console.log('\n⏰ Auto-approving after 3 seconds...');
        continueUpdate = true;
        performUpdate();
      }
    }, 3000);

    async function performUpdate() {
      try {
        // Update all products without platform
        const result = await db.collection('products').updateMany(
          { platform: { $exists: false } },
          { $set: { platform: DEFAULT_PLATFORM } }
        );

        console.log(`\n✅ Successfully updated ${result.modifiedCount} products`);
        console.log(`   Platform assigned: "${DEFAULT_PLATFORM}"`);
        
        // Verify
        const remaining = await db.collection('products').find({ platform: { $exists: false } }).count();
        if (remaining === 0) {
          console.log('\n✅ All products now have platform field!');
        } else {
          console.log(`\n⚠️  Warning: ${remaining} products still missing platform`);
        }
      } catch (error) {
        console.error('Error updating products:', error);
      } finally {
        await client.close();
      }
    }

  } catch (error) {
    console.error('Error:', error);
    await client.close();
  }
}

fixPlatforms();

