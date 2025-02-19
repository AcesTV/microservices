db = db.getSiblingDB('menu_db');

db.createUser({
  user: 'menu_user',
  pwd: 'menu_password',
  roles: [
    {
      role: 'readWrite',
      db: 'menu_db',
    },
  ],
});

// Création des collections initiales
db.createCollection('products');
db.createCollection('menus');

// Données initiales d'exemple pour les produits
db.products.insertMany([
  {
    name: 'Burger Classic',
    description: 'Un délicieux burger avec steak, salade, tomate',
    created_at: new Date()
  },
  {
    name: 'Frites Maison',
    description: 'Frites fraîches coupées à la main',
    created_at: new Date()
  }
]);

// Données initiales d'exemple pour les menus
db.menus.insertOne({
  name: 'Menu Burger',
  description: 'Notre menu burger signature',
  price: 15.99,
  products: ['Burger Classic', 'Frites Maison'],
  created_at: new Date(),
  active: true
}); 