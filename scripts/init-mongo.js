// MongoDB initialization script
db = db.getSiblingDB('skype_clone');

// Create collections with indexes
db.createCollection('users');
db.createCollection('messages');
db.createCollection('groups');
db.createCollection('calls');
db.createCollection('contacts');
db.createCollection('payments');
db.createCollection('notifications');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "createdAt": 1 });

db.messages.createIndex({ "senderId": 1, "receiverId": 1 });
db.messages.createIndex({ "groupId": 1 });
db.messages.createIndex({ "createdAt": -1 });

db.groups.createIndex({ "members": 1 });
db.groups.createIndex({ "createdAt": 1 });

db.calls.createIndex({ "participants": 1 });
db.calls.createIndex({ "createdAt": -1 });

db.contacts.createIndex({ "userId": 1, "contactId": 1 }, { unique: true });

db.payments.createIndex({ "userId": 1 });
db.payments.createIndex({ "stripePaymentIntentId": 1 }, { unique: true });

db.notifications.createIndex({ "userId": 1 });
db.notifications.createIndex({ "createdAt": -1 });

// Create a test user (optional - remove in production)
db.users.insertOne({
  username: "admin",
  email: "admin@skypeclone.com",
  password: "$2a$10$example.hash.for.documentation", // bcrypt hash for "password123"
  firstName: "Admin",
  lastName: "User",
  avatar: null,
  status: "online",
  lastSeen: new Date(),
  createdAt: new Date(),
  updatedAt: new Date()
});

print("✅ Database initialized successfully");
