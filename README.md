<div align="center">

# 🔮 PHI TRADING
### *Precision. Intelligence. Alpha.*

**A brutalist financial intelligence platform delivering AI-powered trading signals, live market data, and institutional-grade analytics.**

[![Built with Supabase](https://img.shields.io/badge/Built%20with-Supabase-3ECF8E?style=flat&logo=supabase)](https://supabase.com)
[![JavaScript](https://img.shields.io/badge/Vanilla-JavaScript-F7DF1E?style=flat&logo=javascript)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)

</div>

---

## ⚡ Overview

**PhiTrading** is a full-stack SaaS platform combining **AI-generated trading predictions**, **live market data**, and **breaking financial news** into a single high-performance interface. Built with modern web technologies and secured by Row-Level Security, it delivers tiered content access across Forex, Crypto, and Stock markets.

> Production-ready architecture with RBAC, real-time data feeds, and admin content management.

---

## ✨ Features

### 🎯 AI-Powered Trading Predictions
Machine learning-driven signals across **Forex**, **Crypto**, **Stocks**, and **ML Picks** — each prediction includes asset analysis, direction, conviction level, and optional chart images.

### 📰 Live News Engine
Admin-managed breaking news system with **image uploads**, **hero slider display** (7-second auto-cycle), and **full article detail views**. Click headlines to read complete stories with formatted content and image lightbox support.

### 📊 Real-time Market Data
Live ticker bar powered by **Alpha Vantage API** displaying EUR/USD, GBP/USD, BTC/USD, and ETH/USD rates with smooth infinite-scroll animation and intelligent API fallback caching.

###  Role-Based Access Control
Four-tier subscription system with **PostgreSQL Row-Level Security** enforcing content access at the database layer:

| Tier      | Access Level                                  |
|-----------|-----------------------------------------------|
| 🥉 Bronze  | Entry-level signals — major Forex pairs only  |
| 🥈 Silver  | Forex + Crypto & Altcoin predictions         |
| 🥇 Gold    | Full access — all signals, including ML picks |
| ⚙️ Admin   | Full CRUD control + News management           |

### ⚙️ Admin Dashboard
Complete content management for predictions and news:
- **Create**: Add predictions/news with images, tier requirements, category tagging
- **Read**: View all content regardless of tier restrictions
- **Update**: Edit existing content with inline image preview and replacement
- **Delete**: Remove content with dark-themed confirmation dialogs

### 🔑 Secure Authentication
Email/password authentication via **Supabase Auth** with automatic profile creation, tier selection at registration, and full session management.

---

## 🛠️ Tech Stack

| Layer       | Technology                                                                    |
|-------------|-------------------------------------------------------------------------------|
| **Frontend**| Vanilla JavaScript (ES6+), HTML5, CSS3 — no build step required              |
| **Backend** | [Supabase](https://supabase.com) — PostgreSQL, Auth, Storage, Realtime       |
| **APIs**    | Alpha Vantage (live market data ticker)                                       |
| **Fonts**   | Orbitron (headings), Inter (UI), JetBrains Mono (prices/data) via Google Fonts|
| **UI**      | SweetAlert2 (dialogs), i18n translations (BG/EN)                              |

---

## 🚀 How to Use

### For Users
1. **Register** → Create account and choose subscription tier (Bronze / Silver / Gold)
2. **Login** → Access tier-filtered trading predictions feed
3. **View Predictions** → Browse AI signals for Forex, Crypto, Stocks with confidence meters and live prices
4. **Read News** → Click hero slider headlines to read full financial news articles
5. **Switch Language** → Toggle between Bulgarian and English (BG/EN)

### For Admins
1. **Login** with admin credentials → Full dashboard access unlocked
2. **Manage Predictions** → Create, edit, delete trading signals with image uploads
3. **Manage News** → Post breaking news with title, content, and hero images
4. **Monitor Activity** → View all content regardless of tier restrictions

---

## 📁 Project Structure

```
PhiTrading/
├── index.html                  # Main app — all views (SPA)
├── auth.js                     # Auth, CRUD, live prices, i18n logic
├── style.css                   # Brutalist dark theme (Orbitron/Inter)
├── supabase.js                 # Supabase client config
├── translations.js             # BG/EN i18n strings
├── schema.sql                  # Full DB schema + RLS policies
├── add-profile-fields.sql      # Profile fields migration
├── add-news-title.sql          # News title column migration
├── news-policies.sql           # News RLS policies migration
├── add-watchlist-table.sql     # Watchlist table + indexes migration
├── _headers                    # Netlify/CDN security headers
└── README.md                   # This file
```

---

## 🗄️ Database Schema

### `profiles`
User roles and subscription tiers linked to Supabase Auth.

| Column       | Type        | Description                     |
|--------------|-------------|---------------------------------|
| `id`         | UUID (PK)   | Foreign key → `auth.users.id`  |
| `role`       | VARCHAR     | `user` or `admin`               |
| `tier`       | VARCHAR     | `Bronze`, `Silver`, or `Gold`   |

### `predictions`
AI-generated trading signals with tier-gated access.

| Column            | Type        | Description                          |
|-------------------|-------------|--------------------------------------|
| `id`              | UUID (PK)   | Auto-generated prediction ID         |
| `category`        | VARCHAR     | `Forex`, `Crypto`, `Stocks`, `ML`   |
| `asset`           | VARCHAR     | Asset symbol (EUR/USD, BTC, AAPL)    |
| `prediction_text` | TEXT        | Signal description and rationale     |
| `required_tier`   | VARCHAR     | Minimum tier to view                 |
| `image_url`       | TEXT        | Chart image URL (Supabase Storage)   |

### `news`
Breaking financial news with hero display.

| Column       | Type        | Description                     |
|--------------|-------------|---------------------------------|
| `id`         | UUID (PK)   | Auto-generated news ID          |
| `title`      | TEXT        | Headline displayed on hero      |
| `content`    | TEXT        | Full article text               |
| `image_url`  | TEXT        | Hero image URL (Supabase Storage)|

### `watchlist`
User-specific asset watchlist. **One-to-Many** relationship with `profiles`.

| Column         | Type        | Description                          |
|----------------|-------------|--------------------------------------|
| `id`           | UUID (PK)   | Auto-generated row ID                |
| `user_id`      | UUID (FK)   | Foreign key → `profiles.id`          |
| `asset_symbol` | VARCHAR     | Asset ticker (e.g. EUR/USD, BTC)     |
| `created_at`   | TIMESTAMPTZ | Row creation timestamp               |

**Indexes:** `idx_watchlist_user_id`, `idx_predictions_category`

**Table Relationships:**
```
auth.users (Supabase)
    └── profiles          (1:1)
            └── watchlist (1:Many)
```

---

## 🔒 Security

- **Authentication**: JWT sessions via Supabase Auth with bcrypt password hashing
- **Authorization**: PostgreSQL Row-Level Security (RLS) enforces tier/role access at DB layer
- **Storage**: Public read buckets (`prediction_images`, `news-images`) with authenticated write
- **XSS Prevention**: Content Security Policy (CSP) headers
- **Input Safety**: Parameterized queries via Supabase client — no raw SQL

---

## 🔧 Installation

### Prerequisites
- A Supabase account (free tier is sufficient)
- Any static file server or just open `index.html` directly in a browser

### Setup

```bash
# Clone repository
git clone https://github.com/your-username/phi-trading.git
cd phi-trading
```

**No build step — no `npm install` required.**

### Configure Supabase

Open `supabase.js` and update with your project credentials:
```js
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### Run Database Migrations

In the **Supabase Dashboard → SQL Editor**, run these files in order:

| Step | File | Purpose |
|------|------|---------|
| 1 | `schema.sql` | Core tables, RLS policies, triggers |
| 2 | `add-profile-fields.sql` | Profile extra fields |
| 3 | `add-news-title.sql` | News title column |
| 4 | `news-policies.sql` | News RLS policies |
| 5 | `add-watchlist-table.sql` | Watchlist table + indexes |

### Create Storage Buckets

In **Supabase Dashboard → Storage**, create two **public** buckets:
- `prediction_images`
- `news-images`

### Run the App

Open `index.html` directly in your browser, or serve with any static server:
```bash
# Python (no install needed)
python -m http.server 8080
```
Navigate to **http://localhost:8080**

### Create Admin User

```sql
-- Promote user to admin in Supabase SQL Editor
UPDATE profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-admin@email.com');
```

---

## 🧪 Testing

- [ ] Register with each tier (Bronze/Silver/Gold) and verify content filtering
- [ ] Login as admin and confirm CRUD buttons appear on predictions and news
- [ ] Create prediction with image upload — verify image renders correctly
- [ ] Edit prediction — confirm form pre-populates with existing data
- [ ] Delete prediction — confirm SweetAlert2 dark confirmation dialog
- [ ] Post news with title and image — verify hero slider displays it
- [ ] Click news headline — confirm full article detail view opens
- [ ] Test back navigation from news/prediction details
- [ ] Verify live ticker displays market data
- [ ] Test responsive layout at mobile breakpoints

---

## 📞 Admin Credentials

| Field    | Value               |
|----------|---------------------|
| Email    | `v.mitov@gmail.com` |
| Password | `123456`            |
| Role     | `admin`             |

---

<div align="center">

**Built with precision, intelligence, and a lot of ΦHI energy.**

*© 2026 PhiTrading Platform*

</div>
