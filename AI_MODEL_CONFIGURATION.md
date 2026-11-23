# AI Model Configuration & OpenRouter Architecture
## Vyapar Sarthi Sangi (VSS AI) — Engine: Vyapar Verse
*Version: 2.0.0*

---

## 1. Gateway Overview

Vyapar Verse utilizes a unified OpenRouter gateway to orchestrate multiple state-of-the-art AI models through a single API interface. This decoupled architecture ensures high availability, cost efficiency, and automated fallback when specific model providers experience latency or quota saturation.

- **Gateway URL**: `https://openrouter.ai/api/v1`
- **Authentication**: Bearer Token via `OPENROUTER_API_KEY`
- **Orchestration Module**: `pybackend/ai_engine/orchestrator.py`

---

## 2. Model Fleet & Routing Policy

| Role in Vyapar Verse | Target Model ID | Provider | Primary Responsibility | Fallback Model |
|---|---|---|---|---|
| **Primary Orchestrator** | `nvidia/nemotron-3-ultra-550b-a55b:free` | NVIDIA | Multi-step agent planning, complex business queries, tool calling | `google/gemma-4-31b-it:free` |
| **Logic & Code Engine** | `google/gemma-4-31b-it:free` | Google | Statistical explanations, mathematical reasoning, data transformations | `nvidia/nemotron-3-ultra-550b-a55b:free` |
| **Fast Analysis** | `google/gemma-4-26b-a4b-it:free` | Google | Sub-second dataset summaries, quick KPI Q&A, chat assistance | `google/gemma-4-31b-it:free` |
| **Multimodal Vision** | `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | NVIDIA | Receipt inspection, visual invoice parsing, business document OCR | `google/gemma-4-31b-it:free` |

---

## 3. Zero-Hallucination Deterministic Enforcement

1. **Calculations Executed in Python**: LLMs are never allowed to fabricate numerical sums, averages, or variances. All statistical queries trigger Python pandas/numpy execution via `pybackend/ai_engine/tool_registry.py`.
2. **Result Validation**: LLM outputs containing business metrics are cross-checked against actual computed values by `pybackend/ai_engine/response_validator.py`.
3. **Graceful Fallback**: If OpenRouter API connectivity fails or exceeds rate limits, the system seamlessly transitions to deterministic in-memory analytical summaries without breaking the user experience.

---

## 4. Usage & Cost Monitoring

- All AI inference calls log input/output token counts and elapsed latency via `pybackend/ai_engine/cost_tracker.py`.
- Free-tier model endpoints are prioritized during standard usage to maintain zero operating costs for SMB users.
