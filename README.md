# Vyapar Sarthi Sangi (VSS AI)
> **Your Business. One System. One Intelligent Sarthi.**

VSS AI is an enterprise-grade AI-powered Business Operating System delivered as a unified web application. It automates business data intelligence, exploratory data analysis (EDA), commercial forecasting, machine learning pipelines, and conversational advisory backed by grounded mathematical proof.

---

## 1. System Architecture

```
vayapar_sangisarathi/
├── frontend/                        # Modern SaaS single-page application (SPA)
│   ├── index.html                   # Master layout with sidebar & workspace bar
│   ├── css/style.css                # Brand theme (Navy, Saffron, Ivory, Slate, Green)
│   └── js/
│       ├── api.js                   # Unified REST API client with JWT interception
│       ├── app.js                   # Client-side router across 9 business modules
│       └── views/                   # Overview, Datasets, Data Studio, EDA, BI, ML, AI, Reports, Settings
├── pybackend/                       # FastAPI High-Performance Analytics Core (Port 8000)
│   ├── main.py                      # Application entrypoint & static mount
│   ├── config.py                    # Environment settings & storage path configuration
│   ├── database/                    # Relational schema (SQLAlchemy + SQLite / PostgreSQL)
│   │   ├── connection.py            # Engine, session factory & DB init
│   │   └── models.py                # User, Business, Dataset, Model, Prediction, Report, AI Chat
│   ├── auth/                        # Security layer
│   │   ├── security.py              # Bcrypt password hashing & JWT token handling
│   │   └── dependencies.py          # FastAPI dependencies (user & workspace scoping)
│   ├── api/                         # REST API Endpoints
│   │   ├── auth.py                  # /api/auth (register, login, me, logout)
│   │   ├── business.py              # /api/businesses (workspace switching & creation)
│   │   ├── upload.py                # /api/upload (validated multipart CSV/XLSX upload)
│   │   ├── datasets.py              # /api/datasets (management, preview, download, delete)
│   │   ├── data_quality.py          # /api/data-quality (profiling & safe cleaning)
│   │   ├── analysis.py              # /api/analysis (descriptive statistics, EDA, correlations, outliers)
│   │   ├── bi.py                    # /api/bi (business KPIs, mapping & breakdowns)
│   │   ├── charts.py                # /api/charts (Plotly JSON specifications & presets)
│   │   ├── ml.py                    # /api/ml (task detection, training, forecast, clustering)
│   │   ├── ai_chat.py               # /api/ai (conversational Q&A grounded in analytical tools)
│   │   └── reports.py               # /api/reports (ReportLab PDF & Openpyxl Excel exports)
│   ├── engines/                     # Pure Python Numerical & Machine Learning Engines
│   │   ├── ingestion/               # Multi-encoding CSV & Excel readers
│   │   ├── data_intelligence/       # Semantic type detection, profiling, validation & cleaning
│   │   ├── eda/                     # Statistical moments, Pearson correlations, IQR fences, trends
│   │   ├── bi/                      # KPI calculators, dimension breakdowns & semantic mapping
│   │   ├── visualization/           # Plotly interactive chart generators
│   │   ├── ml/                      # Task detector, Scikit-learn Random Forest, Chronological forecast
│   │   ├── ai_analyst/              # Intent routing, analytical tool execution & grounded narrative
│   │   └── reports/                 # Executive PDF generator & multi-tab Excel builder
│   └── tests/                       # Automated testing & verification suites
│       └── verify_engines.py        # Comprehensive verification across all 9 modules
├── backend/                         # Node.js + Express backend (legacy auth service preserved)
└── storage/                         # Secure workspace file storage (uploads, processed, models, reports)
```

---

## 2. Core V1 Product Modules

1. **Overview:** Executive health indicators, active dataset telemetry, and quick studio actions.
2. **My Datasets:** Resilient CSV and Excel ingestion (up to 100MB), metadata persistence, preview, and safe deletion.
3. **Data Studio:** 50-row paginated dataset preview, semantic column classification, data health gauge (0–100), and non-destructive cleaning (whitespace trim, duplicate removal, median/mode imputation).
4. **Analytics Studio (EDA):** Descriptive statistics (mean, median, mode, std, skewness, kurtosis), probability distributions, Pearson correlations, IQR outlier detection, and longitudinal time-series resamplers.
5. **BI Dashboard:** Commercial headline metrics (Revenue, Transactions, AOV, Units, Profit Margin), product rankings, customer tiers, and interactive Plotly visualizations.
6. **Machine Learning Studio:** Automated task suggestions, Scikit-learn Random Forest predictors, chronological time-series forecasting with 90% confidence bands, and K-Means segmentation.
7. **AI Business Analyst:** Grounded Q&A interface executing real deterministic analytical functions with strategic recommendations and zero numerical hallucination.
8. **Reports & Exports:** One-click ReportLab Executive PDF brief and comprehensive multi-sheet Excel workbooks.
9. **Settings & Workspace:** Multi-tenant workspace switcher, corporate profile management, and platform health telemetry.

---

## 3. Getting Started

### Prerequisites
- Python 3.10+ (using the configured `py310` environment)
- Standard packages installed: `fastapi`, `uvicorn`, `pydantic`, `pandas`, `scikit-learn`, `plotly`, `reportlab`, `openpyxl`, `bcrypt`, `pyjwt`.

### Running the Application

To launch both the backend API and the web frontend simultaneously:

```bash
cd pybackend
"D:\env files\New folder\anaconda\envs\py310\python.exe" main.py
```

Or using standard uvicorn:

```bash
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

Once running:
- **Web Application:** Open `http://localhost:8000/app/` in your browser.
- **Interactive API Documentation:** Open `http://localhost:8000/docs` (Swagger UI).
- **Alternative Open:** Visiting `http://localhost:8000/` automatically redirects your browser to the SaaS dashboard.

---

## 4. Running the Automated Test Suite

To verify all 9 core architectural modules and their integrations:

```bash
cd pybackend
"D:\env files\New folder\anaconda\envs\py310\python.exe" tests/verify_engines.py
```

This verifies:
- Database creation & relational constraints
- Bcrypt password hashing & JWT encoding/decoding
- Dataset ingestion & schema validation
- Profiling & quality score computation
- Safe non-destructive data cleaning
- Statistical moments, Pearson correlations & IQR outliers
- Commercial KPI computations & dimension breakdowns
- Plotly chart JSON generation
- Scikit-learn regression modeling & 3-month forward forecasting
- AI Analyst intent routing & grounded evidence synthesis
- PDF & Excel report file generation

---

## 5. Brand Identity & Design System

- **Navy:** `#14233D`
- **Dark Navy:** `#0C1729`
- **Saffron:** `#E99A3A`
- **Warm Ivory:** `#F7F6F2`
- **Slate:** `#748197`
- **Green:** `#31856C`
- **Typography:** Inter / Manrope
