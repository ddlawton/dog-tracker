# Josie Tracker

Production-ready mobile-first dog activity tracker. Log potty breaks, vomiting, eating, grooming, and surgery with timestamps, notes, and optional GPS coordinates.

## ✨ Version 2.0 - Production Rewrite

Complete rewrite with React, production-grade backend, and mobile optimization.

### Key Features
- 🐕 Track 5 activity types (potty, vomit, eating, grooming, surgery)
- 🌍 Timezone-aware logging and display (fixed critical timezone bug)
- 📍 Optional GPS coordinates with interactive map
- 📊 Daily statistics and weekly analytics
- 📅 Interactive calendar with activity heatmap
- 📱 Mobile-optimized interface (44x44px touch targets)
- 💾 JSON data export
- 🔒 Production-ready security and validation

## Quick Start

**Requirements**: Node.js 18+, PostgreSQL

```bash
# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your PostgreSQL credentials

# Start backend (Terminal 1)
cd backend && npm run dev

# Start frontend (Terminal 2)
cd frontend && npm run dev

# Access at http://localhost:8000
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Architecture

### Backend (Production-Ready)
- **Express.js** with comprehensive error handling
- **PostgreSQL** with optimized indexes
- **Joi** validation on all endpoints
- **Winston** structured logging
- **Rate limiting** (100 req/15min)
- **CORS** properly configured
- **Compression** middleware
- **Database retry logic** with exponential backoff
- **Request/response logging** with correlation IDs

### Frontend (React + Vite)
- **React 18** with hooks and context
- **Vite** for fast builds and HMR
- **Luxon** for robust timezone handling
- **React Leaflet** for interactive maps
- **Mobile-optimized** CSS and touch targets
- **Modular architecture** (no more 839-line monolith!)

### Code Organization
```
backend/
  server.js              # Main server (production-ready)
  utils/
    validation.js        # Joi schemas
    logger.js           # Winston configuration
    db.js               # Database with retry logic
  middleware/
    errorHandler.js     # Centralized error handling
    requestLogger.js    # Request/response logging

frontend/
  src/
    App.jsx             # Main app component
    context/
      AppContext.jsx    # Global state management
    pages/
      TodayPage.jsx     # Today's activities
      HistoryPage.jsx   # Calendar view
      AnalyticsPage.jsx # Stats and map
    components/
      QuickAdd.jsx      # Activity buttons
      ActivityList.jsx  # Activity feed
      Calendar.jsx      # Monthly calendar
      ActivityMap.jsx   # GPS map
      modals/           # 7 modal components
    utils/
      timezone.js       # Timezone utilities (Luxon)
      gps.js           # GPS utilities
      security.js      # XSS protection
    services/
      api.js           # Centralized API calls

shared/
  constants.js          # Shared constants (eliminates duplication)
```

## Production Improvements

### Before → After

**Code Quality**
- ❌ 839-line monolithic `app.js` → ✅ Modular React components
- ❌ Code duplication (6+ instances) → ✅ Shared constants
- ❌ No validation → ✅ Joi schemas on all endpoints
- ❌ Console.log only → ✅ Winston structured logging
- ❌ Generic error messages → ✅ Proper HTTP status codes & details

**Security & Reliability**
- ❌ No rate limiting → ✅ 100 requests/15min
- ❌ Open CORS → ✅ Configurable origins
- ❌ No input validation → ✅ Full validation with helpful errors
- ❌ Database connection fails → ✅ Auto-retry with exponential backoff
- ❌ Basic health check → ✅ Database ping included

**Timezone Handling**
- ❌ **CRITICAL BUG**: Activities created with wrong timezone → ✅ **FIXED**: Luxon timezone-aware timestamps
- ❌ Manual Date manipulation → ✅ Robust Luxon formatting
- ❌ Duplicate timezone functions → ✅ Single TimezoneFormatter class

**Mobile Experience**
- ❌ Some touch targets too small → ✅ Minimum 44x44px touch targets
- ❌ Basic responsive CSS → ✅ Mobile-first with iOS Safari fixes
- ❌ Generic UI → ✅ Bottom sheet modals, optimized calendar

## API

All endpoints include proper validation, error handling, and logging.

- **User Settings**: Timezone preference stored in `user_settings` table
- **Activity Storage**: Each activity stores:
  - `timestamp` (UTC) - the actual moment the activity occurred
  - `timestamp_local_date` (DATE) - pre-computed local date in user's timezone
  - `user_timezone` (VARCHAR) - timezone used when activity was logged (for historical accuracy)

- **Query Performance**: Using pre-computed `timestamp_local_date` makes date filtering fast without requiring timezone conversions on every query

- **Frontend**: Loads user timezone once on app start, all display formatting uses this timezone

## API

**Settings Management**:
```
GET /api/settings
- Returns current user settings including timezone

PUT /api/settings
- Updates user settings
- Body: { "timezone": "America/New_York" }
```

**Log activity**:
```
POST /api/activities
{
  "type": "potty|vomit|eating|groom|surgery",
  "subtype": "pee|poo|both" (optional, for potty only),
  "timestamp": "2026-07-26T10:30:00Z",
  "notes": "optional notes",
  "gps_lat": 40.7128,
  "gps_lon": -74.0060
}
```

**Get activities**: `GET /api/activities?date=2026-07-26`

**Get statistics**: `GET /api/activities/stats`

**Delete activity**: `DELETE /api/activities/:id`

**Export data**: `GET /api/export`


## Testing

**Backend** (56+ tests with production coverage):
```bash
cd backend && npm test
```

**Frontend** (90+ tests being ported to React Testing Library):
```bash
cd frontend && npm test
```

Tests cover: CRUD operations, statistics, timezone handling, validation, error cases, and edge cases.

## Production Deployment

### Docker (Recommended)
```bash
docker-compose up -d
```

### Manual
See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Mobile Usage (iPhone via Tailscale)

The app is optimized for iPhone Safari:
1. Connect to your home network via Tailscale
2. Open Safari and navigate to your server's IP:3000
3. Optionally: Add to Home Screen for app-like experience
4. All UI is touch-optimized with proper target sizes

No App Store deployment needed - works perfectly as a web app!

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite HMR for instant updates
```

### View Logs
```bash
tail -f backend/logs/combined.log
```

## Monitoring & Observability

- **Structured Logs**: `backend/logs/combined.log` and `error.log`
- **Request IDs**: Track requests across the system
- **Health Check**: `GET /health` includes database status
- **Performance**: Query timing logged automatically

## Data Export

Click the 💾 icon in the app header to download all data as JSON.

Or use the API:
```bash
curl http://localhost:3000/api/export > backup.json
```

## Notes

- All data stored locally in PostgreSQL (no cloud services)
- Timezone-aware activity logging with Luxon
- Optional GPS coordinates with Leaflet/OpenStreetMap maps
- Activity history with interactive calendar heatmap
- Weekly statistics and analytics
- Production-ready error handling and logging
- Rate limiting and security hardening
- Mobile-optimized for iPhone Safari

## Contributing

This is a personal project for tracking Josie's activities. The codebase is now production-ready and highly maintainable with:
- Clear separation of concerns
- Comprehensive error handling
- Full input validation
- Structured logging
- Mobile-first design

## License

Personal use only.



