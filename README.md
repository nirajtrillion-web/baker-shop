# 🎂 BakerBliss – Premium Cake Shop Website

> Inspired by Bakingo.com | Built with HTML, CSS, JavaScript & Node.js/Express

---

## 📁 Project Structure

```
Baker Shop 1/
├── 📁 frontend/          ← Frontend (HTML + CSS + JS)
│   ├── index.html        ← Main SPA page
│   ├── style.css         ← Premium design system
│   └── app.js            ← Frontend logic (auth, cart, products)
│
├── 📁 backend/           ← Backend (Node.js + Express)
│   ├── server.js         ← Main API server
│   └── package.json      ← Dependencies
│
├── 📁 images/            ← AI-generated cake product photos
│   ├── hero_cakes.jpg
│   ├── chocolate_truffle.jpg
│   ├── strawberry_dream.jpg
│   ├── red_velvet.jpg
│   ├── black_forest.jpg
│   ├── butterscotch.jpg
│   ├── pineapple.jpg
│   ├── pinata.jpg
│   └── fondant.jpg
│
└── start-server.bat      ← Windows quick start script
```

---

## 🚀 How to Run

### Option 1 – Double-click
Just double-click `start-server.bat`

### Option 2 – Manual
```bash
cd backend
node server.js
```

Then open: **http://localhost:5000**

---

## 🔑 Demo Login Credentials

| Role     | Email                    | Password  |
|----------|--------------------------|-----------|
| Customer | demo@bakershop.com       | demo123   |
| Admin    | admin@bakershop.com      | admin123  |

---

## 🛠 Features

### 1. Frontend
- ✅ Bakingo-inspired pink & premium design
- ✅ Hero section with animated cake photography
- ✅ Product grid with 8 real cake products (AI-generated images)
- ✅ Category filters: Chocolate, Fruit, Classic, Trending, Wedding
- ✅ Eggless filter toggle
- ✅ Live search (debounced)
- ✅ Sort by: Price, Rating, Popularity
- ✅ Shopping cart drawer (add, remove, update qty)
- ✅ Cart total + free delivery above ₹999
- ✅ Login/Register modal with form validation
- ✅ Occasions section
- ✅ Customer testimonials
- ✅ Responsive design (mobile-friendly)
- ✅ Toast notifications
- ✅ Smooth animations & micro-interactions

### 2. Backend (REST API)
| Method | Endpoint              | Description           |
|--------|-----------------------|-----------------------|
| POST   | /api/auth/register    | Register new user     |
| POST   | /api/auth/login       | Login                 |
| GET    | /api/auth/profile     | Get user profile (auth) |
| GET    | /api/products         | List all products     |
| GET    | /api/products/:id     | Get single product    |
| POST   | /api/orders           | Place order (auth)    |
| GET    | /api/orders           | Get user orders (auth)|
| GET    | /api/admin/stats      | Admin stats (admin)   |

### 3. Login / Auth System
- JWT-based authentication
- bcrypt password hashing
- 7-day token expiration
- Role-based access (customer / admin)
- Persistent login via localStorage
- Demo credentials pre-loaded

---

## 🎨 Design Highlights
- **Color Palette**: Deep Pink `#E8185A` + Gold + Dark Navy
- **Fonts**: Playfair Display (headings) + Inter (body)
- **Animations**: Hero parallax, card hover lifts, cart bounce, shimmer bar
- **Glassmorphism**: Hero badge & delivery card overlays

---

## 🔧 Tech Stack

| Layer    | Technology           |
|----------|----------------------|
| Frontend | HTML5, CSS3, Vanilla JS |
| Backend  | Node.js, Express.js  |
| Auth     | JWT + bcrypt         |
| Images   | AI-generated (Gemini)|
| Fonts    | Google Fonts         |

---

*Made with ❤️ inspired by Bakingo.com*
