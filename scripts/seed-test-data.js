// Seed test data for multi-tenant testing
const { MongoClient } = require('mongodb');

// Use environment variable or default to localhost
const uri = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/catalogue?authSource=admin';

const platforms = [
  {
    name: 'Roze Collection',
    code: 'roze',
    description: 'Rose Collection - Premium Fashion',
    logo: '',
    createdAt: new Date()
  },
  {
    name: 'Jador Boutique',
    code: 'jador',
    description: 'Jador - Modern Fashion',
    logo: '',
    createdAt: new Date()
  }
];

const products = {
  roze: [
    {
      title: 'Elegant Evening Dress',
      description: 'Beautiful evening dress for special occasions',
      price: 150,
      category: 'Dresses',
      image: 'dress1.jpg',
      platform: 'roze',
      barcode: 'ROZE001',
      createdAt: new Date()
    },
    {
      title: 'Casual Summer Top',
      description: 'Comfortable summer top',
      price: 45,
      category: 'Tops',
      image: 'top1.jpg',
      platform: 'roze',
      barcode: 'ROZE002',
      createdAt: new Date()
    },
    {
      title: 'Designer Handbag',
      description: 'Luxury designer handbag',
      price: 200,
      category: 'Accessories',
      image: 'bag1.jpg',
      platform: 'roze',
      barcode: 'ROZE003',
      createdAt: new Date()
    }
  ],
  jador: [
    {
      title: 'Modern Jacket',
      description: 'Stylish modern jacket',
      price: 180,
      category: 'Outerwear',
      image: 'jacket1.jpg',
      platform: 'jador',
      barcode: 'JADOR001',
      createdAt: new Date()
    },
    {
      title: 'Slim Fit Jeans',
      description: 'Comfortable slim fit jeans',
      price: 80,
      category: 'Pants',
      image: 'jeans1.jpg',
      platform: 'jador',
      barcode: 'JADOR002',
      createdAt: new Date()
    },
    {
      title: 'Classic Watch',
      description: 'Elegant classic watch',
      price: 250,
      category: 'Accessories',
      image: 'watch1.jpg',
      platform: 'jador',
      barcode: 'JADOR003',
      createdAt: new Date()
    }
  ]
};

const admins = [
  {
    username: 'admin',
    platform: 'roze',
    password: 'adminrozeplatform',
    active: true,
    createdAt: new Date()
  },
  {
    username: 'admin',
    platform: 'jador',
    password: 'adminjadorplatform',
    active: true,
    createdAt: new Date()
  }
];

async function seedData() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('catalogue');

    // Insert platforms
    console.log('Inserting platforms...');
    for (const platform of platforms) {
      const existing = await db.collection('platforms').findOne({ code: platform.code });
      if (!existing) {
        await db.collection('platforms').insertOne(platform);
        console.log(`Created platform: ${platform.name} (${platform.code})`);
      } else {
        console.log(`Platform already exists: ${platform.code}`);
      }
    }

    // Insert products
    console.log('\nInserting products...');
    for (const [platformCode, platformProducts] of Object.entries(products)) {
      for (const product of platformProducts) {
        const existing = await db.collection('products').findOne({ 
          platform: platformCode, 
          barcode: product.barcode 
        });
        if (!existing) {
          await db.collection('products').insertOne(product);
          console.log(`Created product: ${product.title} (${platformCode})`);
        } else {
          console.log(`Product already exists: ${product.barcode}`);
        }
      }
    }

    // Insert admins
    console.log('\nInserting admins...');
    for (const admin of admins) {
      const existing = await db.collection('admins').findOne({ 
        platform: admin.platform, 
        username: admin.username 
      });
      if (!existing) {
        await db.collection('admins').insertOne(admin);
        console.log(`Created admin for platform: ${admin.platform}`);
      } else {
        console.log(`Admin already exists for platform: ${admin.platform}`);
      }
    }

    console.log('\n=== Test Credentials ===');
    console.log('\nSuper Admin:');
    console.log('  Username: super_admin');
    console.log('  Password: super_admin876635');
    console.log('\nPlatform Admins:');
    for (const admin of admins) {
      console.log(`\n  Platform: ${admin.platform}`);
      console.log(`  Username: ${admin.username}`);
      console.log(`  Password: ${admin.password}`);
    }

    console.log('\n=== Test URLs ===');
    console.log('  Default: http://localhost:3000');
    console.log('  With platform param: http://localhost:3000?platform=roze');
    console.log('  Login: http://localhost:3000/login');
    console.log('  Super Admin: http://localhost:3000/super-admin');

    console.log('\n✅ Seed data created successfully!');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await client.close();
    console.log('\nDatabase connection closed');
  }
}

seedData();

