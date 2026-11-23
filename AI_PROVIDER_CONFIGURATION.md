# AI PROVIDER AND CENTRAL BRAIN CONFIGURATION — VYAPAR VERSE

**Gateway:** OpenRouter API Gateway (`https://openrouter.ai/api/v1`)  
**Security Standard:** Zero-Leakage Credential Policy (Backend-Only Environment Variables)  
**Date:** November 23, 2026  

---

## 1. Environment Configuration

All AI API keys and model parameters are read strictly from backend environment configurations and never transmitted to the browser or logged to stdout.

### `.env` Specifications:
```env
# OpenRouter Multi-Model Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Model Allocation
VSS_PRIMARY_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
VSS_REASONING_MODEL=google/gemma-4-31b-it:free
VSS_FAST_MODEL=google/gemma-4-26b-a4b-it:free
VSS_MULTIMODAL_MODEL=nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free

# Resilience & Rate-Limit Thresholds
VSS_AI_TIMEOUT_SECONDS=15
VSS_AI_MAX_RETRIES=2
VSS_AI_FALLBACK_MODEL=openrouter/free
```

---

## 2. Directory Architecture: `pybackend/ai_engine/`

The AI Engine is structured as a decoupled, provider-independent subsystem:

```
pybackend/ai_engine/
├── __init__.py                 # Subsystem initializer & facade exports
├── orchestrator.py             # Central pipeline execution & multi-turn state
├── model_router.py             # Dynamic model selector based on classified intent
├── provider_registry.py        # Gateway client instances & connection pool
├── task_classifier.py          # Deterministic keyword & zero-shot intent classifier
├── prompt_manager.py           # Enterprise system prompts & data grounding templates
├── tool_registry.py            # Verified Python execution tools (KPI, EDA, ML, DB)
├── response_validator.py       # Output verification (hallucination detector)
├── fallback_manager.py         # Graceful cascade across fallback tiers
├── cost_tracker.py             # Free tier & token usage accounting
└── providers/
    ├── __init__.py
    └── openrouter_provider.py  # Asynchronous HTTP client for OpenRouter completions
```

---

## 3. Tool Calling & Computational Grounding

To guarantee that the AI **never invents numbers**, models are provided with deterministic tools backed by the Python analytics core:

| Tool Identifier | Underlying Python Engine | Description |
| :--- | :--- | :--- |
| `calculate_dataset_kpis` | `pybackend.engines.bi.kpi_calculator` | Calculates exact Revenue, AOV, Orders, and Profit Margin. |
| `run_statistical_summary`| `pybackend.engines.eda.statistics` | Computes mean, median, standard deviation, skewness, min, and max. |
| `detect_dataset_outliers` | `pybackend.engines.eda.outliers` | Computes 1.5× IQR fences and count of abnormal observations. |
| `execute_secure_python` | `pybackend.api.code_studio` | Executes restricted, sandboxed Python code on dataset dataframe. |
| `query_inventory_status` | `pybackend.api.inventory` | Retrieves current stock counts, valuation, and reorder alerts. |
| `query_finance_summary` | `pybackend.api.finance` | Retrieves income/expense ledgers and cash flow projections. |

---

## 4. Privacy & Disclosure Guardrails

1. **Explicit Disclosure:** The platform informs users that analytical summaries or conversational queries are processed via secure OpenRouter endpoints.
2. **Data Minimization:** Full raw datasets are **NEVER** transmitted in raw form to external LLMs. Only column schema metadata, anonymized statistical summaries, and query contexts are sent.
3. **Local-First Fallback:** Users without an active OpenRouter API key operate with 100% functionality via the local deterministic Python engines.
