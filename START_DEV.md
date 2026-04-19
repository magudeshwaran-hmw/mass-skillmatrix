# 🚀 START DEVELOPMENT SERVER

## Quick Start (3 Terminals)

### Terminal 1: Frontend (Vite Dev Server)
```bash
npm run dev:ui
```
✅ Runs on: http://localhost:8080

### Terminal 2: Backend (Express Server)
```bash
npm run server
```
✅ Runs on: http://localhost:3001

### Terminal 3: Ollama AI (Optional)
```bash
npm run ollama:serve
```
✅ Runs on: http://localhost:11434

---

## Alternative: Run All Together
```bash
npm run dev
```
⚠️ Note: Requires `concurrently` to be installed (already done)

---

## Access Application

- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3001/api/health
- **Login:** admin / admin123

---

## Database Connection

Make sure PostgreSQL is running:
```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT 1;"

# If not running, start PostgreSQL service
# Windows: Services → PostgreSQL → Start
```

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 8080
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Kill process on port 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Dependencies Not Installed
```bash
npm install
```

### Database Connection Failed
```bash
# Verify credentials in .env
# Default: postgres / Hmw@81323

# Test connection
psql -U postgres skillmatrix -c "SELECT COUNT(*) FROM employees;"
```

---

**Status:** ✅ Ready to develop!
