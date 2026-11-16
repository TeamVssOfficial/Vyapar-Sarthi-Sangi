import { API } from "../api.js";

export async function renderDataStudio(container) {
  const activeDatasetId = API.getActiveDatasetId();

  if (!activeDatasetId) {
    container.innerHTML = `
      <div class="vss-card p-12 text-center max-w-lg mx-auto mt-8" style="padding: 40px 30px; text-align: center; max-width: 540px; margin: 40px auto;">
        <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(233,154,58,0.15); color: #E99A3A; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">🗃️</div>
        <h3 style="font-size: 18px; font-weight: 800; color: #14233D; margin-bottom: 8px;">No Active Dataset Selected</h3>
        <p style="font-size: 13px; color: #64748B; margin-bottom: 24px; line-height: 1.6;">Select a dataset from the Datasets Hub or upload a new one to begin data profiling, or return to the Business OS Launchpad.</p>
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
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(2,132,199,0.18); color: #0284C7; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(2,132,199,0.15);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284C7" stroke-width="2.2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon><circle cx="12" cy="17" r="1.5" fill="#0284C7"></circle></svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-[#14233D] brand-font" style="margin: 0;">Data Studio & Safe Curation</h1>
            <p class="text-sm text-slate-500" style="margin-top: 2px;">Examine raw rows, structural types, missingness, and run non-destructive data cleaning.</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="window.navigateTo('#overview')" class="btn btn-outline" style="font-size: 12px; padding: 6px 14px; display: inline-flex; align-items: center; gap: 6px;">
            <span>&larr;</span> Back to Business OS
          </button>
          <button id="btn-open-cleaner" class="bg-[#E99A3A] hover:bg-[#D97706] text-[#0C1729] font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition shadow">
            <i data-lucide="sparkles" class="w-4 h-4"></i> Clean Dataset Safely
          </button>
        </div>
      </div>

      <!-- Quality Telemetry Card -->
      <div id="quality-summary-card" class="vss-card p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="flex items-center gap-4 border-r border-slate-100 pr-4">
          <div id="quality-score-circle" class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-xl font-extrabold text-[#31856C] border-4 border-[#31856C]/20">
            --
          </div>
          <div>
            <div class="text-xs uppercase text-slate-400 font-semibold tracking-wider">Quality Score</div>
            <div id="quality-rating-text" class="text-base font-bold text-[#14233D]">Evaluating...</div>
            <div class="text-[11px] text-slate-500">Integrity benchmark</div>
          </div>
        </div>

        <div>
          <div class="text-xs uppercase text-slate-400 font-semibold tracking-wider mb-1">Missing Cells</div>
          <div id="missing-cells-val" class="text-xl font-bold text-[#14233D]">--</div>
          <div id="missing-pct-val" class="text-xs text-slate-500">--% overall missingness</div>
        </div>

        <div>
          <div class="text-xs uppercase text-slate-400 font-semibold tracking-wider mb-1">Duplicate Rows</div>
          <div id="duplicate-rows-val" class="text-xl font-bold text-[#14233D]">--</div>
          <div id="duplicate-pct-val" class="text-xs text-slate-500">Identical full records</div>
        </div>

        <div>
          <div class="text-xs uppercase text-slate-400 font-semibold tracking-wider mb-1">Feature Breakdown</div>
          <div id="feature-breakdown-val" class="text-xs text-slate-600 space-y-1">
            Loading features...
          </div>
        </div>
      </div>

      <!-- Quality Alerts Bar -->
      <div id="quality-alerts-container" class="space-y-2"></div>

      <!-- Tabs: Preview vs Columns -->
      <div class="vss-card overflow-hidden">
        <div class="border-b border-slate-200 bg-slate-50 px-6 flex gap-6 text-sm font-semibold">
          <button id="tab-preview-btn" class="py-3.5 border-b-2 border-[#E99A3A] text-[#14233D]">Dataset Preview (First 50 Rows)</button>
          <button id="tab-columns-btn" class="py-3.5 border-b-2 border-transparent text-slate-500 hover:text-slate-700">Column Types & Semantics</button>
        </div>

        <!-- Preview Table View -->
        <div id="view-preview" class="p-4 overflow-x-auto max-h-[550px]">
          <div class="text-center py-12 text-slate-400">Loading dataset records...</div>
        </div>

        <!-- Column Profiles View -->
        <div id="view-columns" class="hidden p-6 overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-600 uppercase text-xs border-b">
              <tr>
                <th class="px-4 py-3">Column</th>
                <th class="px-4 py-3">Detected Type</th>
                <th class="px-4 py-3">Semantic Tag</th>
                <th class="px-4 py-3">Missing</th>
                <th class="px-4 py-3">Unique Values</th>
                <th class="px-4 py-3">Sample Values</th>
              </tr>
            </thead>
            <tbody id="columns-table-body" class="divide-y divide-slate-100"></tbody>
          </table>
        </div>
      </div>

      <!-- Safe Cleaning Modal -->
      <div id="clean-modal" class="hidden fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
          <div class="flex items-center justify-between border-b pb-3">
            <h3 class="text-lg font-bold text-[#14233D] brand-font flex items-center gap-2">
              <i data-lucide="sparkles" class="w-5 h-5 text-[#E99A3A]"></i> Non-Destructive Safe Cleaning
            </h3>
            <button id="btn-close-clean-modal" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="text-xs text-slate-500 bg-amber-50 p-3 rounded-lg border border-amber-200">
            <strong>Architecture Guarantee:</strong> Original uploaded files are never modified. A new processed version is safely generated and registered into your business workspace.
          </div>

          <form id="clean-form" class="space-y-3">
            <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" id="clean-opt-dup" checked class="w-4 h-4 text-[#E99A3A] rounded border-slate-300" />
              <span>Drop exact duplicate rows</span>
            </label>
            <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input type="checkbox" id="clean-opt-trim" checked class="w-4 h-4 text-[#E99A3A] rounded border-slate-300" />
              <span>Trim leading & trailing string whitespace</span>
            </label>

            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Numeric Missing Imputation</label>
              <select id="clean-opt-num" class="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="median">Impute with Column Median (Preserves distribution)</option>
                <option value="mean">Impute with Column Mean</option>
                <option value="zero">Fill with Zero (0)</option>
                <option value="none">Do not impute numbers</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Categorical Missing Imputation</label>
              <select id="clean-opt-cat" class="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="unknown">Fill with 'Unknown' marker</option>
                <option value="mode">Impute with Mode (Most Frequent)</option>
                <option value="none">Do not impute categories</option>
              </select>
            </div>

            <div class="pt-2 border-t border-slate-200">
              <label class="flex items-center gap-2 text-sm font-semibold text-slate-800 cursor-pointer">
                <input type="checkbox" id="clean-opt-outliers" class="w-4 h-4 text-[#E99A3A] rounded border-slate-300" checked />
                <span>Remove or Treat Outliers (1.5× IQR Fences)</span>
              </label>
              <div id="clean-outlier-controls" class="mt-2 pl-6">
                <select id="clean-opt-outlier-strategy" class="w-full px-3 py-2 border rounded-lg text-sm bg-amber-50/50 border-amber-200 text-amber-900 font-medium">
                  <option value="drop">🗑️ Drop Outlier Rows (Purge anomalies)</option>
                  <option value="cap">✂️ Cap / Winsorize (Keep rows, clip boundaries)</option>
                </select>
              </div>
            </div>

            <div id="clean-status-msg" class="hidden text-xs p-3 rounded-lg"></div>

            <div class="flex justify-end gap-2 pt-2 border-t">
              <button type="button" id="btn-cancel-clean" class="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="submit" id="btn-execute-clean" class="bg-[#E99A3A] hover:bg-[#D97706] text-[#0C1729] font-bold px-5 py-2 rounded-lg text-sm transition">Generate Cleaned Dataset</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Tab switching
  const tabPrevBtn = document.getElementById("tab-preview-btn");
  const tabColsBtn = document.getElementById("tab-columns-btn");
  const viewPrev = document.getElementById("view-preview");
  const viewCols = document.getElementById("view-columns");

  tabPrevBtn?.addEventListener("click", () => {
    tabPrevBtn.classList.add("border-[#E99A3A]", "text-[#14233D]");
    tabPrevBtn.classList.remove("border-transparent", "text-slate-500");
    tabColsBtn.classList.remove("border-[#E99A3A]", "text-[#14233D]");
    tabColsBtn.classList.add("border-transparent", "text-slate-500");
    viewPrev.classList.remove("hidden");
    viewCols.classList.add("hidden");
  });

  tabColsBtn?.addEventListener("click", () => {
    tabColsBtn.classList.add("border-[#E99A3A]", "text-[#14233D]");
    tabColsBtn.classList.remove("border-transparent", "text-slate-500");
    tabPrevBtn.classList.remove("border-[#E99A3A]", "text-[#14233D]");
    tabPrevBtn.classList.add("border-transparent", "text-slate-500");
    viewCols.classList.remove("hidden");
    viewPrev.classList.add("hidden");
  });

  // Modal setup
  const cleanModal = document.getElementById("clean-modal");
  document.getElementById("btn-open-cleaner")?.addEventListener("click", () => cleanModal.classList.remove("hidden"));
  document.getElementById("btn-close-clean-modal")?.addEventListener("click", () => cleanModal.classList.add("hidden"));
  document.getElementById("btn-cancel-clean")?.addEventListener("click", () => cleanModal.classList.add("hidden"));

  // Cleaning form submission
  document.getElementById("clean-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btn-execute-clean");
    const msg = document.getElementById("clean-status-msg");
    btn.disabled = true;
    msg.classList.remove("hidden");
    msg.className = "text-xs p-3 rounded-lg bg-slate-100 text-slate-600";
    msg.innerText = "Applying safe transformations and registering new dataset...";

    try {
      const res = await API.cleanDataset(activeDatasetId, {
        drop_duplicates: document.getElementById("clean-opt-dup").checked,
        trim_whitespace: document.getElementById("clean-opt-trim").checked,
        fill_numeric_strategy: document.getElementById("clean-opt-num").value,
        fill_categorical_strategy: document.getElementById("clean-opt-cat").value,
        outlier_strategy: document.getElementById("clean-opt-outliers")?.checked ? document.getElementById("clean-opt-outlier-strategy")?.value : "none",
        iqr_multiplier: 1.5
      });

      msg.className = "text-xs p-3 rounded-lg bg-green-50 text-green-700 border border-green-200";
      msg.innerText = `Success! Generated '${res.name}'. Set as new active dataset.`;
      API.setActiveDatasetId(res.new_dataset_id);
      setTimeout(() => {
        cleanModal.classList.add("hidden");
        renderDataStudio(container);
      }, 1200);
    } catch (err) {
      msg.className = "text-xs p-3 rounded-lg bg-red-50 text-red-600 border border-red-200";
      msg.innerText = err.message || "Failed to clean dataset.";
    } finally {
      btn.disabled = false;
    }
  });

  // Load Data
  try {
    const [datasetRes, qualityRes] = await Promise.all([
      API.getDataset(activeDatasetId, 50),
      API.getDataQuality(activeDatasetId)
    ]);

    const p = qualityRes.profile || {};
    const cols = p.columns || [];

    // Quality Telemetry
    const qCircle = document.getElementById("quality-score-circle");
    if (qCircle) qCircle.innerText = p.quality_score || 100;
    const qRating = document.getElementById("quality-rating-text");
    if (qRating) qRating.innerText = p.quality_rating || "Good";
    const mCells = document.getElementById("missing-cells-val");
    if (mCells) mCells.innerText = Number(p.missing_cells || 0).toLocaleString();
    const mPct = document.getElementById("missing-pct-val");
    if (mPct) mPct.innerText = `${p.missing_percentage || 0}% of all cells`;
    const dRows = document.getElementById("duplicate-rows-val");
    if (dRows) dRows.innerText = Number(p.duplicate_rows || 0).toLocaleString();
    const dPct = document.getElementById("duplicate-pct-val");
    if (dPct) dPct.innerText = `${p.duplicate_percentage || 0}% duplication`;

    const fBreakdown = document.getElementById("feature-breakdown-val");
    if (fBreakdown) {
      fBreakdown.innerHTML = `
        <div class="flex justify-between"><span>Numeric Measures:</span> <b class="text-[#14233D]">${(p.numeric_columns || []).length}</b></div>
        <div class="flex justify-between"><span>Categorical Dimensions:</span> <b class="text-[#14233D]">${(p.categorical_columns || []).length}</b></div>
        <div class="flex justify-between"><span>Datetime Fields:</span> <b class="text-[#14233D]">${(p.datetime_columns || []).length}</b></div>
      `;
    }

    // Alerts
    const alertsContainer = document.getElementById("quality-alerts-container");
    if (alertsContainer && p.alerts && p.alerts.length > 0) {
      alertsContainer.innerHTML = p.alerts.map(a => `
        <div class="p-3 rounded-lg text-xs flex items-center gap-2 ${a.severity === 'critical' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}">
          <i data-lucide="alert-triangle" class="w-4 h-4 flex-shrink-0"></i>
          <span><b>[${a.column}]</b> ${a.message}</span>
        </div>
      `).join("");
      if (window.lucide) window.lucide.createIcons();
    }

    // Render Preview Table
    const previewData = datasetRes.preview || [];
    const headers = datasetRes.columns || [];

    if (previewData.length === 0) {
      viewPrev.innerHTML = `<div class="p-8 text-center text-slate-400">No records available to preview.</div>`;
    } else {
      let tableHtml = `
        <table class="w-full text-left text-xs whitespace-nowrap">
          <thead class="bg-slate-100 text-slate-700 uppercase tracking-wider font-semibold border-b">
            <tr>
              <th class="p-2.5 bg-slate-200 text-center">#</th>
              ${headers.map(h => `<th class="p-2.5 border-r border-slate-200">${h}</th>`).join("")}
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
      `;

      previewData.forEach((row, idx) => {
        tableHtml += `
          <tr class="hover:bg-slate-50">
            <td class="p-2 text-center text-slate-400 font-mono">${idx + 1}</td>
            ${headers.map(h => {
              const val = row[h];
              const isNull = val === null || val === "" || val === undefined;
              return `<td class="p-2 border-r border-slate-100 ${isNull ? 'text-slate-300 italic' : 'text-slate-700'}">${isNull ? 'null' : String(val)}</td>`;
            }).join("")}
          </tr>
        `;
      });
      tableHtml += `</tbody></table>`;
      viewPrev.innerHTML = tableHtml;
    }

    // Render Columns Table
    const colBody = document.getElementById("columns-table-body");
    colBody.innerHTML = cols.map(c => `
      <tr class="hover:bg-slate-50">
        <td class="px-4 py-3 font-semibold text-[#14233D]">${c.name}</td>
        <td class="px-4 py-3">
          <span class="px-2 py-0.5 rounded text-xs font-mono font-medium ${c.is_numeric ? 'badge-green' : c.is_datetime ? 'badge-saffron' : 'badge-navy'}">
            ${c.detected_type} (${c.raw_dtype})
          </span>
        </td>
        <td class="px-4 py-3 capitalize text-slate-600">${c.semantic_tag}</td>
        <td class="px-4 py-3 text-slate-600">${c.missing_count} (${c.missing_percent}%)</td>
        <td class="px-4 py-3 text-slate-600">${c.unique_count.toLocaleString()}</td>
        <td class="px-4 py-3 text-slate-500 font-mono text-[11px] truncate max-w-xs">${(c.sample_values || []).join(", ")}</td>
      </tr>
    `).join("");

  } catch (err) {
    console.error("Data Studio render error:", err);
    if (err.message && err.message.includes("404")) {
      try {
        const datasets = await API.listDatasets();
        if (datasets && datasets.length > 0 && datasets[0].id !== activeDatasetId) {
          API.setActiveDatasetId(datasets[0].id);
          renderDataStudio(container);
          return;
        }
      } catch (e) {}
    }
    const viewPrev = document.getElementById("view-preview");
    if (viewPrev) {
      viewPrev.innerHTML = `<div class="p-6 text-red-600 text-center">Error loading studio data: ${err.message}</div>`;
    }
  }
}
