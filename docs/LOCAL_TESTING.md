# Local Testing Guide - Josie Tracker

## Prerequisites
- macOS with Node.js 18+
- PostgreSQL installed and running
- Two terminal windows

## Step 1: Install PostgreSQL (if not already installed)

```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb josie_tracker

# Verify connection
psql josie_tracker
```

## Step 2: Project Setup

```bash
# Clone or navigate to project
cd /Users/lawton/SideProjects/dog-tracker

# Make scripts executable
chmod +x *.sh

# Run setup
./setup.sh
```

## Step 3: Configure Environment

Edit `backend/.env`:
```bash
nano backend/.env
```

For local Mac testing, use these settings:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=josie_tracker
DB_USER=your_mac_username
DB_PASSWORD=
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
ALLOWED_ORIGINS=http://localhost:8000,http://localhost:3000
```

> **Note**: If you set up PostgreSQL without a password, leave `DB_PASSWORD` empty. Otherwise, use your PostgreSQL password.

## Step 4: Test Backend Connection

```bash
cd backend
node -e "require('dotenv').config(); const {Pool} = require('pg'); const pool = new Pool({host: process.env.DB_HOST, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD}); pool.query('SELECT NOW()').then(r => {console.log('✅ Connected:', r.rows[0]); process.exit(0)}).catch(e => {console.error('❌ Error:', e.message); process.exit(1)})"
```

You should see: `✅ Connected: { now: ... }`

## Step 5: Start Development Servers

### Option A: Automated (with tmux)
```bash
./start-dev.sh
```

### Option B: Manual (recommended for first-time testing)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Watch for:
```
Server running on port 3000
Environment: development
Database initialized successfully
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Watch for:
```
  VITE v5.0.8  ready in 523 ms

  ➜  Local:   http://localhost:8000/
  ➜  Network: use --host to expose
```

## Step 6: Test the Application

1. **Open Browser**: http://localhost:8000

2. **Test Basic Functionality**:
   - ✅ App loads without errors
   - ✅ Click each activity button (Potty, Vomit, Eating, Groom, Surgery)
   - ✅ Log a test activity with notes
   - ✅ Verify activity appears in the list
   - ✅ Check timestamp shows correct time
   - ✅ Delete the test activity

3. **Test Timezone**:
   - Click 🌍 icon
   - Change timezone (try "America/Los_Angeles")
   - Log an activity
   - Verify time displays in selected timezone
   - Check "Today's Activity" stats update

4. **Test Calendar**:
   - Click "History" tab
   - Click today's date on calendar
   - Click "Today" tab to see activities

5. **Test Analytics**:
   - Click "Analytics" tab
   - Verify weekly stats show
   - If you logged activities with GPS, verify map appears

6. **Test Date Picker**:
   - Click 📅 icon
   - Select yesterday's date
   - Verify "No activities" message
   - Click 📅 again and "Today" button

7. **Test Export**:
   - Click 💾 icon
   - Verify JSON file downloads

8. **Test GPS** (requires HTTPS or localhost):
   - Log activity with "Include GPS location" checked
   - Allow browser location access
   - Verify GPS coordinates appear in activity

## Step 7: Check Backend Logs

```bash
# In another terminal
tail -f backend/logs/combined.log

# Should see structured logs like:
# {"level":"info","message":"Incoming request","method":"GET","path":"/api/settings","requestId":"..."}
# {"level":"info","message":"Activity logged","type":"potty","subtype":"pee","requestId":"..."}
```

## Step 8: Test Error Handling

1. **Invalid Input**:
   - Try to log activity without selecting subtype for potty
   - Should see validation error

2. **Rate Limiting**:
   ```bash
   # In terminal, make 101 rapid requests
   for i in {1..101}; do curl http://localhost:3000/api/settings > /dev/null 2>&1; done
   # Last request should be rate limited
   ```

3. **Database Errors**:
   ```bash
   # Stop PostgreSQL
   brew services stop postgresql@15
   
   # Try to load app - should see graceful error message
   # Restart PostgreSQL
   brew services start postgresql@15
   ```

## Troubleshooting

### Backend won't start

**Error**: `Missing required environment variables`
```bash
# Check .env file exists
ls -la backend/.env

# Verify contents
cat backend/.env
```

**Error**: `ECONNREFUSED` (PostgreSQL)
```bash
# Check if PostgreSQL is running
brew services list | grep postgresql

# Start if stopped
brew services start postgresql@15

# Check if database exists
psql -l | grep josie_tracker

# Create if missing
createdb josie_tracker
```

**Error**: `Authentication failed for user`
```bash
# Check your PostgreSQL user
whoami

# Update .env with correct username
# Mac username is usually your PostgreSQL user (no password needed)
```

### Frontend won't start

**Error**: `Cannot find module`
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**Error**: Port 8000 in use
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use different port
cd frontend
npm run dev -- --port 8001
```

### Timezone Issues

**Activities showing wrong time**:
1. Clear browser cache
2. Click 🌍 icon and reselect your timezone
3. Check backend logs for timezone errors
4. Verify your system timezone: `date`

### GPS Not Working

GPS requires HTTPS or localhost. On `localhost:8000` it should work.

If not:
1. Check browser console for errors
2. Make sure location permissions are granted
3. Try different browser (Safari/Chrome)

## Pre-Deployment Checklist

Before pushing to GitHub and deploying to TrueNAS:

- [ ] All tests pass locally
- [ ] Activities log with correct timestamps
- [ ] All 5 activity types work
- [ ] Calendar displays correctly
- [ ] Map shows GPS coordinates (if tested)
- [ ] Export downloads JSON file
- [ ] Timezone changes update display
- [ ] Backend logs to files properly
- [ ] No console errors in browser
- [ ] Rate limiting works
- [ ] Health check returns database status: `curl http://localhost:3000/health`

## Testing on Different Network Devices

To test from iPhone on same WiFi:

1. Find your Mac's IP:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

2. Update frontend Vite config temporarily:
```bash
# Edit frontend/vite.config.js
# Add: host: '0.0.0.0'
```

3. Restart frontend:
```bash
cd frontend
npm run dev
```

4. Access from iPhone:
```
http://YOUR_MAC_IP:8000
```

5. Test touch interactions, GPS on actual device

## Clean Up After Testing

```bash
# Stop servers
./stop-dev.sh

# Or manually:
# Ctrl+C in both terminal windows

# Optional: Remove test data
psql josie_tracker -c "DELETE FROM activities WHERE notes LIKE '%test%';"

# Optional: Drop database to start fresh
dropdb josie_tracker
createdb josie_tracker
```

## Next Steps

Once local testing is successful:

1. Review `TRUENAS_DEPLOYMENT.md` for TrueNAS Scale setup
2. Commit changes to GitHub
3. Deploy to TrueNAS using custom app
4. Access via Tailscale from anywhere

---

**Remember**: All test data in development is safe. The production deployment will use separate database credentials.
