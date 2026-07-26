# Pet Tracker

Mobile-first dog activity tracker. Log potty breaks, vomiting, eating, grooming, and surgery with timestamps, notes, and optional GPS coordinates.

## Setup

**Requirements**: Docker, Docker Compose, PostgreSQL server

**Quick start**:
```bash
cp backend/.env.example .env
# Edit .env with your PostgreSQL credentials
docker-compose up -d
# Access at http://localhost:3000
```

**Environment variables** (.env):
```
DB_HOST=your-postgres-host
DB_PORT=5432
DB_NAME=josie_tracker
DB_USER=postgres
DB_PASSWORD=your-password
PORT=3000
```

## API

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

**Backend** (56 integration tests):
```bash
cd backend && npm install && npm test
```
Tests cover CRUD operations, statistics, data export, and error handling.

**Frontend** (90+ unit tests):
```bash
cd frontend && npm install && npm test
```
Tests cover formatting, calculations, calendar generation, statistics, and API response validation.

Test organization: `backend/tests/` and `frontend/tests/` with shared fixtures and separated integration/unit tests. All tests use real value assertions, not smoke tests. See TEST_ORGANIZATION_SUMMARY.md for details.

## Development

**Local setup** (without Docker):
```bash
# Backend
cd backend && npm install && npm start

# Frontend (in another terminal)
cd frontend
python3 -m http.server 8000
```

## Notes

- All data stored locally in PostgreSQL (no cloud services)
- Optional GPS coordinates with map view (Leaflet/OpenStreetMap)
- Activity history grouped by date with interactive calendar
- Weekly statistics and analytics
- JSON data export


