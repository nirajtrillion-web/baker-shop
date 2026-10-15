require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const initialProducts = [
  { id: 1, name: 'Chocolate Truffle', category: 'Chocolate', price: 599, weight: '500g', rating: 4.8, reviews: 2341, tag: 'Bestseller', image: '/images/chocolate_truffle.jpg', description: 'Rich dark chocolate ganache with premium Belgian chocolate layers and raspberry accents.', eggless: true, delivery_time: 'Same Day' },
  { id: 2, name: 'Strawberry Dream', category: 'Fruit', price: 649, weight: '500g', rating: 4.7, reviews: 1876, tag: 'New', image: '/images/strawberry_dream.jpg', description: 'Fresh strawberry cream cake with edible flowers and mirror glaze finish.', eggless: true, delivery_time: 'Same Day' },
  { id: 3, name: 'Red Velvet Delight', category: 'Classic', price: 699, weight: '500g', rating: 4.9, reviews: 3102, tag: 'Bestseller', image: '/images/red_velvet.jpg', description: 'Classic red velvet with cream cheese frosting and vivid crimson layers.', eggless: false, delivery_time: 'Same Day' },
  { id: 4, name: 'Black Forest', category: 'Chocolate', price: 549, weight: '500g', rating: 4.6, reviews: 1654, tag: '', image: '/images/black_forest.jpg', description: 'Dark chocolate sponge with whipped cream, cherries and chocolate shavings.', eggless: true, delivery_time: 'Same Day' },
  { id: 5, name: 'Butterscotch Heaven', category: 'Classic', price: 499, weight: '500g', rating: 4.5, reviews: 987, tag: '', image: '/images/butterscotch.jpg', description: 'Creamy butterscotch cake with caramel drizzle and crunchy butterscotch chips.', eggless: true, delivery_time: 'Same Day' },
  { id: 6, name: 'Tropical Pineapple', category: 'Fruit', price: 499, weight: '500g', rating: 4.4, reviews: 762, tag: '', image: '/images/pineapple.jpg', description: 'Light vanilla sponge with pineapple cream and fresh tropical fruit topping.', eggless: true, delivery_time: 'Same Day' },
  { id: 7, name: 'Pinata Party Cake', category: 'Trending', price: 1299, weight: '1kg', rating: 4.9, reviews: 2891, tag: 'Trending', image: '/images/pinata.jpg', description: 'Surprise smash cake filled with rainbow candy, chocolates and sprinkles inside.', eggless: false, delivery_time: 'Next Day' },
  { id: 8, name: 'Designer Fondant', category: 'Wedding', price: 2499, weight: '2kg', rating: 5.0, reviews: 543, tag: 'Premium', image: '/images/fondant.jpg', description: 'Two-tier marble fondant wedding cake with sugar flowers and gold leaf details.', eggless: true, delivery_time: 'Pre-Order' }
];

async function initDb() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Supabase Postgres database.');

    // 1. Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'customer',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Create products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        category VARCHAR(50) NOT NULL,
        price NUMERIC NOT NULL,
        weight VARCHAR(50) NOT NULL,
        rating NUMERIC DEFAULT 4.5,
        reviews INT DEFAULT 0,
        tag VARCHAR(50),
        image TEXT NOT NULL,
        description TEXT,
        eggless BOOLEAN DEFAULT true,
        delivery_time VARCHAR(50) DEFAULT 'Same Day',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 3. Create orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.orders (
        id VARCHAR(50) PRIMARY KEY,
        user_id INT REFERENCES public.users(id) ON DELETE SET NULL,
        user_name VARCHAR(100),
        items JSONB NOT NULL,
        address TEXT NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'Online',
        delivery_date DATE,
        subtotal NUMERIC NOT NULL,
        delivery_fee NUMERIC NOT NULL,
        total NUMERIC NOT NULL,
        status VARCHAR(50) DEFAULT 'Confirmed',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Seed default users if not present
    const demoPasswordHash = bcrypt.hashSync('demo123', 10);
    const adminPasswordHash = bcrypt.hashSync('admin123', 10);

    await client.query(`
      INSERT INTO public.users (id, name, email, password, role)
      VALUES 
        (1, 'Demo User', 'demo@bakershop.com', $1, 'customer'),
        (2, 'Admin', 'admin@bakershop.com', $2, 'admin')
      ON CONFLICT (email) DO NOTHING;
    `, [demoPasswordHash, adminPasswordHash]);

    // Reset sequence if needed
    await client.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));`);

    // Seed products
    for (const p of initialProducts) {
      await client.query(`
        INSERT INTO public.products (id, name, category, price, weight, rating, reviews, tag, image, description, eggless, delivery_time)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          category = EXCLUDED.category,
          price = EXCLUDED.price,
          weight = EXCLUDED.weight,
          rating = EXCLUDED.rating,
          reviews = EXCLUDED.reviews,
          tag = EXCLUDED.tag,
          image = EXCLUDED.image,
          description = EXCLUDED.description,
          eggless = EXCLUDED.eggless,
          delivery_time = EXCLUDED.delivery_time;
      `, [p.id, p.name, p.category, p.price, p.weight, p.rating, p.reviews, p.tag, p.image, p.description, p.eggless, p.delivery_time]);
    }

    await client.query(`SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));`);

    console.log('✅ Supabase tables and seed data created successfully!');
  } catch (err) {
    console.error('❌ Error initializing database:', err);
  } finally {
    await client.end();
  }
}

initDb();
