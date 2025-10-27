// Script to seed MongoDB with initial products
// Run with: node scripts/seed-products.js

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/catalogue';
const dbName = process.env.DB_NAME || 'catalogue';

const sampleProducts = [
  {
    title: 'Rose Gold Ring',
    description: 'Elegant rose gold ring with diamond setting',
    price: 299.99,
    category: 'Rings',
    image: 'ring-1.jpg',
    createdAt: new Date(),
  },
  {
    title: 'Silver Necklace',
    description: 'Beautiful silver necklace with pendant',
    price: 199.99,
    category: 'Necklaces',
    image: 'necklace-1.jpg',
    createdAt: new Date(),
  },
  {
    title: 'Pearl Earrings',
    description: 'Classic pearl stud earrings',
    price: 149.99,
    category: 'Earrings',
    image: 'earrings-1.jpg',
    createdAt: new Date(),
  },
  {
    title: 'Gold Bracelet',
    description: 'Delicate gold chain bracelet',
    price: 249.99,
    category: 'Bracelets',
    image: 'bracelet-1.jpg',
    createdAt: new Date(),
  },
];

async function seedDatabase() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection('products');

    // Check if products already exist
    const existingCount = await collection.countDocuments();
    if (existingCount > 0) {
      console.log(`Database already has ${existingCount} products. Skipping seed.`);
      process.exit(0);
    }

    // Insert sample products
    const result = await collection.insertMany(sampleProducts);
    console.log(`Successfully seeded ${result.insertedCount} products`);

    console.log('Sample products:');
    sampleProducts.forEach((product) => {
      console.log(`- ${product.title} ($${product.price})`);
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seedDatabase();

