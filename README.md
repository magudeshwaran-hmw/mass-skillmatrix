# 🌟 Skill Navigator

Skill Navigator is a comprehensive workforce optimization platform designed to provide deep visibility into team and individual quality engineering (QE) capabilities. It bridges the gap between raw data and strategic workforce planning through a multi-tiered architecture that integrates a React-based frontend, an Excel-driven backend for accessibility, and AI intelligence for career development.

## ✨ Project Vision & Core Features

- **Centralized Skill Intelligence:** A 32-skill unified taxonomy spanning 7 categories (Tool, Technology, Application, Domain, TestingType, DevOps, AI).
- **Dual-View Dashboard:** Tailored experiences for both employees (self-growth) and admins (workforce planning).
- **AI-Driven Personalization:** Automated career coaching, personalized learning roadmaps, and real-time market value analysis.
- **Enterprise Ready:** Secure role-based access control, persistent data storage via Excel backend (Power Automate), and high-fidelity reporting.

## 🛠️ Technical Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Tailwind CSS + Framer Motion + Lucide Icons
- **Analytics:** Chart.js + React-chartjs-2
- **Backend:** Node.js (Express) serving as a proxy/sync layer
- **Cloud Database:** Microsoft Excel via Power Automate Webhooks

## 💾 Infrastructure & Architecture

- **Frontend (src):** High-performance UI with a "Local-First" state management approach using `localStorage` for zero-latency interactions.
- **Backend (server.cjs):** A lightweight sync layer that connects the frontend to Microsoft Excel.
- **Cloud Sync:** Uses two specific Power Automate flows:
  - **Push Flow:** Triggered when users save/submit skills.
  - **Get Flow:** Triggered on login or admin dashboard refresh to pull latest profile data from Excel.

---

## 🚀 How to Run the Project

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)

### 2. Setup (First time)
```bash
# Install dependencies
npm install
```

### 3. Running the Project
The project requires both the **Vite frontend** and the **Node server** to be running simultaneously.

```bash
# Run both frontend and back-end together
npm run dev:full
```

- **Frontend:** [http://localhost:8080/login](http://localhost:8080/login)
- **Backend API:** [http://localhost:3001](http://localhost:3001)

---

## 🛡️ Admin Access
Access the administrative portal at: [http://localhost:8080/admin](http://localhost:8080/admin)
- **Username:** `admin`
- **Password:** `admin`

---

## 📂 Core Folder Structure

```
├── src/                # Frontend source files
│   ├── components/     # UI components (shadcn/ui)
│   ├── lib/            # Shared logic (API, DB helpers, AI engine)
│   ├── pages/          # Main application views (Matrix, Admin, AI)
│   └── main.tsx        # App entry point
├── server.cjs          # Node.js backend (Power Automate Sync)
├── package.json        # Dependencies & scripts
└── README.md           # Project documentation
```

## 📄 Pages & Capabilities

1. **🔐 Login / Auth:** Role-based access for Employees and Admins.
2. **📋 Skill Matrix:** 32-skill rating system with high-fidelity visual feedback.
3. **🧠 AI Intelligence:** Personalized coaching, demand analysis, and training roadmaps.
4. **🏢 Skill Report:** Professional portfolio and individual readiness score.
5. **📊 Admin Dashboard:** Team heatmap, leaderboard, and critical gap alerts.

---

**Last Updated:** March 2026  
**Project Lead:** Zensar Quality Engineering Team
