# 🚀 ZENSAR PROJECT SETUP

## Quick Start for New Laptop

### Prerequisites
```bash
✓ Node.js v18+
✓ PostgreSQL v12+
✓ Ollama (for AI)
✓ Git
```

### Setup Steps

1. **Clone Repository**
   ```bash
   git clone https://github.com/magudeshwaran-hmw/zenlap.git
   cd zenlap
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Create Database**
   ```bash
   createdb -U postgres skillmatrix
   ```

4. **Restore Database (if you have backup)**
   ```bash
   psql -U postgres skillmatrix < skillmatrix_backup.sql
   ```

5. **Start Services**
   ```bash
   # Terminal 1: Frontend
   npm run dev:ui

   # Terminal 2: Backend
   npm run server

   # Terminal 3: Ollama
   ollama serve
   ```

6. **Access Application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001/api/health
   - Login: admin / admin123

### Database Credentials
```
Host:     localhost
Port:     1234
Database: skillmatrix
User:     postgres
Password: Hmw@81323
```

### Backup Database
```bash
pg_dump -U postgres skillmatrix > skillmatrix_backup.sql
```

### Restore Database
```bash
psql -U postgres skillmatrix < skillmatrix_backup.sql
```

---

**Status:** ✅ Ready for Pen Drive Transfer
