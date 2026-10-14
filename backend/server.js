const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'bakershop_secret_key_2024';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));
// Serve images
app.use('/images', express.static(path.join(__dirname, '../images')));

// ─────────────────────────────────────────────────
// In-Memory "Database" (no DB dependency needed)
// ─────────────────────────────────────────────────
const users = [
  {
    id: 1,
    name: 'Demo User',
    email: 'demo@bakershop.com',
    password: bcrypt.hashSync('demo123', 10),
    role: 'customer',
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: 'Admin',
    email: 'admin@bakershop.com',
    password: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    createdAt: new Date().toISOString()
  }
];

const products = [
  { id: 1, name: 'Chocolate Truffle', category: 'Chocolate', price: 599, weight: '500g', rating: 4.8, reviews: 2341, tag: 'Bestseller', image: '/images/chocolate_truffle.jpg', description: 'Rich dark chocolate ganache with premium Belgian chocolate layers and raspberry accents.', eggless: true, deliveryTime: 'Same Day' },
  { id: 2, name: 'Strawberry Dream', category: 'Fruit', price: 649, weight: '500g', rating: 4.7, reviews: 1876, tag: 'New', image: '/images/strawberry_dream.jpg', description: 'Fresh strawberry cream cake with edible flowers and mirror glaze finish.', eggless: true, deliveryTime: 'Same Day' },
  { id: 3, name: 'Red Velvet Delight', category: 'Classic', price: 699, weight: '500g', rating: 4.9, reviews: 3102, tag: 'Bestseller', image: '/images/red_velvet.jpg', description: 'Classic red velvet with cream cheese frosting and vivid crimson layers.', eggless: false, deliveryTime: 'Same Day' },
  { id: 4, name: 'Black Forest', category: 'Chocolate', price: 549, weight: '500g', rating: 4.6, reviews: 1654, tag: '', image: '/images/black_forest.jpg', description: 'Dark chocolate sponge with whipped cream, cherries and chocolate shavings.', eggless: true, deliveryTime: 'Same Day' },
  { id: 5, name: 'Butterscotch Heaven', category: 'Classic', price: 499, weight: '500g', rating: 4.5, reviews: 987, tag: '', image: '/images/butterscotch.jpg', description: 'Creamy butterscotch cake with caramel drizzle and crunchy butterscotch chips.', eggless: true, deliveryTime: 'Same Day' },
  { id: 6, name: 'Tropical Pineapple', category: 'Fruit', price: 499, weight: '500g', rating: 4.4, reviews: 762, tag: '', image: '/images/pineapple.jpg', description: 'Light vanilla sponge with pineapple cream and fresh tropical fruit topping.', eggless: true, deliveryTime: 'Same Day' },
  { id: 7, name: 'Pinata Party Cake', category: 'Trending', price: 1299, weight: '1kg', rating: 4.9, reviews: 2891, tag: 'Trending', image: '/images/pinata.jpg', description: 'Surprise smash cake filled with rainbow candy, chocolates and sprinkles inside.', eggless: false, deliveryTime: 'Next Day' },
  { id: 8, name: 'Designer Fondant', category: 'Wedding', price: 2499, weight: '2kg', rating: 5.0, reviews: 543, tag: 'Premium', image: '/images/fondant.jpg', description: 'Two-tier marble fondant wedding cake with sugar flowers and gold leaf details.', eggless: true, deliveryTime: 'Pre-Order' }
];

const orders = [];
let orderCounter = 1000;

// ─────────────────────────────────────────────────
// Helper: Authenticate Token
// ─────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────
// AUTH ROUTES
// ─────────────────────────────────────────────────

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'All fields are required' });
    if (users.find(u => u.email === email))
      return res.status(400).json({ success: false, message: 'Email already registered' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: users.length + 1,
      name,
      email,
      password: hashedPassword,
      role: 'customer',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, message: 'Registration successful!', token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    const user = users.find(u => u.email === email);
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, message: 'Login successful!', token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt } });
});

// ─────────────────────────────────────────────────
// PRODUCTS ROUTES
// ─────────────────────────────────────────────────

// Get all products
app.get('/api/products', (req, res) => {
  const { category, eggless, search, sort } = req.query;
  let result = [...products];
  if (category && category !== 'All') result = result.filter(p => p.category === category);
  if (eggless === 'true') result = result.filter(p => p.eggless);
  if (search) result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  if (sort === 'price_asc') result.sort((a, b) => a.price - b.price);
  if (sort === 'price_desc') result.sort((a, b) => b.price - a.price);
  if (sort === 'rating') result.sort((a, b) => b.rating - a.rating);
  if (sort === 'popular') result.sort((a, b) => b.reviews - a.reviews);
  res.json({ success: true, products: result, total: result.length });
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, product });
});

// ─────────────────────────────────────────────────
// ORDERS ROUTES
// ─────────────────────────────────────────────────

// Place order
app.post('/api/orders', authenticateToken, (req, res) => {
  try {
    const { items, address, paymentMethod, deliveryDate } = req.body;
    if (!items || items.length === 0)
      return res.status(400).json({ success: false, message: 'No items in order' });

    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      return { ...product, quantity: item.quantity, weight: item.weight || product.weight };
    });

    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = subtotal >= 999 ? 0 : 49;
    const total = subtotal + deliveryFee;

    const order = {
      id: 'BB' + (++orderCounter),
      userId: req.user.id,
      userName: req.user.name,
      items: orderItems,
      address: address || 'Mumbai, Maharashtra',
      paymentMethod: paymentMethod || 'Online',
      deliveryDate: deliveryDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      subtotal,
      deliveryFee,
      total,
      status: 'Confirmed',
      createdAt: new Date().toISOString()
    };
    orders.push(order);
    res.status(201).json({ success: true, message: 'Order placed successfully!', order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user orders
app.get('/api/orders', authenticateToken, (req, res) => {
  const userOrders = orders.filter(o => o.userId === req.user.id);
  res.json({ success: true, orders: userOrders });
});

// ─────────────────────────────────────────────────
// STATS (Admin)
// ─────────────────────────────────────────────────
app.get('/api/admin/stats', authenticateToken, (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Admin only' });
  res.json({
    success: true,
    stats: {
      totalUsers: users.length,
      totalProducts: products.length,
      totalOrders: orders.length,
      revenue: orders.reduce((sum, o) => sum + o.total, 0)
    }
  });
});

// ─────────────────────────────────────────────────
// Serve Frontend SPA
// ─────────────────────────────────────────────────
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
  console.log('\n Bakershop Server running at http://localhost:' + PORT);
  console.log('API: http://localhost:' + PORT + '/api');
  console.log('\nDemo Credentials:');
  console.log('   Customer: demo@bakershop.com / demo123');
  console.log('   Admin:    admin@bakershop.com / admin123\n');
});
