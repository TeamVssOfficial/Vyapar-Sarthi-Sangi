// Vyapar Verse — AI Code Studio View
import { API } from "../api.js";

export async function renderCodeStudio(container) {
  const datasetId = API.getActiveDatasetId();
  if (!datasetId) {
    container.innerHTML = `
      <div class="vss-card" style="padding: 40px; text-align: center; max-width: 600px; margin: 40px auto;">
        <h3 style="font-size: 18px; font-weight: 800; color: var(--navy); margin-bottom: 8px;">No Dataset Active</h3>
        <p style="color: var(--slate); font-size: 13px; margin-bottom: 20px;">AI Code Studio requires an uploaded dataset to generate and run custom Python scripts.</p>
        <button onclick="window.navigateTo('#datasets')" class="btn btn-saffron">Go to My Datasets</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="max-width: 1400px; margin: 0 auto;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 14px;">
        <div>
          <div style="display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 20px; background: rgba(99, 102, 241, 0.12); color: #6366F1; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">
            <span>&lt;/&gt;</span> Sandboxed Python Analytical Kernel
          </div>
          <h1 style="font-size: 22px; font-weight: 800; color: var(--navy);">AI Code Studio</h1>
          <p style="font-size: 13px; color: var(--slate);">Generate verified Python data-science scripts, inspect AST safety, and execute in an isolated sandbox.</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button id="btn-refresh-history" class="btn btn-outline" style="font-size: 12px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
            Execution Logs
          </button>
        </div>
      </div>

      <!-- Main Layout Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <!-- Left: Instruction & Code Editor -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <!-- Prompt Box -->
          <div class="vss-card" style="padding: 20px;">
            <h3 style="font-size: 14px; font-weight: 700; color: var(--navy); margin-bottom: 12px;">1. Natural Language Instruction</h3>
            <textarea id="code-instruction-input" rows="3" placeholder="e.g. Calculate correlation between price and quantity, find top 5 product categories by margin, or group sales by month..." style="width: 100%; padding: 12px; font-size: 13px; border: 1px solid var(--border-color); border-radius: 8px; resize: vertical; margin-bottom: 12px;"></textarea>
            
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <label style="font-size: 12px; font-weight: 600; color: var(--slate);">Target Stack:</label>
                <select id="code-target-lib" style="padding: 6px 12px; font-size: 12px; border-radius: 6px; border: 1px solid var(--border-color); font-weight: 600;">
                  <option value="pandas">Pandas & NumPy</option>
                  <option value="scipy">SciPy & Statistics</option>
                  <option value="scikit-learn">Scikit-Learn Preprocessing</option>
                  <option value="plotly">Plotly / Visualization</option>
                </select>
              </div>

              <button id="btn-generate-code" class="btn btn-saffron" style="font-size: 12px; padding: 8px 18px; font-weight: 700;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>
                Generate Code
              </button>
            </div>
          </div>

          <!-- Code Editor Surface -->
          <div class="vss-card" style="padding: 20px; display: flex; flex-direction: column; flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h3 style="font-size: 14px; font-weight: 700; color: var(--navy);">2. Python Source Script (Active)</h3>
              <div style="display: flex; gap: 8px;">
                <button id="btn-copy-code" class="btn btn-outline" style="font-size: 11px; padding: 4px 10px;">Copy</button>
                <button id="btn-download-code" class="btn btn-outline" style="font-size: 11px; padding: 4px 10px;">Download .py</button>
              </div>
            </div>

            <textarea id="code-editor-area" spellcheck="false" style="font-family: 'Courier New', Courier, monospace; font-size: 12.5px; line-height: 1.5; background: #0C1729; color: #38BDF8; padding: 16px; border-radius: 8px; border: 1px solid #1E293B; width: 100%; height: 320px; resize: vertical;"># Python script loaded with active dataset 'df'
# Example:
print("Dataset Shape:", df.shape)
print("\nNumerical Summary:")
print(df.describe().round(2))
</textarea>

            <!-- Explanation Panel -->
            <div id="code-explanation-card" style="margin-top: 14px; padding: 12px; background: #F8FAFC; border-radius: 6px; border-left: 3px solid #6366F1; font-size: 12px; color: var(--slate); display: none;">
              <b style="color: var(--navy);">Code Logic & Purpose:</b>
              <p id="code-explanation-text" style="margin-top: 4px; line-height: 1.5;"></p>
            </div>

            <!-- Run Action Bar -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px; border-top: 1px solid var(--border-color); padding-top: 14px;">
              <div style="font-size: 11px; color: var(--slate);">
                <span style="color: #10B981;">● Sandbox Isolation:</span> Restricted globals, AST forbidden modules checked.
              </div>
              <button id="btn-execute-code" class="btn btn-primary" style="font-size: 13px; padding: 9px 24px; font-weight: 700; background: #31856C;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                Execute Safely
              </button>
            </div>
          </div>
        </div>

        <!-- Right: Execution Terminal & Output -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <!-- Output Console -->
          <div class="vss-card" style="padding: 20px; height: 100%; display: flex; flex-direction: column;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="width: 10px; height: 10px; border-radius: 50%; background: #10B981;"></span>
                <h3 style="font-size: 14px; font-weight: 700; color: var(--navy);">Sandboxed Output Console</h3>
              </div>
              <span id="exec-status-badge" style="font-size: 11px; padding: 3px 8px; border-radius: 4px; background: #F1F5F9; color: var(--slate); font-weight: 600;">Idle</span>
            </div>

            <div id="code-terminal-output" style="flex: 1; min-height: 440px; max-height: 560px; overflow-y: auto; background: #080E1A; color: #F8FAFC; font-family: 'Courier New', Courier, monospace; font-size: 12px; padding: 16px; border-radius: 8px; border: 1px solid #1E293B; white-space: pre-wrap; line-height: 1.6;">Ready to execute. Click 'Execute Safely' to run the active script.</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach Event Handlers
  const btnGen = container.querySelector("#btn-generate-code");
  const btnExec = container.querySelector("#btn-execute-code");
  const btnCopy = container.querySelector("#btn-copy-code");
  const btnDown = container.querySelector("#btn-download-code");
  const editor = container.querySelector("#code-editor-area");
  const terminal = container.querySelector("#code-terminal-output");
  const statusBadge = container.querySelector("#exec-status-badge");
  const explCard = container.querySelector("#code-explanation-card");
  const explText = container.querySelector("#code-explanation-text");

  btnGen.addEventListener("click", async () => {
    const instruction = container.querySelector("#code-instruction-input").value.trim();
    if (!instruction) {
      alert("Please enter an analysis instruction or question.");
      return;
    }
    const lib = container.querySelector("#code-target-lib").value;
    btnGen.disabled = true;
    btnGen.innerHTML = `Generating...`;
    try {
      const res = await API.generateCode(datasetId, instruction, lib);
      if (res.code) {
        editor.value = res.code;
        if (res.explanation) {
          explCard.style.display = "block";
          explText.innerText = res.explanation;
        }
      }
    } catch (e) {
      alert("Code generation notice: " + (e.message || "Failed to generate code"));
    } finally {
      btnGen.disabled = false;
      btnGen.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg> Generate Code`;
    }
  });

  btnExec.addEventListener("click", async () => {
    const code = editor.value;
    if (!code.trim()) return;
    btnExec.disabled = true;
    statusBadge.innerText = "Running...";
    statusBadge.style.background = "#FEF3C7";
    statusBadge.style.color = "#D97706";
    terminal.innerHTML = `<span style="color: #94A3B8;">[Sandbox] Initializing isolated environment...\n[Sandbox] Injecting 'df' from encrypted storage...\n[Sandbox] AST security scan in progress...\n</span>`;

    try {
      const res = await API.executeCode(datasetId, code);
      if (res.success) {
        statusBadge.innerText = `Success (${(res.execution_time_seconds || 0).toFixed(3)}s)`;
        statusBadge.style.background = "#DCFCE7";
        statusBadge.style.color = "#15803D";
        terminal.innerHTML = res.stdout ? `<span style="color: #34D399;">[Execution Output]</span>\n\n${res.stdout}` : `<span style="color: #94A3B8;">Script finished with no stdout output.</span>`;
      } else {
        statusBadge.innerText = "Execution Error";
        statusBadge.style.background = "#FEE2E2";
        statusBadge.style.color = "#DC2626";
        terminal.innerHTML = `<span style="color: #F87171;">[Execution Failed]</span>\n\n${res.error || res.stderr || "Unknown script error"}`;
      }
    } catch (e) {
      statusBadge.innerText = "Error";
      statusBadge.style.background = "#FEE2E2";
      statusBadge.style.color = "#DC2626";
      terminal.innerHTML = `<span style="color: #F87171;">[Sandbox Communication Error]</span>\n${e.message}`;
    } finally {
      btnExec.disabled = false;
    }
  });

  btnCopy.addEventListener("click", () => {
    navigator.clipboard.writeText(editor.value);
    btnCopy.innerText = "Copied!";
    setTimeout(() => { btnCopy.innerText = "Copy"; }, 1500);
  });

  btnDown.addEventListener("click", () => {
    const blob = new Blob([editor.value], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vss_analysis_${Date.now()}.py`;
    a.click();
    URL.revokeObjectURL(url);
  });
}
