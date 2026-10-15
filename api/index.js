const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'bakershop_secret_key_2024';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Access token required' });
  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }
}

// ── AUTH ROUTES ──
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields are required' });

    const cleanEmail = email.trim().toLowerCase();
    const existing = await pool.query('SELECT id FROM public.users WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0)
      return res.status(400).json({ success: false, message: 'Email already registered' });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO public.users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name.trim(), cleanEmail, hashedPassword, 'customer']
    );

    const newUser = result.rows[0];
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const cleanEmail = email.trim().toLowerCase();
    const result = await pool.query('SELECT * FROM public.users WHERE email = $1', [cleanEmail]);
    const user = result.rows[0];

    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role, created_at FROM public.users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.created_at }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── PRODUCTS ROUTES ──
app.get('/api/products', async (req, res) => {
  try {
    const { category, eggless, search, sort } = req.query;
    let query = 'SELECT * FROM public.products WHERE 1=1';
    const params = [];

    if (category && category !== 'All') {
      params.push(category);
      query += ` AND LOWER(category) = LOWER($${params.length})`;
    }

    if (eggless === 'true') {
      query += ` AND eggless = true`;
    }

    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND LOWER(name) LIKE $${params.length}`;
    }

    if (sort === 'price_asc') query += ' ORDER BY price ASC';
    else if (sort === 'price_desc') query += ' ORDER BY price DESC';
    else if (sort === 'rating') query += ' ORDER BY rating DESC';
    else if (sort === 'popular') query += ' ORDER BY reviews DESC';
    else query += ' ORDER BY id ASC';

    const result = await pool.query(query, params);

    const products = result.rows.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: Number(p.price),
      weight: p.weight,
      rating: Number(p.rating),
      reviews: p.reviews,
      tag: p.tag || '',
      image: p.image,
      description: p.description,
      eggless: p.eggless,
      deliveryTime: p.delivery_time || 'Same Day'
    }));

    res.json({ success: true, products, total: products.length });
  } catch (err) {
    console.error('Products fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await pool.query('SELECT * FROM public.products WHERE id = $1', [id]);
    const p = result.rows[0];
    if (!p) return res.status(404).json({ success: false, message: 'Product not found' });

    res.json({
      success: true,
      product: {
        id: p.id,
        name: p.name,
        category: p.category,
        price: Number(p.price),
        weight: p.weight,
        rating: Number(p.rating),
        reviews: p.reviews,
        tag: p.tag || '',
        image: p.image,
        description: p.description,
        eggless: p.eggless,
        deliveryTime: p.delivery_time || 'Same Day'
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── ORDERS ROUTES ──
app.post('/api/orders', authenticateToken, async (req, res) => {
  try {
    const { items, address, paymentMethod, deliveryDate } = req.body;
    if (!items || items.length === 0)
      return res.status(400).json({ success: false, message: 'No items in order' });

    const productIds = items.map(i => i.productId);
    const prodResult = await pool.query('SELECT * FROM public.products WHERE id = ANY($1)', [productIds]);
    const dbProducts = prodResult.rows;

    const orderItems = items.map(item => {
      const p = dbProducts.find(prod => prod.id === item.productId);
      return {
        id: p.id,
        name: p.name,
        price: Number(p.price),
        image: p.image,
        quantity: item.quantity,
        weight: item.weight || p.weight
      };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = subtotal >= 999 ? 0 : 49;
    const total = subtotal + deliveryFee;

    const orderId = 'BB' + Date.now().toString().slice(-6);
    const safeAddress = address || 'Mumbai, Maharashtra';
    const safePayment = paymentMethod || 'Online';
    const safeDeliveryDate = deliveryDate || new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const insertResult = await pool.query(
      `INSERT INTO public.orders 
       (id, user_id, user_name, items, address, payment_method, delivery_date, subtotal, delivery_fee, total, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        orderId,
        req.user.id,
        req.user.name,
        JSON.stringify(orderItems),
        safeAddress,
        safePayment,
        safeDeliveryDate,
        subtotal,
        deliveryFee,
        total,
        'Confirmed'
      ]
    );

    const newOrder = insertResult.rows[0];

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: {
        id: newOrder.id,
        userId: newOrder.user_id,
        userName: newOrder.user_name,
        items: newOrder.items,
        address: newOrder.address,
        paymentMethod: newOrder.payment_method,
        deliveryDate: newOrder.delivery_date,
        subtotal: Number(newOrder.subtotal),
        deliveryFee: Number(newOrder.delivery_fee),
        total: Number(newOrder.total),
        status: newOrder.status,
        createdAt: newOrder.created_at
      }
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM public.orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    const userOrders = result.rows.map(o => ({
      id: o.id,
      items: o.items,
      address: o.address,
      deliveryDate: o.delivery_date,
      subtotal: Number(o.subtotal),
      deliveryFee: Number(o.delivery_fee),
      total: Number(o.total),
      status: o.status,
      createdAt: o.created_at
    }));
    res.json({ success: true, orders: userOrders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.get('/api/admin/stats', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Admin only' });

    const usersCount = await pool.query('SELECT COUNT(*)::int as count FROM public.users');
    const productsCount = await pool.query('SELECT COUNT(*)::int as count FROM public.products');
    const ordersCount = await pool.query('SELECT COUNT(*)::int as count, COALESCE(SUM(total), 0)::numeric as revenue FROM public.orders');

    res.json({
      success: true,
      stats: {
        totalUsers: usersCount.rows[0].count,
        totalProducts: productsCount.rows[0].count,
        totalOrders: ordersCount.rows[0].count,
        revenue: Number(ordersCount.rows[0].revenue)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = app;
