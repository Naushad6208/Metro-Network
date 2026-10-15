# Metro P-Way Portal — MongoDB Version

This version separates the original portal into:

- `frontend/` — Vite frontend
- `backend/` — Express + MongoDB API

The original UI/features are retained, while portal data, users, passwords, recovery secret, banner and theme preference are moved to the backend/MongoDB.

## MongoDB collections

### `users`
Stores:
- username
- bcrypt password hash
- role (`admin` / `viewer`)
- created date

Plain-text passwords are never returned by the API.

### `portals`
One `main` document stores:
- all metro lines
- all section/item records
- line colours/photos
- hero banner
- theme preference
- SHA-256 hash of the recovery secret

## Local setup

### Backend

```bash
cd backend
npm install
copy .env.example .env
```

Linux/macOS:

```bash
cp .env.example .env
```

Fill `.env`:

```env
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_long_random_secret
FRONTEND_ORIGIN=http://localhost:5173
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=your_admin_password
DEFAULT_RECOVERY_CODE=your_recovery_code
PORT=5000
```

Start:

```bash
npm run dev
```

Health check:

`http://localhost:5000/api/health`

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
```

Set:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Start:

```bash
npm run dev
```

## Vercel deployment

### Backend project
Deploy the `backend` folder as one Vercel project and add the environment variables from `backend/.env.example`.

Set:

```env
FRONTEND_ORIGIN=https://YOUR-FRONTEND-DOMAIN.vercel.app
```

### Frontend project
Deploy the `frontend` folder as a separate Vercel project.

Set:

```env
VITE_API_BASE_URL=https://YOUR-BACKEND-DOMAIN.vercel.app
```

Redeploy the frontend after changing the environment variable.

## Important

The browser's old `localStorage` data cannot automatically be read by a newly deployed server. If the old portal already contains important data, export/migrate that data before deleting the old application. The new version itself no longer uses localStorage for portal data, users, passwords, recovery code, hero or theme.

The only browser-side storage used by this version is the authentication JWT token; actual application data remains in MongoDB.
