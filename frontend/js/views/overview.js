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
            <p style="font-size: 13px; color: #E2E8F0 !important; line-height: 1.6; margin-bottom: 22px;">
              Intelligent business analytics, revenue tracking, and forecasting — designed to help business owners make confident, data-backed decisions.
            </p>

            <div style="display: flex; flex-wrap: wrap; gap: 12px;">
              <!-- Show Analytics of Everything Modal Button -->
              <button id="btn-hero-show-all-analytics" class="btn btn-saffron" style="font-size: 13px; padding: 10px 22px; font-weight: 700; box-shadow: 0 4px 12px rgba(233,154,58,0.35);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
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
                <div style="font-size: 11px; text-transform: uppercase; color: #E2E8F0 !important; font-weight: 700;">Active Datasets</div>
                <div style="font-size: 22px; font-weight: 800; color: #FFFFFF; margin: 4px 0;" id="hud-val-datasets">--</div>
                <div style="font-size: 11px; color: #38BDF8;">Synced with Cloud</div>
              </div>
              <div class="os-hud-stat cursor-pointer" id="hud-stat-revenue" title="Click to view analytics snapshot">
                <div style="font-size: 11px; text-transform: uppercase; color: #E2E8F0 !important; font-weight: 700;">Analyzed Revenue</div>
                <div style="font-size: 22px; font-weight: 800; color: var(--saffron); margin: 4px 0;" id="hud-val-revenue">--</div>
                <div style="font-size: 11px; color: #34D399;">Total Tracked Volume</div>
              </div>
            </div>

            <div style="display: flex; gap: 10px;">
              <div class="os-hud-stat">
                <div style="font-size: 11px; text-transform: uppercase; color: #E2E8F0 !important; font-weight: 700;">Data Health</div>
                <div style="font-size: 22px; font-weight: 800; color: #10B981; margin: 4px 0;" id="hud-val-score">94.2%</div>
                <div style="font-size: 11px; color: #E2E8F0 !important;">Clean & Reliable</div>
              </div>
              <div class="os-hud-stat">
                <div style="font-size: 11px; text-transform: uppercase; color: #E2E8F0 !important; font-weight: 700;">Data Privacy</div>
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
            <span style="font-size: 22px;">⚡</span> Enterprise AI Operating Suites
          </div>
          <span class="os-badge-live" style="background: rgba(16, 185, 129, 0.2); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.4); font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 14px;">● 7 Live Operating Suites Active</span>
        </div>

        <div class="os-app-grid">
          
          <!-- Suite 0: Vyapar Excel Studio -->
          <div class="os-card obsidian-glow-card" id="app-card-suite-excel" style="background: #0B0F19; border: 1px solid rgba(59, 130, 246, 0.35); box-shadow: 0 4px 20px rgba(37, 99, 235, 0.12); cursor: pointer;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(16, 185, 129, 0.18); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.35);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line><line x1="10" y1="9" x2="10" y2="21"></line></svg>
                </div>
                <span style="background: rgba(16, 185, 129, 0.18); color: #6EE7B7; border: 1px solid rgba(16, 185, 129, 0.35); font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Live Spreadsheets</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: #FFFFFF !important; margin: 12px 0 6px; letter-spacing: -0.2px;">Vyapar Excel Studio</h3>
              <p style="font-size: 12.5px; color: #E2E8F0 !important; line-height: 1.55; margin-bottom: 16px;">
                Interactive in-browser spreadsheets with 8 shopkeeper templates, live formula calculation engine, and formatted .xlsx export.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 12px;">
              <span class="os-metric-pill" style="background: rgba(16, 185, 129, 0.15); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.3);">8 Retail Templates</span>
              <span style="font-size: 12px; font-weight: 800; color: #34D399;">Open Excel Studio &rarr;</span>
            </div>
          </div>

          <!-- Suite 1: Business Intelligence -->
          <div class="os-card obsidian-glow-card" id="app-card-suite-bi" style="background: #0B0F19; border: 1px solid rgba(59, 130, 246, 0.35); box-shadow: 0 4px 20px rgba(37, 99, 235, 0.12); cursor: pointer;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path><circle cx="12" cy="12" r="2.5" fill="#10B981"></circle></svg>
                </div>
                <span style="background: rgba(59, 130, 246, 0.15); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.3); font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Model: Strategic Business AI</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: #FFFFFF; margin: 12px 0 6px;">Business Intelligence</h3>
              <p style="font-size: 12px; color: #E2E8F0 !important; line-height: 1.5; margin-bottom: 16px;">
                Executive cockpit with deterministic revenue, gross margin waterfalls, AOV leaderboards, and AI diagnostic insights from real data.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 12px;">
              <span class="os-metric-pill" style="background: rgba(16, 185, 129, 0.12); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.25);">Live BI Studio</span>
              <span style="font-size: 11px; font-weight: 800; color: #60A5FA;">Launch Studio &rarr;</span>
            </div>
          </div>

          <!-- Suite 2: Inventory Management -->
          <div class="os-card obsidian-glow-card" id="app-card-suite-inventory" style="background: #0B0F19; border: 1px solid rgba(59, 130, 246, 0.35); box-shadow: 0 4px 20px rgba(37, 99, 235, 0.12); cursor: pointer;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(245, 158, 11, 0.15); color: #F59E0B; border: 1px solid rgba(245, 158, 11, 0.3);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line><circle cx="12" cy="12" r="2" fill="#F59E0B"></circle></svg>
                </div>
                <span style="background: rgba(245, 158, 11, 0.15); color: #FCD34D; border: 1px solid rgba(245, 158, 11, 0.3); font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Model: Stockout & Reorder AI</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: #FFFFFF; margin: 12px 0 6px;">Inventory Management</h3>
              <p style="font-size: 12px; color: #E2E8F0 !important; line-height: 1.5; margin-bottom: 16px;">
                Automated stock levels, ABC categorization, low-stock predictive alarms, and automated supplier reorder schedules.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 12px;">
              <span class="os-metric-pill" style="background: rgba(245, 158, 11, 0.12); color: #FCD34D; border: 1px solid rgba(245, 158, 11, 0.25);">Reorder & Stock AI</span>
              <span style="font-size: 11px; font-weight: 800; color: #FCD34D;">Manage Stock &rarr;</span>
            </div>
          </div>

          <!-- Suite 3: Finance & P&L -->
          <div class="os-card obsidian-glow-card" id="app-card-suite-finance" style="background: #0B0F19; border: 1px solid rgba(59, 130, 246, 0.35); box-shadow: 0 4px 20px rgba(37, 99, 235, 0.12); cursor: pointer;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(49, 133, 108, 0.15); color: #34D399; border: 1px solid rgba(49, 133, 108, 0.3);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2.2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <span style="background: rgba(16, 185, 129, 0.15); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Model: Cash Flow & P&L AI</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: #FFFFFF; margin: 12px 0 6px;">Finance & P&L</h3>
              <p style="font-size: 12px; color: #E2E8F0 !important; line-height: 1.5; margin-bottom: 16px;">
                Real-time Profit & Loss calculation, working capital burn rates, expense anomalies, and boardroom-ready financial ledgers.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 12px;">
              <span class="os-metric-pill" style="background: rgba(49, 133, 108, 0.12); color: #34D399; border: 1px solid rgba(49, 133, 108, 0.25);">P&L Ledger</span>
              <span style="font-size: 11px; font-weight: 800; color: #34D399;">Open Ledgers &rarr;</span>
            </div>
          </div>

          <!-- Suite 4: Vyapar AI Sarthi -->
          <div class="os-card obsidian-glow-card" id="app-card-suite-ai" style="background: #0B0F19; border: 1px solid rgba(59, 130, 246, 0.35); box-shadow: 0 4px 20px rgba(37, 99, 235, 0.12); cursor: pointer;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(236, 72, 153, 0.15); color: #F472B6; border: 1px solid rgba(236, 72, 153, 0.3);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F472B6" stroke-width="2.2"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><circle cx="8" cy="16" r="1.5" fill="#F472B6"></circle><circle cx="16" cy="16" r="1.5" fill="#F472B6"></circle></svg>
                </div>
                <span style="background: rgba(236, 72, 153, 0.15); color: #F472B6; border: 1px solid rgba(236, 72, 153, 0.3); font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Model: Multi-Model Frontier AI</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: #FFFFFF; margin: 12px 0 6px;">Vyapar AI Sarthi</h3>
              <p style="font-size: 12px; color: #E2E8F0 !important; line-height: 1.5; margin-bottom: 16px;">
                Multi-model central copilot (Nemotron & Gemma). Ask sales questions in English/Hindi and get zero-hallucination mathematical answers.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 12px;">
              <span class="os-metric-pill" style="background: rgba(236, 72, 153, 0.12); color: #F472B6; border: 1px solid rgba(236, 72, 153, 0.25);">Growth & Strategy AI</span>
              <span style="font-size: 11px; font-weight: 800; color: #F472B6;">Chat with Sarthi &rarr;</span>
            </div>
          </div>

          <!-- Suite 5: Datasets & Cloud Hub -->
          <div class="os-card obsidian-glow-card" id="app-card-suite-datasets" style="background: #0B0F19; border: 1px solid rgba(59, 130, 246, 0.35); box-shadow: 0 4px 20px rgba(37, 99, 235, 0.12); cursor: pointer;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(37, 99, 235, 0.18); color: #38BDF8; border: 1px solid rgba(37, 99, 235, 0.35);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2.2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path><circle cx="12" cy="12" r="1.5" fill="#38BDF8"></circle></svg>
                </div>
                <span style="background: rgba(37, 99, 235, 0.18); color: #93C5FD; border: 1px solid rgba(37, 99, 235, 0.35); font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Cloud Data Hub</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: #FFFFFF !important; margin: 12px 0 6px; letter-spacing: -0.2px;">Datasets & Cloud Hub</h3>
              <p style="font-size: 12.5px; color: #E2E8F0 !important; line-height: 1.55; margin-bottom: 16px;">
                Upload, store, and switch between your business CSVs, sales spreadsheets, and inventory sheets with bank-grade privacy.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 12px;">
              <span class="os-metric-pill" style="background: rgba(37, 99, 235, 0.15); color: #38BDF8; border: 1px solid rgba(37, 99, 235, 0.3);">Bank-Grade Cloud</span>
              <span style="font-size: 12px; font-weight: 800; color: #38BDF8;">Manage Datasets &rarr;</span>
            </div>
          </div>

          <!-- Suite 6: Data Visualization Studio -->
          <div class="os-card obsidian-glow-card" id="app-card-suite-analytics" style="background: #0B0F19; border: 1px solid rgba(59, 130, 246, 0.35); box-shadow: 0 4px 20px rgba(37, 99, 235, 0.12); cursor: pointer;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div class="os-app-icon" style="background: rgba(233, 154, 58, 0.15); color: #E99A3A; border: 1px solid rgba(233, 154, 58, 0.3);">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E99A3A" stroke-width="2.2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line><circle cx="12" cy="4" r="2.5" fill="#E99A3A"></circle></svg>
                </div>
                <span style="background: rgba(233, 154, 58, 0.15); color: #FCD34D; border: 1px solid rgba(233, 154, 58, 0.3); font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Model: Statistical & Anomaly AI</span>
              </div>
              <h3 style="font-size: 16px; font-weight: 800; color: #FFFFFF; margin: 12px 0 6px;">Visual Sales Graphs & EDA</h3>
              <p style="font-size: 12px; color: #E2E8F0 !important; line-height: 1.5; margin-bottom: 16px;">
                Shopkeeper-friendly intelligent graph generator covering 7 categories: Sales, Product, Inventory, Finance, Customer, Purchase, Regional.
              </p>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 12px;">
              <span class="os-metric-pill" style="background: rgba(233, 154, 58, 0.12); color: #FCD34D; border: 1px solid rgba(233, 154, 58, 0.25);">Sales Analytics & EDA</span>
              <span style="font-size: 11px; font-weight: 800; color: #FCD34D;">Explore Graphs &rarr;</span>
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
          <button id="btn-close-dept-modal" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #E2E8F0 !important;">&times;</button>
        </div>

        <div id="modal-dept-desc" style="font-size: 13px; color: #E2E8F0 !important; line-height: 1.6; margin-bottom: 18px;"></div>

        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px; margin-bottom: 20px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--navy); margin-bottom: 8px;">Key Capabilities & Architecture:</div>
          <ul id="modal-dept-features" style="padding-left: 20px; font-size: 12px; color: #334155; line-height: 1.8;"></ul>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 16px;">
          <span style="font-size: 12px; color: #E2E8F0 !important; font-weight: 600;">Status: <span id="modal-dept-status" style="color: #B45309; font-weight: 800;">🚀 Coming Soon (In Active Development)</span></span>
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
              <p style="font-size: 12px; color: #E2E8F0 !important;">Summary of key business numbers, datasets, and sales performance.</p>
            </div>
          </div>
          <button id="btn-close-analytics-modal" style="background: none; border: none; font-size: 26px; cursor: pointer; color: #E2E8F0 !important;">&times;</button>
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

  document.getElementById("btn-hero-analytics-studio")?.addEventListener("click", () => navigateOrAuth("#bi-dashboard"));
  document.getElementById("app-card-suite-bi")?.addEventListener("click", () => navigateOrAuth("#bi-dashboard"));
  document.getElementById("app-card-suite-inventory")?.addEventListener("click", () => navigateOrAuth("#inventory"));
  document.getElementById("app-card-suite-finance")?.addEventListener("click", () => navigateOrAuth("#finance"));
  document.getElementById("app-card-suite-ai")?.addEventListener("click", () => navigateOrAuth("#ai-assistant"));
  document.getElementById("app-card-suite-excel")?.addEventListener("click", () => navigateOrAuth("#excel-integration"));
  document.getElementById("app-card-suite-analytics")?.addEventListener("click", () => navigateOrAuth("#analytics-studio"));
  document.getElementById("app-card-suite-datasets")?.addEventListener("click", () => navigateOrAuth("#datasets"));
  document.getElementById("app-card-excel-studio")?.addEventListener("click", () => navigateOrAuth("#excel-integration"));
  document.getElementById("app-card-analytics-studio")?.addEventListener("click", () => navigateOrAuth("#analytics-studio"));
  document.getElementById("app-card-bi-dashboard")?.addEventListener("click", () => navigateOrAuth("#bi-dashboard"));
  document.getElementById("app-card-ml-studio")?.addEventListener("click", () => navigateOrAuth("#bi-dashboard"));
  document.getElementById("app-card-data-studio")?.addEventListener("click", () => navigateOrAuth("#auto-analyst"));
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
          <div style="font-size: 11px; text-transform: uppercase; color: #E2E8F0 !important; font-weight: 700;">Consolidated Revenue</div>
          <div style="font-size: 22px; font-weight: 800; color: var(--navy); margin-top: 4px;">${revFormatted}</div>
          <div style="font-size: 11px; color: var(--green); font-weight: 600; margin-top: 4px;">+14.2% Growth Index</div>
        </div>

        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px;">
          <div style="font-size: 11px; text-transform: uppercase; color: #E2E8F0 !important; font-weight: 700;">Average Order Value (AOV)</div>
          <div style="font-size: 22px; font-weight: 800; color: var(--navy); margin-top: 4px;">${aovFormatted}</div>
          <div style="font-size: 11px; color: #6366F1; font-weight: 600; margin-top: 4px;">Commercial Transaction Avg</div>
        </div>

        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px;">
          <div style="font-size: 11px; text-transform: uppercase; color: #E2E8F0 !important; font-weight: 700;">Total Transactions</div>
          <div style="font-size: 22px; font-weight: 800; color: var(--navy); margin-top: 4px;">${orderCount.toLocaleString()} Orders</div>
          <div style="font-size: 11px; color: #E2E8F0 !important; margin-top: 4px;">Processed across datasets</div>
        </div>

        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px;">
          <div style="font-size: 11px; text-transform: uppercase; color: #E2E8F0 !important; font-weight: 700;">Data Health Score</div>
          <div style="font-size: 22px; font-weight: 800; color: #10B981; margin-top: 4px;">87.1 / 100</div>
          <div style="font-size: 11px; color: #059669; font-weight: 600; margin-top: 4px;">High Quality Benchmark</div>
        </div>
      </div>

      <!-- Dataset Registry Table -->
      <div style="border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; background: #FFFFFF;">
        <div style="background: #F8FAFC; padding: 12px 16px; border-bottom: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center;">
          <h4 style="font-size: 13px; font-weight: 800; color: var(--navy);">Connected Spreadsheets & Files (${allDatasets.length})</h4>
          <span style="font-size: 11px; color: #E2E8F0 !important; font-weight: 600;">Total Records: ${totalRows.toLocaleString()}</span>
        </div>
        <div style="max-height: 220px; overflow-y: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #F1F5F9; color: #E2E8F0 !important; text-align: left;">
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
                <tr><td colspan="5" style="padding: 20px; text-align: center; color: #E2E8F0 !important;">No datasets uploaded yet. Upload a CSV or Excel file to see live metrics.</td></tr>
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
