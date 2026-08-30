# Josie Tracker - Installation & Deployment Guide

## Quick Start (Development)

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Configure Environment
```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit backend/.env with your PostgreSQL credentials
```

### 4. Start Backend (Terminal 1)
```bash
cd backend
npm run dev
```

### 5. Start Frontend Dev Server (Terminal 2)
```bash
cd frontend
npm run dev
```

### 6. Access Application
Open http://localhost:8000 in your browser

## Production Deployment with Docker

### 1. Build and Start
```bash
# Make sure your .env file is configured
docker-compose up -d
```

### 2. Access Application
Open http://localhost:3000

## Manual Production Build

### 1. Build Frontend
```bash
cd frontend
npm run build
```

### 2. Start Backend
```bash
cd backend
NODE_ENV=production npm start
```

## Database Setup

The application will automatically create the required tables on first run. Make sure your PostgreSQL server is running and accessible with the credentials in your `.env` file.

### Manual Migration (if needed)
```bash
psql -U postgres -d josie_tracker -f backend/migrations/001_add_user_settings.sql
```

## Environment Variables

### Backend (.env)
- `DB_HOST` - PostgreSQL host (default: localhost)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_NAME` - Database name (default: josie_tracker)
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (info/debug/warn/error)
- `ALLOWED_ORIGINS` - CORS allowed origins (comma-separated)

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Key Improvements in This Version

### Fixed
- ✅ Critical timezone bug in activity creation
- ✅ Code duplication (6+ instances reduced to shared constants)
- ✅ No input validation → Full Joi schema validation
- ✅ Poor error handling → Centralized middleware
- ✅ No logging → Winston structured logging
- ✅ No rate limiting → 100 req/15min limit
- ✅ Weak CORS → Configurable origins
- ✅ Monolithic 839-line app.js → Modular React components

### Architecture
- React + Vite for modern frontend
- Luxon for robust timezone handling
- React Context for state management
- Centralized API service layer
- Mobile-optimized UI (44x44px touch targets)
- Production-ready error handling
- Request/response logging with correlation IDs
- Database connection retry logic

## Mobile Usage

The app is optimized for mobile web browsers (especially iOS Safari):
- Responsive design
- Touch-optimized interface (44x44px minimum targets)
- iOS Safari specific fixes
- Bottom sheet modals
- Swipeable calendar

Simply access the app from your iPhone's Safari browser via Tailscale.

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify `.env` credentials
- Check logs in `backend/logs/`

### Frontend build fails
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Check Node version (requires Node 18+)

### Database connection fails
- Verify PostgreSQL is accessible
- Check firewall settings
- Test connection: `psql -h $DB_HOST -U $DB_USER -d $DB_NAME`

### Map not showing
- Check browser console for Leaflet errors
- Verify GPS coordinates are valid
- Ensure activities have `gps_lat` and `gps_lon` set

## Logs

Logs are stored in `backend/logs/`:
- `combined.log` - All logs
- `error.log` - Errors only

View logs:
```bash
tail -f backend/logs/combined.log
```

## Backup

Export your data:
```bash
# From the app: Click 💾 icon in header

# Or via API:
curl http://localhost:3000/api/export > backup.json
```

## Performance

- Backend uses connection pooling (max 20 connections)
- Responses are compressed with gzip
- React app is bundled and minified
- Pre-computed date fields for fast queries
- Indexes on frequently queried columns
