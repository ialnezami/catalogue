/**
 * Migration Script: Add Language Support to Database
 * 
 * This migration adds the `language` field to:
 * 1. Platforms collection - adds 'language' field (default: 'ar')
 * 2. Settings collection - ensures 'language' field exists in settings documents
 * 3. Verifies products are properly linked to platforms with language support
 * 
 * Note: Products don't need a language field - they inherit language from their platform.
 * 
 * This script is idempotent and safe to run multiple times.
 * It will only update documents that don't have the language field.
 * 
 * Usage:
 *   NODE_ENV=production node scripts/migrate-add-language.js
 *   OR
 *   npm run migrate:language
 * 
 * Environment Variables:
 *   MONGODB_URI - MongoDB connection string (optional, uses default if not set)
 *   DB_NAME - Database name (optional, defaults to 'catalogue')
 */

const { MongoClient } = require('mongodb');

// Try to load dotenv if available (for local development)
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv not available, use environment variables directly
  console.log('📝 Using environment variables directly (dotenv not available)');
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/catalogue?authSource=admin';
const DB_NAME = process.env.DB_NAME || 'catalogue';

async function migrateLanguageField() {
  let client;
  
  try {
    console.log('🔄 Starting migration: Add Language Support...');
    console.log(`📊 Database: ${DB_NAME}`);
    console.log(`🔗 URI: ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`); // Hide credentials
    
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const platformsCollection = db.collection('platforms');
    const settingsCollection = db.collection('settings');
    
    // Step 1: Add language field to platforms that don't have it
    console.log('\n📦 Step 1: Updating platforms collection...');
    const platformsWithoutLanguage = await platformsCollection.find({
      language: { $exists: false }
    }).toArray();
    
    if (platformsWithoutLanguage.length > 0) {
      console.log(`   Found ${platformsWithoutLanguage.length} platform(s) without language field`);
      
      const result = await platformsCollection.updateMany(
        { language: { $exists: false } },
        { $set: { language: 'ar' } }
      );
      
      console.log(`   ✅ Updated ${result.modifiedCount} platform(s) with default language 'ar'`);
    } else {
      console.log('   ✅ All platforms already have language field');
    }
    
    // Step 2: Update settings documents to include language field
    console.log('\n⚙️  Step 2: Updating settings collection...');
    const settingsWithoutLanguage = await settingsCollection.find({
      type: 'app_settings',
      language: { $exists: false }
    }).toArray();
    
    if (settingsWithoutLanguage.length > 0) {
      console.log(`   Found ${settingsWithoutLanguage.length} setting(s) without language field`);
      
      // For each setting, get the platform's language or default to 'ar'
      let updatedCount = 0;
      
      for (const setting of settingsWithoutLanguage) {
        let languageValue = 'ar'; // default
        
        // Try to get language from platform
        if (setting.platform) {
          const platform = await platformsCollection.findOne({ code: setting.platform });
          if (platform && platform.language) {
            languageValue = platform.language;
          }
        }
        
        await settingsCollection.updateOne(
          { _id: setting._id },
          { $set: { language: languageValue } }
        );
        
        updatedCount++;
      }
      
      console.log(`   ✅ Updated ${updatedCount} setting(s) with language field`);
    } else {
      console.log('   ✅ All settings already have language field');
    }
    
    // Step 3: Verify products are linked to platforms with language
    console.log('\n📦 Step 3: Verifying products and platforms...');
    const productsCollection = db.collection('products');
    const totalProducts = await productsCollection.countDocuments({});
    const productsWithoutPlatform = await productsCollection.countDocuments({ 
      platform: { $exists: false } 
    });
    const productsWithInvalidPlatform = await productsCollection.aggregate([
      {
        $lookup: {
          from: 'platforms',
          localField: 'platform',
          foreignField: 'code',
          as: 'platformInfo'
        }
      },
      {
        $match: {
          platformInfo: { $size: 0 },
          platform: { $exists: true, $ne: null }
        }
      },
      {
        $count: 'count'
      }
    ]).toArray();
    
    const invalidPlatformCount = productsWithInvalidPlatform[0]?.count || 0;
    
    if (productsWithoutPlatform > 0) {
      console.log(`   ⚠️  Found ${productsWithoutPlatform} product(s) without platform field`);
      console.log(`   💡 These products should be assigned to a platform manually`);
    } else {
      console.log(`   ✅ All ${totalProducts} product(s) have platform field`);
    }
    
    if (invalidPlatformCount > 0) {
      console.log(`   ⚠️  Found ${invalidPlatformCount} product(s) with invalid platform references`);
      console.log(`   💡 These products reference platforms that don't exist`);
    }
    
    // Step 4: Verify migration
    console.log('\n🔍 Step 4: Verifying migration...');
    const platformsCount = await platformsCollection.countDocuments({});
    const platformsWithLanguage = await platformsCollection.countDocuments({ language: { $exists: true } });
    
    const settingsCount = await settingsCollection.countDocuments({ type: 'app_settings' });
    const settingsWithLanguage = await settingsCollection.countDocuments({ 
      type: 'app_settings', 
      language: { $exists: true } 
    });
    
    console.log(`   Platforms: ${platformsWithLanguage}/${platformsCount} have language field`);
    console.log(`   Settings: ${settingsWithLanguage}/${settingsCount} have language field`);
    
    // Check that all platforms used by products have language
    const platformsUsedByProducts = await productsCollection.distinct('platform', {
      platform: { $exists: true, $ne: null }
    });
    const platformsWithLanguageArray = await platformsCollection.find({
      code: { $in: platformsUsedByProducts },
      language: { $exists: true }
    }).toArray();
    const platformsUsedCount = platformsUsedByProducts.length;
    const platformsWithLanguageCount = platformsWithLanguageArray.length;
    
    if (platformsUsedCount > 0) {
      console.log(`   Products use ${platformsUsedCount} platform(s)`);
      console.log(`   ${platformsWithLanguageCount}/${platformsUsedCount} of these platforms have language field`);
    }
    
    if (platformsWithLanguage === platformsCount && settingsWithLanguage === settingsCount) {
      console.log('\n✅ Migration completed successfully!');
      console.log('✨ All documents now have the language field.');
      
      if (platformsWithoutPlatform === 0 && invalidPlatformCount === 0) {
        console.log('✨ All products are properly linked to platforms with language support.');
      }
    } else {
      console.log('\n⚠️  Migration completed with warnings.');
      console.log('   Some documents may still be missing the language field.');
    }
    
    // Summary
    console.log('\n📋 Migration Summary:');
    console.log(`   - Platforms updated: ${platformsWithoutLanguage.length}`);
    console.log(`   - Settings updated: ${settingsWithoutLanguage.length}`);
    console.log(`   - Total products: ${totalProducts}`);
    console.log(`   - Products without platform: ${productsWithoutPlatform}`);
    console.log(`   - Products with invalid platform: ${invalidPlatformCount}`);
    console.log(`   - Default language: 'ar' (Arabic)`);
    console.log('\n💡 Notes:');
    console.log('   - Products inherit language from their platform');
    console.log('   - You can change the default language for platforms in the admin settings');
    if (productsWithoutPlatform > 0 || invalidPlatformCount > 0) {
      console.log('   - Some products need manual attention (missing or invalid platform)');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }
}

// Run migration
if (require.main === module) {
  migrateLanguageField()
    .then(() => {
      console.log('\n🎉 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateLanguageField };

