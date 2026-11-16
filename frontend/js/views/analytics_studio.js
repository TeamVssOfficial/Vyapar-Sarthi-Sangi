import { API } from "../api.js";
import { ensurePlotly } from "../utils/plotly_loader.js";
import { renderSVGBarChart, renderSVGLineChart, renderSVGPieChart, autoRenderSpec } from "../utils/svg_charts.js";

export async function renderAnalyticsStudio(container) {
  const activeDatasetId = API.getActiveDatasetId();

  if (!activeDatasetId) {
    container.innerHTML = `
      <div class="vss-card p-12 text-center max-w-lg mx-auto mt-8" style="padding: 40px 30px; text-align: center; max-width: 540px; margin: 40px auto;">
        <div style="width: 56px; height: 56px; border-radius: 14px; background: rgba(233,154,58,0.15); color: #E99A3A; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E99A3A" stroke-width="2.5"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line><circle cx="12" cy="4" r="2" fill="#E99A3A"></circle></svg>
        </div>
        <h3 style="font-size: 18px; font-weight: 800; color: #14233D; margin-bottom: 8px;">No Active Dataset Selected</h3>
        <p style="font-size: 13px; color: #64748B; margin-bottom: 24px; line-height: 1.6;">Select a dataset from the Datasets Hub to unlock the full Analytics Studio suite: Automated EDA, Custom Chart Builder, Correlations, and Anomaly Diagnostics.</p>
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
    <div class="space-y-6" style="display: flex; flex-direction: column; gap: 20px;">
      
      <!-- STUDIO HEADER & TOP ACTION BAR -->
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; border-bottom: 1px solid #E2E8F0; padding-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <!-- Distinct Analytics Studio Logo Badge -->
          <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, rgba(233,154,58,0.2) 0%, rgba(217,119,6,0.25) 100%); border: 1px solid rgba(233,154,58,0.4); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(233,154,58,0.15);">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E99A3A" stroke-width="2.5"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line><circle cx="12" cy="4" r="2" fill="#E99A3A"></circle></svg>
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h1 style="font-size: 22px; font-weight: 800; color: #14233D; margin: 0;">Analytics Studio</h1>
              <span class="os-badge-live" style="background: rgba(233,154,58,0.15); color: #B45309; border: 1px solid rgba(233,154,58,0.3); font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 12px;">Automated EDA & Visual Suite</span>
            </div>
            <p style="font-size: 12px; color: #64748B; margin-top: 2px;">
              Comprehensive data profiling, interactive Plotly visualization studio, Pearson correlations, and IQR anomaly fences.
            </p>
          </div>
        </div>

        <!-- Top Right Actions -->
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <button id="btn-switch-dataset-eda" class="btn btn-outline" style="font-size: 12px; padding: 7px 14px; font-weight: 700;">
            Change Dataset
          </button>
          <button id="btn-export-eda-json" class="btn btn-saffron" style="font-size: 12px; padding: 7px 16px; font-weight: 700;">
            Export EDA Summary
          </button>
        </div>
      </div>

      <!-- LOADING INDICATOR -->
      <div id="eda-loading" style="text-align: center; padding: 60px 20px; color: var(--slate);">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--saffron)" stroke-width="2.5" style="animation: spin 1s linear infinite; margin: 0 auto 12px; display: block;">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
        <div style="font-size: 15px; font-weight: 700; color: var(--navy);">Loading Business Analytics...</div>
        <div style="font-size: 12px; color: var(--slate); margin-top: 4px;">Calculating sales numbers, column summaries, and visual charts</div>
      </div>

      <!-- MAIN STUDIO CONTENT CONTAINER (Hidden until loaded) -->
      <div id="eda-content" style="display: none; flex-direction: column; gap: 20px;">
        
        <!-- TOP EXECUTIVE TELEMETRY HUD CARDS -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px;" id="eda-hud-grid">
          <div class="vss-card" style="padding: 14px; border-left: 4px solid var(--saffron);">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748B;">Total Rows</div>
            <div style="font-size: 22px; font-weight: 800; color: var(--navy); margin-top: 4px;" id="hud-eda-rows">--</div>
            <div style="font-size: 11px; color: #10B981; font-weight: 600;">Rows Analyzed</div>
          </div>
          <div class="vss-card" style="padding: 14px; border-left: 4px solid #3B82F6;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748B;">Total Columns</div>
            <div style="font-size: 22px; font-weight: 800; color: #1E40AF; margin-top: 4px;" id="hud-eda-cols">--</div>
            <div style="font-size: 11px; color: #64748B;" id="hud-eda-types-split">-- Num / -- Cat</div>
          </div>
          <div class="vss-card" style="padding: 14px; border-left: 4px solid #10B981;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748B;">Numeric Metrics</div>
            <div style="font-size: 22px; font-weight: 800; color: #047857; margin-top: 4px;" id="hud-eda-num">--</div>
            <div style="font-size: 11px; color: #10B981;">Values & Amounts</div>
          </div>
          <div class="vss-card" style="padding: 14px; border-left: 4px solid #8B5CF6;">
            <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748B;">Categories</div>
            <div style="font-size: 22px; font-weight: 800; color: #6D28D9; margin-top: 4px;" id="hud-eda-cat">--</div>
            <div style="font-size: 11px; color: #8B5CF6;">Text & Labels</div>
          </div>
          <div class="vss-card" style="padding: 14px; border-left: 4px solid #EF4444; position: relative;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: #64748B;">Outlier Points</div>
              <button id="btn-hud-jump-outliers" style="background: rgba(239, 68, 68, 0.1); color: #DC2626; border: 1px solid rgba(239, 68, 68, 0.25); border-radius: 4px; font-size: 10px; font-weight: 800; padding: 2px 7px; cursor: pointer;" title="Open Outlier Remover">⚡ Fix Outliers</button>
            </div>
            <div style="font-size: 22px; font-weight: 800; color: #DC2626; margin-top: 4px;" id="hud-eda-outliers">--</div>
            <div style="font-size: 11px; color: #B91C1C;" id="hud-eda-outlier-cols">-- cols affected</div>
          </div>
        </div>

        <!-- WORKSPACE SUB-NAVIGATION TABS (ALL FEATURES) -->
        <div class="studio-tab-bar" id="eda-tab-bar">
          <button class="studio-tab-btn active" data-tab="tab-findings">
            <span>📊</span> Executive Summary
          </button>
          <button class="studio-tab-btn" data-tab="tab-chart-studio">
            <span>📈</span> Visual Chart Studio
          </button>
          <button class="studio-tab-btn" data-tab="tab-statistics">
            <span>🔢</span> Metric Statistics
          </button>
          <button class="studio-tab-btn" data-tab="tab-correlations">
            <span>🔀</span> Metric Correlations
          </button>
          <button class="studio-tab-btn" data-tab="tab-outliers">
            <span>⚠️</span> Anomaly & Outliers
          </button>
          <button class="studio-tab-btn" data-tab="tab-categories">
            <span>🏷️</span> Category Breakdown
          </button>
          <button class="studio-tab-btn" data-tab="tab-trends">
            <span>📅</span> Trends Over Time
          </button>
        </div>

        <!-- ========================================== -->
        <!-- TAB 1: EXECUTIVE SUMMARY & KEY FINDINGS     -->
        <!-- ========================================== -->
        <div class="eda-tab-content" id="tab-findings" style="display: flex; flex-direction: column; gap: 16px;">
          <div class="vss-card" style="padding: 20px; background: linear-gradient(135deg, #FFFFFF 0%, #FFFBEB 100%); border-left: 5px solid var(--saffron);">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
              <span style="font-size: 18px;">⚡</span>
              <h3 style="font-size: 15px; font-weight: 800; color: var(--navy); margin: 0;">Automated Mathematical Insights & Intelligence Findings</h3>
            </div>
            <ul id="eda-insights-list" style="font-size: 13px; color: #334155; line-height: 1.7; padding-left: 20px; margin: 0;"></ul>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
            <div class="vss-card" style="padding: 20px;">
              <h3 style="font-size: 14px; font-weight: 800; color: var(--navy); margin-bottom: 10px;">Dataset Architecture</h3>
              <p style="font-size: 12px; color: #64748B; margin-bottom: 14px;">Structural metadata and high-level dimensionality summary.</p>
              <div style="display: flex; flex-direction: column; gap: 8px; font-size: 12px;">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 6px;">
                  <span style="color: #64748B;">Active Dataset:</span>
                  <b id="summary-ds-name" style="color: var(--navy);">--</b>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 6px;">
                  <span style="color: #64748B;">Primary Temporal Field:</span>
                  <b id="summary-date-col" style="color: var(--saffron);">None detected</b>
                </div>
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #F1F5F9; padding-bottom: 6px;">
                  <span style="color: #64748B;">Mathematical Health:</span>
                  <b style="color: #10B981;">100% Deterministic Engine Clean</b>
                </div>
              </div>
            </div>

            <div class="vss-card" style="padding: 20px;">
              <h3 style="font-size: 14px; font-weight: 800; color: var(--navy); margin-bottom: 10px;">Quick Launch Actions</h3>
              <p style="font-size: 12px; color: #64748B; margin-bottom: 14px;">Instant shortcuts to specialized analytics engines.</p>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                <button class="btn btn-outline" onclick="document.querySelector('[data-tab=tab-chart-studio]')?.click()" style="font-size: 12px; padding: 8px 14px;">
                  📈 Launch Chart Builder
                </button>
                <button class="btn btn-outline" onclick="document.querySelector('[data-tab=tab-correlations]')?.click()" style="font-size: 12px; padding: 8px 14px;">
                  🔀 View Correlations
                </button>
                <button class="btn btn-outline" onclick="window.navigateTo('#bi-dashboard')" style="font-size: 12px; padding: 8px 14px;">
                  📊 BI Dashboard &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB 2: INTERACTIVE CHART STUDIO BUILDER   -->
        <!-- ========================================== -->
        <div class="eda-tab-content" id="tab-chart-studio" style="display: none; flex-direction: column; gap: 16px;">
          
          <!-- Chart Control Card -->
          <div class="vss-card" style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
              <div>
                <h3 style="font-size: 15px; font-weight: 800; color: var(--navy); margin: 0;">Interactive Visual Chart Builder</h3>
                <p style="font-size: 12px; color: #64748B; margin-top: 2px;">Build customized Plotly charts with zoom, pan, hover tooltips, and high-resolution export.</p>
              </div>

              <!-- Quick Chart Preset Buttons -->
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                <button id="preset-bar-btn" class="btn" style="background: #F1F5F9; color: var(--navy); font-size: 11px; padding: 5px 10px; font-weight: 700;">Bar Chart</button>
                <button id="preset-trend-btn" class="btn" style="background: #F1F5F9; color: var(--navy); font-size: 11px; padding: 5px 10px; font-weight: 700;">Trend Line</button>
                <button id="preset-pie-btn" class="btn" style="background: #F1F5F9; color: var(--navy); font-size: 11px; padding: 5px 10px; font-weight: 700;">Donut Breakdown</button>
                <button id="preset-heatmap-btn" class="btn" style="background: #F1F5F9; color: var(--navy); font-size: 11px; padding: 5px 10px; font-weight: 700;">Correlation Heatmap</button>
              </div>
            </div>

            <!-- Builder Form -->
            <form id="chart-builder-form" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; align-items: flex-end;">
              <div>
                <label style="display: block; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 4px;">Chart Type</label>
                <select id="builder-chart-type" style="width: 100%; padding: 8px 10px; font-size: 12px; font-weight: 600; border-radius: 6px; border: 1px solid #CBD5E1;">
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Trend</option>
                  <option value="scatter">Scatter Plot</option>
                  <option value="pie">Pie / Donut Breakdown</option>
                  <option value="histogram">Distribution Histogram</option>
                  <option value="box">Box & Whisker Plot</option>
                  <option value="correlation_heatmap">Correlation Heatmap</option>
                  <option value="stacked_bar">Stacked Bar Breakdown</option>
                </select>
              </div>

              <div>
                <label style="display: block; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 4px;">X-Axis Dimension</label>
                <select id="builder-x-axis" style="width: 100%; padding: 8px 10px; font-size: 12px; font-weight: 600; border-radius: 6px; border: 1px solid #CBD5E1;"></select>
              </div>

              <div>
                <label style="display: block; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 4px;">Y-Axis Metric</label>
                <select id="builder-y-axis" style="width: 100%; padding: 8px 10px; font-size: 12px; font-weight: 600; border-radius: 6px; border: 1px solid #CBD5E1;"></select>
              </div>

              <div>
                <label style="display: block; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 4px;">Color / Group By</label>
                <select id="builder-color-dim" style="width: 100%; padding: 8px 10px; font-size: 12px; font-weight: 600; border-radius: 6px; border: 1px solid #CBD5E1;">
                  <option value="">None (Single Color)</option>
                </select>
              </div>

              <div>
                <label style="display: block; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 4px;">Chart Title</label>
                <input type="text" id="builder-title-input" placeholder="e.g. Sales Distribution" style="width: 100%; padding: 8px 10px; font-size: 12px; border-radius: 6px; border: 1px solid #CBD5E1;" />
              </div>

              <div>
                <button type="submit" id="btn-render-chart" class="btn btn-saffron" style="width: 100%; padding: 9px 16px; font-size: 12px; font-weight: 700;">
                  Generate Chart
                </button>
              </div>
            </form>
          </div>

          <!-- Chart Output Canvas Card -->
          <div class="vss-card" style="padding: 20px;">
            <div id="chart-builder-status" style="display: none; padding: 10px; border-radius: 6px; font-size: 12px; margin-bottom: 12px;"></div>
            <div id="builder-chart-canvas" style="width: 100%; min-height: 480px; background: #FAFBFD; border-radius: 8px; position: relative;">
              <div style="display: flex; align-items: center; justify-content: center; height: 480px;">
                <span style="font-size: 13px; color: #94A3B8;">Configuring chart visualization...</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB 3: NUMERIC DESCRIPTIVE STATISTICS      -->
        <!-- ========================================== -->
        <div class="eda-tab-content" id="tab-statistics" style="display: none; flex-direction: column; gap: 16px;">
          <div class="vss-card" style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
              <div>
                <h3 style="font-size: 15px; font-weight: 800; color: var(--navy); margin: 0;">Numeric Feature Descriptive Statistics</h3>
                <p style="font-size: 12px; color: #64748B; margin-top: 2px;">Parametric and non-parametric statistical metrics for all numeric features.</p>
              </div>
              <div>
                <input type="text" id="stats-search-input" placeholder="Search feature name..." style="padding: 7px 12px; font-size: 12px; border-radius: 6px; border: 1px solid #CBD5E1; width: 220px;" />
              </div>
            </div>

            <div style="overflow-x: auto; max-height: 500px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left; white-space: nowrap;">
                <thead style="background: #F8FAFC; border-bottom: 2px solid #E2E8F0; position: sticky; top: 0; z-index: 10;">
                  <tr>
                    <th style="padding: 10px 12px; font-weight: 700; color: #475569;">Feature Name</th>
                    <th style="padding: 10px 12px; font-weight: 700; color: #475569;">Mean</th>
                    <th style="padding: 10px 12px; font-weight: 700; color: #475569;">Median</th>
                    <th style="padding: 10px 12px; font-weight: 700; color: #475569;">Std Dev</th>
                    <th style="padding: 10px 12px; font-weight: 700; color: #475569;">Min</th>
                    <th style="padding: 10px 12px; font-weight: 700; color: #475569;">Max</th>
                    <th style="padding: 10px 12px; font-weight: 700; color: #475569;">IQR (Spread)</th>
                    <th style="padding: 10px 12px; font-weight: 700; color: #475569;">Skewness</th>
                    <th style="padding: 10px 12px; font-weight: 700; color: #475569;">Kurtosis</th>
                  </tr>
                </thead>
                <tbody id="eda-stats-tbody" style="divide-y: 1px solid #F1F5F9;"></tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB 4: CORRELATION HEATMAP & RELATIONSHIPS -->
        <!-- ========================================== -->
        <div class="eda-tab-content" id="tab-correlations" style="display: none; flex-direction: column; gap: 16px;">
          <div style="display: grid; grid-template-columns: 1fr; lg:grid-template-columns: 1.2fr 1fr; gap: 16px;">
            
            <!-- Correlation Matrix Plot -->
            <div class="vss-card" style="padding: 20px;">
              <h3 style="font-size: 15px; font-weight: 800; color: var(--navy); margin-bottom: 4px;">Pearson Correlation Heatmap</h3>
              <p style="font-size: 12px; color: #64748B; margin-bottom: 14px;">Pairwise linear dependencies across all numerical features.</p>
              <div id="eda-heatmap-canvas" style="width: 100%; min-height: 380px; background: #FAFBFD; border-radius: 8px;"></div>
            </div>

            <!-- Top Relationship Pairs List -->
            <div class="vss-card" style="padding: 20px;">
              <h3 style="font-size: 15px; font-weight: 800; color: var(--navy); margin-bottom: 4px;">Strongest Feature Relationships</h3>
              <p style="font-size: 12px; color: #64748B; margin-bottom: 14px;">Key cross-feature correlations (|r| &ge; 0.10) ranked by magnitude.</p>
              <div id="eda-corrs-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto; padding-right: 4px;"></div>
            </div>

          </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB 5: ANOMALY & OUTLIER DETECTION (IQR)   -->
        <!-- ========================================== -->
        <div class="eda-tab-content" id="tab-outliers" style="display: none; flex-direction: column; gap: 16px;">
          <!-- OUTLIER REMOVER & CLEANER ACTION CARD -->
          <div class="vss-card" style="padding: 20px; background: linear-gradient(135deg, #FFFDF8 0%, #FFFBEB 100%); border: 1.5px solid #F59E0B; border-radius: 12px; box-shadow: 0 4px 14px rgba(245, 158, 11, 0.12);">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 44px; height: 44px; border-radius: 10px; background: rgba(245, 158, 11, 0.2); display: flex; align-items: center; justify-content: center; font-size: 22px;">
                  🧹
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <h3 style="font-size: 16px; font-weight: 800; color: #92400E; margin: 0;">Fix & Clean Abnormal Outliers</h3>
                    <span style="background: #FEF3C7; color: #B45309; border: 1px solid #FCD34D; font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 10px;">Keeps Original File Safe</span>
                  </div>
                  <p style="font-size: 12px; color: #78350F; margin: 4px 0 0 0;">
                    Clean abnormal data spikes or clerical errors so your revenue charts and sales forecasts stay accurate.
                  </p>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                <div>
                  <label style="display: block; font-size: 10px; font-weight: 800; color: #92400E; text-transform: uppercase; margin-bottom: 3px;">Handling Method</label>
                  <select id="select-outlier-remover-mode" style="padding: 7px 12px; font-size: 12px; font-weight: 700; border-radius: 6px; border: 1px solid #D97706; background: #FFFFFF; color: #78350F;">
                    <option value="drop">🗑️ Remove outlier rows (Best for bad entries)</option>
                    <option value="cap">✂️ Cap to normal range (Keep rows, clip spikes)</option>
                  </select>
                </div>
                <div style="align-self: flex-end;">
                  <button id="btn-run-outlier-removal" class="btn btn-saffron" style="font-size: 12px; font-weight: 800; padding: 8px 18px; box-shadow: 0 4px 12px rgba(233,154,58,0.35); display: inline-flex; align-items: center; gap: 6px;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    <span>Clean Outliers Now</span>
                  </button>
                </div>
              </div>
            </div>
            
            <div id="outlier-remover-status" style="display: none; padding: 10px 14px; border-radius: 8px; font-size: 12px; font-weight: 600; margin-top: 12px;"></div>
          </div>

          <div class="vss-card" style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
              <div>
                <h3 style="font-size: 15px; font-weight: 800; color: var(--navy); margin: 0;">Statistical Outlier & Anomaly Diagnostics</h3>
                <p style="font-size: 12px; color: #64748B; margin-top: 2px;">Tukey's 1.5&times; Interquartile Range (IQR) fence boundaries across numeric columns.</p>
              </div>
              <span class="os-metric-pill" style="color: #DC2626; background: #FEE2E2; border: 1px solid #FECACA;">1.5&times; IQR Fences Active</span>
            </div>

            <div id="eda-outliers-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px;"></div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB 6: CATEGORICAL DISTRIBUTIONS           -->
        <!-- ========================================== -->
        <div class="eda-tab-content" id="tab-categories" style="display: none; flex-direction: column; gap: 16px;">
          <div class="vss-card" style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
              <div>
                <h3 style="font-size: 15px; font-weight: 800; color: var(--navy); margin: 0;">Categorical Frequency & Share Analyzer</h3>
                <p style="font-size: 12px; color: #64748B; margin-top: 2px;">Discrete dimension value counts, occurrence frequency, and percentage share.</p>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 12px; font-weight: 700; color: #64748B;">Select Dimension:</span>
                <select id="cat-dim-selector" style="padding: 6px 12px; font-size: 12px; font-weight: 700; border-radius: 6px; border: 1px solid #CBD5E1; color: var(--navy);"></select>
              </div>
            </div>

            <div id="cat-dim-content" style="display: flex; flex-direction: column; gap: 10px;"></div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB 7: LONGITUDINAL TRENDS & TIME SERIES   -->
        <!-- ========================================== -->
        <div class="eda-tab-content" id="tab-trends" style="display: none; flex-direction: column; gap: 16px;">
          <div class="vss-card" style="padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
              <div>
                <h3 style="font-size: 15px; font-weight: 800; color: var(--navy); margin: 0;">Longitudinal Trend & Temporal Resampling</h3>
                <p style="font-size: 12px; color: #64748B; margin-top: 2px;">Resample periodic time-series metrics over Daily, Weekly, Monthly, or Quarterly intervals.</p>
              </div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                <select id="time-date-select" style="padding: 6px 10px; font-size: 12px; border-radius: 6px; border: 1px solid #CBD5E1;"></select>
                <select id="time-val-select" style="padding: 6px 10px; font-size: 12px; border-radius: 6px; border: 1px solid #CBD5E1;"></select>
                <select id="time-freq-select" style="padding: 6px 10px; font-size: 12px; border-radius: 6px; border: 1px solid #CBD5E1;">
                  <option value="M">Monthly (M)</option>
                  <option value="W">Weekly (W)</option>
                  <option value="Q">Quarterly (Q)</option>
                  <option value="D">Daily (D)</option>
                </select>
                <button id="btn-update-trend" class="btn btn-primary" style="padding: 6px 14px; font-size: 12px;">Update Trend</button>
              </div>
            </div>

            <div id="trend-chart-div" style="width: 100%; min-height: 380px; background: #FAFBFD; border-radius: 8px;"></div>
          </div>
        </div>

      </div>
    </div>
  `;

  // Fetch Full EDA Data
  let edaData = null;
  try {
    edaData = await API.getFullEDA(activeDatasetId);
    const loadingEl = document.getElementById("eda-loading");
    const contentEl = document.getElementById("eda-content");
    if (loadingEl) loadingEl.style.display = "none";
    if (contentEl) contentEl.style.display = "flex";

    // 1. Fill HUD Metrics
    const overview = edaData.overview || {};
    const statsObj = edaData.descriptive_statistics || {};
    const catDist = edaData.categorical_distributions || {};
    const outliers = edaData.outliers || {};

    const elRows = document.getElementById("hud-eda-rows");
    const elCols = document.getElementById("hud-eda-cols");
    const elSplit = document.getElementById("hud-eda-types-split");
    const elNum = document.getElementById("hud-eda-num");
    const elCat = document.getElementById("hud-eda-cat");
    const elOut = document.getElementById("hud-eda-outliers");
    const elOutCols = document.getElementById("hud-eda-outlier-cols");

    if (elRows) elRows.innerText = (overview.total_rows || 0).toLocaleString();
    if (elCols) elCols.innerText = (overview.total_columns || 0);
    if (elSplit) elSplit.innerText = `${overview.numeric_columns_count || 0} Num / ${overview.categorical_columns_count || 0} Cat`;
    if (elNum) elNum.innerText = (overview.numeric_columns_count || 0);
    if (elCat) elCat.innerText = (overview.categorical_columns_count || 0);
    if (elOut) elOut.innerText = (outliers.total_outlier_points || 0).toLocaleString();
    if (elOutCols) elOutCols.innerText = `${outliers.columns_with_outliers || 0} cols with anomalies`;

    // 2. Tab 1: Executive Findings
    const listEl = document.getElementById("eda-insights-list");
    if (listEl) {
      if (edaData.insights && edaData.insights.length > 0) {
        listEl.innerHTML = edaData.insights.map(i => `<li style="margin-bottom: 6px;">${i}</li>`).join("");
      } else {
        listEl.innerHTML = `<li>All features profiled within nominal operational thresholds.</li>`;
      }
    }
    const nameEl = document.getElementById("summary-ds-name");
    if (nameEl) nameEl.innerText = edaData.dataset_name || "Active Commercial Dataset";
    const dateEl = document.getElementById("summary-date-col");
    if (dateEl) {
      dateEl.innerText = (overview.date_columns && overview.date_columns.length > 0) ? overview.date_columns[0] : "None detected";
    }

    // 3. Setup Workspace Tab Switching
    document.querySelectorAll(".studio-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".studio-tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const targetId = btn.getAttribute("data-tab");
        document.querySelectorAll(".eda-tab-content").forEach(c => {
          c.style.display = (c.id === targetId) ? "flex" : "none";
        });

        // Trigger chart resizes if switching to chart tabs
        if (targetId === "tab-chart-studio") {
          const canvas = document.getElementById("builder-chart-canvas");
          if (canvas && window.Plotly) window.Plotly.Plots.resize(canvas);
        } else if (targetId === "tab-correlations") {
          renderCorrelationHeatmap();
        } else if (targetId === "tab-trends") {
          loadTrendPlot();
        }
      });
    });

    // 4. Tab 2: Setup Chart Builder Dropdowns
    const numericCols = Object.keys(statsObj);
    const allCols = [...numericCols, ...Object.keys(catDist), ...(overview.date_columns || [])];
    const uniqueCols = Array.from(new Set(allCols));

    const xSel = document.getElementById("builder-x-axis");
    const ySel = document.getElementById("builder-y-axis");
    const colorSel = document.getElementById("builder-color-dim");
    const typeSel = document.getElementById("builder-chart-type");

    if (xSel) {
      xSel.innerHTML = uniqueCols.map(c => `<option value="${c}">${c}</option>`).join("");
    }
    if (ySel) {
      ySel.innerHTML = `
        <option value="">(None - Count)</option>
        ${numericCols.map(c => `<option value="${c}">${c}</option>`).join("")}
      `;
    }
    if (colorSel) {
      colorSel.innerHTML = `
        <option value="">None (Single Color)</option>
        ${Object.keys(catDist).map(c => `<option value="${c}">${c}</option>`).join("")}
      `;
    }

    // Chart Render Function
    const renderBuilderChart = async () => {
      const chartType = typeSel?.value || "bar";
      const xVal = xSel?.value || uniqueCols[0];
      const yVal = ySel?.value || (numericCols.length > 0 ? numericCols[0] : null);
      const colorVal = colorSel?.value || null;
      const titleVal = document.getElementById("builder-title-input")?.value || `${chartType.toUpperCase()} of ${xVal}`;
      const canvas = document.getElementById("builder-chart-canvas");
      const statusEl = document.getElementById("chart-builder-status");

      if (!canvas) return;

      try {
        canvas.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 480px; text-align: center; color: var(--slate);">
            <div>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--saffron)" stroke-width="2" style="animation: spin 1s linear infinite; margin: 0 auto 8px; display: block;">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
              </svg>
              <span style="font-size: 12px; font-weight: 600;">Rendering Interactive Chart...</span>
            </div>
          </div>
        `;

        const spec = await API.getChartSpec(activeDatasetId, chartType, xVal, yVal, colorVal, titleVal);
        if (statusEl) statusEl.style.display = "none";

        // Try Plotly
        const plotly = await ensurePlotly();
        if (plotly && spec.data && spec.layout) {
          canvas.innerHTML = "";
          canvas.style.display = "block";
          canvas.style.width = "100%";
          canvas.style.minHeight = "480px";
          spec.layout.autosize = true;
          spec.layout.height = 480;
          delete spec.layout.width;
          spec.layout.margin = { l: 55, r: 35, t: 50, b: 50 };
          await plotly.newPlot("builder-chart-canvas", spec.data, spec.layout, { responsive: true, displayModeBar: true });
          plotly.Plots.resize(canvas);
        } else {
          canvas.style.display = "block";
          // Instant SVG Fallback
          autoRenderSpec("builder-chart-canvas", spec);
        }
      } catch (e) {
        console.error("Failed to render custom chart:", e);
        if (statusEl) {
          statusEl.style.display = "block";
          statusEl.style.background = "#FEE2E2";
          statusEl.style.color = "#DC2626";
          statusEl.innerText = `Chart Error: ${e.message}`;
        }
      }
    };

    document.getElementById("chart-builder-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      renderBuilderChart();
    });

    // Preset button handlers
    document.getElementById("preset-bar-btn")?.addEventListener("click", () => {
      if (typeSel) typeSel.value = "bar";
      renderBuilderChart();
    });
    document.getElementById("preset-trend-btn")?.addEventListener("click", () => {
      if (typeSel) typeSel.value = "line";
      if (overview.date_columns && overview.date_columns.length > 0 && xSel) {
        xSel.value = overview.date_columns[0];
      }
      renderBuilderChart();
    });
    document.getElementById("preset-pie-btn")?.addEventListener("click", () => {
      if (typeSel) typeSel.value = "pie";
      renderBuilderChart();
    });
    document.getElementById("preset-heatmap-btn")?.addEventListener("click", () => {
      if (typeSel) typeSel.value = "correlation_heatmap";
      renderBuilderChart();
    });

    // Initial default render
    renderBuilderChart();

    // 5. Tab 3: Numeric Descriptive Statistics Table
    const statsBody = document.getElementById("eda-stats-tbody");
    const renderStatsRows = (filter = "") => {
      if (!statsBody) return;
      const rows = Object.entries(statsObj).filter(([col]) => col.toLowerCase().includes(filter.toLowerCase()));
      if (rows.length === 0) {
        statsBody.innerHTML = `<tr><td colspan="9" style="padding: 20px; text-align: center; color: var(--slate);">No matching numeric features.</td></tr>`;
        return;
      }
      statsBody.innerHTML = rows.map(([col, s]) => `
        <tr style="border-bottom: 1px solid #F1F5F9; font-family: monospace;">
          <td style="padding: 9px 12px; font-family: sans-serif; font-weight: 700; color: var(--navy);">${col}</td>
          <td style="padding: 9px 12px;">${Number(s.mean).toLocaleString()}</td>
          <td style="padding: 9px 12px;">${Number(s.median).toLocaleString()}</td>
          <td style="padding: 9px 12px; color: #64748B;">${Number(s.std).toLocaleString()}</td>
          <td style="padding: 9px 12px;">${Number(s.min).toLocaleString()}</td>
          <td style="padding: 9px 12px;">${Number(s.max).toLocaleString()}</td>
          <td style="padding: 9px 12px; color: #64748B;">${Number(s.iqr).toLocaleString()}</td>
          <td style="padding: 9px 12px; ${Math.abs(s.skewness) > 1 ? 'color: #D97706; font-weight: 700;' : ''}">${s.skewness}</td>
          <td style="padding: 9px 12px; color: #64748B;">${s.kurtosis}</td>
        </tr>
      `).join("");
    };
    renderStatsRows();

    document.getElementById("stats-search-input")?.addEventListener("input", (e) => {
      renderStatsRows(e.target.value);
    });

    // 6. Tab 4: Correlations List & Heatmap
    const corrsList = document.getElementById("eda-corrs-list");
    const topPairs = edaData.correlations?.top_correlations || [];
    if (corrsList) {
      if (topPairs.length === 0) {
        corrsList.innerHTML = `<div style="font-size: 12px; color: #94A3B8; padding: 12px;">No significant multi-feature correlations (|r| &ge; 0.10) found.</div>`;
      } else {
        corrsList.innerHTML = topPairs.map(p => {
          const isPos = p.correlation >= 0;
          return `
            <div style="padding: 10px 14px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-size: 12px; font-weight: 800; color: var(--navy);">${p.col1} &harr; ${p.col2}</div>
                <div style="font-size: 11px; color: #64748B;">${p.relationship || 'Linear Relationship'}</div>
              </div>
              <div style="text-align: right;">
                <span style="display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 800; font-family: monospace; ${isPos ? 'background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0;' : 'background: #FFF1F2; color: #BE123C; border: 1px solid #FECDD3;'}">
                  r = ${p.correlation}
                </span>
              </div>
            </div>
          `;
        }).join("");
      }
    }

    let heatmapLoaded = false;
    async function renderCorrelationHeatmap() {
      if (heatmapLoaded) return;
      const heatmapCanvas = document.getElementById("eda-heatmap-canvas");
      if (!heatmapCanvas) return;
      try {
        const spec = await API.getChartSpec(activeDatasetId, "correlation_heatmap", "all");
        const plotly = await ensurePlotly();
        if (plotly && spec.data && spec.layout) {
          plotly.newPlot("eda-heatmap-canvas", spec.data, spec.layout, { responsive: true });
          heatmapLoaded = true;
        }
      } catch (e) {
        console.warn("Could not render correlation heatmap:", e);
      }
    }

    // 7. Tab 5: Anomaly & Outliers
    const outGrid = document.getElementById("eda-outliers-grid");
    const outDetails = edaData.outliers?.details || {};
    const outKeys = Object.keys(outDetails);
    if (outGrid) {
      if (outKeys.length === 0) {
        outGrid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: #10B981; background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; font-size: 13px; font-weight: 700;">
            ✓ Clean Dataset: No outlier points detected outside 1.5&times; IQR fences.
          </div>
        `;
      } else {
        outGrid.innerHTML = outKeys.map(k => {
          const item = outDetails[k];
          return `
            <div style="padding: 14px; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <b style="font-size: 13px; color: var(--navy);">${k}</b>
                <span style="font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 10px; background: #FEE2E2; color: #DC2626;">
                  ${item.outlier_count} Outliers (${item.outlier_percentage}%)
                </span>
              </div>
              <div style="font-size: 11px; color: #64748B; margin-bottom: 4px;">
                Acceptable Range: [${Number(item.lower_bound).toLocaleString()} &hellip; ${Number(item.upper_bound).toLocaleString()}]
              </div>
              <div style="width: 100%; height: 6px; background: #F1F5F9; border-radius: 3px; overflow: hidden; margin-top: 8px;">
                <div style="width: ${Math.min(100, item.outlier_percentage * 3)}%; height: 100%; background: #EF4444; border-radius: 3px;"></div>
              </div>
            </div>
          `;
        }).join("");
      }
    }

    // 8. Tab 6: Categorical Value Counts
    const catSelector = document.getElementById("cat-dim-selector");
    const catContent = document.getElementById("cat-dim-content");
    const catKeys = Object.keys(catDist);

    if (catKeys.length === 0) {
      if (catContent) catContent.innerHTML = `<div style="font-size: 12px; color: #94A3B8; padding: 16px;">No discrete categorical columns found.</div>`;
    } else {
      if (catSelector) {
        catSelector.innerHTML = catKeys.map(k => `<option value="${k}">${k}</option>`).join("");
      }

      const renderCatDist = (key) => {
        if (!catContent) return;
        const dist = catDist[key] || {};
        const entries = Object.entries(dist);
        const total = entries.reduce((acc, [, v]) => acc + v, 0) || 1;

        catContent.innerHTML = entries.map(([val, count]) => {
          const pct = ((count / total) * 100).toFixed(1);
          return `
            <div style="padding: 10px 14px; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                <b style="color: var(--navy);">${val || '(Blank / Missing)'}</b>
                <span style="color: #64748B;"><b>${count.toLocaleString()}</b> records (${pct}%)</span>
              </div>
              <div style="width: 100%; height: 6px; background: #E2E8F0; border-radius: 3px; overflow: hidden;">
                <div style="width: ${pct}%; height: 100%; background: var(--saffron); border-radius: 3px;"></div>
              </div>
            </div>
          `;
        }).join("");
      };

      catSelector?.addEventListener("change", (e) => renderCatDist(e.target.value));
      renderCatDist(catKeys[0]);
    }

    // 9. Tab 7: Longitudinal Trend
    const dateCols = overview.date_columns || [];
    const dateSel = document.getElementById("time-date-select");
    const valSel = document.getElementById("time-val-select");

    if (dateCols.length === 0 || numericCols.length === 0) {
      const trendDiv = document.getElementById("trend-chart-div");
      if (trendDiv) trendDiv.innerHTML = `<div style="padding: 40px; text-align: center; color: #94A3B8; font-size: 12px;">No temporal date column detected in this dataset for longitudinal trend analysis.</div>`;
    } else {
      if (dateSel) dateSel.innerHTML = dateCols.map(c => `<option value="${c}">${c}</option>`).join("");
      if (valSel) valSel.innerHTML = numericCols.map(c => `<option value="${c}">${c}</option>`).join("");

      async function loadTrendPlot() {
        const dCol = dateSel?.value || dateCols[0];
        const vCol = valSel?.value || numericCols[0];
        const freq = document.getElementById("time-freq-select")?.value || "M";

        try {
          const trendRes = await API.getTimeTrend(activeDatasetId, dCol, vCol, freq);
          if (trendRes.labels && trendRes.labels.length) {
            renderSVGLineChart("trend-chart-div", {
              labels: trendRes.labels,
              values: trendRes.values,
              title: `Temporal Trend of ${vCol}`,
              color: "#E99A3A"
            });

            const plotly = await ensurePlotly();
            if (plotly) {
              const trace = {
                x: trendRes.labels,
                y: trendRes.values,
                type: "scatter",
                mode: "lines+markers",
                line: { color: "#E99A3A", width: 2.5 },
                marker: { color: "#14233D", size: 6 }
              };
              const layout = {
                margin: { l: 50, r: 20, t: 30, b: 40 },
                xaxis: { title: "Time Interval" },
                yaxis: { title: vCol }
              };
              plotly.newPlot("trend-chart-div", [trace], layout, { responsive: true });
            }
          }
        } catch (e) {
          console.warn("Trend load error:", e);
        }
      }

      document.getElementById("btn-update-trend")?.addEventListener("click", loadTrendPlot);
    }

    // 9. Outlier Remover & Jump Actions
    document.getElementById("btn-hud-jump-outliers")?.addEventListener("click", () => {
      const tabBtn = document.querySelector('.studio-tab-btn[data-tab="tab-outliers"]');
      if (tabBtn) tabBtn.click();
    });

    const btnRunOutliers = document.getElementById("btn-run-outlier-removal");
    const outlierStatus = document.getElementById("outlier-remover-status");
    const outlierModeSelect = document.getElementById("select-outlier-remover-mode");

    btnRunOutliers?.addEventListener("click", async () => {
      const mode = outlierModeSelect?.value || "drop";
      btnRunOutliers.disabled = true;
      if (outlierStatus) {
        outlierStatus.style.display = "block";
        outlierStatus.style.background = "#EFF6FF";
        outlierStatus.style.color = "#1D4ED8";
        outlierStatus.style.border = "1px solid #BFDBFE";
        outlierStatus.innerHTML = `<span style="display:inline-block; animation: spin 1s linear infinite; margin-right: 6px;">⏳</span> Executing ${mode === 'drop' ? 'outlier row removal' : 'winsorization'} across all anomaly columns...`;
      }

      try {
        const res = await API.removeOutliers(activeDatasetId, {
          strategy: mode,
          iqr_multiplier: 1.5
        });

        if (outlierStatus) {
          outlierStatus.style.background = "#ECFDF5";
          outlierStatus.style.color = "#047857";
          outlierStatus.style.border = "1px solid #A7F3D0";
          const actionsText = res.summary?.actions_performed?.join("<br>• ") || "Outliers successfully treated.";
          outlierStatus.innerHTML = `
            <div style="font-weight: 800; margin-bottom: 4px;">✅ Outlier Removal Complete!</div>
            <div style="font-size: 11px; color: #065F46; line-height: 1.5;">• ${actionsText}</div>
            <div style="font-size: 11px; margin-top: 6px; font-weight: 700; color: #0D9488;">Auto-switching active workspace to newly cleaned dataset: "${res.name}"...</div>
          `;
        }

        // Auto-switch to the new cleaned dataset
        if (res.new_dataset_id) {
          API.setActiveDatasetId(res.new_dataset_id);
          window.dispatchEvent(new CustomEvent("vss:dataset-changed", { detail: { id: res.new_dataset_id } }));
          setTimeout(() => {
            window.navigateTo("#analytics-studio");
          }, 1500);
        }
      } catch (err) {
        if (outlierStatus) {
          outlierStatus.style.display = "block";
          outlierStatus.style.background = "#FEF2F2";
          outlierStatus.style.color = "#DC2626";
          outlierStatus.style.border = "1px solid #FECACA";
          outlierStatus.innerHTML = `❌ <b>Failed to remove outliers:</b> ${err.message || 'Unknown error'}`;
        }
        btnRunOutliers.disabled = false;
      }
    });

    // Export Summary Action
    document.getElementById("btn-export-eda-json")?.addEventListener("click", () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(edaData, null, 2));
      const dlAnchor = document.createElement("a");
      dlAnchor.setAttribute("href", dataStr);
      dlAnchor.setAttribute("download", `EDA_Report_${edaData.dataset_name || 'dataset'}.json`);
      document.body.appendChild(dlAnchor);
      dlAnchor.click();
      dlAnchor.remove();
    });

    // Switch Dataset Action
    document.getElementById("btn-switch-dataset-eda")?.addEventListener("click", () => {
      window.navigateTo("#datasets");
    });

  } catch (err) {
    console.error("EDA render error:", err);
    if (err.message && err.message.includes("404")) {
      try {
        const datasets = await API.listDatasets();
        if (datasets && datasets.length > 0 && datasets[0].id !== activeDatasetId) {
          API.setActiveDatasetId(datasets[0].id);
          renderAnalyticsStudio(container);
          return;
        }
      } catch (e) {}
    }
    const loadingEl = document.getElementById("eda-loading");
    if (loadingEl) {
      loadingEl.innerHTML = `
        <div style="padding: 24px; color: #DC2626; background: #FEE2E2; border-radius: 8px; max-width: 500px; margin: 0 auto; text-align: center;">
          <h4 style="font-weight: 800; font-size: 14px; margin-bottom: 6px;">Failed to generate Analytics Studio summary</h4>
          <p style="font-size: 12px; margin-bottom: 14px;">${err.message}</p>
          <button onclick="window.location.reload()" class="btn btn-primary" style="font-size: 12px; padding: 6px 14px;">Retry</button>
        </div>
      `;
    }
  }
}
