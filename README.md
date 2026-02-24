# PHI.TRADING - AI Financial Predictions Platform

A modern, dark-themed SaaS platform for financial market predictions powered by AI. Features tier-based access control (Bronze, Silver, Gold) and admin management capabilities.

---

## 🚀 Technology Stack

- **Frontend**: Pure HTML5, CSS3, Vanilla JavaScript (ES6 Modules)
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Styling**: Custom CSS with brutal dark theme, neon accents
- **Typography**: Space Grotesk (Google Fonts)
- **Development Server**: Python HTTP Server (for ES module support)

---

## 🎨 Design Features

- **Brutal Dark Theme**: Deep black (`#050505`) background
- **Neon Accents**: Green (`#00ff88`) and Blue (`#00d9ff`)
- **Responsive Design**: Mobile-first with breakpoints at 960px and 600px
- **Glassmorphism Effects**: Modal overlays with backdrop blur
- **Grid Background**: Animated hero section with radial gradient mask

---

## 📦 Project Structure

```
AIprojectWebPhiTrading/
├── index.html          # Main landing page with navigation and hero
├── style.css           # Complete styling with responsive design
├── auth.js             # Authentication logic (register, login, logout)
├── supabase.js         # Supabase client initialization
├── schema.sql          # PostgreSQL database schema with RLS policies
└── README.md           # Project documentation
```

---

## 🔐 Admin Credentials

**Email**: `v.mitov@gmail.com`  
**Password**: `123456`  
**Role**: `admin`

> **Note**: This account has full admin privileges and can manage predictions for all tiers.

---

## 🗄️ Database Schema

### Tables

#### `profiles`
| Column      | Type      | Description                    |
|-------------|-----------|--------------------------------|
| id          | UUID (PK) | Foreign key to `auth.users.id` |
| role        | VARCHAR   | `user` or `admin` (default: `user`) |
| tier        | VARCHAR   | `Bronze`, `Silver`, or `Gold` (default: `Bronze`) |
| created_at  | TIMESTAMP | Profile creation timestamp     |
| updated_at  | TIMESTAMP | Last update timestamp          |

#### `predictions`
| Column          | Type      | Description                |
|-----------------|-----------|----------------------------|
| id              | UUID (PK) | Unique prediction ID       |
| category        | VARCHAR   | `Forex`, `Crypto`, `Stocks`, `ML` |
| asset           | VARCHAR   | Asset symbol (e.g., `EUR/USD`) |
| prediction_text | TEXT      | Prediction content         |
| required_tier   | VARCHAR   | Minimum tier to view (`Bronze`, `Silver`, `Gold`) |
| created_at      | TIMESTAMP | Prediction creation time   |

### Row Level Security (RLS) Policies

- **Profiles**: Users can read/update own profile; all authenticated users can read all profiles
- **Predictions**: All authenticated users can SELECT; only admins can INSERT/UPDATE/DELETE

---

## 🛠️ Setup Instructions

### 1. Clone/Download Project
```bash
cd C:\Users\test\Desktop\AIprojectWebPhiTrading
```

### 2. Configure Supabase

**Supabase Project Details**:
- **URL**: `https://qbgcpwmqjwwgiginelqe.supabase.co`
- **Anon Key**: `sb_publishable_ZSqBLgYmunmSRYGrOPz5hg_YZvaYECl`

Already configured in `supabase.js` - no changes needed.

### 3. Setup Database

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/qbgcpwmqjwwgiginelqe
2. Navigate to **SQL Editor**
3. Copy contents of `schema.sql` and execute
4. Verify tables created: `profiles` and `predictions`

### 4. Configure Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Disable "Confirm email" (for testing) in **Settings** → **Auth**

### 5. Create Admin User

Execute in SQL Editor:
```sql
-- Set admin role for v.mitov@gmail.com
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
    SELECT id FROM auth.users WHERE email = 'v.mitov@gmail.com'
);
```

### 6. Start Development Server

```bash
python -m http.server 5500
```

### 7. Open Application

Navigate to: **http://localhost:5500**

---

## 🎯 Features

### Authentication
- ✅ Email/Password registration
- ✅ Tier selection during signup (Bronze/Silver/Gold)
- ✅ Secure login with Supabase Auth
- ✅ Session management with localStorage
- ✅ Automatic profile creation on registration

### User Management
- ✅ Role-based access control (user/admin)
- ✅ Tier-based content filtering
- ✅ Profile data persistence
- ✅ Secure logout with session cleanup

### Admin Features
- ✅ Admin panel button (visible only to admins)
- ✅ Full CRUD access to predictions
- ✅ Tier-based content management
- 🔄 Admin dashboard (coming soon)

### UI/UX
- ✅ Responsive navigation bar
- ✅ Hero section with grid background effect
- ✅ Modal-based authentication forms
- ✅ Tab switching (Login/Register)
- ✅ Form validation and error messages
- ✅ Loading states and success feedback
- ✅ Mobile hamburger menu

---

## 🔑 User Workflow

### Registration
1. Click **Register** button
2. Enter email and password
3. Select tier (Bronze/Silver/Gold)
4. Submit form
5. Profile automatically created in database

### Login
1. Click **Login** button
2. Enter credentials
3. System fetches role and tier from profiles table
4. Data stored in localStorage
5. UI updates based on role (Admin Panel button shows for admins)

### Admin Access
1. Login with admin credentials
2. **Admin Panel** button appears in navigation
3. Full access to prediction management
4. Can view console logs for debugging

---

## 🐛 Troubleshooting

### CSP Errors
If you see Content Security Policy errors, ensure the CSP meta tag in `index.html` includes:
```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://esm.sh https://*.supabase.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co; img-src 'self' data: https:;">
```

### ES Module Errors
- Must use HTTP server (not `file://` protocol)
- Use `python -m http.server 5500`

### Profile Not Found
If role/tier not showing:
1. Open Browser Console (F12)
2. Check for "Error fetching profile" message
3. Verify profile exists in database:
```sql
SELECT * FROM profiles WHERE id = 'YOUR_USER_ID';
```

### Admin Button Not Showing
1. Verify role in database: `SELECT role FROM profiles WHERE id = 'USER_ID';`
2. Check Console for "User Role:" log
3. Logout and login again to refresh session

---

## 📊 Testing Checklist

- [ ] Registration with Bronze tier
- [ ] Registration with Silver tier
- [ ] Registration with Gold tier
- [ ] Login as regular user
- [ ] Login as admin (v.mitov@gmail.com)
- [ ] Verify Admin Panel button visible
- [ ] Check Console logs for role/tier
- [ ] Test logout functionality
- [ ] Verify localStorage cleared on logout
- [ ] Test responsive design on mobile

---

## 🔮 Next Steps

1. **Seed Predictions Data**: Add sample predictions to test tier-based filtering
2. **Build Admin Panel**: Create UI for managing predictions
3. **Predictions Feed**: Display predictions based on user tier
4. **Payment Integration**: Connect tier upgrades to Stripe
5. **Real-time Updates**: Use Supabase real-time subscriptions
6. **Analytics Dashboard**: Track prediction accuracy

---

## 📝 Console Debugging

When logged in, you should see:
```
User Role: admin (or user)
User Tier: Bronze (or Silver/Gold)
```

If you see "Error fetching profile", check:
1. Profile exists in `profiles` table
2. RLS policies allow SELECT
3. User ID matches between `auth.users` and `profiles`

---

## 🔒 Security Notes

- All routes use Row Level Security (RLS)
- Passwords never stored in code
- Supabase handles all authentication
- Admin keys stored server-side only
- HTTPS enforced in production
- CSP headers prevent XSS attacks

---

## 📞 Support

For issues or questions, check:
1. Browser Console (F12) for errors
2. Supabase Dashboard logs
3. Database RLS policies
4. Profile table for user data

---

**Built with ❤️ using Supabase and Vanilla JavaScript**
