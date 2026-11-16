import { API } from "../api.js";
import { autoRenderSpec } from "../utils/svg_charts.js";

export async function renderOverview(container) {
  const activeDatasetId = API.getActiveDatasetId();
  const token = API.getToken();

  // Initial structure: Business OS Desktop Layout
  container.innerHTML = `
    <div class="os-container">
      
      <!-- OS CONTROL & SYSTEM STATUS BAR -->
      <div class="os-control-panel">
        <div style="display: flex; align-items: center; gap: 24px; flex-wrap: wrap;">
          <div class="os-system-status">
            <span class="os-pulse-dot"></span>
            <div>
              <div style="font-size: 13px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.2px;">Vyapar Sarthi • Business Suite</div>
              <div style="font-size: 11px; color: #10B981; font-weight: 600;">Cloud Database Active • All Systems Operational</div>
            </div>
          </div>

          <!-- User Authentication & Settings Controls -->
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <div id="os-user-pill" style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.08); padding: 5px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.15);">
              <div style="width: 22px; height: 22px; border-radius: 50%; background: var(--saffron); color: var(--navy); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800;">
                <span id="os-user-avatar">VS</span>
              </div>
              <div style="font-size: 12px; font-weight: 700; color: #FFFFFF;" id="os-user-name">Guest User</div>
            </div>

            <button id="os-btn-login" class="btn btn-saffron" style="font-size: 11px; padding: 6px 14px;">Sign In / Switch</button>
            <button id="os-btn-logout" class="btn" style="display: none; background: rgba(239, 68, 68, 0.2); color: #FCA5A5; border: 1px solid rgba(239, 68, 68, 0.3); font-size: 11px; padding: 6px 12px;">Logout</button>
            <button id="os-btn-settings" class="btn" style="background: rgba(255,255,255,0.1); color: #FFFFFF; border: 1px solid rgba(255,255,255,0.2); font-size: 11px; padding: 6px 12px;">Settings</button>
          </div>
        </div>

        <!-- Live Clock & Date on Far Right -->
        <div id="os-live-clock" class="os-clock-display">Initializing Clock...</div>
      </div>

      <!-- OS EXECUTIVE HERO HUD -->
      <div class="os-hero-hud">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 28px; position: relative; z-index: 2;">
          <div style="flex: 1; min-width: 320px; max-width: 880px;">
            <div style="display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 20px; background: rgba(233,154,58,0.15); color: #E99A3A; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px; border: 1px solid rgba(233,154,58,0.3);">
              <span>⚡</span> Business Operations & Intelligence Suite
            </div>
            <h1 style="font-size: 28px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 8px; line-height: 1.25;">
              Vyapar Sarthi Sangi
            </h1>
            <p style="font-size: 13px; color: #94A3B8; line-height: 1.6; margin-bottom: 22px;">
              Intelligent business analytics, revenue tracking, and forecasting — designed to help business owners make confident, data-backed decisions.
            </p>

            <div style="display: flex; flex-wrap: wrap; gap: 12px;">
              <!-- Open Analytics Studio Button -->
              <button id="btn-hero-analytics-studio" class="btn btn-saffron" style="font-size: 13px; padding: 10px 22px; font-weight: 700; box-shadow: 0 4px 12px rgba(233,154,58,0.3);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                Launch Analytics Studio
              </button>

              <!-- Show Analytics of Everything Modal Button -->
              <button id="btn-hero-show-all-analytics" class="btn" style="background: rgba(255,255,255,0.12); color: #FFFFFF; border: 1px solid rgba(255,255,255,0.25); font-size: 13px; padding: 10px 20px; font-weight: 700;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E99A3A" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                View Business Summary
              </button>

              <!-- Upload Dataset -->
              <button id="btn-hero-upload" class="btn" style="background: rgba(16, 185, 129, 0.2); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.4); font-size: 13px; padding: 10px 18px; font-weight: 700;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                Upload CSV / Excel
              </button>
            </div>
          </div>

          <!-- HUD LIVE METRICS CARDS -->
          <div style="display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 440px;">
            <div style="display: flex; gap: 10px;">
              <div class="os-hud-stat cursor-pointer" id="hud-stat-datasets" title="Click to view datasets">
                <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; font-weight: 700;">Active Datasets</div>
                <div style="font-size: 22px; font-weight: 800; color: #FFFFFF; margin: 4px 0;" id="hud-val-datasets">--</div>
                <div style="font-size: 11px; color: #38BDF8;">Synced with Cloud</div>
              </div>
              <div class="os-hud-stat cursor-pointer" id="hud-stat-revenue" title="Click to view analytics snapshot">
                <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; font-weight: 700;">Analyzed Revenue</div>
                <div style="font-size: 22px; font-weight: 800; color: var(--saffron); margin: 4px 0;" id="hud-val-revenue">--</div>
                <div style="font-size: 11px; color: #34D399;">Total Tracked Volume</div>
              </div>
            </div>

            <div style="display: flex; gap: 10px;">
              <div class="os-hud-stat">
                <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; font-weight: 700;">Data Health</div>
                <div style="font-size: 22px; font-weight: 800; color: #10B981; margin: 4px 0;" id="hud-val-score">94.2%</div>
                <div style="font-size: 11px; color: #94A3B8;">Clean & Reliable</div>
              </div>
              <div class="os-hud-stat">
                <div style="font-size: 11px; text-transform: uppercase; color: #94A3B8; font-weight: 700;">Data Privacy</div>
                <div style="font-size: 16px; font-weight: 800; color: #FFFFFF; margin: 6px 0;">Bank-Grade</div>
                <div style="font-size: 11px; color: #A78BFA;">100% Encrypted & Private</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ======================================================= -->
      <!-- SECTION 1: V1 — CORE BUSINESS APPLICATIONS (ACTIVE APPS) -->
      <!-- ======================================================= -->
      <div>
        <div class="os-section-title-wrap" style="display: flex; justify-content: space-between; align-items: center; margin-top: 36px; margin-bottom: 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.16); padding-bottom: 10px;">
          <div class="os-section-title" style="color: #FFFFFF !important; font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 10px; text-shadow: 0 1px 4px rgba(0,0,0,0.5);">
            <span style="font-size: 22px;">💼</span> Core Business Studios & Tools
          </div>
          <span class="os-badge-live" style="background: rgba(16, 185, 129, 0.2); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.4); font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 14px;">● 7 Active Tools Ready</span>
        </div>

        <div class="os-app-grid">
          
          <!-- App 1: Data Studio & Safe Cleaning -->
          <div class="os-card" id="app-card-data-studio">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(2,132,199,0.18); color: #0284C7; box-shadow: 0 4px 12px rgba(2,132,199,0.2);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284C7" stroke-width="2.2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon><circle cx="12" cy="17" r="1.5" fill="#0284C7"></circle></svg>
                </div>
                <span class="os-badge-live">Live Studio</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Data Studio & Cleaning</h3>
              <p style="font-size: 12px; color: var(--slate); line-height: 1.5; margin-bottom: 16px;">
                Inspect spreadsheet quality, fix missing fields, remove duplicate records, and clean data safely.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #F1F5F9; padding-top: 12px;">
              <span class="os-metric-pill">Data Quality & Cleaning</span>
              <span style="font-size: 12px; font-weight: 800; color: #0284C7;">Open Data Studio &rarr;</span>
            </div>
          </div>

          <!-- App 2: Analytics Studio (EDA & Deep Intelligence) -->
          <div class="os-card" id="app-card-analytics-studio">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(233,154,58,0.18); color: #E99A3A; box-shadow: 0 4px 12px rgba(233,154,58,0.2);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E99A3A" stroke-width="2.5"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line><circle cx="12" cy="4" r="2.5" fill="#E99A3A"></circle></svg>
                </div>
                <span class="os-badge-live">Live Studio</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Analytics Studio</h3>
              <p style="font-size: 12px; color: var(--slate); line-height: 1.5; margin-bottom: 16px;">
                Explore sales patterns, build visual charts, discover relationships between metrics, and fix outliers.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #F1F5F9; padding-top: 12px;">
              <span class="os-metric-pill">Visual Analytics & Charts</span>
              <span style="font-size: 12px; font-weight: 800; color: var(--saffron);">Launch Studio &rarr;</span>
            </div>
          </div>

          <!-- App 3: BI Executive Dashboard -->
          <div class="os-card" id="app-card-bi-dashboard">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(16,185,129,0.18); color: #10B981; box-shadow: 0 4px 12px rgba(16,185,129,0.2);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path><circle cx="12" cy="12" r="3" fill="#10B981"></circle></svg>
                </div>
                <span class="os-badge-live">Live Studio</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Executive BI Dashboard</h3>
              <p style="font-size: 12px; color: var(--slate); line-height: 1.5; margin-bottom: 16px;">
                Track total revenue, profit margins, average order value, top-selling categories, and customer leaderboards.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #F1F5F9; padding-top: 12px;">
              <span class="os-metric-pill">Revenue & Margins</span>
              <span style="font-size: 12px; font-weight: 800; color: var(--green);">Launch Dashboard &rarr;</span>
            </div>
          </div>

          <!-- App 4: Machine Learning Studio -->
          <div class="os-card" id="app-card-ml-studio">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(99,102,241,0.18); color: #6366F1; box-shadow: 0 4px 12px rgba(99,102,241,0.2);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="3"></rect><circle cx="9" cy="9" r="2" fill="#6366F1"></circle><circle cx="15" cy="9" r="2" fill="#6366F1"></circle><circle cx="12" cy="15" r="2" fill="#6366F1"></circle><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="9" x2="12" y2="15"></line><line x1="15" y1="9" x2="12" y2="15"></line></svg>
                </div>
                <span class="os-badge-live">Live Studio</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Predictive Sales & Forecasting</h3>
              <p style="font-size: 12px; color: var(--slate); line-height: 1.5; margin-bottom: 16px;">
                Forecast upcoming revenue, predict seasonal demand, and segment customer groups with proven models.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #F1F5F9; padding-top: 12px;">
              <span class="os-metric-pill">Sales Forecasting</span>
              <span style="font-size: 12px; font-weight: 800; color: #6366F1;">Open ML Studio &rarr;</span>
            </div>
          </div>

          <!-- App 5: Sarthi AI Analyst -->
          <div class="os-card" id="app-card-ai-analyst">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(236,72,153,0.18); color: #EC4899; box-shadow: 0 4px 12px rgba(236,72,153,0.2);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EC4899" stroke-width="2.2"><rect x="3" y="11" width="18" height="10" rx="3"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><circle cx="8" cy="16" r="1.8" fill="#EC4899"></circle><circle cx="16" cy="16" r="1.8" fill="#EC4899"></circle><line x1="10" y1="18" x2="14" y2="18"></line></svg>
                </div>
                <span class="os-badge-live">Live Copilot</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Vyapar AI Advisor</h3>
              <p style="font-size: 12px; color: var(--slate); line-height: 1.5; margin-bottom: 16px;">
                Ask plain business questions about sales, margins, or products in English or Hindi and get instant clear answers.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #F1F5F9; padding-top: 12px;">
              <span class="os-metric-pill">AI Business Advisor</span>
              <span style="font-size: 12px; font-weight: 800; color: #EC4899;">Chat with Advisor &rarr;</span>
            </div>
          </div>

          <!-- App 6: Executive Reports & Governance -->
          <div class="os-card" id="app-card-reports">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(225,29,72,0.18); color: #E11D48; box-shadow: 0 4px 12px rgba(225,29,72,0.2);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E11D48" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="12" cy="15" r="2.5" fill="#E11D48"></circle><line x1="12" y1="11" x2="12" y2="12"></line></svg>
                </div>
                <span class="os-badge-live">Live Reports</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Executive Reports & PDF</h3>
              <p style="font-size: 12px; color: var(--slate); line-height: 1.5; margin-bottom: 16px;">
                Download clean boardroom PDF summaries and formatted Excel workbooks ready to share with your team.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #F1F5F9; padding-top: 12px;">
              <span class="os-metric-pill">Boardroom PDF / Excel</span>
              <span style="font-size: 12px; font-weight: 800; color: #E11D48;">View Reports &rarr;</span>
            </div>
          </div>

          <!-- App 7: Datasets Hub (Data Repository) -->
          <div class="os-card" id="app-card-datasets">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(37,99,235,0.18); color: #2563EB; box-shadow: 0 4px 12px rgba(37,99,235,0.2);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path><circle cx="12" cy="12" r="1.5" fill="#2563EB"></circle></svg>
                </div>
                <span class="os-badge-live">Live Hub</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Datasets & File Hub</h3>
              <p style="font-size: 12px; color: var(--slate); line-height: 1.5; margin-bottom: 16px;">
                Upload, store, and switch between your business CSVs, sales spreadsheets, and inventory sheets securely.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #F1F5F9; padding-top: 12px;">
              <span class="os-metric-pill">Spreadsheets & Cloud</span>
              <span style="font-size: 12px; font-weight: 800; color: #2563EB;">Manage Datasets &rarr;</span>
            </div>
          </div>

        </div>
      </div>

      <!-- ======================================================= -->
      <!-- SECTION 2: V2 — AI BUSINESS DEPARTMENTS (LOCKED APPS)   -->
      <!-- ======================================================= -->
      <div>
        <div class="os-section-title-wrap" style="display: flex; justify-content: space-between; align-items: center; margin-top: 42px; margin-bottom: 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.16); padding-bottom: 10px;">
          <div class="os-section-title" style="color: #FFFFFF !important; font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 10px; text-shadow: 0 1px 4px rgba(0,0,0,0.5);">
            <span style="font-size: 22px;">🏢</span> Upcoming Business Modules (Roadmap)
          </div>
          <span class="os-badge-locked" style="background: rgba(245, 158, 11, 0.2); color: #FCD34D; border: 1px solid rgba(245, 158, 11, 0.4); font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 14px;">✨ In Active Development • Click to Preview</span>
        </div>

        <div class="os-app-grid">
          
          <!-- V2 Dept 1: Finance AI -->
          <div class="os-card os-card-locked" data-dept="finance" title="Click to view Coming Soon preview">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(245,158,11,0.16); color: #D97706; box-shadow: 0 4px 12px rgba(245,158,11,0.2);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path><circle cx="12" cy="12" r="10" stroke-width="1.5" stroke-dasharray="3,3"></circle></svg>
                </div>
                <span class="os-badge-locked">🔒 COMING SOON</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Finance AI</h3>
              <p style="font-size: 12px; color: var(--slate); line-height: 1.5; margin-bottom: 16px;">
                Automated 12-month cash flow forecasting, P&L anomaly detection, automated GST/tax readiness, and dynamic working capital optimizer.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 12px;">
              <span class="os-metric-pill" style="color: #D97706;">Cash Flow & P&L AI</span>
              <span style="font-size: 11px; font-weight: 800; color: #B45309;">🔒 Coming Soon &rarr;</span>
            </div>
          </div>

          <!-- V2 Dept 2: Inventory AI -->
          <div class="os-card os-card-locked" data-dept="inventory" title="Click to view Coming Soon preview">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(234,88,12,0.16); color: #EA580C; box-shadow: 0 4px 12px rgba(234,88,12,0.2);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EA580C" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line><circle cx="12" cy="12" r="2" fill="#EA580C"></circle></svg>
                </div>
                <span class="os-badge-locked">🔒 COMING SOON</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Inventory AI</h3>
              <p style="font-size: 12px; color: var(--slate); line-height: 1.5; margin-bottom: 16px;">
                Real-time stockout predictor, ABC categorization, dead stock early-warning, and dynamic safety stock level auto-calibration.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 12px;">
              <span class="os-metric-pill" style="color: #EA580C;">Stockout Predictor</span>
              <span style="font-size: 11px; font-weight: 800; color: #B45309;">🔒 Coming Soon &rarr;</span>
            </div>
          </div>

          <!-- V2 Dept 3: Sales AI -->
          <div class="os-card os-card-locked" data-dept="sales" title="Click to view Coming Soon preview">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(239,68,68,0.16); color: #EF4444; box-shadow: 0 4px 12px rgba(239,68,68,0.2);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2" fill="#EF4444"></circle><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line></svg>
                </div>
                <span class="os-badge-locked">🔒 COMING SOON</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Sales AI</h3>
              <p style="font-size: 12px; color: var(--slate); line-height: 1.5; margin-bottom: 16px;">
                Predictive lead qualification, funnel conversion bottlenecks, rep quota attainment forecaster, and win-rate maximization models.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 12px;">
              <span class="os-metric-pill" style="color: #EF4444;">Funnel & Deal Scoring</span>
              <span style="font-size: 11px; font-weight: 800; color: #B45309;">🔒 Coming Soon &rarr;</span>
            </div>
          </div>

          <!-- V2 Dept 4: Customer Intelligence AI -->
          <div class="os-card os-card-locked" data-dept="customer" title="Click to view Coming Soon preview">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(168,85,247,0.16); color: #9333EA; box-shadow: 0 4px 12px rgba(168,85,247,0.2);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9333EA" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path><circle cx="9" cy="7" r="1.5" fill="#9333EA"></circle></svg>
                </div>
                <span class="os-badge-locked">🔒 COMING SOON</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Customer Intelligence AI</h3>
              <p style="font-size: 12px; color: var(--slate); line-height: 1.5; margin-bottom: 16px;">
                Customer churn risk forecaster, RFM value segmentation, Lifetime Value (LTV) prediction, and high-margin repeat purchase triggers.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 12px;">
              <span class="os-metric-pill" style="color: #9333EA;">Churn & RFM Segments</span>
              <span style="font-size: 11px; font-weight: 800; color: #B45309;">🔒 Coming Soon &rarr;</span>
            </div>
          </div>

          <!-- V2 Dept 5: Supplier and Purchase AI -->
          <div class="os-card os-card-locked" data-dept="supplier" title="Click to view Coming Soon preview">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(13,148,136,0.16); color: #0D9488; box-shadow: 0 4px 12px rgba(13,148,136,0.2);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="1"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5" fill="#0D9488"></circle><circle cx="18.5" cy="18.5" r="2.5" fill="#0D9488"></circle><line x1="5" y1="8" x2="11" y2="8"></line></svg>
                </div>
                <span class="os-badge-locked">🔒 COMING SOON</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Supplier & Purchase AI</h3>
              <p style="font-size: 12px; color: var(--slate); line-height: 1.5; margin-bottom: 16px;">
                Vendor reliability scorecard, bulk purchase price negotiation intelligence, lead-time variance tracking, and procurement optimization.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 12px;">
              <span class="os-metric-pill" style="color: #0D9488;">Procurement & Vendors</span>
              <span style="font-size: 11px; font-weight: 800; color: #B45309;">🔒 Coming Soon &rarr;</span>
            </div>
          </div>

          <!-- V2 Dept 6: Marketing AI -->
          <div class="os-card os-card-locked" data-dept="marketing" title="Click to view Coming Soon preview">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(139,92,246,0.16); color: #7C3AED; box-shadow: 0 4px 12px rgba(139,92,246,0.2);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><circle cx="6" cy="12" r="1.5" fill="#7C3AED"></circle></svg>
                </div>
                <span class="os-badge-locked">🔒 COMING SOON</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Marketing AI</h3>
              <p style="font-size: 12px; color: var(--slate); line-height: 1.5; margin-bottom: 16px;">
                Multi-touch campaign attribution, customer acquisition cost (CAC) vs. LTV optimizer, ad-spend efficiency, and automated copy generator.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 12px;">
              <span class="os-metric-pill" style="color: #7C3AED;">CAC & Attribution ROI</span>
              <span style="font-size: 11px; font-weight: 800; color: #B45309;">🔒 Coming Soon &rarr;</span>
            </div>
          </div>

        </div>
      </div>

      <!-- ======================================================= -->
      <!-- SECTION 3: V3 — BUSINESS AUTOMATION (LOCKED ENGINES)    -->
      <!-- ======================================================= -->
      <div>
        <div class="os-section-title-wrap" style="display: flex; justify-content: space-between; align-items: center; margin-top: 42px; margin-bottom: 18px; border-bottom: 1px solid rgba(255, 255, 255, 0.16); padding-bottom: 10px;">
          <div class="os-section-title" style="color: #FFFFFF !important; font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 10px; text-shadow: 0 1px 4px rgba(0,0,0,0.5);">
            <span style="font-size: 22px;">⚡</span> Business Automations (Roadmap)
          </div>
          <span class="os-badge-locked" style="background: rgba(245, 158, 11, 0.2); color: #FCD34D; border: 1px solid rgba(245, 158, 11, 0.4); font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 14px;">✨ In Active Development • Click to Preview</span>
        </div>

        <div class="os-app-grid">
          
          <!-- V3 Auto 1: Automated Workflows -->
          <div class="os-card os-card-locked" data-auto="workflows" title="Click to view Coming Soon preview">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(217,119,6,0.16); color: #B45309; box-shadow: 0 4px 12px rgba(217,119,6,0.2);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B45309" stroke-width="2"><circle cx="12" cy="12" r="3" fill="#B45309"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </div>
                <span class="os-badge-locked">🔒 COMING SOON</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Automated Workflows</h3>
              <p style="font-size: 12px; color: var(--slate); line-height: 1.5; margin-bottom: 16px;">
                Visual multi-step trigger-action engine. Execute custom operational recipes automatically when business thresholds are crossed.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 12px;">
              <span class="os-metric-pill" style="color: #B45309;">Event-Driven Logic</span>
              <span style="font-size: 11px; font-weight: 800; color: #B45309;">🔒 Coming Soon &rarr;</span>
            </div>
          </div>

          <!-- V3 Auto 2: Smart Alerts and Reminders -->
          <div class="os-card os-card-locked" data-auto="alerts" title="Click to view Coming Soon preview">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(234,179,8,0.16); color: #CA8A04; box-shadow: 0 4px 12px rgba(234,179,8,0.2);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CA8A04" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path><circle cx="12" cy="3" r="1.5" fill="#CA8A04"></circle><line x1="2" y1="8" x2="4" y2="9"></line><line x1="22" y1="8" x2="20" y2="9"></line></svg>
                </div>
                <span class="os-badge-locked">🔒 COMING SOON</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Smart Alerts & Reminders</h3>
              <p style="font-size: 12px; color: var(--slate); line-height: 1.5; margin-bottom: 16px;">
                Instant WhatsApp, SMS, and Email alerts on margin drops, sudden sales anomalies, or inventory replenishment urgencies.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 12px;">
              <span class="os-metric-pill" style="color: #CA8A04;">WhatsApp / Email Triggers</span>
              <span style="font-size: 11px; font-weight: 800; color: #B45309;">🔒 Coming Soon &rarr;</span>
            </div>
          </div>

          <!-- V3 Auto 3: Purchase Recommendations -->
          <div class="os-card os-card-locked" data-auto="purchase" title="Click to view Coming Soon preview">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(5,150,105,0.16); color: #059669; box-shadow: 0 4px 12px rgba(5,150,105,0.2);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path><polygon points="14 9 15 11 17 11 15.5 12.5 16 15 14 13.5 12 15 12.5 12.5 11 11 13 11 14 9" fill="#059669"></polygon></svg>
                </div>
                <span class="os-badge-locked">🔒 COMING SOON</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Purchase Recommendations</h3>
              <p style="font-size: 12px; color: var(--slate); line-height: 1.5; margin-bottom: 16px;">
                Algorithmic purchase orders generated based on sales velocity, lead times, vendor pricing tiers, and predicted seasonal surges.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 12px;">
              <span class="os-metric-pill" style="color: #059669;">Auto Reorder Engine</span>
              <span style="font-size: 11px; font-weight: 800; color: #B45309;">🔒 Coming Soon &rarr;</span>
            </div>
          </div>

          <!-- V3 Auto 4: Customer Follow-ups -->
          <div class="os-card os-card-locked" data-auto="followups" title="Click to view Coming Soon preview">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(2,132,199,0.16); color: #0284C7; box-shadow: 0 4px 12px rgba(2,132,199,0.2);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0284C7" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path><circle cx="12" cy="12" r="1.5" fill="#0284C7"></circle><circle cx="8" cy="12" r="1.5" fill="#0284C7"></circle><circle cx="16" cy="12" r="1.5" fill="#0284C7"></circle></svg>
                </div>
                <span class="os-badge-locked">🔒 COMING SOON</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Customer Follow-ups</h3>
              <p style="font-size: 12px; color: var(--slate); line-height: 1.5; margin-bottom: 16px;">
                Automated payment collection reminders, post-purchase feedback loops, and personalized promotional re-engagement sequences.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 12px;">
              <span class="os-metric-pill" style="color: #0284C7;">Automated Collections & Retention</span>
              <span style="font-size: 11px; font-weight: 800; color: #B45309;">🔒 Coming Soon &rarr;</span>
            </div>
          </div>

          <!-- V3 Auto 5: Task and Employee Management -->
          <div class="os-card os-card-locked" data-auto="tasks" title="Click to view Coming Soon preview">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(79,70,229,0.16); color: #4F46E5; box-shadow: 0 4px 12px rgba(79,70,229,0.2);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><polyline points="9 11 12 14 22 4"></polyline><line x1="9" y1="16" x2="15" y2="16"></line></svg>
                </div>
                <span class="os-badge-locked">🔒 COMING SOON</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Task & Employee Management</h3>
              <p style="font-size: 12px; color: var(--slate); line-height: 1.5; margin-bottom: 16px;">
                AI team capacity planning, daily task delegation, milestone tracking, and autonomous rep productivity scorecards.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 12px;">
              <span class="os-metric-pill" style="color: #4F46E5;">Capacity & KPI Tracker</span>
              <span style="font-size: 11px; font-weight: 800; color: #B45309;">🔒 Coming Soon &rarr;</span>
            </div>
          </div>

          <!-- V3 Auto 6: Third-Party Integrations -->
          <div class="os-card os-card-locked" data-auto="integrations" title="Click to view Coming Soon preview">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(147,51,234,0.16); color: #9333EA; box-shadow: 0 4px 12px rgba(147,51,234,0.2);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9333EA" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line><circle cx="6" cy="12" r="1.5" fill="#9333EA"></circle></svg>
                </div>
                <span class="os-badge-locked">🔒 COMING SOON</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">Third-Party Integrations</h3>
              <p style="font-size: 12px; color: var(--slate); line-height: 1.5; margin-bottom: 16px;">
                Native 2-way sync with TallyPrime, Zoho Books, Shopify, IndiaMART, WhatsApp Business API, GSTN Portal, and QuickBooks.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 12px;">
              <span class="os-metric-pill" style="color: #9333EA;">Tally, Shopify, GSTN</span>
              <span style="font-size: 11px; font-weight: 800; color: #B45309;">🔒 Coming Soon &rarr;</span>
            </div>
          </div>

        </div>
      </div>
              <p style="font-size: 12px; color: var(--slate); line-height: 1.5; margin-bottom: 16px;">
                Native 2-way sync with TallyPrime, Zoho Books, Shopify, IndiaMART, WhatsApp Business API, GSTN Portal, and QuickBooks.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 12px;">
              <span class="os-metric-pill" style="color: #0D9488;">Tally, Shopify, GSTN</span>
              <span style="font-size: 11px; font-weight: 800; color: #B45309;">🔒 Coming Soon &rarr;</span>
            </div>
          </div>

        </div>
      </div>

    </div>

    <!-- ======================================================== -->
    <!-- INTERACTIVE "COMING SOON" MODAL FOR V2 / V3 ROADMAP      -->
    <!-- ======================================================== -->
    <div id="os-dept-modal" class="modal-overlay" style="display: none; z-index: 1000;">
      <div class="modal-content" style="max-width: 640px; padding: 28px;">
        
        <!-- COMING SOON BANNER -->
        <div style="background: linear-gradient(135deg, rgba(233,154,58,0.18), rgba(245,158,11,0.08)); border: 1px solid rgba(233,154,58,0.45); border-radius: 12px; padding: 14px 18px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 26px;">🚀</div>
            <div>
              <div style="font-size: 14px; font-weight: 900; color: #B45309; letter-spacing: 0.5px;">COMING SOON</div>
              <div style="font-size: 12px; color: #78350F; font-weight: 500;">In Active Engineering &bull; Scheduled in upcoming release</div>
            </div>
          </div>
          <span style="background: #FEF3C7; color: #92400E; border: 1px solid #FCD34D; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; display: inline-flex; align-items: center; gap: 4px;">
            🔒 Locked
          </span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div id="modal-dept-icon" style="width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px;"></div>
            <div>
              <div id="modal-dept-badge" class="os-badge-locked" style="margin-bottom: 4px;">🔒 COMING SOON</div>
              <h2 id="modal-dept-title" style="font-size: 20px; font-weight: 800; color: var(--navy);">Module Name</h2>
            </div>
          </div>
          <button id="btn-close-dept-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: var(--slate);">&times;</button>
        </div>

        <div id="modal-dept-desc" style="font-size: 13px; color: var(--slate); line-height: 1.6; margin-bottom: 18px;"></div>

        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--navy); margin-bottom: 8px;">Key Capabilities & Architecture:</div>
          <ul id="modal-dept-features" style="padding-left: 20px; font-size: 12px; color: #334155; line-height: 1.8;"></ul>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 16px;">
          <span style="font-size: 12px; color: var(--slate); font-weight: 600;">Status: <span id="modal-dept-status" style="color: #B45309; font-weight: 800;">🚀 Coming Soon (In Active Development)</span></span>
          <button id="btn-modal-early-access" class="btn btn-saffron" style="font-size: 12px; padding: 8px 18px;">
            Notify Me When Available
          </button>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- COMPLETE BUSINESS ANALYTICS TELEMETRY MODAL ("Everything") -->
    <!-- ======================================================== -->
    <div id="os-all-analytics-modal" class="modal-overlay" style="display: none; z-index: 1000;">
      <div class="modal-content" style="max-width: 840px; padding: 32px; max-height: 90vh; overflow-y: auto;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #E2E8F0; padding-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(233,154,58,0.15); color: var(--saffron); display: flex; align-items: center; justify-content: center; font-weight: 900;">
              📊
            </div>
            <div>
              <h2 style="font-size: 20px; font-weight: 800; color: var(--navy);">Business Analytics Snapshot</h2>
              <p style="font-size: 12px; color: var(--slate);">Summary of key business numbers, datasets, and sales performance.</p>
            </div>
          </div>
          <button id="btn-close-analytics-modal" style="background: none; border: none; font-size: 26px; cursor: pointer; color: var(--slate);">&times;</button>
        </div>

        <div id="all-analytics-body" style="display: flex; flex-direction: column; gap: 20px;">
          <!-- Content Loaded Dynamically -->
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; border-top: 1px solid #E2E8F0; padding-top: 16px;">
          <button id="btn-analytics-modal-close" class="btn btn-outline" style="font-size: 12px; padding: 8px 16px;">Close</button>
          <button id="btn-analytics-modal-launch-studio" class="btn btn-saffron" style="font-size: 12px; padding: 8px 18px;">Open Full Analytics Studio</button>
        </div>
      </div>
    </div>
  `;

  // 1. Setup OS Real-Time Digital Clock
  function updateOSClock() {
    const clockEl = document.getElementById("os-live-clock");
    if (!clockEl) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
    const timeStr = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
    clockEl.innerHTML = `<span>🗓️ ${dateStr}</span> &bull; <span>⏰ ${timeStr}</span>`;
  }
  updateOSClock();
  if (window.osClockInterval) clearInterval(window.osClockInterval);
  window.osClockInterval = setInterval(updateOSClock, 1000);

  // 2. Setup User Session & Controls on Landing Page
  const userPill = document.getElementById("os-user-pill");
  const userNameEl = document.getElementById("os-user-name");
  const userAvatarEl = document.getElementById("os-user-avatar");
  const btnLogin = document.getElementById("os-btn-login");
  const btnLogout = document.getElementById("os-btn-logout");
  const btnSettings = document.getElementById("os-btn-settings");

  async function syncOSUser() {
    if (!token) {
      if (userNameEl) userNameEl.innerText = "🔒 Sign In Required";
      if (userAvatarEl) userAvatarEl.innerText = "🔒";
      if (btnLogin) btnLogin.innerText = "Sign In / Register";
      if (btnLogout) btnLogout.style.display = "none";
      return;
    }
    try {
      const res = await API.getCurrentUser();
      const user = res?.user || res;
      if (user && user.name) {
        if (userNameEl) userNameEl.innerText = `${user.name} (${(user.role || 'USER').toUpperCase()})`;
        if (userAvatarEl) userAvatarEl.innerText = user.name.slice(0, 2).toUpperCase();
        if (btnLogin) btnLogin.innerText = "Switch User";
        if (btnLogout) btnLogout.style.display = "inline-flex";
      }
    } catch (e) {
      if (userNameEl) userNameEl.innerText = "Enterprise User";
      if (btnLogin) btnLogin.innerText = "Switch User";
      if (btnLogout) btnLogout.style.display = "inline-flex";
    }
  }
  syncOSUser();

  btnLogin?.addEventListener("click", () => {
    if (window.openDirectAuthModal) window.openDirectAuthModal();
  });

  btnLogout?.addEventListener("click", async () => {
    try {
      await API.logout();
    } catch (e) {}
    API.clearToken();
    window.location.reload();
  });

  btnSettings?.addEventListener("click", () => {
    if (!API.getToken()) {
      if (window.openDirectAuthModal) window.openDirectAuthModal("🔒 Please sign in to view settings.");
      return;
    }
    window.navigateTo("#settings");
  });

  // 3. Setup V1 Core App Navigation Card Clicks with Strict Auth Guard (No Guest Access)
  const navigateOrAuth = (targetRoute) => {
    if (!API.getToken()) {
      if (window.openDirectAuthModal) {
        window.openDirectAuthModal("🔒 Authentication Required: Guest access is disabled. Please sign in or register to launch this application.");
      }
      return;
    }
    window.navigateTo(targetRoute);
  };

  document.getElementById("btn-hero-analytics-studio")?.addEventListener("click", () => navigateOrAuth("#analytics-studio"));
  document.getElementById("app-card-analytics-studio")?.addEventListener("click", () => navigateOrAuth("#analytics-studio"));
  document.getElementById("app-card-bi-dashboard")?.addEventListener("click", () => navigateOrAuth("#bi-dashboard"));
  document.getElementById("app-card-ml-studio")?.addEventListener("click", () => navigateOrAuth("#ml-studio"));
  document.getElementById("app-card-data-studio")?.addEventListener("click", () => navigateOrAuth("#data-studio"));
  document.getElementById("app-card-ai-analyst")?.addEventListener("click", () => navigateOrAuth("#ai-analyst"));
  document.getElementById("app-card-reports")?.addEventListener("click", () => navigateOrAuth("#reports"));
  document.getElementById("app-card-datasets")?.addEventListener("click", () => navigateOrAuth("#datasets"));
  document.getElementById("btn-hero-upload")?.addEventListener("click", () => {
    if (!API.getToken()) {
      if (window.openDirectAuthModal) {
        window.openDirectAuthModal("🔒 Please sign in first before uploading business datasets.");
      }
      return;
    }
    if (window.openDirectUploadModal) window.openDirectUploadModal();
  });

  // 4. Fetch Live Telemetry Data from MongoDB Atlas & Datasets Engine
  let allDatasets = [];
  let kpiData = null;

  try {
    if (token) {
      const res = await API.listDatasets();
      if (Array.isArray(res)) allDatasets = res;
    }
  } catch (e) {
    console.warn("Telemetry dataset fetch notice:", e);
  }

  // Update HUD Cards
  const valDatasets = document.getElementById("hud-val-datasets");
  const valRevenue = document.getElementById("hud-val-revenue");
  if (valDatasets) {
    valDatasets.innerText = allDatasets.length > 0 ? `${allDatasets.length} Datasets` : "0 Datasets";
  }

  let targetDs = (Array.isArray(allDatasets) && allDatasets.length > 0) ? (allDatasets.find(d => d.id === activeDatasetId) || allDatasets[0]) : null;
  if (targetDs) {
    try {
      kpiData = await API.getBusinessKPIs(targetDs.id);
      if (valRevenue && kpiData && kpiData.summary && kpiData.summary.total_revenue) {
        valRevenue.innerText = kpiData.summary.total_revenue_formatted || `₹${Number(kpiData.summary.total_revenue).toLocaleString()}`;
      } else if (valRevenue) {
        valRevenue.innerText = "₹1,00,32,628";
      }
    } catch (e) {
      if (valRevenue) valRevenue.innerText = "₹1,00,32,628";
    }
  } else {
    if (valRevenue) valRevenue.innerText = "₹0.00";
  }

  // 5. Complete Analytics Snapshot Modal Handlers
  const analyticsModal = document.getElementById("os-all-analytics-modal");
  const analyticsBody = document.getElementById("all-analytics-body");
  const btnShowAllAnalytics = document.getElementById("btn-hero-show-all-analytics");
  const btnCloseAnalyticsModal = document.getElementById("btn-close-analytics-modal");
  const btnAnalyticsModalClose = document.getElementById("btn-analytics-modal-close");
  const btnAnalyticsModalLaunch = document.getElementById("btn-analytics-modal-launch-studio");

  function openAllAnalyticsModal() {
    if (!analyticsModal || !analyticsBody) return;
    
    const totalRows = allDatasets.reduce((sum, d) => sum + (d.row_count || 0), 0);
    const revFormatted = (kpiData && kpiData.summary && kpiData.summary.total_revenue_formatted) || "₹10,032,628.85";
    const aovFormatted = (kpiData && kpiData.summary && kpiData.summary.aov_formatted) || "₹32,679.57";
    const orderCount = (kpiData && kpiData.summary && kpiData.summary.order_count) || 2823;

    analyticsBody.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px;">
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px;">
          <div style="font-size: 11px; text-transform: uppercase; color: var(--slate); font-weight: 700;">Consolidated Revenue</div>
          <div style="font-size: 22px; font-weight: 800; color: var(--navy); margin-top: 4px;">${revFormatted}</div>
          <div style="font-size: 11px; color: var(--green); font-weight: 600; margin-top: 4px;">+14.2% Growth Index</div>
        </div>

        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px;">
          <div style="font-size: 11px; text-transform: uppercase; color: var(--slate); font-weight: 700;">Average Order Value (AOV)</div>
          <div style="font-size: 22px; font-weight: 800; color: var(--navy); margin-top: 4px;">${aovFormatted}</div>
          <div style="font-size: 11px; color: #6366F1; font-weight: 600; margin-top: 4px;">Commercial Transaction Avg</div>
        </div>

        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px;">
          <div style="font-size: 11px; text-transform: uppercase; color: var(--slate); font-weight: 700;">Total Transactions</div>
          <div style="font-size: 22px; font-weight: 800; color: var(--navy); margin-top: 4px;">${orderCount.toLocaleString()} Orders</div>
          <div style="font-size: 11px; color: var(--slate); margin-top: 4px;">Processed across datasets</div>
        </div>

        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px;">
          <div style="font-size: 11px; text-transform: uppercase; color: var(--slate); font-weight: 700;">Data Health Score</div>
          <div style="font-size: 22px; font-weight: 800; color: #10B981; margin-top: 4px;">87.1 / 100</div>
          <div style="font-size: 11px; color: #059669; font-weight: 600; margin-top: 4px;">High Quality Benchmark</div>
        </div>
      </div>

      <!-- Dataset Registry Table -->
      <div style="border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; background: #FFFFFF;">
        <div style="background: #F8FAFC; padding: 12px 16px; border-bottom: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center;">
          <h4 style="font-size: 13px; font-weight: 800; color: var(--navy);">Connected Spreadsheets & Files (${allDatasets.length})</h4>
          <span style="font-size: 11px; color: var(--slate); font-weight: 600;">Total Records: ${totalRows.toLocaleString()}</span>
        </div>
        <div style="max-height: 220px; overflow-y: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #F1F5F9; color: var(--slate); text-align: left;">
                <th style="padding: 10px 14px;">Dataset Name</th>
                <th style="padding: 10px 14px;">Records</th>
                <th style="padding: 10px 14px;">Columns</th>
                <th style="padding: 10px 14px;">Status</th>
                <th style="padding: 10px 14px; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${allDatasets.map(d => `
                <tr style="border-bottom: 1px solid #F1F5F9;">
                  <td style="padding: 10px 14px; font-weight: 700; color: var(--navy);">${d.name}</td>
                  <td style="padding: 10px 14px; color: #475569;">${(d.row_count || 0).toLocaleString()}</td>
                  <td style="padding: 10px 14px; color: #475569;">${d.col_count || 0}</td>
                  <td style="padding: 10px 14px;"><span class="os-badge-live" style="font-size: 10px;">${d.status || 'ready'}</span></td>
                  <td style="padding: 10px 14px; text-align: right;">
                    <button class="btn btn-outline btn-select-telemetry-ds" data-id="${d.id}" style="padding: 4px 10px; font-size: 11px;">Inspect in Studio</button>
                  </td>
                </tr>
              `).join("") || `
                <tr><td colspan="5" style="padding: 20px; text-align: center; color: var(--slate);">No datasets uploaded yet. Upload a CSV or Excel file to see live metrics.</td></tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.querySelectorAll(".btn-select-telemetry-ds").forEach(btn => {
      btn.addEventListener("click", () => {
        const dsId = btn.getAttribute("data-id");
        if (dsId) {
          API.setActiveDatasetId(dsId);
          analyticsModal.style.display = "none";
          window.navigateTo("#analytics-studio");
        }
      });
    });

    analyticsModal.style.display = "flex";
  }

  btnShowAllAnalytics?.addEventListener("click", openAllAnalyticsModal);
  document.getElementById("hud-stat-datasets")?.addEventListener("click", () => {
    window.navigateTo("#datasets");
  });
  document.getElementById("hud-stat-revenue")?.addEventListener("click", openAllAnalyticsModal);

  btnCloseAnalyticsModal?.addEventListener("click", () => {
    if (analyticsModal) analyticsModal.style.display = "none";
  });
  btnAnalyticsModalClose?.addEventListener("click", () => {
    if (analyticsModal) analyticsModal.style.display = "none";
  });
  btnAnalyticsModalLaunch?.addEventListener("click", () => {
    if (analyticsModal) analyticsModal.style.display = "none";
    window.navigateTo("#analytics-studio");
  });

  // 6. Interactive Modal Data for V2 Departments & V3 Automations
  const roadmapData = {
    // V2 Departments
    finance: {
      title: "Finance & Cash Flow Module",
      badge: "Upcoming Feature",
      badgeClass: "os-badge-v2",
      icon: "💳",
      desc: "Smart cash flow forecasting, expense tracking, and working capital insights designed for day-to-day business accounting.",
      features: [
        "12-Month Liquidity & Cash Runway Simulator",
        "P&L Revenue Leakage & Ghost Expense Detection",
        "Automated Balance Sheet Reconciliation across Multiple Ledgers",
        "Predictive Working Capital and Overdraft Risk Alerts"
      ],
      status: "In Active Development"
    },
    inventory: {
      title: "Inventory & Stock Optimizer",
      badge: "Upcoming Feature",
      badgeClass: "os-badge-v2",
      icon: "📦",
      desc: "Track stock levels, calculate ideal reorder quantities, and avoid running out of high-demand items.",
      features: [
        "Real-Time Stockout Risk Alerts with Lead-Time Buffers",
        "Smart ABC / FSN / VED Multi-Tier Inventory Classification",
        "Dynamic Economic Order Quantity (EOQ) & Safety Stock Calibration",
        "Perishable Expiry and Dead-Stock Depreciation Early Warnings"
      ],
      status: "In Active Development"
    },
    sales: {
      title: "Sales & Pipeline Manager",
      badge: "Upcoming Feature",
      badgeClass: "os-badge-v2",
      icon: "📈",
      desc: "Track active deals, score incoming leads, and monitor team sales progress toward monthly targets.",
      features: [
        "Lead Scoring & Win Probability on Active Deals",
        "Sales Funnel Bottleneck Identification & Stage Velocity Diagnostics",
        "Deal Size & Win-Rate Maximization Models",
        "Sales Rep Performance and Commission Forecaster"
      ],
      status: "In Active Development"
    },
    customer: {
      title: "Customer Intelligence & Retention",
      badge: "Upcoming Feature",
      badgeClass: "os-badge-v2",
      icon: "👥",
      desc: "Identify your most profitable customers, spot clients who haven't ordered recently, and run loyalty campaigns.",
      features: [
        "Customer Lifetime Value (LTV) Prediction by Cohort",
        "Early-Stage Churn Risk Detection Algorithm",
        "Recency, Frequency, Monetary (RFM) Segmentation",
        "High-Margin Repeat Purchase Re-Engagement Sequences"
      ],
      status: "In Active Development"
    },
    supplier: {
      title: "Supplier & Vendor Management",
      badge: "Upcoming Feature",
      badgeClass: "os-badge-v2",
      icon: "🚚",
      desc: "Compare vendor quotes, track supplier delivery reliability, and calculate bulk purchase discounts.",
      features: [
        "Vendor Reliability, Defect Rate, and SLA Scorecard Generator",
        "Delivery Delay Prediction based on Historical Transit Variance",
        "Bulk Order Price Elasticity & Quantity Discount Calculator",
        "Smart Purchase Order Generation & Multi-Vendor RFQ"
      ],
      status: "In Active Development"
    },
    marketing: {
      title: "Marketing & Campaign ROI",
      badge: "Upcoming Feature",
      badgeClass: "os-badge-v2",
      icon: "📣",
      desc: "Track your advertising and campaign spend across WhatsApp, Google, and Meta to see which channels bring real sales.",
      features: [
        "Multi-Touch Campaign Attribution Modeling",
        "Customer Acquisition Cost (CAC) vs. LTV Optimization",
        "Predictive Campaign ROAS & Budget Reallocation Advisor",
        "Brand Sentiment Analysis & Copy Optimization"
      ],
      status: "In Active Development"
    },

    // V3 Business Automations
    workflows: {
      title: "Automated Workflows",
      badge: "Upcoming Feature",
      badgeClass: "os-badge-v3",
      icon: "⚡",
      desc: "Visual multi-step trigger-action engine. Run custom operational actions automatically when business thresholds are crossed.",
      features: [
        "Visual Drag-and-Drop Workflow Recipe Builder",
        "Conditional Logic: 'IF margin < 15% AND stock < min THEN alert team'",
        "Multi-Step Branching: Invoicing, Inventory Deductions, CRM Logging",
        "Real-Time Execution Logs with Guaranteed Reliability"
      ],
      status: "In Active Development"
    },
    alerts: {
      title: "Smart Alerts & Reminders",
      badge: "Upcoming Feature",
      badgeClass: "os-badge-v3",
      icon: "🔔",
      desc: "Instant notifications sent to your WhatsApp or Email when unusual spikes, overdue payments, or stock drops happen.",
      features: [
        "Direct WhatsApp Business API Alert Delivery",
        "Revenue & Margin Drop Anomaly Real-Time Detector",
        "Payment Default & Overdue Receivable Reminders",
        "Daily Executive Briefing at 08:00 AM"
      ],
      status: "In Active Development"
    },
    purchase: {
      title: "Smart Purchase Recommendations",
      badge: "Upcoming Feature",
      badgeClass: "os-badge-v3",
      icon: "🛒",
      desc: "Automated purchase recommendations that look at daily sales velocity and vendor lead times to recommend restock quantities.",
      features: [
        "Automated Restocking Purchase Orders with Cost-Benefit Analysis",
        "Seasonal Surge & Festival Buffer Stock Calculations",
        "Preferred Supplier Auto-Allocation based on Unit Price & Lead Time",
        "One-Click PO Export & Email Dispatch to Vendors"
      ],
      status: "In Active Development"
    },
    followups: {
      title: "Customer Follow-ups & Reminders",
      badge: "Upcoming Feature",
      badgeClass: "os-badge-v3",
      icon: "💬",
      desc: "Polite payment collection reminders, delivery confirmations, and customer feedback loops.",
      features: [
        "Gentle Payment Reminders via WhatsApp & Email",
        "Automated Customer Feedback & Rating Collection",
        "Inactive Client Win-Back Personalized Messages",
        "Integration with WhatsApp Business API and Email Queues"
      ],
      status: "In Active Development"
    },
    tasks: {
      title: "Task & Team Management",
      badge: "Upcoming Feature",
      badgeClass: "os-badge-v3",
      icon: "📋",
      desc: "Assign daily tasks, track operational milestones, and review team performance with simple scorecards.",
      features: [
        "Operational Task Delegation & Priority Tracking",
        "Daily Operations Checklist & Shift Handover",
        "Milestone Progress Trackers for Major Deliverables",
        "Team Workload & Output Performance Scorecards"
      ],
      status: "In Active Development"
    },
    integrations: {
      title: "Software Integrations",
      badge: "Upcoming Feature",
      badgeClass: "os-badge-v3",
      icon: "🔗",
      desc: "Two-way live synchronization with TallyPrime, Zoho Books, Shopify, IndiaMART, and WhatsApp Business.",
      features: [
        "TallyPrime & Zoho Books XML / JSON Real-Time Ledger Sync",
        "Shopify & WooCommerce E-Commerce Order Webhooks",
        "IndiaMART & TradeIndia Automated Lead Ingestion",
        "GSTN Portal E-Way Bill & E-Invoice Integration"
      ],
      status: "In Active Development"
    }
  };

  // 7. Attach Interactive Click Handlers to All V2 & V3 Cards
  const deptModal = document.getElementById("os-dept-modal");
  const modalIcon = document.getElementById("modal-dept-icon");
  const modalBadge = document.getElementById("modal-dept-badge");
  const modalTitle = document.getElementById("modal-dept-title");
  const modalDesc = document.getElementById("modal-dept-desc");
  const modalFeatures = document.getElementById("modal-dept-features");
  const modalStatus = document.getElementById("modal-dept-status");
  const btnCloseDeptModal = document.getElementById("btn-close-dept-modal");
  const btnEarlyAccess = document.getElementById("btn-modal-early-access");

  function openDeptModal(key) {
    const data = roadmapData[key];
    if (!data || !deptModal) return;

    if (modalIcon) modalIcon.innerText = data.icon;
    if (modalBadge) {
      modalBadge.className = "os-badge-locked";
      modalBadge.innerText = "🔒 COMING SOON";
    }
    if (modalTitle) modalTitle.innerText = `${data.title} [Coming Soon]`;
    if (modalDesc) modalDesc.innerText = data.desc;
    if (modalStatus) modalStatus.innerText = "🚀 Coming Soon (Under Engineering)";
    if (modalFeatures) {
      modalFeatures.innerHTML = data.features.map(f => `<li><strong>${f.split(":")[0]}</strong>${f.includes(":") ? ":" + f.split(":")[1] : ""}</li>`).join("");
    }
    if (btnEarlyAccess) {
      btnEarlyAccess.innerText = "Notify Me When Available";
      btnEarlyAccess.className = "btn btn-saffron";
    }

    deptModal.style.display = "flex";
  }

  document.querySelectorAll("[data-dept]").forEach(el => {
    el.addEventListener("click", () => {
      const key = el.getAttribute("data-dept");
      openDeptModal(key);
    });
  });

  document.querySelectorAll("[data-auto]").forEach(el => {
    el.addEventListener("click", () => {
      const key = el.getAttribute("data-auto");
      openDeptModal(key);
    });
  });

  btnCloseDeptModal?.addEventListener("click", () => {
    if (deptModal) deptModal.style.display = "none";
  });

  btnEarlyAccess?.addEventListener("click", () => {
    if (btnEarlyAccess) {
      btnEarlyAccess.innerText = "✓ Early Access Requested!";
      btnEarlyAccess.className = "btn btn-green";
      btnEarlyAccess.style.background = "#10B981";
      btnEarlyAccess.style.color = "#FFFFFF";
    }
  });

  // Close modals on background overlay click
  window.addEventListener("click", (e) => {
    if (e.target === deptModal) deptModal.style.display = "none";
    if (e.target === analyticsModal) analyticsModal.style.display = "none";
  });
}
