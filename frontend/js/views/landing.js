// Vyapar Verse (VSS AI) — Premium Enterprise Landing Page View
import { API } from "../api.js";

export function renderLanding(container) {
  container.innerHTML = `
    <div class="landing-page-root">
      <!-- 1. LANDING TOP NAVIGATION BAR -->
      <nav class="landing-navbar">
        <div class="landing-nav-inner">
          <div class="landing-brand cursor-pointer" onclick="window.navigateTo('#landing')">
            <div class="brand-logo-badge" style="background: linear-gradient(135deg, #E99A3A, #F59E0B); color: #0C1729; font-weight: 900;">VV</div>
            <div>
              <div class="brand-title">Vyapar Verse</div>
              <div class="brand-sub">by Vyapar Sarthi Sangi</div>
            </div>
          </div>

          <div class="landing-nav-links">
            <a href="#landing" class="landing-nav-link active">Home</a>
            <a href="#section-solutions" class="landing-nav-link" onclick="document.getElementById('section-solutions')?.scrollIntoView({behavior:'smooth'}); return false;">Solutions</a>
            <a href="#section-features" class="landing-nav-link" onclick="document.getElementById('section-features')?.scrollIntoView({behavior:'smooth'}); return false;">Features</a>
            <a href="#section-ai" class="landing-nav-link" onclick="document.getElementById('section-ai')?.scrollIntoView({behavior:'smooth'}); return false;">Central AI</a>
            <a href="#section-about" class="landing-nav-link" onclick="document.getElementById('section-about')?.scrollIntoView({behavior:'smooth'}); return false;">About</a>
            <a href="#section-contact" class="landing-nav-link" onclick="document.getElementById('section-contact')?.scrollIntoView({behavior:'smooth'}); return false;">Contact</a>
          </div>

          <div class="landing-nav-actions">
            <button id="landing-btn-signin" class="btn btn-outline" style="font-size: 13px; padding: 8px 18px; border-color: rgba(255,255,255,0.25); color: #FFFFFF;">
              Sign In
            </button>
            <button id="landing-btn-signup" class="btn btn-saffron" style="font-size: 13px; padding: 8px 20px; font-weight: 700;">
              Get Started
            </button>
            <button id="landing-btn-dashboard" class="btn" style="background: rgba(49, 133, 108, 0.25); color: #34D399; border: 1px solid rgba(49, 133, 108, 0.4); font-size: 13px; padding: 8px 16px; font-weight: 700;">
              Launch OS &rarr;
            </button>
          </div>
        </div>
      </nav>

      <!-- 2. HERO SECTION WITH TYPEWRITER ANIMATION -->
      <section class="landing-hero">
        <div class="landing-hero-backdrop"></div>
        <div class="landing-hero-content">
          <div class="landing-badge">
            <span class="badge-dot"></span>
            <span>AI-Powered Business Operating System</span>
          </div>

          <h1 class="landing-hero-title">
            <span class="hero-prefix">VYAPAR VERSE</span><br>
            <div style="display: inline-block; background: rgba(12, 23, 41, 0.7); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 12px; padding: 6px 18px; margin-top: 8px; box-shadow: 0 0 25px rgba(37, 99, 235, 0.25);">
              <span id="typewriter-text" class="hero-typewriter-highlight" style="color: #FCD34D;">Your One Business. One Solution.</span><span id="typewriter-cursor" class="hero-blinking-cursor">|</span>
            </div>
          </h1>

          <p class="landing-hero-tagline" style="font-size: 18px; font-weight: 800; color: #FFFFFF; letter-spacing: 0.5px; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">
            "One Business. One Solution. One Intelligent Sarthi."
          </p>

          <p class="landing-hero-description">
            Vyapar Verse bridges spreadsheets, business intelligence, inventory levels, financial books, and multi-model AI reasoning into one cohesive, bank-grade enterprise cockpit.
          </p>

          <div class="landing-hero-cta">
            <button id="btn-hero-explore" class="btn btn-saffron landing-cta-primary" style="box-shadow: 0 0 20px rgba(233, 154, 58, 0.4); font-size: 15px; padding: 14px 28px;">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Open Vyapar Verse &rarr;
            </button>
            <button id="btn-hero-getstarted" class="btn btn-outline landing-cta-secondary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
              Get Started Free
            </button>
          </div>

          <!-- Quick Metrics Bar -->
          <div class="landing-metrics-strip">
            <div class="metric-item">
              <div class="metric-val">100%</div>
              <div class="metric-lbl">Private & Isolated Data</div>
            </div>
            <div class="metric-sep"></div>
            <div class="metric-item">
              <div class="metric-val">14 Studios</div>
              <div class="metric-lbl">Unified in One OS</div>
            </div>
            <div class="metric-sep"></div>
            <div class="metric-item">
              <div class="metric-val">4 Frontier Models</div>
              <div class="metric-lbl">OpenRouter Orchestrated</div>
            </div>
            <div class="metric-sep"></div>
            <div class="metric-item">
              <div class="metric-val">&lt; 0.05s</div>
              <div class="metric-lbl">Native SVG & In-Memory EDA</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. PRODUCT INTRODUCTION: THE UNIFIED OS -->
      <section id="section-solutions" class="landing-section">
        <div class="section-container">
          <div class="section-header">
            <div class="section-tag">Platform Overview</div>
            <h2 class="section-title">The Unified Business Operating System</h2>
            <p class="section-subtitle">
              Traditional businesses lose 20+ hours a week juggling disconnected spreadsheets, accounting tools, and disjointed dashboards. Vyapar Verse consolidates your entire enterprise footprint into one verifiable engine.
            </p>
          </div>

          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon icon-saffron">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
              </div>
              <h3 class="feature-heading">Dataset Intelligence & EDA</h3>
              <p class="feature-body">
                Upload CSV and Excel workbooks. The engine automatically profiles data types, surfaces missing values, flags duplicates, and identifies statistical outliers via 1.5&times; IQR fences.
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-icon icon-blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
              </div>
              <h3 class="feature-heading">Executive BI Studio</h3>
              <p class="feature-body">
                Interactive real-time visualizations: Bar, Line, Donut, Heatmap, and Scatter plots. Filter by dates, calculate real AOV, revenue, and gross margins, or prompt dashboards in plain English.
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-icon icon-purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
              </div>
              <h3 class="feature-heading">AI Code Studio</h3>
              <p class="feature-body">
                Ask analytical questions and watch the AI synthesize production-grade Python (Pandas, SciPy, Scikit-learn). Run code directly in an isolated backend sandbox with live console output.
              </p>
            </div>

            <div class="feature-card">
              <div class="feature-icon icon-green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line></svg>
              </div>
              <h3 class="feature-heading">Predictive ML Studio</h3>
              <p class="feature-body">
                From demand forecasting to revenue regression and classification, train machine learning models automatically. Review training logs, $R^2$ scores, actual vs predicted charts, and feature weights.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. BUSINESS MODULES: INVENTORY & FINANCE -->
      <section id="section-features" class="landing-section bg-alt">
        <div class="section-container">
          <div class="dual-feature-row">
            <!-- Inventory Column -->
            <div class="dual-feature-card">
              <div class="dual-badge badge-inventory">Operational Pillar</div>
              <h3 class="dual-title">Inventory Management & Reorder Control</h3>
              <p class="dual-desc">
                Keep stock levels balanced and eliminate stockouts. Track incoming and outgoing logistics, product SKUs, supplier ledgers, and automated inventory valuation.
              </p>
              <ul class="dual-checklist">
                <li><span class="check-icon">&check;</span> Real-time Stock In / Stock Out Ledger</li>
                <li><span class="check-icon">&check;</span> Low-Stock Predictive Alerts & Reorder Points</li>
                <li><span class="check-icon">&check;</span> Total Valuation via FIFO & Weighted Costing</li>
                <li><span class="check-icon">&check;</span> Seamless SKU extraction from uploaded spreadsheets</li>
              </ul>
              <button onclick="window.navigateTo('#inventory')" class="btn btn-outline dual-btn">
                Open Inventory Studio &rarr;
              </button>
            </div>

            <!-- Finance Column -->
            <div class="dual-feature-card">
              <div class="dual-badge badge-finance">Financial Pillar</div>
              <h3 class="dual-title">Financial Ledgers, P&L & Cash Flow</h3>
              <p class="dual-desc">
                Gain crystal-clear visibility into where revenue arrives and capital leaves. Track income, operational overhead, monthly gross profit, and projected burn rate.
              </p>
              <ul class="dual-checklist">
                <li><span class="check-icon">&check;</span> Profit & Loss (P&L) Instant Generation</li>
                <li><span class="check-icon">&check;</span> Cash Flow Velocity & Burn Projections</li>
                <li><span class="check-icon">&check;</span> Revenue vs Expense Category Allocations</li>
                <li><span class="check-icon">&check;</span> Downloadable Audit-Ready Excel & PDF Reports</li>
              </ul>
              <button onclick="window.navigateTo('#finance')" class="btn btn-outline dual-btn">
                Open Finance Studio &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 5. CENTRAL AI ASSISTANT: MULTI-MODEL BRAIN -->
      <section id="section-ai" class="landing-section">
        <div class="section-container">
          <div class="ai-architecture-banner">
            <div class="ai-banner-content">
              <div class="section-tag" style="background: rgba(233,154,58,0.2); color: #E99A3A;">Multi-Model Central Brain</div>
              <h2 class="ai-title">OpenRouter Intelligence Gateway</h2>
              <p class="ai-desc">
                Vyapar Verse does not rely on a single fragile AI model. It features a provider-independent Central Brain connected to OpenRouter that routes each specific intent to the ideal frontier model.
              </p>

              <div class="model-cards-row">
                <div class="model-chip">
                  <div class="model-role">Strategic Orchestrator</div>
                  <div class="model-name">Nemotron 3 Ultra 550B</div>
                  <div class="model-scope">Multi-step planning & tool calling</div>
                </div>
                <div class="model-chip">
                  <div class="model-role">Logic & Code Engine</div>
                  <div class="model-name">Gemma 4 31B</div>
                  <div class="model-scope">Python synthesis & mathematics</div>
                </div>
                <div class="model-chip">
                  <div class="model-role">Ultra-Fast Routine Q&A</div>
                  <div class="model-name">Gemma 4 26B A4B</div>
                  <div class="model-scope">Instant insights & summaries</div>
                </div>
                <div class="model-chip">
                  <div class="model-role">Document & Visual AI</div>
                  <div class="model-name">Nemotron Nano Omni</div>
                  <div class="model-scope">Receipt OCR & multimodal analysis</div>
                </div>
              </div>

              <div class="ai-guarantee-box">
                <strong>Zero-Hallucination Guarantee:</strong> The AI orchestrator never fabricates financial or statistical metrics. Every figure is calculated deterministically by the underlying Python analytics core and validated before response generation.
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 6. EXCEL INTEGRATION SHOWCASE -->
      <section class="landing-section bg-alt">
        <div class="section-container">
          <div class="excel-showcase-box">
            <div style="flex: 1; min-width: 320px;">
              <div class="section-tag" style="background: rgba(49, 133, 108, 0.2); color: #34D399;">Spreadsheet First</div>
              <h2 class="section-title">Deep Excel & Multi-Sheet Integration</h2>
              <p class="section-subtitle" style="text-align: left; margin: 0 0 18px 0;">
                Whether you manage workbooks with one sheet or twenty, Vyapar Verse automatically maps sheets, preserves relational headers, and allows instant cross-tabulation without manual CSV exporting.
              </p>
              <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                <button onclick="window.navigateTo('#excel-studio')" class="btn btn-saffron" style="padding: 10px 20px; font-weight: 700;">
                  Launch Excel Studio
                </button>
                <button onclick="window.openDirectUploadModal()" class="btn btn-outline" style="padding: 10px 20px; font-weight: 700;">
                  Upload .xlsx File
                </button>
              </div>
            </div>
            <div class="excel-graphic">
              <div class="excel-sheet-pill active-pill">Sales_Q1 (2,823 rows)</div>
              <div class="excel-sheet-pill">Inventory_Status (412 rows)</div>
              <div class="excel-sheet-pill">Operating_Expenses (1,240 rows)</div>
              <div class="excel-sheet-pill">Supplier_Directory (88 rows)</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 7. ABOUT & TRUST -->
      <section id="section-about" class="landing-section">
        <div class="section-container" style="text-align: center; max-width: 820px;">
          <div class="section-tag">About Vyapar Verse</div>
          <h2 class="section-title">Built for Modern Businesses & Enterprises</h2>
          <p style="color: var(--slate); font-size: 15px; line-height: 1.7; margin-bottom: 24px;">
            Vyapar Sarthi Sangi was engineered from the ground up for merchants, CFOs, data teams, and business founders who demand verifiable accuracy over marketing buzzwords. Every insight, regression model, and cleaning recommendation is fully inspectable with downloadable code and reproducible math.
          </p>
          <div style="display: flex; justify-content: center; gap: 24px; flex-wrap: wrap; margin-top: 10px;">
            <div style="text-align: left; background: #FFFFFF; border: 1px solid #E2E8F0; padding: 18px 24px; border-radius: 10px; width: 240px;">
              <div style="font-size: 12px; font-weight: 800; color: var(--navy); text-transform: uppercase;">Bank-Grade Privacy</div>
              <div style="font-size: 12px; color: var(--slate); margin-top: 4px;">User-isolated encrypted storage trees with strict access control.</div>
            </div>
            <div style="text-align: left; background: #FFFFFF; border: 1px solid #E2E8F0; padding: 18px 24px; border-radius: 10px; width: 240px;">
              <div style="font-size: 12px; font-weight: 800; color: var(--navy); text-transform: uppercase;">Local & Cloud Hybrid</div>
              <div style="font-size: 12px; color: var(--slate); margin-top: 4px;">Runs offline on local desktop or auto-scales on cloud deployments.</div>
            </div>
            <div style="text-align: left; background: #FFFFFF; border: 1px solid #E2E8F0; padding: 18px 24px; border-radius: 10px; width: 240px;">
              <div style="font-size: 12px; font-weight: 800; color: var(--navy); text-transform: uppercase;">No Locked Vendors</div>
              <div style="font-size: 12px; color: var(--slate); margin-top: 4px;">Export raw data, cleaned datasets, and trained models anytime.</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 8. CONTACT & FOOTER -->
      <footer id="section-contact" class="landing-footer">
        <div class="section-container">
          <div class="footer-grid">
            <div class="footer-col brand-col">
              <div class="landing-brand">
                <div class="brand-logo-badge" style="background: linear-gradient(135deg, #E99A3A, #F59E0B); color: #0C1729; font-weight: 900;">VV</div>
                <div>
                  <div class="brand-title" style="color: #FFFFFF;">Vyapar Verse</div>
                  <div class="brand-sub" style="color: #94A3B8;">Vyapar Sarthi Sangi (VSS AI)</div>
                </div>
              </div>
              <p style="font-size: 12px; color: #94A3B8; margin-top: 14px; line-height: 1.6;">
                The unified AI-powered Business Operating System for high-performing commerce and modern enterprises.
              </p>
              <div style="font-size: 11px; color: #10B981; font-weight: 700; margin-top: 12px;">
                &bull; Production v2.0 Enterprise Engine Active
              </div>
            </div>

            <div class="footer-col">
              <div class="footer-heading">Platform Studios</div>
              <ul class="footer-links">
                <li><a href="#overview" onclick="window.navigateTo('#overview'); return false;">Overview Launchpad</a></li>
                <li><a href="#bi-dashboard" onclick="window.navigateTo('#bi-dashboard'); return false;">Executive BI Dashboard</a></li>
                <li><a href="#data-studio" onclick="window.navigateTo('#data-studio'); return false;">Data Cleaning Studio</a></li>
                <li><a href="#code-studio" onclick="window.navigateTo('#code-studio'); return false;">AI Code Studio</a></li>
                <li><a href="#ml-studio" onclick="window.navigateTo('#ml-studio'); return false;">Predictive ML Studio</a></li>
              </ul>
            </div>

            <div class="footer-col">
              <div class="footer-heading">Business Engines</div>
              <ul class="footer-links">
                <li><a href="#inventory" onclick="window.navigateTo('#inventory'); return false;">Inventory Management</a></li>
                <li><a href="#finance" onclick="window.navigateTo('#finance'); return false;">Finance &amp; Cash Flow</a></li>
                <li><a href="#ai-assistant" onclick="window.navigateTo('#ai-assistant'); return false;">Central AI Sarthi</a></li>
                <li><a href="#excel-studio" onclick="window.navigateTo('#excel-studio'); return false;">Excel Integration</a></li>
                <li><a href="#reports" onclick="window.navigateTo('#reports'); return false;">Audit PDF Reports</a></li>
              </ul>
            </div>

            <div class="footer-col">
              <div class="footer-heading">Enterprise Support</div>
              <ul class="footer-links">
                <li><a href="mailto:support@vyaparsarthi.com">support@vyaparsarthi.com</a></li>
                <li><a href="#settings" onclick="window.navigateTo('#settings'); return false;">System Settings</a></li>
                <li><a href="#landing" onclick="window.navigateTo('#landing'); return false;">Security &amp; Encryption</a></li>
                <li><a href="#landing" onclick="window.navigateTo('#landing'); return false;">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div class="footer-bottom">
            <div>&copy; 2026 Vyapar Sarthi Sangi (VSS AI) &bull; Vyapar Verse Platform. All rights reserved.</div>
            <div style="display: flex; gap: 16px;">
              <span>FastAPI Python 3.10 Engine</span>
              <span>&bull;</span>
              <span>MongoDB Atlas Cloud</span>
              <span>&bull;</span>
              <span>OpenRouter AI Core</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `;

  // Initialize interactive event listeners and typewriter animation
  setupLandingInteractions();
}

let typewriterInterval = null;

function setupLandingInteractions() {
  // Navigation button binds
  document.getElementById("landing-btn-signin")?.addEventListener("click", () => {
    if (window.openDirectAuthModal) window.openDirectAuthModal(null, "login");
  });
  document.getElementById("landing-btn-signup")?.addEventListener("click", () => {
    if (window.openDirectAuthModal) window.openDirectAuthModal(null, "register");
  });
  document.getElementById("landing-btn-dashboard")?.addEventListener("click", () => {
    window.navigateTo("#overview");
  });
  document.getElementById("btn-hero-explore")?.addEventListener("click", () => {
    window.navigateTo("#overview");
  });
  document.getElementById("btn-hero-getstarted")?.addEventListener("click", () => {
    if (window.openDirectAuthModal) window.openDirectAuthModal(null, "register");
  });

  // Typewriter Animation:
  // "VSS" character by character -> pause -> delete -> "VYAPAR VERSE" -> pause -> repeat
  const textEl = document.getElementById("typewriter-text");
  if (!textEl) return;

  // Clear any existing animation timer
  if (typewriterInterval) clearTimeout(typewriterInterval);

  // Check reduced-motion preference
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) {
    textEl.innerText = "VYAPAR VERSE";
    return;
  }

  const words = [
    "Your One Business. One Solution.",
    "Your Business. One System. One Intelligent Sarthi.",
    "Your Intelligent Business Sarthi.",
    "Autonomous Spreadsheets & BI.",
    "Bank-Grade Zero Hallucination AI."
  ];
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function typeTick() {
    const currentWord = words[wordIndex];
    if (isDeleting) {
      charIndex--;
      textEl.innerText = currentWord.substring(0, charIndex);
    } else {
      charIndex++;
      textEl.innerText = currentWord.substring(0, charIndex);
    }

    let delay = isDeleting ? 65 : 120;

    if (!isDeleting && charIndex === currentWord.length) {
      // Pause at full word
      delay = wordIndex === 0 ? 1400 : 2500;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      delay = 400;
    }

    typewriterInterval = setTimeout(typeTick, delay);
  }

  typeTick();
}
