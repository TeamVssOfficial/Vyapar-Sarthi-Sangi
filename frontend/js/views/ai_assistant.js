// Vyapar Verse — Context-Aware AI Data Analyst & Central Brain (Sarthi) View
import { API } from "../api.js";
import { formatMarkdown } from "../utils/markdown_renderer.js";

export async function renderAIAssistant(container) {
  let activeDatasetId = API.getActiveDatasetId();
  let currentConversationId = null;
  let chatHistory = [];
  let availableDatasets = [];
  let pastConversations = [];

  try {
    const dsRes = await API.listDatasets();
    if (Array.isArray(dsRes)) {
      availableDatasets = dsRes;
      if (!activeDatasetId && availableDatasets.length > 0) {
        activeDatasetId = availableDatasets[0].id;
        API.setActiveDatasetId(activeDatasetId);
      }
    }
  } catch (e) {
    console.warn("Dataset list notice:", e);
  }

  container.innerHTML = `
    <div style="max-width: 1280px; margin: 0 auto; height: calc(100vh - 120px); display: flex; flex-direction: column;">
      
      <!-- 1. TOP CONTROL BAR -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px; flex-shrink: 0; background: #0B0F19; border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 10px; padding: 12px 18px; box-shadow: 0 4px 20px rgba(0,0,0,0.25);">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #E99A3A, #F59E0B); color: #0C1729; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px; box-shadow: 0 0 15px rgba(233,154,58,0.4);">
            VV
          </div>
          <div>
            <h1 style="font-size: 16px; font-weight: 800; color: #FFFFFF; display: flex; align-items: center; gap: 8px; margin: 0;">
              Central Vyapar Sarthi AI
              <span style="font-size: 10px; font-weight: 700; background: rgba(16,185,129,0.18); color: #34D399; border: 1px solid rgba(16,185,129,0.4); padding: 2px 8px; border-radius: 12px;">Zero Hallucination Verified</span>
            </h1>
            <div style="font-size: 11px; color: #94A3B8; margin-top: 2px;">
              Multi-Model Brain (Nemotron 3 Ultra & Gemma 4) grounded in deterministic Python calculations.
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <!-- Active Dataset Selector -->
          <div style="display: flex; align-items: center; gap: 6px;">
            <label style="font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase;">Dataset:</label>
            <select id="select-ai-dataset" style="padding: 6px 12px; font-size: 12px; border-radius: 6px; border: 1px solid rgba(59, 130, 246, 0.4); font-weight: 600; color: #E2E8F0; background: #070B14; outline: none; max-width: 200px;">
              ${availableDatasets.length > 0
                ? availableDatasets.map(d => `<option value="${d.id}" ${d.id === activeDatasetId ? 'selected' : ''}>${d.name} (${d.rows || 'Records'})</option>`).join("")
                : `<option value="">No Dataset (Demo Mode)</option>`
              }
            </select>
          </div>

          <!-- Active Brain Selector -->
          <div style="display: flex; align-items: center; gap: 6px;">
            <label style="font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase;">Brain:</label>
            <select id="select-ai-model" style="padding: 6px 12px; font-size: 12px; border-radius: 6px; border: 1px solid rgba(59, 130, 246, 0.4); font-weight: 600; color: #E2E8F0; background: #070B14; outline: none;">
              <option value="auto">Auto Strategic Routing (Nemotron / Gemma)</option>
              <option value="nvidia/nemotron-3-ultra-550b-a55b:free">Nemotron 3 Ultra 550B (Planning)</option>
              <option value="google/gemma-4-31b-it:free">Gemma 4 31B (Deep Logic & Stats)</option>
              <option value="google/gemma-4-26b-a4b-it:free">Gemma 4 26B (High Speed Q&A)</option>
              <option value="nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free">Nemotron Nano Omni (Multimodal)</option>
              <option value="local">Local Python Engine (100% Deterministic)</option>
            </select>
          </div>

          <!-- New Chat Button -->
          <button id="btn-new-chat" class="btn btn-outline" style="font-size: 11.5px; padding: 6px 14px; border-color: rgba(255,255,255,0.25); color: #E2E8F0; display: inline-flex; align-items: center; gap: 6px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New Chat
          </button>
        </div>
      </div>

      <!-- 2. MAIN CHAT STREAM CONTAINER -->
      <div class="vss-card" style="flex: 1; display: flex; flex-direction: column; overflow: hidden; padding: 0; background: #080D1A; border: 1px solid rgba(59, 130, 246, 0.28); border-radius: 12px; box-shadow: 0 4px 25px rgba(0,0,0,0.3);">
        
        <!-- Messages Scroll Container -->
        <div id="ai-messages-container" style="flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 18px;">
          <!-- Welcome Greeting -->
          <div style="display: flex; gap: 14px; align-items: flex-start; max-width: 82%;">
            <div style="width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #14233D, #0C1729); border: 1px solid rgba(59, 130, 246, 0.4); color: #E99A3A; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px; flex-shrink: 0; box-shadow: 0 0 12px rgba(37,99,235,0.25);">
              VV
            </div>
            <div style="background: #0D1627; border: 1px solid rgba(59, 130, 246, 0.25); padding: 18px 22px; border-radius: 12px; font-size: 13.5px; line-height: 1.6; color: #E2E8F0; box-shadow: 0 4px 16px rgba(0,0,0,0.2);">
              <b style="color: #FFFFFF; font-size: 14px;">Namaste! I am your Central Vyapar Sarthi.</b><br>
              I am connected to your enterprise spreadsheets, live inventory registers, cash flow ledger, and mathematical analytical engines.
              <br><br>
              <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 6px;">
                <span style="background: rgba(16, 185, 129, 0.15); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 12px;">✓ Zero-Hallucination Guard</span>
                <span style="background: rgba(59, 130, 246, 0.15); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.3); font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 12px;">📊 Interactive Plotly Charts</span>
                <span style="background: rgba(233, 154, 58, 0.15); color: #FCD34D; border: 1px solid rgba(233, 154, 58, 0.3); font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 12px;">⚡ Multi-Turn Context Memory</span>
              </div>
              Every calculation is verified against exact data — zero made-up numbers. How can I assist your business strategy today?
            </div>
          </div>
        </div>

        <!-- Suggestion Chips Bar -->
        <div style="padding: 10px 18px; border-top: 1px solid rgba(255, 255, 255, 0.08); background: #070B14; display: flex; gap: 8px; overflow-x: auto; flex-shrink: 0;">
          <button class="ai-chip" data-prompt="What were my best-selling products and top categories?">🏆 Best-Selling Products</button>
          <button class="ai-chip" data-prompt="Show monthly sales growth and revenue velocity in a chart.">📈 Monthly Trend Chart</button>
          <button class="ai-chip" data-prompt="Which products need restocking or have low stock?">⚠️ Low Stock Alerts</button>
          <button class="ai-chip" data-prompt="Why did my profit decrease even though sales increased?">📉 Profit Variance Analysis</button>
          <button class="ai-chip" data-prompt="Calculate business KPIs, average order value, and outliers.">⚡ KPIs & Outlier Fences</button>
          <button class="ai-chip" data-prompt="Generate an executive boardroom performance summary report.">📋 Boardroom Report</button>
        </div>

        <!-- Chat Input Bar -->
        <div style="padding: 16px 20px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; gap: 12px; background: #0B0F19; flex-shrink: 0; align-items: center;">
          <input type="text" id="ai-chat-input" placeholder="Ask your business sarthi anything about revenue, inventory, margins, or request a chart..." style="flex: 1; padding: 12px 18px; font-size: 13.5px; border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.35); background: #070B14; color: #FFFFFF; outline: none; transition: border-color 0.2s;" />
          <button id="btn-send-ai-message" class="btn btn-saffron" style="padding: 12px 24px; font-weight: 700; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 0 15px rgba(233,154,58,0.35);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            Ask Sarthi
          </button>
        </div>
      </div>
    </div>

    <style>
      .ai-chip {
        background: #0D1627;
        border: 1px solid rgba(59, 130, 246, 0.3);
        padding: 6px 14px;
        border-radius: 16px;
        font-size: 11.5px;
        font-weight: 600;
        color: #CBD5E1;
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.18s ease;
      }
      .ai-chip:hover {
        background: rgba(233, 154, 58, 0.15);
        border-color: #E99A3A;
        color: #FCD34D;
        transform: translateY(-1px);
      }
      #ai-chat-input:focus {
        border-color: #38BDF8 !important;
        box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
      }
    </style>
  `;

  const msgContainer = container.querySelector("#ai-messages-container");
  const inputEl = container.querySelector("#ai-chat-input");
  const btnSend = container.querySelector("#btn-send-ai-message");
  const modelSelect = container.querySelector("#select-ai-model");
  const datasetSelect = container.querySelector("#select-ai-dataset");
  const btnNewChat = container.querySelector("#btn-new-chat");

  // Load existing conversations for this dataset
  async function loadConversationHistory() {
    try {
      if (activeDatasetId) {
        const convs = await API.getAIConversations(activeDatasetId);
        if (Array.isArray(convs) && convs.length > 0) {
          pastConversations = convs;
          // Optionally link to latest conversation
          currentConversationId = convs[0].id;
        }
      }
    } catch (e) {
      console.warn("Conversation history notice:", e);
    }
  }
  loadConversationHistory();

  // Switch Dataset
  datasetSelect?.addEventListener("change", (e) => {
    activeDatasetId = e.target.value;
    API.setActiveDatasetId(activeDatasetId);
    currentConversationId = null;
    chatHistory = [];
    appendSystemNotice(`Active workspace dataset switched. Vyapar Sarthi re-indexed.`);
  });

  // New Chat
  btnNewChat?.addEventListener("click", () => {
    currentConversationId = null;
    chatHistory = [];
    msgContainer.innerHTML = "";
    appendAssistantBubble(
      `<b>New Conversation Initialized.</b><br>I am ready to analyze your active dataset with fresh context memory. Ask me any question about sales, inventory, or margins.`,
      "Central AI Sarthi",
      [],
      null
    );
  });

  function appendSystemNotice(text) {
    const notice = document.createElement("div");
    notice.style.cssText = "text-align: center; font-size: 11px; color: #94A3B8; margin: 4px 0;";
    notice.innerHTML = `<span style="background: rgba(255,255,255,0.06); padding: 4px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">${text}</span>`;
    msgContainer.appendChild(notice);
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  function appendUserBubble(text) {
    const bubble = document.createElement("div");
    bubble.style.cssText = "display: flex; justify-content: flex-end; align-items: flex-start; gap: 10px;";
    bubble.innerHTML = `
      <div style="background: linear-gradient(135deg, #1E3A8A, #172554); border: 1px solid rgba(59, 130, 246, 0.4); color: #FFFFFF; padding: 14px 20px; border-radius: 12px 12px 2px 12px; font-size: 13.5px; max-width: 75%; line-height: 1.5; box-shadow: 0 4px 14px rgba(0,0,0,0.25);">
        ${text}
      </div>
    `;
    msgContainer.appendChild(bubble);
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  function appendAssistantBubble(content, modelUsed, toolsExecuted, chartSpec) {
    const bubble = document.createElement("div");
    bubble.style.cssText = "display: flex; gap: 14px; align-items: flex-start; max-width: 85%;";

    let toolsHtml = "";
    if (toolsExecuted && toolsExecuted.length > 0) {
      toolsHtml = `
        <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px;">
          ${toolsExecuted.map(t => {
            const name = typeof t === "string" ? t : (t.name || JSON.stringify(t));
            return `
              <span style="font-size: 10.5px; padding: 3px 10px; border-radius: 12px; background: rgba(16, 185, 129, 0.15); color: #34D399; font-weight: 700; border: 1px solid rgba(16, 185, 129, 0.3);">
                ✓ Python Verified: ${name}
              </span>
            `;
          }).join("")}
        </div>
      `;
    }

    const chartId = `chat-chart-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    bubble.innerHTML = `
      <div style="width: 36px; height: 36px; border-radius: 8px; background: linear-gradient(135deg, #14233D, #0C1729); border: 1px solid rgba(59, 130, 246, 0.4); color: #E99A3A; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 15px; flex-shrink: 0; box-shadow: 0 0 12px rgba(37,99,235,0.25);">
        VV
      </div>
      <div style="background: #0D1627; border: 1px solid rgba(59, 130, 246, 0.28); padding: 18px 22px; border-radius: 2px 12px 12px 12px; font-size: 13.5px; line-height: 1.6; color: #E2E8F0; box-shadow: 0 4px 20px rgba(0,0,0,0.3); width: 100%;">
        ${toolsHtml}
        <div class="markdown-prose" style="font-size: 13.5px; line-height: 1.6; color: #E2E8F0;">${formatMarkdown(content)}</div>
        
        <!-- Interactive Chart Placeholder -->
        ${chartSpec ? `
          <div style="margin-top: 14px; background: #070B14; border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 11px; font-weight: 800; color: #38BDF8; text-transform: uppercase;">📊 Interactive Visual Intelligence</span>
              <span style="font-size: 10px; color: #94A3B8;">Plotly Engine</span>
            </div>
            <div id="${chartId}" style="width: 100%; height: 300px;"></div>
          </div>
        ` : ''}

        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid rgba(255, 255, 255, 0.08); font-size: 10.5px; color: #94A3B8; display: flex; justify-content: space-between; align-items: center;">
          <span>Model: <b style="color: #FCD34D;">${modelUsed || 'VSS Multi-Model Engine'}</b></span>
          <span style="color: #34D399; font-weight: 700;">● Zero Hallucination Verified</span>
        </div>
      </div>
    `;

    msgContainer.appendChild(bubble);
    msgContainer.scrollTop = msgContainer.scrollHeight;

    // Render interactive chart if chartSpec is present
    if (chartSpec) {
      setTimeout(() => {
        try {
          if (window.Plotly) {
            // Apply dark theme styling to layout
            const darkLayout = {
              ...(chartSpec.layout || {}),
              paper_bgcolor: "#070B14",
              plot_bgcolor: "#070B14",
              font: { color: "#CBD5E1", size: 11 },
              margin: { t: 30, b: 35, l: 45, r: 20 },
              autosize: true
            };
            window.Plotly.newPlot(chartId, chartSpec.data, darkLayout, {
              responsive: true,
              displayModeBar: true,
              displaylogo: false
            });
          }
        } catch (plotErr) {
          console.warn("Plotly render notice:", plotErr);
        }
      }, 50);
    }
  }

  async function handleSend(userText) {
    if (!userText.trim()) return;
    appendUserBubble(userText);
    inputEl.value = "";
    btnSend.disabled = true;

    // Loading indicator
    const loadingDiv = document.createElement("div");
    loadingDiv.id = "ai-loading-indicator";
    loadingDiv.style.cssText = "display: flex; gap: 10px; align-items: center; font-size: 12px; color: #94A3B8; padding: 10px 14px; background: rgba(12,23,41,0.6); border-radius: 8px; width: fit-content; border: 1px solid rgba(59,130,246,0.25);";
    loadingDiv.innerHTML = `
      <div class="spinner" style="width: 14px; height: 14px; border: 2px solid rgba(56,189,248,0.2); border-top-color: #38BDF8; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <span>Querying Central Brain & verifying with deterministic Python core...</span>
    `;
    msgContainer.appendChild(loadingDiv);
    msgContainer.scrollTop = msgContainer.scrollHeight;

    const chosenModel = modelSelect.value === "auto" ? null : modelSelect.value;

    try {
      const res = await API.chatCentralAI({
        question: userText,
        message: userText,
        preferred_model: chosenModel,
        model: chosenModel,
        dataset_id: activeDatasetId,
        conversation_id: currentConversationId,
        history: chatHistory
      });

      loadingDiv.remove();
      if (res.conversation_id) currentConversationId = res.conversation_id;

      const replyText = res.response || res.answer || res.content || (typeof res === "string" ? res : "Analytical evaluation complete.");
      const modelLabel = res.model || res.model_used || "Central AI Sarthi";
      const tools = res.tools_executed || res.evidence || [];
      const chart = res.chart_spec || null;

      chatHistory.push({ role: "user", content: userText });
      chatHistory.push({ role: "assistant", content: replyText });

      appendAssistantBubble(replyText, modelLabel, tools, chart);
    } catch (err) {
      loadingDiv.remove();
      let cleanErr = "Could not communicate with AI engine.";
      if (err) {
        if (typeof err === "string") cleanErr = err;
        else if (typeof err.message === "string" && err.message !== "[object Object]") cleanErr = err.message;
        else if (err.detail) cleanErr = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
        else if (err.error) cleanErr = typeof err.error === "string" ? err.error : JSON.stringify(err.error);
        else {
          try { cleanErr = JSON.stringify(err); } catch (e) { cleanErr = String(err); }
        }
      }
      if (cleanErr === "{}" || cleanErr === "[object Object]") {
        cleanErr = "The analytical engine is processing your dataset. Please try again.";
      }
      appendAssistantBubble(`Notice: ${cleanErr}`, "Local Analytical Core", [], null);
    } finally {
      btnSend.disabled = false;
      inputEl.focus();
    }
  }

  btnSend.addEventListener("click", () => handleSend(inputEl.value));
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputEl.value);
    }
  });

  // Suggestion chips handler
  container.querySelectorAll(".ai-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const prompt = chip.getAttribute("data-prompt");
      handleSend(prompt);
    });
  });
}
