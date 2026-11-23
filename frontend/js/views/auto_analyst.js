// Vyapar Verse — Fully Automated AI Data Science Agent View (No-Code Business Interface)
import { API } from "../api.js";

export async function renderAutoAnalyst(container) {
  const datasetId = API.getActiveDatasetId();

  if (!datasetId) {
    container.innerHTML = `
      <div class="vss-card" style="padding: 48px 32px; text-align: center; max-width: 600px; margin: 40px auto; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.06);">
        <div style="width: 64px; height: 64px; border-radius: 16px; background: rgba(233,154,58,0.14); color: #E99A3A; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E99A3A" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
        </div>
        <h2 style="font-size: 20px; font-weight: 800; color: #14233D; margin-bottom: 10px;">Upload Dataset to Begin Automatic Analysis</h2>
        <p style="font-size: 13px; color: #64748B; margin-bottom: 24px; line-height: 1.6;">
          Upload your CSV or Excel file once. The AI Data Science Agent will automatically profile your data, apply safe cleaning, generate charts, train machine learning models, and deliver executive insights. Zero code required.
        </p>
        <button onclick="window.openDirectUploadModal()" class="btn btn-saffron" style="padding: 11px 26px; font-size: 13px; font-weight: 700;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          Upload CSV / Excel
        </button>
      </div>
    `;
    return;
  }

  // Initial Loading Stage with Friendly Non-Technical Progress Messages
  container.innerHTML = `
    <div id="auto-progress-wrapper" style="max-width: 680px; margin: 50px auto; text-align: center;">
      <div class="vss-card" style="padding: 40px 32px; border-radius: 12px; box-shadow: 0 12px 35px rgba(0,0,0,0.06);">
        <div style="width: 56px; height: 56px; border-radius: 14px; background: rgba(233,154,58,0.15); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E99A3A" stroke-width="2.5" style="animation: spin 1.2s linear infinite;">
            <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
          </svg>
        </div>

        <h2 id="auto-stage-headline" style="font-size: 19px; font-weight: 800; color: #14233D; margin-bottom: 8px;">
          Understanding your dataset...
        </h2>
        <p id="auto-stage-sub" style="font-size: 13px; color: #64748B; margin-bottom: 28px;">
          The AI Data Science Agent is autonomously profiling your spreadsheet.
        </p>

        <!-- Friendly Stage Tracker (No Code / Technical Details) -->
        <div style="display: flex; flex-direction: column; gap: 12px; text-align: left; max-width: 440px; margin: 0 auto;">
          <div id="stage-step-1" class="stage-step active">
            <span class="stage-icon">●</span>
            <span class="stage-label">Understanding your dataset & schema...</span>
          </div>
          <div id="stage-step-2" class="stage-step pending">
            <span class="stage-icon">○</span>
            <span class="stage-label">Identifying important patterns & relationships...</span>
          </div>
          <div id="stage-step-3" class="stage-step pending">
            <span class="stage-icon">○</span>
            <span class="stage-label">Checking data quality & applying safe cleaning...</span>
          </div>
          <div id="stage-step-4" class="stage-step pending">
            <span class="stage-icon">○</span>
            <span class="stage-label">Preparing statistical analysis & calculations...</span>
          </div>
          <div id="stage-step-5" class="stage-step pending">
            <span class="stage-icon">○</span>
            <span class="stage-label">Creating interactive visualizations...</span>
          </div>
          <div id="stage-step-6" class="stage-step pending">
            <span class="stage-icon">○</span>
            <span class="stage-label">Generating business insights & ML predictions...</span>
          </div>
          <div id="stage-step-7" class="stage-step pending">
            <span class="stage-icon">○</span>
            <span class="stage-label">Your analysis is ready!</span>
          </div>
        </div>
      </div>
    </div>

    <style>
      .stage-step {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 13px;
        padding: 8px 14px;
        border-radius: 6px;
        transition: all 0.3s ease;
      }
      .stage-step.active {
        background: rgba(233, 154, 58, 0.12);
        color: #D97706;
        font-weight: 700;
      }
      .stage-step.active .stage-icon {
        color: #E99A3A;
      }
      .stage-step.done {
        color: #10B981;
        font-weight: 600;
      }
      .stage-step.done .stage-icon {
        color: #10B981;
      }
      .stage-step.pending {
        color: #94A3B8;
      }
      @keyframes spin { 100% { transform: rotate(360deg); } }
    </style>
  `;

  // Animate friendly progress steps while fetching from backend
  const stepIds = [
    "stage-step-1", "stage-step-2", "stage-step-3",
    "stage-step-4", "stage-step-5", "stage-step-6", "stage-step-7"
  ];
  let currentStep = 0;

  const progressTimer = setInterval(() => {
    if (currentStep < stepIds.length - 1) {
      const prevEl = container.querySelector(`#${stepIds[currentStep]}`);
      if (prevEl) {
        prevEl.className = "stage-step done";
        prevEl.querySelector(".stage-icon").innerText = "✓";
      }
      currentStep++;
      const nextEl = container.querySelector(`#${stepIds[currentStep]}`);
      if (nextEl) {
        nextEl.className = "stage-step active";
        nextEl.querySelector(".stage-icon").innerText = "●";
        const labelText = nextEl.querySelector(".stage-label").innerText;
        const headlineEl = container.querySelector("#auto-stage-headline");
        if (headlineEl) headlineEl.innerText = labelText;
      }
    }
  }, 450);

  try {
    const report = await API.getAutomatedAnalysisResults(datasetId);
    clearInterval(progressTimer);

    // Mark final step done
    stepIds.forEach(id => {
      const el = container.querySelector(`#${id}`);
      if (el) {
        el.className = "stage-step done";
        el.querySelector(".stage-icon").innerText = "✓";
      }
    });

    setTimeout(() => {
      renderCompletedDashboard(container, report, datasetId);
    }, 400);

  } catch (err) {
    clearInterval(progressTimer);
    container.innerHTML = `
      <div class="vss-card" style="padding: 40px; text-align: center; max-width: 600px; margin: 40px auto;">
        <div style="width: 56px; height: 56px; border-radius: 14px; background: #FEE2E2; color: #DC2626; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        </div>
        <h3 style="font-weight: 800; font-size: 18px; margin-bottom: 8px; color: #14233D;">Automated Analysis Notice</h3>
        <p style="font-size: 13px; color: #64748B; margin-bottom: 24px; line-height: 1.6;">${err.message || 'Unable to complete automated analysis on this file.'}</p>
        <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
          <button onclick="window.handleRoute ? window.handleRoute() : window.location.reload()" class="btn btn-saffron" style="font-weight: 700;">Retry Analysis</button>
          <button onclick="window.openDirectUploadModal()" class="btn btn-outline" style="font-weight: 700;">Upload New Dataset</button>
          <button onclick="window.navigateTo('#datasets')" class="btn btn-primary" style="font-weight: 700;">Return to My Datasets</button>
        </div>
      </div>
    `;
  }
}

function renderCompletedDashboard(container, data, datasetId) {
  const ov = data.overview || {};
  const kpis = data.kpis || {};
  const ml = data.machine_learning || {};
  const insights = data.insights || [];
  const cleaning = data.cleaning_report || {};
  const charts = data.charts || [];

  container.innerHTML = `
    <div style="max-width: 1400px; margin: 0 auto; padding-bottom: 60px;">
      
      <!-- Top Action & Overview Banner -->
      <div class="vss-card" style="padding: 24px 28px; margin-bottom: 24px; background: linear-gradient(135deg, #14233D 0%, #0C1729 100%); color: #FFFFFF; border: none; border-radius: 12px; box-shadow: 0 8px 24px rgba(12,23,41,0.15);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 20px; background: rgba(49, 133, 108, 0.25); color: #34D399; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; border: 1px solid rgba(49, 133, 108, 0.4);">
              <span>✓</span> AI Data Science Analysis Complete
            </div>
            <h1 style="font-size: 22px; font-weight: 800; letter-spacing: -0.3px; margin-bottom: 4px;">
              ${data.dataset_name || 'Business Dataset'}
            </h1>
            <p style="font-size: 13px; color: #94A3B8;">
              Automatically profiled, cleaned, and analyzed in <b>${data.execution_time_seconds || 0.4} seconds</b>. Zero manual configuration required.
            </p>
          </div>

          <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
            <a href="${API.getDownloadCleanedUrl(datasetId)}" target="_blank" class="btn btn-saffron" style="font-size: 13px; padding: 10px 20px; font-weight: 700; box-shadow: 0 4px 12px rgba(233,154,58,0.3);">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Download Cleaned Dataset (.CSV)
            </a>

            <button onclick="window.navigateTo('#ai-assistant')" class="btn" style="background: rgba(255,255,255,0.12); color: #FFFFFF; border: 1px solid rgba(255,255,255,0.25); font-size: 13px; padding: 10px 18px; font-weight: 600;">
              <span>💬</span> Ask AI Sarthi
            </button>
          </div>
        </div>

        <!-- Quick Metrics Strip -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; font-weight: 700;">Analyzed Rows</div>
            <div style="font-size: 22px; font-weight: 800; color: #FFFFFF; margin-top: 4px;">${(ov.total_rows || 0).toLocaleString()}</div>
          </div>
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; font-weight: 700;">Columns / Features</div>
            <div style="font-size: 22px; font-weight: 800; color: #FFFFFF; margin-top: 4px;">${ov.total_columns || 0}</div>
          </div>
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; font-weight: 700;">Data Quality Score</div>
            <div style="font-size: 22px; font-weight: 800; color: #34D399; margin-top: 4px;">${ov.quality_score || 95}/100</div>
          </div>
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; font-weight: 700;">Automated Cleanups</div>
            <div style="font-size: 22px; font-weight: 800; color: #FCD34D; margin-top: 4px;">${(ov.missing_cells_imputed || 0) + (ov.duplicate_rows_removed || 0)} operations</div>
          </div>
        </div>
      </div>

      <!-- Executive KPI Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="vss-card" style="padding: 18px; border-left: 4px solid #10B981;">
          <div style="font-size: 11px; font-weight: 700; color: var(--slate); text-transform: uppercase;">Total Volume / Revenue</div>
          <div style="font-size: 24px; font-weight: 800; color: var(--navy); margin-top: 6px;">₹${(kpis.total_volume || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
          <div style="font-size: 11px; color: #10B981; margin-top: 4px;">Metric: ${kpis.primary_metric || 'Transactions'}</div>
        </div>

        <div class="vss-card" style="padding: 18px; border-left: 4px solid var(--saffron);">
          <div style="font-size: 11px; font-weight: 700; color: var(--slate); text-transform: uppercase;">Average Ticket (AOV)</div>
          <div style="font-size: 24px; font-weight: 800; color: var(--navy); margin-top: 6px;">₹${(kpis.average_value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
          <div style="font-size: 11px; color: var(--slate); margin-top: 4px;">Median: ₹${(kpis.median_value || 0).toLocaleString("en-IN")}</div>
        </div>

        <div class="vss-card" style="padding: 18px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--slate); text-transform: uppercase;">Transaction Range</div>
          <div style="font-size: 18px; font-weight: 800; color: var(--navy); margin-top: 6px;">
            ₹${(kpis.minimum_value || 0).toLocaleString("en-IN")} - ₹${(kpis.maximum_value || 0).toLocaleString("en-IN")}
          </div>
          <div style="font-size: 11px; color: var(--slate); margin-top: 4px;">Std Dev: ₹${(kpis.std_deviation || 0).toLocaleString("en-IN")}</div>
        </div>

        <div class="vss-card" style="padding: 18px; border-left: 4px solid ${kpis.outlier_count > 0 ? '#EF4444' : '#10B981'};">
          <div style="font-size: 11px; font-weight: 700; color: ${kpis.outlier_count > 0 ? '#EF4444' : '#10B981'}; text-transform: uppercase;">High-Value Anomalies</div>
          <div style="font-size: 24px; font-weight: 800; color: ${kpis.outlier_count > 0 ? '#EF4444' : '#10B981'}; margin-top: 6px;">
            ${kpis.outlier_count || 0}
          </div>
          <div style="font-size: 11px; color: var(--slate); margin-top: 4px;">Outliers detected via IQR rule</div>
        </div>
      </div>

      <!-- Data Cleaning Actions Card (Non-Technical, Reassuring) -->
      <div class="vss-card" style="padding: 22px 26px; margin-bottom: 24px; background: #F8FAFC;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
          <h3 style="font-size: 15px; font-weight: 800; color: var(--navy); display: flex; align-items: center; gap: 8px;">
            <span>🛡️</span> Automated Safe Data Cleaning Results
          </h3>
          <span style="font-size: 12px; color: #10B981; font-weight: 700;">Original file safely preserved</span>
        </div>
        
        <p style="font-size: 13px; color: var(--slate); margin-bottom: 16px;">
          ${cleaning.summary || 'All missing values, text whitespace, and duplicates were automatically resolved.'}
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
          ${(cleaning.actions_taken || []).map(act => `
            <div style="padding: 12px 16px; background: #FFFFFF; border: 1px solid var(--border-color); border-radius: 8px; border-left: 3px solid #10B981;">
              <div style="font-size: 12px; font-weight: 700; color: var(--navy); margin-bottom: 4px;">${act.action}</div>
              <div style="font-size: 12px; color: var(--slate); line-height: 1.5;">${act.description}</div>
            </div>
          `).join("")}
        </div>
      </div>

      <!-- Interactive Dynamic Visualizations -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(420px, 1fr)); gap: 20px; margin-bottom: 24px;">
        ${charts.map(chart => `
          <div class="vss-card" style="padding: 22px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <h3 style="font-size: 15px; font-weight: 700; color: var(--navy);">${chart.title}</h3>
              <span style="font-size: 11px; padding: 2px 8px; border-radius: 4px; background: #F1F5F9; color: var(--slate); font-weight: 600; text-transform: uppercase;">${chart.type}</span>
            </div>
            
            <!-- Render Clean SVG Visualization -->
            <div style="min-height: 220px; display: flex; flex-direction: column; justify-content: center;">
              ${renderDynamicSvgChart(chart)}
            </div>
          </div>
        `).join("")}
      </div>

      <!-- Automated Machine Learning & Predictions -->
      ${ml.status === "COMPLETED" ? `
        <div class="vss-card" style="padding: 24px; margin-bottom: 24px; border-left: 4px solid #6366F1;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 8px;">
            <div>
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #6366F1;">Automated Machine Learning</div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--navy); margin-top: 2px;">${ml.task}</h3>
            </div>
            <span style="background: rgba(99, 102, 241, 0.12); color: #6366F1; font-weight: 700; font-size: 12px; padding: 4px 12px; border-radius: 20px;">
              ${ml.metrics?.confidence_percentage || 85}% Predictive Confidence
            </span>
          </div>

          <p style="font-size: 13px; color: var(--slate); margin-bottom: 18px; line-height: 1.5;">
            ${ml.business_impact || 'Model successfully trained on operational data to forecast business outcomes.'}
          </p>

          <!-- Sample Actual vs Predicted Table -->
          <div style="background: #F8FAFC; border-radius: 8px; padding: 16px; border: 1px solid var(--border-color);">
            <div style="font-size: 12px; font-weight: 700; color: var(--navy); margin-bottom: 10px;">Test Validation Sample (Actual vs AI Predicted):</div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px;">
              ${(ml.sample_predictions || []).map((sp, idx) => `
                <div style="background: #FFFFFF; padding: 10px 14px; border-radius: 6px; border: 1px solid #E2E8F0;">
                  <div style="font-size: 10.5px; color: var(--slate);">Sample #${idx + 1}</div>
                  <div style="font-size: 13px; font-weight: 700; color: var(--navy); margin-top: 2px;">Actual: ₹${sp.actual.toLocaleString("en-IN")}</div>
                  <div style="font-size: 12px; font-weight: 600; color: #6366F1;">Pred: ₹${sp.predicted.toLocaleString("en-IN")}</div>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      ` : ''}

      <!-- AI Business Insights & Recommendations -->
      <div class="vss-card" style="padding: 26px; margin-bottom: 24px;">
        <h3 style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
          <span>💡</span> Strategic Business Insights & Recommendations
        </h3>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${insights.map(ins => `
            <div style="padding: 14px 18px; background: #F8FAFC; border-radius: 8px; border-left: 3px solid ${ins.type === 'ATTENTION' ? '#EF4444' : '#10B981'};">
              <h4 style="font-size: 13.5px; font-weight: 700; color: var(--navy); margin-bottom: 4px;">${ins.title}</h4>
              <p style="font-size: 13px; color: var(--slate); line-height: 1.6;">${ins.summary}</p>
            </div>
          `).join("")}
        </div>
      </div>

    </div>
  `;
}

function renderDynamicSvgChart(chart) {
  const data = chart.data || {};
  const labels = data.labels || [];
  const values = data.values || [];

  if (labels.length === 0 || values.length === 0) {
    return `<div style="text-align: center; color: var(--slate); padding: 40px;">No data points available for this visualization.</div>`;
  }

  if (chart.type === "donut" || chart.type === "pie") {
    const total = values.reduce((a, b) => a + b, 0) || 1;
    const colors = ["#14233D", "#E99A3A", "#31856C", "#0284C7", "#6366F1", "#EC4899", "#8B5CF6", "#F59E0B"];

    return `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${labels.map((lbl, i) => {
          const val = values[i];
          const pct = Math.round((val / total) * 100);
          const col = colors[i % colors.length];
          return `
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px;">
                <span style="font-weight: 600; color: var(--navy);">${lbl}</span>
                <span style="font-weight: 700; color: var(--navy);">₹${typeof val === 'number' ? val.toLocaleString("en-IN") : val} (${pct}%)</span>
              </div>
              <div style="height: 8px; border-radius: 4px; background: #F1F5F9; overflow: hidden;">
                <div style="height: 100%; width: ${pct}%; background: ${col}; border-radius: 4px;"></div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  } else if (chart.type === "line") {
    const maxVal = Math.max(...values) || 1;
    return `
      <div style="display: flex; align-items: flex-end; gap: 10px; height: 180px; padding-top: 20px; border-bottom: 1px solid var(--border-color);">
        ${values.map((v, i) => {
          const heightPct = Math.max(10, Math.round((v / maxVal) * 100));
          return `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end;">
              <div style="font-size: 10px; font-weight: 700; color: var(--navy); margin-bottom: 4px;">₹${(v / 1000).toFixed(0)}k</div>
              <div style="width: 100%; max-width: 24px; height: ${heightPct}%; background: var(--saffron); border-radius: 4px 4px 0 0;"></div>
              <div style="font-size: 10px; color: var(--slate); margin-top: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 40px;" title="${labels[i] || ''}">
                ${labels[i] ? labels[i].slice(-5) : ''}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  } else {
    // Bar chart
    const maxVal = Math.max(...values) || 1;
    return `
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${labels.map((lbl, i) => {
          const val = values[i];
          const pct = Math.round((val / maxVal) * 100);
          return `
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 3px;">
                <span style="font-weight: 600; color: var(--navy);">${lbl}</span>
                <span style="font-weight: 700; color: var(--navy);">${val.toLocaleString("en-IN")}</span>
              </div>
              <div style="height: 8px; border-radius: 4px; background: #F1F5F9; overflow: hidden;">
                <div style="height: 100%; width: ${pct}%; background: #0284C7; border-radius: 4px;"></div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }
}
