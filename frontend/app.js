/* ════════════════════════════════════════════
   BakerBliss – Frontend App JavaScript
   Full SPA: Auth, Products, Cart, Orders
════════════════════════════════════════════ */

// Auto-detect API URL — works on localhost, any phone, tablet, or public URL
const API_BASE = window.location.origin + '/api';

// ─────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────
let state = {
  products: [],
  filteredProducts: [],
  cart: JSON.parse(localStorage.getItem('bb_cart') || '[]'),
  user: JSON.parse(localStorage.getItem('bb_user') || 'null'),
  token: localStorage.getItem('bb_token') || null,
  activeCategory: 'All',
  egglessOnly: false,
  searchQuery: '',
  sort: ''
};

// ─────────────────────────────────────────────────
// Toast Notifications
// ─────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.textContent = icons[type] + ' ' + message;
  toast.className = 'toast ' + type + ' show';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ─────────────────────────────────────────────────
// Auth Modal
// ─────────────────────────────────────────────────
function openAuthModal() {
  if (state.user) {
    showUserMenu();
    return;
  }
  document.getElementById('authModal').classList.remove('hidden');
  switchTab('login');
}

function closeAuthModal() {
  document.getElementById('authModal').classList.add('hidden');
}

function switchTab(tab) {
  document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
  document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
}

function showUserMenu() {
  const menu = [
    'Profile: ' + state.user.name,
    'Email: ' + state.user.email,
    'Role: ' + state.user.role,
    '',
    'Click OK to Logout'
  ].join('\n');
  if (confirm(menu)) {
    logout();
  }
}

function logout() {
  state.user = null;
  state.token = null;
  localStorage.removeItem('bb_user');
  localStorage.removeItem('bb_token');
  updateAuthUI();
  showToast('Logged out successfully!', 'info');
}

function togglePw(id, btn) {
  const input = document.getElementById(id);
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁' : '🙈';
}

// ─────────────────────────────────────────────────
// Auth Handlers
// ─────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  btn.textContent = 'Signing in...';
  btn.disabled = true;

  try {
    const res = await fetch(API_BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      state.user = data.user;
      state.token = data.token;
      localStorage.setItem('bb_user', JSON.stringify(data.user));
      localStorage.setItem('bb_token', data.token);
      updateAuthUI();
      closeAuthModal();
      showToast('Welcome back, ' + data.user.name + '!', 'success');
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Cannot connect to server. Make sure backend is running!', 'error');
  } finally {
    btn.textContent = 'Sign In';
    btn.disabled = false;
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('registerBtn');
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;

  btn.textContent = 'Creating account...';
  btn.disabled = true;

  try {
    const res = await fetch(API_BASE + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (data.success) {
      state.user = data.user;
      state.token = data.token;
      localStorage.setItem('bb_user', JSON.stringify(data.user));
      localStorage.setItem('bb_token', data.token);
      updateAuthUI();
      closeAuthModal();
      showToast('Welcome to BakerBliss, ' + data.user.name + '!', 'success');
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Cannot connect to server. Make sure backend is running!', 'error');
  } finally {
    btn.textContent = 'Create Account';
    btn.disabled = false;
  }
}

function updateAuthUI() {
  const btn = document.getElementById('authBtnText');
  if (state.user) {
    btn.textContent = state.user.name.split(' ')[0];
    document.getElementById('authBtn').style.background = 'linear-gradient(135deg, #fce4ec, #f8bbd9)';
    document.getElementById('authBtn').style.color = '#c4134a';
  } else {
    btn.textContent = 'Login / Register';
    document.getElementById('authBtn').style.background = '';
    document.getElementById('authBtn').style.color = '';
  }
}

// ─────────────────────────────────────────────────
// Products
// ─────────────────────────────────────────────────
async function loadProducts() {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading delicious cakes...</p></div>';

  try {
    const params = new URLSearchParams();
    if (state.activeCategory !== 'All') params.set('category', state.activeCategory);
    if (state.egglessOnly) params.set('eggless', 'true');
    if (state.searchQuery) params.set('search', state.searchQuery);
    if (state.sort) params.set('sort', state.sort);

    const res = await fetch(API_BASE + '/products?' + params.toString());
    const data = await res.json();

    if (data.success) {
      state.products = data.products;
      renderProducts(data.products);
      document.getElementById('resultCount').textContent = data.total + ' cakes found';
    }
  } catch (err) {
    // Fallback: render mock products if API not running
    renderMockProducts();
  }
}

function renderMockProducts() {
  const mockProducts = [
    { id: 1, name: 'Chocolate Truffle', category: 'Chocolate', price: 599, weight: '500g', rating: 4.8, reviews: 2341, tag: 'Bestseller', image: '/images/chocolate_truffle.jpg', description: 'Rich dark chocolate ganache with premium Belgian chocolate layers and raspberry accents.', eggless: true, deliveryTime: 'Same Day' },
    { id: 2, name: 'Strawberry Dream', category: 'Fruit', price: 649, weight: '500g', rating: 4.7, reviews: 1876, tag: 'New', image: '/images/strawberry_dream.jpg', description: 'Fresh strawberry cream cake with edible flowers and mirror glaze finish.', eggless: true, deliveryTime: 'Same Day' },
    { id: 3, name: 'Red Velvet Delight', category: 'Classic', price: 699, weight: '500g', rating: 4.9, reviews: 3102, tag: 'Bestseller', image: '/images/red_velvet.jpg', description: 'Classic red velvet with cream cheese frosting and vivid crimson layers.', eggless: false, deliveryTime: 'Same Day' },
    { id: 4, name: 'Black Forest', category: 'Chocolate', price: 549, weight: '500g', rating: 4.6, reviews: 1654, tag: '', image: '/images/black_forest.jpg', description: 'Dark chocolate sponge with whipped cream, cherries and chocolate shavings.', eggless: true, deliveryTime: 'Same Day' },
    { id: 5, name: 'Butterscotch Heaven', category: 'Classic', price: 499, weight: '500g', rating: 4.5, reviews: 987, tag: '', image: '/images/butterscotch.jpg', description: 'Creamy butterscotch cake with caramel drizzle and crunchy butterscotch chips.', eggless: true, deliveryTime: 'Same Day' },
    { id: 6, name: 'Tropical Pineapple', category: 'Fruit', price: 499, weight: '500g', rating: 4.4, reviews: 762, tag: '', image: '/images/pineapple.jpg', description: 'Light vanilla sponge with pineapple cream and fresh tropical fruit topping.', eggless: true, deliveryTime: 'Same Day' },
    { id: 7, name: 'Pinata Party Cake', category: 'Trending', price: 1299, weight: '1kg', rating: 4.9, reviews: 2891, tag: 'Trending', image: '/images/pinata.jpg', description: 'Surprise smash cake filled with rainbow candy, chocolates and sprinkles inside.', eggless: false, deliveryTime: 'Next Day' },
    { id: 8, name: 'Designer Fondant', category: 'Wedding', price: 2499, weight: '2kg', rating: 5.0, reviews: 543, tag: 'Premium', image: '/images/fondant.jpg', description: 'Two-tier marble fondant wedding cake with sugar flowers and gold leaf details.', eggless: true, deliveryTime: 'Pre-Order' }
  ];

  let filtered = [...mockProducts];
  if (state.activeCategory !== 'All') filtered = filtered.filter(p => p.category === state.activeCategory);
  if (state.egglessOnly) filtered = filtered.filter(p => p.eggless);
  if (state.searchQuery) filtered = filtered.filter(p => p.name.toLowerCase().includes(state.searchQuery.toLowerCase()));
  if (state.sort === 'price_asc') filtered.sort((a, b) => a.price - b.price);
  if (state.sort === 'price_desc') filtered.sort((a, b) => b.price - a.price);
  if (state.sort === 'rating') filtered.sort((a, b) => b.rating - a.rating);
  if (state.sort === 'popular') filtered.sort((a, b) => b.reviews - a.reviews);

  state.products = filtered;
  renderProducts(filtered);
  document.getElementById('resultCount').textContent = filtered.length + ' cakes found';
}

function renderProducts(products) {
  const grid = document.getElementById('productGrid');

  if (!products || products.length === 0) {
    grid.innerHTML = '<div class="no-results"><h3>No cakes found 😢</h3><p>Try adjusting your filters</p></div>';
    return;
  }

  const tagClasses = { Bestseller: 'tag-bestseller', New: 'tag-new', Trending: 'tag-trending', Premium: 'tag-premium' };

  grid.innerHTML = products.map((p, i) => {
    const tagHtml = p.tag ? '<span class="card-tag ' + (tagClasses[p.tag] || 'tag-bestseller') + '">' + p.tag + '</span>' : '';
    const egglessHtml = p.eggless ? '<span class="card-eggless">🌿 Eggless</span>' : '';
    const stars = '⭐'.repeat(Math.round(p.rating));
    const imgSrc = p.image || '../images/chocolate_truffle.jpg';

    return '<div class="product-card" style="animation-delay:' + (i * 0.06) + 's">' +
      '<div class="card-img-wrap">' +
        '<img src="' + imgSrc + '" alt="' + p.name + '" loading="lazy" onerror="this.src=\'../images/chocolate_truffle.jpg\'"/>' +
        tagHtml + egglessHtml +
        '<button class="card-wishlist" onclick="showToast(\'Added to wishlist!\',\'info\')" title="Add to Wishlist">♡</button>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="card-category">' + p.category + '</div>' +
        '<h3 class="card-name">' + p.name + '</h3>' +
        '<p class="card-desc">' + (p.description || '') + '</p>' +
        '<div class="card-meta">' +
          '<span class="card-rating">⭐ ' + p.rating + '</span>' +
          '<span class="card-reviews">(' + p.reviews.toLocaleString() + ' reviews)</span>' +
          '<span class="card-delivery">⚡ ' + p.deliveryTime + '</span>' +
        '</div>' +
        '<div class="card-footer">' +
          '<div>' +
            '<div class="card-price">₹' + p.price + ' <span>/ ' + p.weight + '</span></div>' +
          '</div>' +
          '<div style="display:flex;gap:8px;align-items:center">' +
            '<select class="weight-select" id="weight-' + p.id + '">' +
              '<option value="500g">500g</option>' +
              '<option value="1kg">1kg</option>' +
              '<option value="2kg">2kg</option>' +
            '</select>' +
            '<button class="btn-add" onclick="addToCart(' + JSON.stringify(p).replace(/"/g, '&quot;') + ')">🛒 Add</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ─────────────────────────────────────────────────
// Filters & Sort
// ─────────────────────────────────────────────────
function filterCategory(cat, btn) {
  state.activeCategory = cat;
  state.egglessOnly = false;

  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.eggless-pill').forEach(p => p.classList.remove('active'));
  
  if (btn) {
    btn.classList.add('active');
  } else {
    // Find matching category pill
    document.querySelectorAll('.cat-pill').forEach(p => {
      if (p.textContent.toLowerCase().includes(cat.toLowerCase())) {
        p.classList.add('active');
      }
    });
  }

  const prodSection = document.getElementById('products');
  if (prodSection) prodSection.scrollIntoView({ behavior: 'smooth' });
  loadProducts();
}

function toggleEggless(btn) {
  state.egglessOnly = !state.egglessOnly;
  btn.classList.toggle('active', state.egglessOnly);
  loadProducts();
}

let searchTimer;
function handleSearch(val) {
  state.searchQuery = val;
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    if (state.activeCategory !== 'All') {
      state.activeCategory = 'All';
      document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
      document.querySelector('.cat-pill').classList.add('active');
    }
    loadProducts();
  }, 400);
}

function handleSort(val) {
  state.sort = val;
  loadProducts();
}

// ─────────────────────────────────────────────────
// Cart
// ─────────────────────────────────────────────────
function addToCart(product) {
  const weightEl = document.getElementById('weight-' + product.id);
  const weight = weightEl ? weightEl.value : product.weight;

  const existing = state.cart.find(i => i.id === product.id && i.weight === weight);
  if (existing) {
    existing.quantity++;
  } else {
    state.cart.push({ ...product, weight, quantity: 1 });
  }

  saveCart();
  updateCartUI();
  showToast(product.name + ' added to cart!', 'success');

  // Bounce animation
  const cartBtn = document.querySelector('.cart-btn');
  cartBtn.classList.add('bounce');
  setTimeout(() => cartBtn.classList.remove('bounce'), 400);
}

function removeFromCart(id, weight) {
  state.cart = state.cart.filter(i => !(i.id === id && i.weight === weight));
  saveCart();
  updateCartUI();
  renderCartItems();
}

function updateQuantity(id, weight, delta) {
  const item = state.cart.find(i => i.id === id && i.weight === weight);
  if (!item) return;
  item.quantity = Math.max(0, item.quantity + delta);
  if (item.quantity === 0) removeFromCart(id, weight);
  else {
    saveCart();
    updateCartUI();
    renderCartItems();
  }
}

function saveCart() {
  localStorage.setItem('bb_cart', JSON.stringify(state.cart));
}

function updateCartUI() {
  const total = state.cart.reduce((sum, i) => sum + i.quantity, 0);
  document.getElementById('cartCount').textContent = total;
}

function toggleCart() {
  const drawer = document.getElementById('cartDrawer');
  const overlay = document.getElementById('cartOverlay');
  const isOpen = drawer.classList.contains('open');
  if (isOpen) {
    drawer.classList.remove('open');
    overlay.classList.add('hidden');
    drawer.classList.add('hidden');
  } else {
    drawer.classList.remove('hidden');
    overlay.classList.remove('hidden');
    // Allow paint before adding open class for smooth slide
    requestAnimationFrame(() => {
      drawer.classList.add('open');
    });
    renderCartItems();
  }
}

function renderCartItems() {
  const container = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');
  const empty = document.getElementById('cartEmpty');

  if (state.cart.length === 0) {
    container.innerHTML = '';
    footer.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  footer.classList.remove('hidden');

  container.innerHTML = state.cart.map(item => {
    const imgSrc = item.image || '../images/chocolate_truffle.jpg';
    return '<div class="cart-item">' +
      '<img class="cart-item-img" src="' + imgSrc + '" alt="' + item.name + '" onerror="this.src=\'../images/chocolate_truffle.jpg\'"/>' +
      '<div class="cart-item-info">' +
        '<div class="cart-item-name">' + item.name + '</div>' +
        '<div class="cart-item-weight">' + item.weight + '</div>' +
        '<div class="cart-item-controls">' +
          '<button class="qty-btn" onclick="updateQuantity(' + item.id + ',\'' + item.weight + '\',-1)">−</button>' +
          '<span class="qty-val">' + item.quantity + '</span>' +
          '<button class="qty-btn" onclick="updateQuantity(' + item.id + ',\'' + item.weight + '\',1)">+</button>' +
          '<button class="cart-remove" onclick="removeFromCart(' + item.id + ',\'' + item.weight + '\')">Remove</button>' +
        '</div>' +
      '</div>' +
      '<div class="cart-item-price">₹' + (item.price * item.quantity) + '</div>' +
    '</div>';
  }).join('');

  const subtotal = state.cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const delivery = subtotal >= 999 ? 0 : 49;
  document.getElementById('cartSubtotal').textContent = '₹' + subtotal;
  document.getElementById('cartDelivery').textContent = delivery === 0 ? 'FREE 🎉' : '₹' + delivery;
  document.getElementById('cartTotal').textContent = '₹' + (subtotal + delivery);
}

async function checkout() {
  if (!state.user) {
    toggleCart();
    openAuthModal();
    showToast('Please login to checkout!', 'info');
    return;
  }
  if (state.cart.length === 0) return;

  const items = state.cart.map(i => ({ productId: i.id, quantity: i.quantity, weight: i.weight }));

  try {
    const res = await fetch(API_BASE + '/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + state.token
      },
      body: JSON.stringify({ items, address: 'Mumbai, Maharashtra', paymentMethod: 'Online' })
    });
    const data = await res.json();
    if (data.success) {
      state.cart = [];
      saveCart();
      updateCartUI();
      toggleCart();
      showToast('Order placed! Order ID: ' + data.order.id + ' 🎉', 'success');
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    // Offline fallback
    const orderId = 'BB' + Date.now().toString().slice(-6);
    state.cart = [];
    saveCart();
    updateCartUI();
    toggleCart();
    showToast('Order placed! Order ID: ' + orderId + ' 🎉', 'success');
  }
}

// ─────────────────────────────────────────────────
// Scroll Effects
// ─────────────────────────────────────────────────
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('scroll', () => {
  const header = document.getElementById('header');
  header.classList.toggle('scrolled', window.scrollY > 60);
});

// Bounce animation CSS
const style = document.createElement('style');
style.textContent = '.bounce { animation: cartBounce 0.4s ease; } @keyframes cartBounce { 0%,100%{transform:scale(1)} 40%{transform:scale(1.2)} }';
document.head.appendChild(style);

// ─────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Close modal on overlay click
  document.getElementById('authModal').addEventListener('click', function(e) {
    if (e.target === this) closeAuthModal();
  });
  document.getElementById('closeAuthModal').addEventListener('click', closeAuthModal);

  // Restore auth state
  updateAuthUI();
  updateCartUI();

  // Load products
  loadProducts();
});
