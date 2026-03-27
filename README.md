# 🌐 Skill Navigator: Elite Workforce Optimization

**Skill Navigator** is a high-performance workforce optimization platform that bridges the gap between raw data and strategic workforce planning. It features a sophisticated React frontend, a resilient Excel-driven backend (Power Automate), and **AI-Powered Career Intelligence** via Ollama.

---

## 🚀 Laptop Transfer Guide (Quick Setup)

Follow these steps to get everything working perfectly on your new machine.

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **Ollama** (For AI Intelligence) - [Download here](https://ollama.com/download)

### 2. Initial Setup
Clone the project or copy the folder into your local environment:

```bash
# Install all dependencies
npm install
```

### 3. AI Intelligence Setup (Ollama)
The application uses local AI for data parsing and career insights.

1.  **Open a Terminal/PowerShell** and pull a compatible model:
    ```bash
    ollama pull llama3 
    # OR if you have a powerful GPU:
    ollama pull mistral
    ```
2.  **Enable CORS for Browser Access:**
    On Windows, you must set an environment variable before starting the service:
    ```powershell
    $env:OLLAMA_ORIGINS="*"
    ollama serve
    ```
    *(Alternatively, the app will try to proxy via the Node.js server automatically!)*

### 4. Running the Complete Project
You can run the frontend, backend, and sync layer with a single command:

```bash
# Launch Dev Server & Backend Proxy together
npm run dev:full
```

- **Frontend:** [http://localhost:8080](http://localhost:8080)
- **Admin Portal:** [http://localhost:8080/admin](http://localhost:8080/admin) (User: `admin` | Pass: `admin`)
- **Backend API:** [http://localhost:3001](http://localhost:3001)

---

## 🏗️ Project Architecture

| Component | Responsibility | Technology |
| :--- | :--- | :--- |
| **Frontend** | Interactive Matrix & Dashboards | React, Vite, TS, Tailwind, Lucide |
| **Logic Layer** | State, AI Hooks, & Theme Libs | `src/lib/` (llm.ts, authContext.ts) |
| **Sync Layer** | Node.js Backend Proxy | `server.cjs` (Express) |
| **Database** | Persistent Enterprise Storage | Microsoft Excel (Synced via Power Automate) |
| **AI Intelligence**| Insights, Roadmaps & Parsing | Ollama (Local LLM) |

## 🧠 Key Capability Maps

1.  **Centered Tree Journey:** A high-end visual process flow showing the AI-driven assessment logic.
2.  **32-Skill Unified Taxonomy:** Deep-dive into 7 categories from Tools to Domain.
3.  **Heatmap Analytics:** Visual insight into team gaps and collective proficiency.
4.  **Career Roadmap:** AI-generated training plans based on real skill gaps.

---

## 📦 Troubleshooting & Tips

- **AI says "Offline":** Ensure Ollama is running (`ollama serve`). If you change model names, update `src/lib/llm.ts` (line 36).
- **Employee Not Found:** If a new user doesn't show up in the Admin portal immediately, wait 30s for the Power Automate sync or refresh the page.
- **Port Conflicts:** Ensure ports 8080 and 3001 are free. If port 8080 is taken, the app will run on 8081 (the UI will notify you).

---

**Last Updated:** March 2026 | **Engineering Lead:** Zensar QE Team
