# Fleet Management System

Enterprise-grade Fleet Management System for logistics operations — vehicles, drivers, trips, GPS tracking, maintenance, fuel, documents, alerts, reports, and real-time updates.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | React 18, Redux Toolkit, RTK Query, Material UI, Vite |
| Backend | Node.js, Express.js, Socket.IO |
| Database | MongoDB, Mongoose |
| Auth | JWT + Refresh Tokens (httpOnly cookie), bcrypt, RBAC |
| Maps | Google Maps API (Leaflet fallback) |
| Storage | Cloudinary |
| Real-time | Socket.IO |

---

## Quick Start

### Prerequisites

- Node.js 18+
- MongoDB (Atlas or local)
- Optional: Cloudinary (file uploads), SMTP (email), Google Maps API key

### Installation

```bash
# From project root
npm run install:all

# Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit backend/.env — at minimum set MONGODB_URI and JWT secrets
```

### Seed the database

```bash
# 1. Create the Super Admin login account
npm run seed --prefix backend

# 2. (Optional) Load demo vehicles, drivers, trips, alerts for the dashboard
npm run seed:dashboard --prefix backend
```

Default Super Admin credentials (override with env vars):

| Field | Default |
|-------|---------|
| Email | `admin@fleetmanagement.com` |
| Password | `Admin@123456` |

Env overrides: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` in `backend/.env`.

### Run locally

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| Health check | http://localhost:5000/health |
| API base | http://localhost:5000/api/v1 |

---

## 1. Logging In With Different Roles

> **Role responsibilities:** For what each role should do day to day, see [RESPONSIBILITIES.md](./RESPONSIBILITIES.md).

The app uses **Role-Based Access Control (RBAC)**. Each user has one role; permissions are derived from that role on both frontend and backend.

### Available roles

| Role | Key | What they can do |
|------|-----|------------------|
| **Super Admin** | `super_admin` | Full access — user management, admin panel, all fleet modules |
| **Fleet Manager** | `fleet_manager` | Full fleet operations (vehicles, drivers, trips, fuel, maintenance, documents, reports) — no user admin |
| **Dispatcher** | `dispatcher` | View fleet, assign drivers/vehicles, create/update trips and routes, view tracking & reports |
| **Driver** | `driver` | View/update assigned trips, view tracking and alerts |
| **Mechanic** | `mechanic` | View vehicles, manage maintenance and work orders, view documents & alerts |

Permissions are defined in `backend/constants/roles.js` and mirrored on the frontend in `frontend/src/constants/index.js`.

### How to get accounts for each role

**Only one user is seeded automatically: Super Admin.** There are no pre-built dispatcher/driver/mechanic login accounts. Use one of these methods:

#### Method A — Recommended: Super Admin creates users (UI)

1. Run `npm run seed --prefix backend` if you have not already.
2. Open http://localhost:5173/login and sign in as Super Admin.
3. Go to **Admin → Users** tab.
4. Click **Add User**, fill in name/email/password, and select the role (Dispatcher, Driver, Mechanic, Fleet Manager, or Super Admin).
5. Admin-created users are **email-verified automatically** — they can log in immediately.
6. Log out and log in with the new account to test that role's sidebar and permissions.

> Only **Super Admin** has `manage_users` permission, so only Super Admin can create users from the Admin panel.

#### Method B — Self-registration (defaults to Dispatcher)

1. Go to http://localhost:5173/register.
2. Complete the form and submit.
3. Verify email via OTP at `/verify-otp`.
4. New self-registered users get the **Dispatcher** role by default (no role picker on the register page).
5. A Super Admin can later change the user's role under **Admin → Users → Edit**.

**OTP in development:** If SMTP is not configured in `backend/.env`, the OTP is printed in the **backend terminal** as `[Email Dev Mode] Body: ...` instead of being emailed.

#### Method C — API (for automation or testing)

```bash
# Login as super admin, then create a dispatcher:
curl -X POST http://localhost:5000/api/v1/admin/users \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Dispatcher",
    "email": "dispatcher@fleet.com",
    "password": "Test@123456",
    "role": "dispatcher"
  }'
```

Allowed registration roles via public `/auth/register`: `dispatcher`, `driver`, `mechanic`, `fleet_manager`. Super Admin can only be created via seed script or by another Super Admin.

### What each role sees in the sidebar

Navigation is filtered by permissions in `DashboardLayout`. Examples:

| Page | Super Admin | Fleet Manager | Dispatcher | Driver | Mechanic |
|------|:-----------:|:-------------:|:----------:|:------:|:--------:|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Vehicles | ✓ | ✓ | ✓ (view) | — | ✓ (view) |
| Drivers | ✓ | ✓ | ✓ (view) | — | — |
| Tracking / Maps | ✓ | ✓ | ✓ | ✓ | — |
| Routes / Trips | ✓ | ✓ | ✓ | ✓ (limited) | — |
| Fuel | ✓ | ✓ | ✓ (view) | — | — |
| Maintenance | ✓ | ✓ | — | — | ✓ |
| Documents | ✓ | ✓ | — | — | ✓ (view) |
| Alerts / Reports | ✓ | ✓ | ✓ (view) | ✓ (view) | ✓ (view) |
| Admin | ✓ | — | — | — | — |

Buttons such as **Add Vehicle** or **Add Driver** only appear if the logged-in role has `create_vehicles` or `create_drivers` permission.

### Login flow (step by step)

```
Browser → /login
    → POST /api/v1/auth/login { email, password }
    → Backend validates credentials, checks isActive & isEmailVerified
    → Returns JWT access token + sets refresh token cookie
    → Frontend stores access token, loads user + permissions via GET /auth/me
    → Redirect to /dashboard (or the page you tried to visit)
```

If the session expires, RTK Query automatically calls `POST /auth/refresh-token` using the httpOnly cookie and retries the failed request.

---

## 2. Adding Vehicles, Drivers, and Other Fleet Data

Fleet **records** (vehicles, drivers, trips, etc.) are separate from **login users**. A Driver *user account* is for signing into the app; a Driver *record* under **Drivers** is the operational employee profile used for assignments and trips.

### Add a vehicle

**Who can:** Super Admin, Fleet Manager (`create_vehicles` permission)

1. Log in with a role that can create vehicles.
2. Open **Vehicles** (`/vehicles`).
3. Click **Add Vehicle**.
4. Fill required fields: vehicle number, VIN, manufacturer, model, year, status, fuel type, etc.
5. Submit — data is sent to `POST /api/v1/vehicles`.
6. Optional actions on the grid:
   - **View** — detail drawer with history
   - **Edit** — update vehicle
   - **Assign Driver** — link an available driver (`assign_vehicles` permission)
   - **Export** — CSV download

**Dispatcher** can view vehicles and assign drivers but cannot create or delete vehicles.

### Add a driver (fleet record)

**Who can:** Super Admin, Fleet Manager (`create_drivers` permission)

1. Open **Drivers** (`/drivers`).
2. Click **Add Driver**.
3. Fill in employee ID, name, email, phone, license details, status, etc.
4. Submit — `POST /api/v1/drivers`.
5. Optional: **Assign Vehicle**, upload avatar/documents, export CSV.

### Assign driver ↔ vehicle

Either side works:

- **Vehicles** page → row action **Assign Driver**
- **Drivers** page → row action **Assign Vehicle**

Requires `assign_vehicles` or `assign_drivers` (Dispatcher, Fleet Manager, Super Admin).

### Other modules (same pattern)

| Module | URL | Create permission | Typical workflow |
|--------|-----|-------------------|------------------|
| Routes | `/routes` | `manage_routes` | Define route templates with stops; use address autocomplete if Maps API is configured |
| Trips | `/trips` | `create_trips` | Create trip → assign vehicle/driver → start → complete |
| Fuel | `/fuel` | `manage_fuel` | Log fuel entries per vehicle |
| Maintenance | `/maintenance` | `manage_maintenance` | Create work orders; mechanics can update status |
| Documents | `/documents` | `manage_documents` | Upload fleet documents with expiry tracking |
| Alerts | `/alerts` | auto + `manage_alerts` | System-generated alerts; managers can acknowledge/resolve |
| Reports | `/reports` | `view_reports` | Generate/export PDF/Excel reports |

### Demo data shortcut

If tables are empty, run:

```bash
npm run seed:dashboard --prefix backend
```

This inserts sample drivers, vehicles, trips, fuel logs, maintenance records, and alerts (only when no vehicles exist yet). It does **not** create role-based login users beyond the Super Admin from `npm run seed`.

---

## 3. Application Architecture & Working Flow

### High-level diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (SPA)                            │
│  main.jsx → App.jsx → React Router → Pages / Features           │
│  Redux Store + RTK Query  │  Socket.IO client (RealtimeSync)    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP /api/v1/*  +  WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   backend/server.js                             │
│  Express + HTTP server + Socket.IO                              │
│  Middleware: CORS, helmet, rate limit, auth, permissions        │
│  Routes: /api/v1/{auth,vehicles,drivers,trips,...}             │
│  Services → Mongoose models → MongoDB                           │
└─────────────────────────────────────────────────────────────────┘
```

### Frontend entry point

| File | Role |
|------|------|
| `frontend/index.html` | HTML shell; mounts React on `#root` |
| `frontend/src/main.jsx` | Bootstraps React, imports global CSS |
| `frontend/src/App.jsx` | Redux Provider, theme, router, all route definitions |
| `frontend/src/components/common/AuthInitializer.jsx` | On load: if access token exists, calls `GET /auth/me` to restore session |
| `frontend/src/layouts/DashboardLayout.jsx` | Authenticated shell: sidebar, app bar, `<Outlet />` for pages, realtime hook |

**Route flow:**

```
/  →  redirect to /dashboard
/login, /register  →  GuestRoute (redirect to dashboard if already logged in)
/dashboard, /vehicles, ...  →  ProtectedRoute → DashboardLayout → PermissionRoute → Page
```

- `ProtectedRoute` — requires authentication.
- `PermissionRoute` — requires specific permission(s); otherwise redirects to dashboard.
- `GuestRoute` — blocks authenticated users from auth pages.

**Data layer:** Each module has an RTK Query API slice under `frontend/src/redux/api/` (e.g. `vehiclesApi.js`, `driversApi.js`). All requests go through `baseApi.js`, which attaches the JWT and handles token refresh.

### Backend entry point

| File | Role |
|------|------|
| `backend/server.js` | Creates Express app + HTTP server + Socket.IO; connects MongoDB; starts GPS simulator in dev |
| `backend/routes/index.js` | Mounts all `/api/v1/*` sub-routers |
| `backend/middleware/auth.js` | `protect` — validates JWT, attaches `req.user` and `req.userPermissions` |
| `backend/middleware/authorize.js` | `requirePermission` — enforces RBAC on each route |
| `backend/services/*.js` | Business logic |
| `backend/models/*.js` | Mongoose schemas |
| `backend/socket/index.js` | Real-time events (GPS, alerts, trips) |

**Typical API request:**

```
Client: GET /api/v1/vehicles?page=1&limit=10
  → protect middleware (JWT)
  → requirePermission(VIEW_VEHICLES)
  → vehicleController.getVehicles
  → vehicleService → Vehicle model → MongoDB
  → JSON response with pagination
```

### Real-time updates

When logged in, `RealtimeSync` (inside `DashboardLayout`) connects to Socket.IO. Backend services emit events on GPS updates, new alerts, trip status changes, etc. The connection status chip in the app bar shows whether the live socket is connected.

### Maps

- Backend: `/api/v1/maps/*` (geocode, directions, distance matrix) via Google when `GOOGLE_MAPS_API_KEY` is set, otherwise mock provider.
- Frontend: `GoogleMapsProvider` loads Google Maps when `VITE_GOOGLE_MAPS_API_KEY` is set, or reads the key from `GET /api/v1/maps/browser-config` (backend key only).
- Routes use real Google Directions (distance, duration, polylines, live traffic) when the key is configured.

**Quick setup:**

```bash
npm run setup:maps -- YOUR_GOOGLE_MAPS_API_KEY
```

Enable these APIs in [Google Cloud Console](https://console.cloud.google.com/google/maps-apis): Maps JavaScript API, Places API, Geocoding API, Directions API, Distance Matrix API.

### Auth token lifecycle

1. **Login** — access token returned in response body; refresh token in httpOnly cookie.
2. **API calls** — `Authorization: Bearer <access_token>` header.
3. **401 response** — frontend calls `POST /auth/refresh-token` with cookie; new access token stored.
4. **Logout** — `POST /auth/logout` clears refresh token server-side and client access token.

---

## Project Structure

```
fleet-management-system/
├── backend/
│   ├── server.js              # Entry point
│   ├── routes/                # API route definitions
│   ├── controllers/           # Request handlers
│   ├── services/              # Business logic
│   ├── models/                # Mongoose models
│   ├── middleware/            # auth, authorize, validate, upload
│   ├── constants/roles.js     # Roles & permissions (source of truth)
│   ├── socket/                # Socket.IO handlers
│   ├── scripts/seed.js        # Super Admin seed
│   └── scripts/seed-dashboard.js  # Demo fleet data
├── frontend/
│   └── src/
│       ├── main.jsx           # Frontend entry
│       ├── App.jsx            # Routes & providers
│       ├── layouts/           # DashboardLayout, AuthLayout
│       ├── pages/             # Route-level pages
│       ├── features/          # Module-specific components
│       └── redux/             # Store, slices, RTK Query APIs
└── package.json               # Root scripts (dev, test, build)
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Token signing |
| `CLIENT_URL` | CORS origin (default `http://localhost:5173`) |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Override default Super Admin |
| `SMTP_*` | Email for OTP (optional in dev — logs to console) |
| `GOOGLE_MAPS_API_KEY` | Server-side maps calls |
| `CLOUDINARY_*` | Image/document uploads |

### Frontend (`frontend/.env`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API URL (default `http://localhost:5000/api/v1`) |
| `VITE_GOOGLE_MAPS_API_KEY` | Client-side maps |
| `VITE_SOCKET_URL` | Socket.IO server (default `http://localhost:5000`) |

---

## Testing

```bash
# All unit + integration tests
npm test

# Backend integration suites (auth, vehicles, drivers, …)
npm run test:integration --prefix backend

# Individual module
npm run test:vehicles --prefix backend
```

Frontend uses Vitest; backend uses Node's built-in test runner plus integration scripts.

---

## Modules (Build Progress)

- [x] Module 1: Project Structure & Dependencies
- [x] Module 2: Authentication (JWT, RBAC, OTP)
- [x] Module 3: Dashboard & Analytics
- [x] Module 4: Vehicle Management
- [x] Module 5: Driver Management
- [x] Module 6: GPS Tracking & Geofencing
- [x] Module 7: Route Management
- [x] Module 8: Fuel Management
- [x] Module 9: Maintenance Management
- [x] Module 10: Document Management
- [x] Module 11: Trip Management
- [x] Module 12: Alerts & Notifications
- [x] Module 13: Reports & Export
- [x] Module 14: Admin Panel & Settings
- [x] Module 15: Socket.IO Integration
- [x] Module 16: Maps Integration

---

## Typical first-time walkthrough

1. `npm run install:all`
2. Configure `backend/.env` with `MONGODB_URI`
3. `npm run seed --prefix backend`
4. `npm run seed:dashboard --prefix backend` (optional demo data)
5. `npm run dev`
6. Login at http://localhost:5173/login as Super Admin
7. **Admin → Users** — create a Dispatcher, Driver, and Mechanic test account
8. **Vehicles** / **Drivers** — add or review seeded records; assign driver to vehicle
9. **Trips** — create a trip linking vehicle + driver
10. **Tracking** / **Maps** — view live/simulated GPS
11. Log out and sign in as each role to confirm different menus and actions

---

## License

Proprietary — All rights reserved.
