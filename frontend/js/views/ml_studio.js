import { API } from "../api.js";

export async function renderMLStudio(container) {
  const activeDatasetId = API.getActiveDatasetId();

  if (!activeDatasetId) {
    container.innerHTML = `
      <div class="vss-card p-12 text-center max-w-lg mx-auto mt-8" style="padding: 40px 30px; text-align: center; max-width: 540px; margin: 40px auto;">
        <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(99,102,241,0.15); color: #6366F1; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">🧠</div>
        <h3 style="font-size: 18px; font-weight: 800; color: #14233D; margin-bottom: 8px;">No Active Dataset Selected</h3>
        <p style="font-size: 13px; color: #64748B; margin-bottom: 24px; line-height: 1.6;">Select a dataset from the Datasets Hub to configure predictive machine learning models, or return to the Business OS Launchpad.</p>
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

  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(99,102,241,0.18); color: #6366F1; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(99,102,241,0.15);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="3"></rect><circle cx="9" cy="9" r="2" fill="#6366F1"></circle><circle cx="15" cy="9" r="2" fill="#6366F1"></circle><circle cx="12" cy="15" r="2" fill="#6366F1"></circle><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="9" x2="12" y2="15"></line><line x1="15" y1="9" x2="12" y2="15"></line></svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-[#14233D] brand-font" style="margin: 0;">Machine Learning Studio</h1>
            <p class="text-sm text-slate-500" style="margin-top: 2px;">Supervised prediction pipelines, time-series forecasting, and automated task detection.</p>
          </div>
        </div>
        <button onclick="window.navigateTo('#overview')" class="btn btn-outline" style="font-size: 12px; padding: 6px 14px; display: inline-flex; align-items: center; gap: 6px;">
          <span>&larr;</span> Back to Business OS
        </button>
      </div>

      <div id="ml-loading" class="text-center py-16 text-slate-500">
        <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto mb-3 text-[#E99A3A]"></i>
        Scanning feature space and detecting candidate machine learning tasks...
      </div>

      <div id="ml-content" class="hidden space-y-6">
        <!-- Task Detection Suggestions Grid -->
        <div>
          <h3 class="font-bold text-[#14233D] text-sm brand-font mb-3">Statistically Viable ML Tasks</h3>
          <div id="ml-tasks-grid" class="grid grid-cols-1 md:grid-cols-3 gap-4"></div>
        </div>

        <!-- Training Configuration Card -->
        <div class="vss-card p-6 space-y-4 border-l-4 border-l-[#E99A3A]">
          <h3 class="font-bold text-[#14233D] text-base brand-font flex items-center gap-2">
            <i data-lucide="sliders" class="w-5 h-5 text-[#E99A3A]"></i> Configure and Train Model Pipeline
          </h3>
          
          <form id="ml-train-form" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Task Type</label>
                <select id="ml-task-type" class="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                  <option value="regression">Regression (Continuous Numeric Target)</option>
                  <option value="classification">Classification (Discrete Category Target)</option>
                  <option value="forecasting">Time-Series Forecasting (Periodic Extrapolation)</option>
                </select>
              </div>

              <div id="ml-target-col-group">
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Target Column (y)</label>
                <select id="ml-target-col" class="w-full px-3 py-2 border rounded-lg text-sm bg-white"></select>
              </div>

              <div id="ml-date-col-group" class="hidden">
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Timestamp / Date Column</label>
                <select id="ml-date-col" class="w-full px-3 py-2 border rounded-lg text-sm bg-white"></select>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Custom Model Label</label>
                <input type="text" id="ml-model-name" placeholder="e.g. Sales Random Forest v1" class="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>

            <div class="flex items-center justify-between pt-2">
              <div id="ml-training-status" class="text-xs text-slate-500 font-medium">Ready to fit Scikit-learn Pipeline</div>
              <button type="submit" id="btn-submit-train" class="bg-[#14233D] hover:bg-[#0C1729] text-white font-bold px-6 py-2.5 rounded-lg text-sm transition shadow flex items-center gap-2">
                <i data-lucide="play" class="w-4 h-4 text-[#E99A3A]"></i> Train & Evaluate Model
              </button>
            </div>
          </form>
        </div>

        <!-- Training Results Container -->
        <div id="ml-results-container" class="hidden space-y-6"></div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  try {
    const [tasksRes, datasetRes] = await Promise.all([
      API.getMLTasks(activeDatasetId),
      API.getDataset(activeDatasetId, 1)
    ]);

    document.getElementById("ml-loading")?.classList.add("hidden");
    document.getElementById("ml-content")?.classList.remove("hidden");

    const tasks = tasksRes.suggestions || [];
    const tasksGrid = document.getElementById("ml-tasks-grid");

    if (tasksGrid) {
      if (tasks.length === 0) {
        tasksGrid.innerHTML = `<div class="p-4 text-xs text-slate-400 col-span-3">No obvious ML tasks detected. Select columns manually below.</div>`;
      } else {
        tasksGrid.innerHTML = tasks.slice(0, 6).map(t => `
          <div class="vss-card p-4 hover:border-[#E99A3A] transition cursor-pointer" onclick="window.selectMLTask('${t.task_type}', '${t.target_column || ''}', '${t.date_column || ''}')">
            <div class="flex items-center justify-between mb-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${t.task_type === 'regression' ? 'badge-navy' : t.task_type === 'classification' ? 'badge-green' : 'badge-saffron'}">
                ${t.task_type}
              </span>
              <span class="text-[10px] text-slate-400 font-semibold">${t.confidence} Confidence</span>
            </div>
            <h4 class="font-bold text-[#14233D] text-xs mb-1">${t.title}</h4>
            <p class="text-xs text-slate-500 leading-relaxed">${t.description}</p>
          </div>
        `).join("");
      }
    }

    // Populate columns dropdown
    const cols = datasetRes.columns || [];
    const targetSel = document.getElementById("ml-target-col");
    const dateSel = document.getElementById("ml-date-col");

    if (targetSel) targetSel.innerHTML = cols.map(c => `<option value="${c}">${c}</option>`).join("");
    if (dateSel) dateSel.innerHTML = (tasksRes.date_columns_detected || cols).map(c => `<option value="${c}">${c}</option>`).join("");

    // Toggle fields based on task type
    const taskTypeSel = document.getElementById("ml-task-type");
    const dateGroup = document.getElementById("ml-date-col-group");

    taskTypeSel.addEventListener("change", () => {
      if (taskTypeSel.value === "forecasting") {
        dateGroup.classList.remove("hidden");
      } else {
        dateGroup.classList.add("hidden");
      }
    });

    // Helper for task selection from cards
    window.selectMLTask = (type, target, date) => {
      taskTypeSel.value = type;
      if (target) targetSel.value = target;
      if (type === "forecasting") {
        dateGroup.classList.remove("hidden");
        if (date) dateSel.value = date;
      } else {
        dateGroup.classList.add("hidden");
      }
      document.getElementById("ml-train-form").scrollIntoView({ behavior: "smooth" });
    };

    // Train Form Submission
    document.getElementById("ml-train-form")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const statusEl = document.getElementById("ml-training-status");
      const submitBtn = document.getElementById("btn-submit-train");
      const resultsContainer = document.getElementById("ml-results-container");

      const taskType = taskTypeSel.value;
      const targetCol = targetSel.value;
      const dateCol = dateSel.value;
      const modelName = document.getElementById("ml-model-name").value;

      statusEl.innerHTML = `<span class="text-[#E99A3A] font-semibold flex items-center gap-1.5"><i data-lucide="loader-2" class="w-3.5 h-3.5 animate-spin"></i> Fitting model & computing validation metrics...</span>`;
      if (window.lucide) window.lucide.createIcons();
      submitBtn.disabled = true;

      try {
        const payload = {
          task_type: taskType,
          target_column: targetCol,
          name: modelName || `${taskType.toUpperCase()} on ${targetCol}`
        };
        if (taskType === "forecasting") {
          payload.date_column = dateCol;
          payload.forecast_horizon = 6;
        }

        const res = await API.trainModel(activeDatasetId, payload);
        statusEl.innerText = "Model trained and persisted successfully!";

        resultsContainer.classList.remove("hidden");

        if (taskType === "regression" || taskType === "classification") {
          const m = res.metrics || {};
          const feats = res.feature_importances || [];
          const samples = res.sample_predictions || [];

          resultsContainer.innerHTML = `
            <div class="vss-card p-6 space-y-6">
              <div class="flex items-center justify-between border-b pb-4">
                <div>
                  <span class="text-xs uppercase text-slate-400 font-semibold tracking-wider">Evaluation Results</span>
                  <h3 class="text-lg font-bold text-[#14233D] brand-font">${res.name}</h3>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-bold badge-green">Trained & Saved with Joblib</span>
              </div>

              <!-- Metrics Row -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                ${taskType === 'regression' ? `
                  <div class="p-4 bg-slate-50 rounded-lg">
                    <div class="text-xs text-slate-400 uppercase font-semibold">R-Squared Score</div>
                    <div class="text-2xl font-black text-[#14233D]">${m.r2_score}</div>
                    <div class="text-xs text-slate-500 font-medium">${m.performance_rating} fit</div>
                  </div>
                  <div class="p-4 bg-slate-50 rounded-lg">
                    <div class="text-xs text-slate-400 uppercase font-semibold">Mean Absolute Error</div>
                    <div class="text-2xl font-black text-[#E99A3A]">${m.mean_absolute_error}</div>
                    <div class="text-xs text-slate-500">Average error per record</div>
                  </div>
                  <div class="p-4 bg-slate-50 rounded-lg">
                    <div class="text-xs text-slate-400 uppercase font-semibold">RMSE</div>
                    <div class="text-2xl font-black text-[#14233D]">${m.root_mean_squared_error}</div>
                    <div class="text-xs text-slate-500">Penalty-weighted residual</div>
                  </div>
                ` : `
                  <div class="p-4 bg-slate-50 rounded-lg">
                    <div class="text-xs text-slate-400 uppercase font-semibold">Validation Accuracy</div>
                    <div class="text-2xl font-black text-[#31856C]">${(m.accuracy * 100).toFixed(1)}%</div>
                    <div class="text-xs text-slate-500">${m.performance_rating} classification</div>
                  </div>
                  <div class="p-4 bg-slate-50 rounded-lg">
                    <div class="text-xs text-slate-400 uppercase font-semibold">Weighted F1 Score</div>
                    <div class="text-2xl font-black text-[#14233D]">${m.weighted_f1_score}</div>
                    <div class="text-xs text-slate-500">Harmonic precision/recall</div>
                  </div>
                `}
              </div>

              <!-- Feature Importances & Samples -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 class="font-bold text-[#14233D] text-xs uppercase tracking-wider text-slate-500 mb-3">Top Predictive Features</h4>
                  <div class="space-y-2">
                    ${feats.map(f => `
                      <div>
                        <div class="flex justify-between text-xs mb-1">
                          <span class="font-medium text-[#14233D]">${f.feature}</span>
                          <span class="font-mono text-slate-500">${(f.importance * 100).toFixed(1)}%</span>
                        </div>
                        <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div class="bg-[#14233D] h-full" style="width: ${f.importance * 100}%"></div>
                        </div>
                      </div>
                    `).join("")}
                  </div>
                </div>

                <div>
                  <h4 class="font-bold text-[#14233D] text-xs uppercase tracking-wider text-slate-500 mb-3">Sample Test Set Predictions</h4>
                  <table class="w-full text-left text-xs">
                    <thead class="bg-slate-50 text-slate-500 uppercase border-b">
                      <tr>
                        <th class="p-2">Actual Ground Truth</th>
                        <th class="p-2">Model Prediction</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 font-mono">
                      ${samples.slice(0, 5).map(s => `
                        <tr>
                          <td class="p-2 text-slate-700">${s.actual}</td>
                          <td class="p-2 text-[#E99A3A] font-bold">${s.predicted}</td>
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Limitations Note -->
              <div class="p-4 bg-amber-50 rounded-lg text-xs text-amber-800 border border-amber-200">
                <b>Model Confidence & Limitations:</b> ${res.limitations}
              </div>
            </div>
          `;
        } else if (taskType === "forecasting") {
          const fc = res.forecast || [];
          resultsContainer.innerHTML = `
            <div class="vss-card p-6 space-y-4">
              <div class="flex items-center justify-between border-b pb-4">
                <div>
                  <span class="text-xs uppercase text-slate-400 font-semibold tracking-wider">Time-Series Forecast</span>
                  <h3 class="text-lg font-bold text-[#14233D] brand-font">Future 6-Month Extrapolation for ${targetCol}</h3>
                </div>
                <span class="text-xs text-slate-500">Test MAE: <b>${res.test_mae}</b></span>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-50 text-slate-600 uppercase border-b">
                    <tr>
                      <th class="p-3">Future Period</th>
                      <th class="p-3">Projected Forecast</th>
                      <th class="p-3">90% Lower Bound</th>
                      <th class="p-3">90% Upper Bound</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 font-medium">
                    ${fc.map(p => `
                      <tr class="hover:bg-slate-50">
                        <td class="p-3 font-mono text-[#14233D] font-bold">${p.period}</td>
                        <td class="p-3 text-[#E99A3A] font-extrabold text-sm">₹${Number(p.forecasted_value).toLocaleString()}</td>
                        <td class="p-3 text-slate-500">₹${Number(p.lower_confidence_90).toLocaleString()}</td>
                        <td class="p-3 text-slate-500">₹${Number(p.upper_confidence_90).toLocaleString()}</td>
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
            </div>
          `;
        }

        resultsContainer.scrollIntoView({ behavior: "smooth" });

      } catch (err) {
        statusEl.innerHTML = `<span class="text-red-600 font-semibold">Training failed: ${err.message}</span>`;
      } finally {
        submitBtn.disabled = false;
      }
    });

  } catch (err) {
    console.error("ML Studio error:", err);
    if (err.message && err.message.includes("404")) {
      try {
        const datasets = await API.listDatasets();
        if (datasets && datasets.length > 0 && datasets[0].id !== activeDatasetId) {
          API.setActiveDatasetId(datasets[0].id);
          renderMLStudio(container);
          return;
        }
      } catch (e) {}
    }
    const loadingEl = document.getElementById("ml-loading");
    if (loadingEl) {
      loadingEl.innerHTML = `<div class="p-6 text-red-600">Failed to initialize ML Studio: ${err.message}</div>`;
    }
  }
}
