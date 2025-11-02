// Database initialization script for multi-tenant setup
print('Initializing database...');

// Switch to catalogue database
db = db.getSiblingDB('catalogue');

// Create collections
db.createCollection('products');
db.createCollection('orders');
db.createCollection('admins');
db.createCollection('platforms');
db.createCollection('settings');

print('Collections created successfully');

// Create indexes for better performance
db.products.createIndex({ platform: 1 });
db.products.createIndex({ platform: 1, _id: 1 });
db.orders.createIndex({ platform: 1 });
db.orders.createIndex({ platform: 1, timestamp: -1 });
db.admins.createIndex({ platform: 1, username: 1 });
db.settings.createIndex({ platform: 1 });

print('Indexes created successfully');

// Insert a default platform
db.platforms.insertOne({
  name: 'Default',
  code: 'default',
  description: 'Default platform',
  createdAt: new Date()
});

print('Default platform created');

print('Database initialization complete!');

