# ZenTalentHub / ZenRadar — Fresh Setup Guide

Complete step-by-step instructions to get this project running on a new laptop.

---

## Prerequisites

Install these before anything else:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 20+ | https://nodejs.org |
| PostgreSQL | 15+ | https://www.postgresql.org/download/ |
| Git | any | https://git-scm.com |
| Ollama (optional, for local AI) | latest | https://ollama.com |

---

## Step 1 — Clone the repo

```bash
git clone https://github.com/magudeshwaran-hmw/mass-skillmatrix.git
cd mass-skillmatrix
```

---

## Step 2 — Install dependencies

```bash
npm install
```

---

## Step 3 — Configure the database

### 3a. Create the PostgreSQL database

Open pgAdmin or psql and run:

```sql
CREATE DATABASE skillmatrix;
```

### 3b. Run the schema

In psql (or pgAdmin Query Tool), connect to `skillmatrix` and run the entire contents of:

```
COMPLETE_DATABASE_SETUP.sql
```

This creates all 13 tables with no sample data — clean slate.

### 3c. Update `.env` if needed

The `.env` file is already in the repo. Edit it if your PostgreSQL credentials differ:

```env
DB_HOST=localhost
DB_PORT=5432          # default PostgreSQL port — change if yours differs
DB_NAME=skillmatrix
DB_USER=postgres
DB_PASSWORD=your_password_here

PORT=3001

LLM_PROVIDER=ollama
LLM_MODEL=deepseek-v3.1:671b-cloud
CLOUD_API_KEY=
LOCAL_MODEL=deepseek-v3.1:671b-cloud
```

> **Note:** The default DB_PORT in `.env` is `1234` (custom install). Standard PostgreSQL uses `5432`. Change it to match your installation.

---

## Step 4 — Start the app

### Option A — Start everything at once

```bash
npm run dev
```

This starts:
- Frontend (Vite) on http://localhost:5173
- Backend API on http://localhost:3001
- Ollama AI server (if installed)

### Option B — Start separately

```bash
# Terminal 1 — Backend API
npm run server

# Terminal 2 — Frontend
npm run dev:ui
```

---

## Step 5 — First login

### Admin login
- Go to http://localhost:5173/admin
- Username: `admin`
- Password: `admin123`

### Employee login
- Go to http://localhost:5173/login
- Register a new employee account

---

## Step 6 — Optional: Local AI (Ollama)

If you want AI features to work locally:

```bash
# Install and start Ollama
ollama serve

# Pull a model (choose one)
ollama pull llama3
# or
ollama pull deepseek-v3.1:671b-cloud
```

Or use Google Gemini (free):
1. Get a free API key at https://aistudio.google.com/app/apikey
2. Set `CLOUD_API_KEY=your_key` in `.env`
3. Set `LLM_PROVIDER=gemini`

---

## Project Structure

```
mass-skillmatrix/
├── src/
│   ├── components/       # Shared UI components (AppHeader, etc.)
│   ├── pages/            # All page components
│   │   ├── AdminDashboard.tsx
│   │   ├── BFSIDashboard.tsx    ← ZenTalentHub (Supply/Demand)
│   │   ├── EmployeeDashboard.tsx ← ZenRadar
│   │   ├── SkillMatrixPage.tsx  ← ZenMatrix
│   │   └── ...
│   ├── lib/              # API, auth, contexts, utilities
│   └── App.tsx           # Routes
├── server-postgres.cjs   # Express backend (REST API + DB)
├── COMPLETE_DATABASE_SETUP.sql  # Full DB schema
├── .env                  # Environment config
└── package.json
```

---

## Key Routes

| URL | Page |
|-----|------|
| `/` | Landing page |
| `/login` | Employee login |
| `/admin` | Admin dashboard (ZenRadar) |
| `/admin/bfsi` | ZenTalentHub (Supply & Demand) |
| `/employee/dashboard` | Employee ZenRadar |
| `/employee/skills` | ZenMatrix (skill matrix) |
| `/employee/ai` | ZenAICoach |
| `/employee/resume-upload` | Resume upload & AI extraction |

---

## Troubleshooting

**"Cannot connect to database"**
- Check PostgreSQL is running
- Verify DB_PORT in `.env` matches your PostgreSQL port (usually 5432)
- Verify DB_PASSWORD is correct

**"Port 3001 already in use"**
- Change `PORT=3002` in `.env`

**Frontend shows blank / API errors**
- Make sure backend is running (`npm run server`)
- Check browser console for the API URL being called

**Ollama not working**
- Run `ollama serve` in a separate terminal
- Or set `CLOUD_API_KEY` in `.env` to use Gemini instead
