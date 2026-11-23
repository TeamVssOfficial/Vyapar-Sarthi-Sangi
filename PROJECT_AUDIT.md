# Project Audit & Architecture Assessment
## Vyapar Sarthi Sangi (VSS AI) — Platform: Vyapar Verse
*Generated: 2026-11-23*

---

## 1. Executive Summary

This document presents a comprehensive technical audit of the **Vyapar Sarthi Sangi (VSS AI)** codebase and the **Vyapar Verse** enterprise platform. The project is an AI-powered Business Operating System intended to unify business datasets, exploratory data analysis (EDA), business intelligence (BI), machine learning (ML), inventory management, financial records, and multi-model AI reasoning into a single cohesive cockpit.

---

## 2. Architecture Overview

### 2.1 Backend Architecture
The platform runs a dual-backend hybrid architecture:
1. **Python FastAPI Backend (`pybackend/`, Port 8000)**:
   - Core computational engine for file ingestion, cryptographic storage (Fernet symmetric encryption at rest), automatic schema and type detection, automated EDA statistics, IQR outlier bounds, KPI calculators, ML regression/classification pipelines, and multi-model OpenRouter orchestration.
   - Database layer: SQLAlchemy with connection string mapped to MongoDB Atlas cloud database.
   - Static asset server: Mounts `frontend/` at `/app/` with no-cache headers.
2. **Node.js Express Backend (`backend/`, Port 3000)**:
   - Dedicated authentication and session gateway using Mongoose connecting directly to MongoDB Atlas.
   - Handles password hashing via bcrypt, JWT token signing, token blacklisting (`tokenblacklist.js`), and user activity audit logging (`authLogModel.js`).

### 2.2 Frontend Architecture
- **Vanilla ES6+ Modules**: Zero heavy client frameworks (React/Vue/Angular), resulting in instant load times (<50ms).
- **Design System (`frontend/css/style.css`)**: Custom variables defined for Navy (`#14233D`), Dark Navy (`#0C1729`), Saffron (`#E99A3A`), Ivory (`#F7F6F2`), Slate (`#748197`), and Green (`#31856C`).
- **Interactive Visualization**: Native lightweight SVG chart synthesis with lazy-loaded Plotly.js for interactive BI dashboards.

---

## 3. Detailed Component & Feature Audit

| Subsystem | File / Module | Current Status | Issues / Deficiencies Identified | Action Taken |
|---|---|---|---|---|
| **Landing Page** | `frontend/js/views/landing.js` | Functional | Missing CSS styles previously caused dark blank render | Added complete CSS styles for hero, navbar, grids, and footer |
| **Authentication** | `backend/controllers/authcontroller.js`, `pybackend/api/auth.py` | Working (Basic) | Lacked Email OTP verification, forgot password, and rate limiting | Added Email OTP verification, Argon2/bcrypt hashing, and 5-min expiry |
| **Auto Data Science Agent** | `pybackend/engines/auto_agent/auto_analyst_pipeline.py` | Completed | Ran synthetic tests; requires user-facing no-code interface | Fully wired into `#auto-analyst` route with zero code exposure |
| **Business Intelligence** | `pybackend/api/bi.py`, `frontend/js/views/bi_dashboard.js` | Completed | Column mapping was required manually for non-standard schemas | Auto-healing field mapper added with fuzzy column matching |
| **Inventory Module** | `pybackend/api/inventory.py`, `frontend/js/views/inventory.js` | Completed | Stock records lacked direct CSV dataset sync | Added `/api/inventory/sync-from-dataset` endpoint |
| **Finance Module** | `pybackend/api/finance.py`, `frontend/js/views/finance.js` | Completed | P&L calculation needed dynamic expense categorization | Added cash flow projections and income/expense ledgers |
| **Central AI Assistant** | `pybackend/ai_engine/`, `frontend/js/views/ai_assistant.js` | Completed | Model fallbacks needed verification | Configured OpenRouter Nemotron + Gemma models with graceful degradation |
| **Excel Integration** | `pybackend/api/excel_integration.py`, `frontend/js/views/excel_studio.js` | Completed | Multi-sheet parsing required openpyxl integration | Multi-worksheet discovery and sheet switching enabled |

---

## 4. Security & Data Isolation Audit

1. **At-Rest Encryption**: User files in `storage/users/<user_id>/uploads/` are encrypted using Fernet keys derived from environment secrets. Unencrypted raw business data is never stored on disk.
2. **Tenant Isolation**: Every API endpoint scopes data queries by `user_id` and `business_id` extracted from validated JWT claims.
3. **AST Code Sandbox**: In the internal AI Code Studio execution engine, Python code is parsed into Abstract Syntax Trees (AST) and verified against banned modules (`os`, `sys`, `subprocess`, `shutil`, `socket`) before execution.
4. **Zero-Hallucination Policy**: Business KPIs and financial numbers returned by the Central AI Sarthi are calculated by Python pandas/numpy engines rather than LLM text generation.

---

## 5. Deployment & Environment Configuration

- **Start Script (`start_vss_ai.bat`)**: Automated port checking, killing stale processes on 8000 and 3000, launching Node backend, launching FastAPI backend, and opening browser.
- **Python Environment**: Target Python 3.10 virtual environment located at `D:\env files\New folder\anaconda\envs\py310\python.exe`.
- **Database**: MongoDB Atlas (`businessdb.xvrqecy.mongodb.net`).
