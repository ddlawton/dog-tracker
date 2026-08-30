# TrueNAS Scale Deployment Checklist

## Pre-Deployment: Database Migration Required

⚠️ **IMPORTANT**: Your existing PostgreSQL database needs to be updated before deploying the new version.

### Database Schema Changes
The new version adds:
- `user_settings` table (stores timezone preference)
- `timestamp_local_date` column to `activities` table (for faster date queries)
- `user_timezone` column to `activities` table (tracks timezone for each activity)
- Indexes for performance

---

## Step-by-Step Deployment

### 1. Backup Your Existing Database (CRITICAL!)

```bash
# SSH into your TrueNAS Scale server
ssh your-truenas-server

# Backup your existing database
pg_dump -h localhost -U your_db_user -d josie_tracker > josie_tracker_backup_$(date +%Y%m%d).sql

# Or if PostgreSQL is in a container:
docker exec -t your-postgres-container pg_dump -U your_db_user josie_tracker > josie_tracker_backup_$(date +%Y%m%d).sql
```

### 2. Run Database Migration

**Option A: Run migration SQL directly**

```bash
# Copy the migration file to TrueNAS
scp backend/migrations/001_add_user_settings.sql your-truenas-server:/tmp/

# SSH into TrueNAS and run migration
ssh your-truenas-server

# Run the migration
psql -h localhost -U your_db_user -d josie_tracker -f /tmp/001_add_user_settings.sql

# Or if PostgreSQL is in a container:
docker exec -i your-postgres-container psql -U your_db_user -d josie_tracker < /tmp/001_add_user_settings.sql
```

**Option B: Let the app auto-migrate on first startup**

The new `server.js` has an `initDB()` function that will:
- Create missing tables with `CREATE TABLE IF NOT EXISTS`
- However, it won't add columns to existing tables automatically

**RECOMMENDED: Use Option A** to explicitly run the migration file.

### 3. Verify Migration Success

```bash
# Connect to database
psql -h localhost -U your_db_user -d josie_tracker

# Check user_settings table exists
\dt user_settings

# Check new columns exist
\d activities

# Should see:
# - timestamp_local_date (DATE)
# - user_timezone (VARCHAR(100))

# Check default settings inserted
SELECT * FROM user_settings;

# Exit
\q
```

Expected output:
```
 id |     timezone      |       created_at        |       updated_at        
----+-------------------+-------------------------+-------------------------
  1 | America/New_York  | 2026-08-30 ...          | 2026-08-30 ...
```

### 4. Push Code to GitHub

```bash
cd /Users/lawton/SideProjects/dog-tracker

# Ensure all changes are committed
git add .
git commit -m "Production-ready v2.0 with React frontend and security improvements"
git push origin main

# Optional: Create a release tag
git tag -a v2.0.0 -m "Version 2.0.0 - React frontend, timezone fixes, security improvements"
git push origin v2.0.0
```

### 5. Wait for GitHub Actions to Build Image

- Go to your GitHub repo → Actions tab
- Watch the "Build and Push Docker Image" workflow
- Wait for it to complete successfully
- Image will be pushed to `ghcr.io/ddlawton/dog-tracker:latest`

### 6. Update TrueNAS App Configuration

**If using existing PostgreSQL on TrueNAS:**

Update your `docker-compose.yml` or TrueNAS app configuration:

```yaml
services:
  josie-tracker:
    image: ghcr.io/ddlawton/dog-tracker:latest
    container_name: josie-tracker-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DB_HOST: your-existing-postgres-host
      DB_PORT: 5432
      DB_NAME: josie_tracker
      DB_USER: your_db_user
      DB_PASSWORD: ${DB_PASSWORD}
      PORT: 3000
      NODE_ENV: production
      LOG_LEVEL: info
      ALLOWED_ORIGINS: "*"
    volumes:
      - /mnt/your-pool/josie-tracker/logs:/app/logs
```

**If using bundled PostgreSQL (new deployment):**

Use the provided `docker-compose.truenas.yml`:

```bash
# On your local machine, copy to TrueNAS
scp docker-compose.truenas.yml your-truenas-server:/mnt/your-pool/josie-tracker/

# SSH into TrueNAS
ssh your-truenas-server
cd /mnt/your-pool/josie-tracker/

# Create .env file
cat > .env << EOF
DB_PASSWORD=your-secure-password-here
GITHUB_USERNAME=ddlawton
EOF

# Start the stack
docker-compose -f docker-compose.truenas.yml up -d
```

### 7. Configure Environment Variables in TrueNAS UI

When creating/updating the custom app in TrueNAS Scale:

**Required Environment Variables:**
- `DB_HOST` - Your PostgreSQL host (e.g., `192.168.1.100` or `postgres` if using docker-compose)
- `DB_NAME` - `josie_tracker`
- `DB_USER` - Your PostgreSQL username
- `DB_PASSWORD` - Your PostgreSQL password
- `PORT` - `3000`
- `NODE_ENV` - `production`
- `LOG_LEVEL` - `info`
- `ALLOWED_ORIGINS` - `*` (or specify your Tailscale IP range)

**Optional:**
- `DB_PORT` - `5432` (default)

### 8. Deploy and Verify

```bash
# If using docker-compose on TrueNAS
docker-compose -f docker-compose.truenas.yml up -d

# Or pull the latest image if app is already running
docker pull ghcr.io/ddlawton/dog-tracker:latest
docker restart josie-tracker-app

# Check logs
docker logs -f josie-tracker-app

# Look for:
# - "Database initialized successfully"
# - "Server running on port 3000"
# - No errors about missing columns
```

### 9. Test the Deployment

Access the app via Tailscale:
```
http://your-truenas-tailscale-ip:3000
```

**Test checklist:**
- ✅ App loads (React frontend)
- ✅ Can log a potty activity
- ✅ Can log other activity types
- ✅ Activities display correctly
- ✅ Can change timezone in settings
- ✅ Can export data
- ✅ No errors in browser console
- ✅ GPS location works (if enabled on device)

### 10. Rollback Plan (If Something Goes Wrong)

```bash
# Stop the new container
docker stop josie-tracker-app
docker rm josie-tracker-app

# Restore database from backup
psql -h localhost -U your_db_user -d josie_tracker < josie_tracker_backup_YYYYMMDD.sql

# Deploy old version (if you have it)
docker run -d \
  --name josie-tracker-app \
  -p 3000:3000 \
  -e DB_HOST=your-host \
  -e DB_NAME=josie_tracker \
  -e DB_USER=your_user \
  -e DB_PASSWORD=your_pass \
  your-old-image:tag
```

---

## Architecture Overview

### Current Setup (After Migration)

```
┌─────────────────────────────────────────────┐
│         TrueNAS Scale Server                │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  Existing PostgreSQL                  │  │
│  │  Database: josie_tracker              │  │
│  │  Tables:                              │  │
│  │    - activities (UPDATED SCHEMA)      │  │
│  │    - user_settings (NEW)              │  │
│  └──────────────────────────────────────┘  │
│                    ↑                        │
│                    │                        │
│  ┌──────────────────────────────────────┐  │
│  │  Docker Container                     │  │
│  │  ghcr.io/ddlawton/dog-tracker:latest │  │
│  │  Port: 3000                           │  │
│  │  - Node.js backend                    │  │
│  │  - React frontend                     │  │
│  └──────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
                    ↑
                    │ Tailscale VPN
                    │
         ┌──────────┴──────────┐
         │   Your Devices      │
         │   Mobile / Desktop  │
         └─────────────────────┘
```

---

## Database Migration Details

The migration (`backend/migrations/001_add_user_settings.sql`) is **safe to run multiple times** because it uses:

- `CREATE TABLE IF NOT EXISTS` - Won't fail if table exists
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` - Won't fail if column exists
- `CREATE INDEX IF NOT EXISTS` - Won't fail if index exists
- `INSERT ... WHERE NOT EXISTS` - Won't create duplicate settings

**What the migration does:**

1. Creates `user_settings` table with default timezone
2. Adds `timestamp_local_date` column to `activities` (stores YYYY-MM-DD in user timezone)
3. Adds `user_timezone` column to `activities` (historical tracking)
4. Backfills existing activities with default timezone and computed local dates
5. Creates indexes for faster queries
6. Inserts default user settings (America/New_York)

**Existing data is preserved** - no data loss, only new columns added.

---

## Expected File Sizes

After building:
- Docker image: ~150-200 MB (multi-stage build, only production deps)
- Log files: Grows over time (logrotate recommended)
- Database: Minimal (<1 MB for typical usage)

---

## Troubleshooting

### Migration fails with "column already exists"

This is actually OK - it means the migration was partially run before. The migration file uses `IF NOT EXISTS` so you can safely run it again.

### App fails to start with "column does not exist"

The migration didn't complete successfully. Check:
```bash
# Verify columns exist
psql -h localhost -U your_db_user -d josie_tracker -c "\d activities"
```

If columns are missing, re-run the migration SQL file.

### App can't connect to database

Check environment variables:
```bash
docker exec josie-tracker-app env | grep DB_
```

Verify PostgreSQL is accessible:
```bash
# From TrueNAS
psql -h your-db-host -U your_db_user -d josie_tracker -c "SELECT 1"
```

### "Too many requests" error

Rate limiting is active (100 requests per 15 minutes per IP). This is normal for security. Increase the limit in code if needed for your use case.

---

## Security Notes

- ✅ App is behind Tailscale (no public internet exposure)
- ✅ Rate limiting enabled (100 req/15min per IP)
- ✅ CORS configured (can restrict to specific origins)
- ✅ Input validation with Joi
- ✅ SQL injection protection (parameterized queries)
- ✅ XSS protection (HTML escaping)
- ✅ Comprehensive error handling and logging
- ✅ Request logging with UUIDs for debugging

---

## Support

If you encounter issues:

1. Check logs: `docker logs -f josie-tracker-app`
2. Check database connection: `docker exec josie-tracker-app node -e "require('./utils/db').testConnection()"`
3. Verify environment variables: `docker exec josie-tracker-app env`
4. Check this repository's Issues page for known problems

---

## Success Criteria

✅ Migration completed without errors
✅ App starts successfully
✅ Can create new activities
✅ Existing activities still visible
✅ Timezone settings work
✅ Export functionality works
✅ No errors in logs
✅ Frontend loads and is responsive

---

## Next Steps After Deployment

1. Test thoroughly with real usage for a few days
2. Monitor logs for any unexpected errors
3. Set up log rotation if not already configured
4. Consider setting up automated database backups
5. Update your internal documentation with new TrueNAS app details

---

**Estimated deployment time: 30-45 minutes** (including backup and verification)
