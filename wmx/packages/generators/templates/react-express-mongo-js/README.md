# __PROJECT_NAME__

A full-stack starter built with React 18 + Express + MongoDB, scaffolded by WMX CLI.

## Getting started

### Backend
```bash
cd backend
cp .env.example .env
# Fill in MONGODB_URI and JWT_SECRET in .env
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend runs on http://localhost:5173 and proxies `/api` requests to the backend on port 5000.
