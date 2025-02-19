db = db.getSiblingDB('auth_db');

db.createUser({
  user: 'auth_user',
  pwd: 'auth_password',
  roles: [
    {
      role: 'readWrite',
      db: 'auth_db',
    },
  ],
});

// Création des collections initiales
db.createCollection('users');
db.createCollection('tokens');

db.users.insertOne({
  username: 'admin',
  password: 'hashed_password',
  role: 'admin',
  created_at: new Date()
}); 