import { API } from "../api.js";
import { formatMarkdown } from "../utils/markdown_renderer.js";

export async function renderAIAnalyst(container) {
  const activeDatasetId = API.getActiveDatasetId();

  if (!activeDatasetId) {
    container.innerHTML = `
      <div class="vss-card p-12 text-center max-w-lg mx-auto mt-8" style="padding: 40px 30px; text-align: center; max-width: 540px; margin: 40px auto;">
        <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(233,154,58,0.15); color: #E99A3A; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">🤖</div>
        <h3 style="font-size: 18px; font-weight: 800; color: #14233D; margin-bottom: 8px;">No Active Dataset Selected</h3>
        <p style="font-size: 13px; color: #64748B; margin-bottom: 24px; line-height: 1.6;">Select a dataset from the Datasets Hub to interact with the Sarthi AI Business Analyst, or return to the Business OS Launchpad.</p>
        <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
          <button onclick="window.navigateTo('#overview')" class="btn" style="background: rgba(20, 35, 61, 0.08); color: #14233D; border: 1px solid #CBD5E1; font-weight: 700; padding: 10px 20px; font-size: 13px;">
            &larr; Back to Business OS
          </button>
          <button onclick="window.navigateTo('#datasets')" class="btn btn-primary" style="padding: 10px 20px; font-size: 13px; font-weight: 700;">
            Go to Datasets Hub &rarr;
          </button>
        </div>
      </div>
    `;
    return;
  }

  let activeConversationId = null;

  container.innerHTML = `
    <div class="h-[calc(100vh-140px)] flex flex-col space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between pb-2 border-b">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(236,72,153,0.18); color: #EC4899; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(236,72,153,0.15);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EC4899" stroke-width="2.2"><rect x="3" y="11" width="18" height="10" rx="3"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><circle cx="8" cy="16" r="1.8" fill="#EC4899"></circle><circle cx="16" cy="16" r="1.8" fill="#EC4899"></circle><line x1="10" y1="18" x2="14" y2="18"></line></svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-[#14233D] brand-font" style="margin: 0;">Vyapar AI Advisor</h1>
            <p class="text-xs text-slate-500" style="margin-top: 2px;">Ask any question about your sales, margins, or products in English or Hindi. Answers are calculated directly from your uploaded data.</p>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button onclick="window.navigateTo('#overview')" class="btn btn-outline" style="font-size: 12px; padding: 6px 14px; display: inline-flex; align-items: center; gap: 6px;">
            <span>&larr;</span> Dashboard Home
          </button>
          <button id="btn-new-chat" class="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 transition">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i> New Conversation
          </button>
        </div>
      </div>

      <!-- Quick Question Chips -->
      <div class="flex flex-wrap gap-2 pt-1">
        <span class="text-xs text-slate-400 self-center font-medium mr-1">Suggested inquiries:</span>
        <button class="chip-btn text-xs bg-white border border-slate-200 hover:border-[#E99A3A] px-3 py-1.5 rounded-full text-slate-700 transition">
          Which product is performing best?
        </button>
        <button class="chip-btn text-xs bg-white border border-slate-200 hover:border-[#E99A3A] px-3 py-1.5 rounded-full text-slate-700 transition">
          What is our total revenue and AOV?
        </button>
        <button class="chip-btn text-xs bg-white border border-slate-200 hover:border-[#E99A3A] px-3 py-1.5 rounded-full text-slate-700 transition">
          What historical trends can you identify?
        </button>
        <button class="chip-btn text-xs bg-white border border-slate-200 hover:border-[#E99A3A] px-3 py-1.5 rounded-full text-slate-700 transition">
          What could next month's projection be?
        </button>
        <button class="chip-btn text-xs bg-white border border-slate-200 hover:border-[#E99A3A] px-3 py-1.5 rounded-full text-slate-700 transition">
          What unusual patterns or outliers exist?
        </button>
      </div>

      <!-- Messages Stream -->
      <div id="chat-messages-box" class="flex-1 overflow-y-auto space-y-4 p-4 vss-card bg-slate-50/50">
        <!-- Welcome Message -->
        <div class="flex gap-3 max-w-3xl">
          <div class="w-8 h-8 rounded-full bg-[#14233D] text-[#E99A3A] flex items-center justify-center flex-shrink-0 text-xs font-bold">
            <i data-lucide="sparkles" class="w-4 h-4"></i>
          </div>
          <div class="vss-card p-4 text-xs leading-relaxed space-y-2 text-slate-700 shadow-sm bg-white">
            <div class="font-bold text-[#14233D]">Vyapar Sarthi Intelligence Layer</div>
            <p>
              I am your commercial intelligence partner. I analyze your dataset using real mathematical statistics, linear and non-linear regressions, outlier detections, and dimensional aggregations.
            </p>
            <p>
              Ask me about your sales, top products, customer tiers, revenue anomalies, or future projections.
            </p>
          </div>
        </div>
      </div>

      <!-- Chat Input Box -->
      <div class="vss-card p-3">
        <form id="chat-form" class="flex items-center gap-2">
          <input
            type="text"
            id="chat-input"
            placeholder="Ask a commercial question (e.g. 'What is our most profitable category and what drives it?')..."
            class="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#E99A3A] focus:bg-white transition"
          />
          <button
            type="submit"
            id="chat-submit-btn"
            class="bg-[#14233D] hover:bg-[#0C1729] text-white px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition shadow flex-shrink-0"
          >
            <i data-lucide="send" class="w-4 h-4 text-[#E99A3A]"></i> Ask Sarthi
          </button>
        </form>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  const chatBox = document.getElementById("chat-messages-box");
  const chatInput = document.getElementById("chat-input");
  const chatForm = document.getElementById("chat-form");
  const submitBtn = document.getElementById("chat-submit-btn");

  // Chips click handler
  document.querySelectorAll(".chip-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      chatInput.value = btn.innerText.trim();
      chatForm.dispatchEvent(new Event("submit"));
    });
  });

  // New Chat
  document.getElementById("btn-new-chat")?.addEventListener("click", () => {
    activeConversationId = null;
    chatBox.innerHTML = `
      <div class="flex gap-3 max-w-3xl">
        <div class="w-8 h-8 rounded-full bg-[#14233D] text-[#E99A3A] flex items-center justify-center flex-shrink-0 text-xs font-bold">
          <i data-lucide="sparkles" class="w-4 h-4"></i>
        </div>
        <div class="vss-card p-4 text-xs leading-relaxed space-y-2 text-slate-700 shadow-sm bg-white">
          <div class="font-bold text-[#14233D]">New Conversation Started</div>
          <p>What would you like to investigate in this dataset?</p>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  });

  // Handle Submit
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = chatInput.value.trim();
    if (!query) return;

    chatInput.value = "";
    submitBtn.disabled = true;

    // Append User Message
    const userMsgEl = document.createElement("div");
    userMsgEl.className = "flex justify-end";
    userMsgEl.innerHTML = `
      <div class="bg-[#14233D] text-white p-3.5 rounded-xl text-xs max-w-xl leading-relaxed shadow-sm">
        ${query}
      </div>
    `;
    chatBox.appendChild(userMsgEl);

    // Append Loading Assistant Bubble
    const loadingId = "loading-" + Date.now();
    const loadingEl = document.createElement("div");
    loadingEl.id = loadingId;
    loadingEl.className = "flex gap-3 max-w-3xl";
    loadingEl.innerHTML = `
      <div class="w-8 h-8 rounded-full bg-[#14233D] text-[#E99A3A] flex items-center justify-center flex-shrink-0 text-xs font-bold">
        <i data-lucide="sparkles" class="w-4 h-4"></i>
      </div>
      <div class="vss-card p-4 text-xs text-slate-500 bg-white flex items-center gap-2">
        <i data-lucide="loader-2" class="w-4 h-4 animate-spin text-[#E99A3A]"></i>
        <span>Routing question to analytical engines and verifying grounded proof...</span>
      </div>
    `;
    chatBox.appendChild(loadingEl);
    chatBox.scrollTop = chatBox.scrollHeight;
    if (window.lucide) window.lucide.createIcons();

    try {
      const res = await API.askAI(activeDatasetId, query, activeConversationId);
      activeConversationId = res.conversation_id;

      document.getElementById(loadingId)?.remove();

      // Convert Markdown-style formatting to clean HTML
      let formattedAnswer = formatMarkdown(res.answer || res.response || "");

      const actions = res.suggested_actions || [];

      const assistantMsgEl = document.createElement("div");
      assistantMsgEl.className = "flex gap-3 max-w-3xl";
      assistantMsgEl.innerHTML = `
        <div class="w-8 h-8 rounded-full bg-[#14233D] text-[#E99A3A] flex items-center justify-center flex-shrink-0 text-xs font-bold">
          <i data-lucide="sparkles" class="w-4 h-4"></i>
        </div>
        <div class="vss-card p-5 text-xs text-slate-700 bg-white space-y-3.5 shadow-sm">
          <div class="flex items-center justify-between border-b pb-2">
            <span class="font-bold text-[#14233D] text-xs uppercase tracking-wider">${res.title || 'Analytical Findings'}</span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold badge-green">Grounded in Empirical Data</span>
          </div>

          <div class="leading-relaxed">
            ${formattedAnswer}
          </div>

          ${actions.length > 0 ? `
            <div class="pt-2 border-t border-slate-100">
              <div class="text-[11px] font-bold text-[#14233D] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <i data-lucide="check-circle" class="w-3.5 h-3.5 text-[#31856C]"></i> Suggested Strategic Actions:
              </div>
              <ul class="space-y-1 text-slate-600 pl-4 list-disc text-xs">
                ${actions.map(a => `<li>${a}</li>`).join("")}
              </ul>
            </div>
          ` : ''}
        </div>
      `;
      chatBox.appendChild(assistantMsgEl);
      chatBox.scrollTop = chatBox.scrollHeight;
      if (window.lucide) window.lucide.createIcons();

    } catch (err) {
      document.getElementById(loadingId)?.remove();
      const errEl = document.createElement("div");
      errEl.className = "p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-200";
      errEl.innerText = `Error querying AI Analyst: ${err.message}`;
      chatBox.appendChild(errEl);
    } finally {
      submitBtn.disabled = false;
    }
  });
}
