# PROJECT AUDIT AND ROADMAP — VYAPAR VERSE (VSS AI)

**Product:** Vyapar Sarthi Sangi (VSS AI) — **Vyapar Verse**  
**Tagline:** *Your Business. One System. One Intelligent Sarthi.*  
**Architecture:** Hybrid Enterprise SaaS (FastAPI Python Analytics Engine + Node.js Mongoose Auth Service + Native ES6 Modular Frontend)  
**Date:** November 23, 2026  
**Status:** Under Active Upgrade & Expansion  

---

## 1. Executive Summary & Existing Project Audit

### 1.1 Current Architectural Landscape
Vyapar Sarthi Sangi (VSS AI) is an AI-powered Business Operating System created to unify data intelligence, analytics, forecasts, and enterprise management. The existing system consists of:

1. **Python FastAPI Intelligence Backend (`pybackend/`):**
   - **Port:** `8000` (dynamic fallback via `PORT` env var).
   - **Database Connection:** MongoDB Atlas Cloud (`test` database) using unified collections (`users`, `businesses`, `datasets`, `audit_logs`).
   - **Core Engines:**
     - `engines/ingestion`: Multi-encoding CSV reader (`utf-8`, `cp1252`, `latin1`) and Excel spreadsheet reader (`openpyxl`).
     - `engines/data_intelligence`: Schema profiling, missing values, duplicate detection, and 1.5× IQR outlier detection/cleaning (capping/dropping).
     - `engines/eda`: Correlation matrix, statistics summary, and time-series trends.
     - `engines/ml`: Automated task detection, feature engineering, and RandomForest/Ridge training for regression and classification.
     - `engines/bi`: Business field mapping and KPI calculator (Revenue, Orders, AOV, Gross Margin).
     - `engines/reports`: PDF generation via ReportLab and Excel export via OpenPyXL.
     - `engines/visualization`: Native SVG chart generation with Plotly.js dynamic loader.
   - **Static Frontend Mount:** Directly mounts `/frontend` at `/app/` with aggressive no-cache response headers to ensure real-time UI synchronization without stale client caching.

2. **Node.js Authentication Service (`backend/`):**
   - **Port:** `3000`.
   - **Database Connection:** MongoDB Atlas Cloud via Mongoose.
   - **Features:** User registration, password hashing (`bcrypt`), JWT issue/verification, token blacklist management, and session logout auditing.

3. **Frontend Client (`frontend/`):**
   - **Tech Stack:** Vanilla JavaScript ES Modules (`app.js`, `api.js`, `views/*.js`), zero-build, ultra-fast loading.
   - **Design System:** Corporate Navy (`#14233D`), Dark Navy (`#0C1729`), Saffron (`#E99A3A`), Warm Ivory (`#F7F6F2`), Slate (`#748197`), and Green (`#31856C`).
   - **Existing Modules:**
     - Overview Launchpad (`overview.js`)
     - Datasets Management (`datasets.js`)
     - Data Studio & Cleaning (`data_studio.js`)
     - Analytics Studio (`analytics_studio.js`)
     - Executive BI Dashboard (`bi_dashboard.js`)
     - ML & DL Studio (`ml_studio.js`)
     - AI Business Advisor / Analyst (`ai_analyst.js`)
     - Reports & Exports (`reports.js`)
     - Settings & Workspace Profile (`settings.js`)

4. **Security & Data Isolation:**
   - Dedicated encrypted workspace storage trees per user (`storage/users/<user_id>/...`).
   - Strict `.gitignore` preventing exposure of `.env`, spreadsheets (`*.csv`, `*.xlsx`), database files, and encrypted storage.

---

## 2. Identified Gaps & Upgrade Objectives

| Capability | Current State | Target Upgraded State |
| :--- | :--- | :--- |
| **Brand & Landing** | Minimal launchpad, boots directly to `#overview`. | Comprehensive Public Landing Page (`#landing`) with interactive hero ("VSS" $\to$ "VYAPAR VERSE" typing effect), Solutions, Features, About, Contact, Pricing, and CTA to Launchpad. |
| **Dashboard Navigation** | 9 navigation links. | Complete **14-module unified navigation structure** matching Master Prompt specifications with clear active states and "Coming Soon" badges for future modules. |
| **AI Architecture** | Heuristic rule-based prompt generator. | **Central Brain Multi-Model AI Engine (`pybackend/ai_engine/`)** powered by OpenRouter API with automated task routing across Nemotron 3 Ultra, Gemma 4 31B, Gemma 4 26B, and Nemotron 3 Nano Omni, with robust fallbacks and offline analytical calculation. |
| **AI Code Studio** | Not present as a standalone module. | **Interactive AI Code Studio (`#code-studio`)** generating real Python code, explaining data logic, executing in a sandboxed runner with timeout and output capturing, and history logging. |
| **Excel & Multi-Sheet** | Basic single sheet ingestion. | **Dedicated Excel Integration Studio (`#excel-studio`)** supporting multi-sheet parsing, sheet switching, formula understanding, and consolidated reporting. |
| **Inventory & Finance** | Not surfaced as standalone studios. | **Inventory Management Studio (`#inventory`)** and **Finance Management Studio (`#finance`)** with working real metrics, stock valuation, and revenue/expense ledgers. |
| **BI Natural Language** | Standard KPI rendering. | **Natural Language Dashboard Builder** where requests like *"Create a monthly sales dashboard"* translate into validated chart widgets. |

---

## 3. Comprehensive Implementation Roadmap

### Phase 1: Project Audit & Planning Documentation *(COMPLETED)*
- Audit current codebase and document active endpoints, database models, and static routes.
- Produce `PROJECT_AUDIT_AND_ROADMAP.md`, `VYAPAR_VERSE_PROGRESS.md`, `AI_MODEL_BENCHMARK.md`, and `AI_PROVIDER_CONFIGURATION.md`.

### Phase 2: Design System & Landing Page Upgrade
- Introduce modern Google Fonts: `Inter` and `Manrope`.
- Build the rich marketing landing page in `frontend/index.html` and `frontend/js/views/landing.js`:
  - Character-by-character animated typewriter ("VSS" $\to$ "VYAPAR VERSE").
  - Navigation: Home, Solutions, Features, About, Contact, Login, Sign Up.
  - Sections: Hero, Product Intro, BI Intro, Inventory, Finance, AI Assistant, Excel, and Footer.
- Ensure 100% responsiveness on mobile, tablet, and desktop with zero unwanted layout shift.

### Phase 3: Dashboard Navigation & Architecture Overhaul
- Expand sidebar to feature all **14 modules**:
  1. Overview (`#overview`)
  2. Business Intelligence (`#bi-dashboard`)
  3. My Datasets (`#datasets`)
  4. Data Cleaning Studio (`#data-studio`)
  5. BI Studio (`#bi-studio`)
  6. AI Code Studio (`#code-studio`)
  7. ML & DL Studio (`#ml-studio`)
  8. AI Insights (`#ai-analyst`)
  9. Inventory Management (`#inventory`)
  10. Finance Management (`#finance`)
  11. AI Business Assistant (`#ai-assistant`)
  12. Excel Integration (`#excel-studio`)
  13. Reports (`#reports`)
  14. Settings (`#settings`)
- Wire seamless routing and state management in `frontend/js/app.js`.

### Phase 4: Central Brain Multi-Model AI Engine (`pybackend/ai_engine/`)
- Implement provider-independent AI subsystem:
  - `orchestrator.py`: Multi-step reasoning and tool dispatch.
  - `model_router.py`: Intelligent classification and model routing.
  - `provider_registry.py`: OpenRouter client wrapper and health monitor.
  - `task_classifier.py`: Intent classifier (reasoning vs coding vs routine query).
  - `prompt_manager.py`: Enterprise business prompt engineering templates.
  - `tool_registry.py`: Authorized Python computation tool attachments.
  - `response_validator.py`: Output integrity verification (ensuring actual figures).
  - `fallback_manager.py`: Cascade across Nemotron $\to$ Gemma $\to$ Heuristic engine.
  - `cost_tracker.py`: Token usage and pricing transparency.
  - `providers/openrouter_provider.py`: Clean httpx-powered OpenRouter client.
- Mount API endpoint `/api/ai/chat` and `/api/ai/code`.

### Phase 5: AI Code Studio & Secure Execution Engine
- Implement `pybackend/api/code_studio.py` with AST-validated sandboxed execution.
- Build frontend `frontend/js/views/code_studio.js` with syntax highlighting, execution console, copy/download actions, and prompt templates.

### Phase 6: Inventory & Finance Working Modules
- Implement `pybackend/api/inventory.py` & `pybackend/api/finance.py`.
- Build UI in `frontend/js/views/inventory.js` & `frontend/js/views/finance.js`.
- Connect inventory valuation and financial summary to uploaded dataset records.

### Phase 7: Excel Multi-Sheet & BI Studio Upgrades
- Upgrade `pybackend/engines/ingestion/excel_reader.py` to extract all sheet names and return structured multi-sheet payloads.
- Build `frontend/js/views/excel_studio.js` and upgrade `frontend/js/views/bi_dashboard.js` with natural language prompt parser.

### Phase 8: Verification & Automated Benchmark Testing
- Execute comprehensive test suite for AI orchestrator, tool calls, and sandboxed code execution.
- Verify zero regressions on existing auth, MongoDB sync, and file upload flows.
- Verify NO git commits are made per user strict instruction.
