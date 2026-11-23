import { API } from "../api.js";

export async function renderSubscription(container) {
  container.innerHTML = `
    <div style="max-width: 1100px; margin: 0 auto; padding: 24px 16px; font-family: 'Inter', sans-serif;">
      
      <!-- Top Header Navigation -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 11px; font-weight: 800; background: rgba(233, 154, 58, 0.15); color: #B45309; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
              Access & Billing Management
            </span>
          </div>
          <h1 style="font-size: 24px; font-weight: 800; color: #14233D; margin: 0; font-family: 'Manrope', sans-serif;">
            Vyapar Verse Subscriptions & Plans
          </h1>
          <p style="font-size: 13px; color: #64748B; margin: 4px 0 0 0;">
            Manage your Free Trial, upgrade to Vyapar Business, and review billing history.
          </p>
        </div>
        
        <div style="display: flex; gap: 10px;">
          <button id="btn-sub-refresh" class="btn btn-outline" style="font-size: 12px; padding: 6px 14px; display: inline-flex; align-items: center; gap: 6px;">
            <span>↻</span> Refresh Status
          </button>
          <button onclick="window.navigateTo('#overview')" class="btn" style="background: rgba(20, 35, 61, 0.08); color: #14233D; border: 1px solid #CBD5E1; font-size: 12px; padding: 6px 14px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; cursor: pointer;">
            <span>&larr;</span> Launchpad
          </button>
        </div>
      </div>

      <!-- Notification Banner -->
      <div id="sub-alert-box" style="display: none; padding: 14px 18px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; font-weight: 600; line-height: 1.5;"></div>

      <!-- Current Subscription Status Hero Card -->
      <div id="current-sub-hero-card" style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; margin-bottom: 30px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); position: relative; overflow: hidden;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 16px;">
          <div style="flex: 1; min-width: 260px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span id="sub-status-badge" style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; background: #F1F5F9; color: #475569;">
                Loading Subscription...
              </span>
              <span id="sub-role-badge" style="font-size: 11px; color: #64748B; font-weight: 600;"></span>
            </div>
            
            <h2 id="sub-plan-title" style="font-size: 20px; font-weight: 800; color: #14233D; margin: 0 0 6px 0;">
              Checking Plan...
            </h2>
            <p id="sub-plan-desc" style="font-size: 13px; color: #64748B; margin: 0; max-width: 650px;">
              Connecting to secure subscription ledger...
            </p>
          </div>

          <div id="sub-expiry-box" style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 18px; text-align: right; min-width: 200px;">
            <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; margin-bottom: 4px;">Trial / Access Expiry</div>
            <div id="sub-expiry-date" style="font-size: 14px; font-weight: 800; color: #14233D;">--</div>
            <div id="sub-days-remaining" style="font-size: 12px; font-weight: 700; color: #E99A3A; margin-top: 2px;">--</div>
          </div>
        </div>

        <!-- Days Remaining Progress Bar -->
        <div id="sub-progress-container" style="margin-top: 20px; display: none;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: #64748B; margin-bottom: 6px;">
            <span>Access Timeline</span>
            <span id="sub-progress-label">Active</span>
          </div>
          <div style="width: 100%; height: 8px; background: #E2E8F0; border-radius: 4px; overflow: hidden;">
            <div id="sub-progress-bar" style="height: 100%; width: 100%; background: linear-gradient(90deg, #10B981, #059669); transition: width 0.4s ease;"></div>
          </div>
        </div>

        <!-- Granted Features Strip -->
        <div style="margin-top: 18px; padding-top: 16px; border-top: 1px solid #F1F5F9; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; font-size: 12px; color: #334155;">
            <span style="font-weight: 700; color: #14233D;">Included Features:</span>
            <span style="display: inline-flex; align-items: center; gap: 4px; color: #047857;">✓ Auto Data Science Agent</span>
            <span style="display: inline-flex; align-items: center; gap: 4px; color: #047857;">✓ Vyapar Excel Studio</span>
            <span style="display: inline-flex; align-items: center; gap: 4px; color: #047857;">✓ BI Dashboards</span>
            <span style="display: inline-flex; align-items: center; gap: 4px; color: #047857;">✓ Vyapar AI Sarthi</span>
            <span style="display: inline-flex; align-items: center; gap: 4px; color: #047857;">✓ Boardroom Reports</span>
          </div>

          <div id="sub-admin-quick-link" style="display: none;">
            <a href="#admin-subscriptions" style="font-size: 12px; font-weight: 700; color: #2563EB; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
              ⚙️ Open Company Admin Subscriptions &rarr;
            </a>
          </div>
        </div>
      </div>

      <!-- Subscription Options Section (Free Trial vs Paid Plan) -->
      <div style="margin-bottom: 30px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="font-size: 20px; font-weight: 800; color: #14233D; margin-bottom: 6px; font-family: 'Manrope', sans-serif;">
            Select Your Business Plan
          </h2>
          <p style="font-size: 13px; color: #64748B; max-width: 600px; margin: 0 auto;">
            Experience 100% of VSS AI features with zero upfront payment during Free Trial, or upgrade for uninterrupted operations.
          </p>
        </div>

        <div style="display: grid; grid-cols-1; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px;">
          
          <!-- Plan Card 1: Free Trial -->
          <div id="card-free-trial" style="background: #FFFFFF; border: 2px solid #E2E8F0; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03); transition: transform 0.2s ease, border-color 0.2s ease;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="background: rgba(16, 185, 129, 0.1); color: #047857; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">
                  Full Feature Trial
                </span>
                <span id="trial-duration-badge" style="font-size: 12px; font-weight: 700; color: #64748B;">
                  7 Days Free
                </span>
              </div>

              <h3 style="font-size: 20px; font-weight: 800; color: #14233D; margin: 0 0 4px 0;">Free Trial</h3>
              <p style="font-size: 12px; color: #64748B; margin-bottom: 16px;">
                Evaluate every enterprise module with your actual sales and inventory spreadsheets. Zero card required.
              </p>

              <div style="display: flex; align-items: baseline; gap: 4px; margin-bottom: 20px;">
                <span style="font-size: 32px; font-weight: 900; color: #14233D;">₹0</span>
                <span style="font-size: 13px; color: #64748B; font-weight: 600;">for evaluation period</span>
              </div>

              <ul style="list-style: none; padding: 0; margin: 0 0 24px 0; font-size: 13px; color: #334155; line-height: 2;">
                <li style="display: flex; align-items: center; gap: 8px;">
                  <span style="color: #10B981; font-weight: bold;">✓</span> <b>All Features Unlocked</b> (Zero restriction)
                </li>
                <li style="display: flex; align-items: center; gap: 8px;">
                  <span style="color: #10B981; font-weight: bold;">✓</span> Auto AI Data Science & Cleaning
                </li>
                <li style="display: flex; align-items: center; gap: 8px;">
                  <span style="color: #10B981; font-weight: bold;">✓</span> Vyapar Excel Studio with typing & formulas
                </li>
                <li style="display: flex; align-items: center; gap: 8px;">
                  <span style="color: #10B981; font-weight: bold;">✓</span> Business Intelligence & Sales Run-Rate
                </li>
                <li style="display: flex; align-items: center; gap: 8px;">
                  <span style="color: #10B981; font-weight: bold;">✓</span> Vyapar AI Sarthi Business Copilot
                </li>
                <li style="display: flex; align-items: center; gap: 8px;">
                  <span style="color: #10B981; font-weight: bold;">✓</span> Company-Admin Controlled Extension Support
                </li>
              </ul>
            </div>

            <div id="trial-action-container">
              <button id="btn-start-trial" class="btn" style="width: 100%; padding: 12px; font-weight: 800; font-size: 13px; background: #14233D; color: #FFFFFF; border: none; border-radius: 8px; cursor: pointer; transition: background 0.2s ease;">
                Start Free Trial
              </button>
            </div>
          </div>

          <!-- Plan Card 2: Vyapar Business (Paid Plan) -->
          <div id="card-paid-plan" style="background: #FFFFFF; border: 2px solid #E99A3A; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 10px 15px -3px rgba(233, 154, 58, 0.1); position: relative;">
            <div style="position: absolute; top: -11px; right: 24px; background: #E99A3A; color: #0C1729; font-size: 10px; font-weight: 900; padding: 2px 10px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
              Most Popular for Retailers
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                <span style="background: rgba(233, 154, 58, 0.15); color: #B45309; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase;">
                  Enterprise Commercial
                </span>
                <span style="font-size: 12px; font-weight: 700; color: #64748B;">
                  Monthly Renewal
                </span>
              </div>

              <h3 style="font-size: 20px; font-weight: 800; color: #14233D; margin: 0 0 4px 0;">Vyapar Business</h3>
              <p style="font-size: 12px; color: #64748B; margin-bottom: 16px;">
                Full-scale production deployment for Indian shops, retail stores, FMCG dealers, and commercial enterprises.
              </p>

              <div style="display: flex; align-items: baseline; gap: 4px; margin-bottom: 20px;">
                <span id="biz-price-display" style="font-size: 32px; font-weight: 900; color: #14233D;">₹799</span>
                <span style="font-size: 13px; color: #64748B; font-weight: 600;">/ month</span>
              </div>

              <ul style="list-style: none; padding: 0; margin: 0 0 24px 0; font-size: 13px; color: #334155; line-height: 2;">
                <li style="display: flex; align-items: center; gap: 8px;">
                  <span style="color: #E99A3A; font-weight: bold;">★</span> <b>Continuous 24/7 Cloud Operations</b>
                </li>
                <li style="display: flex; align-items: center; gap: 8px;">
                  <span style="color: #10B981; font-weight: bold;">✓</span> Unlimited Datasets & Excel Workbooks
                </li>
                <li style="display: flex; align-items: center; gap: 8px;">
                  <span style="color: #10B981; font-weight: bold;">✓</span> Priority Neural Model Execution (Ultra / Gemma)
                </li>
                <li style="display: flex; align-items: center; gap: 8px;">
                  <span style="color: #10B981; font-weight: bold;">✓</span> PDF Boardroom & Formatted Excel Exports
                </li>
                <li style="display: flex; align-items: center; gap: 8px;">
                  <span style="color: #10B981; font-weight: bold;">✓</span> Automated Bank-Grade Ingestion & Ledgers
                </li>
                <li style="display: flex; align-items: center; gap: 8px;">
                  <span style="color: #10B981; font-weight: bold;">✓</span> Instant Seamless Monthly Invoicing & GST Receipt
                </li>
              </ul>
            </div>

            <div id="paid-action-container">
              <button id="btn-subscribe-biz" class="btn" style="width: 100%; padding: 12px; font-weight: 800; font-size: 13px; background: #E99A3A; color: #0C1729; border: none; border-radius: 8px; cursor: pointer; transition: background 0.2s ease;">
                Choose Paid Subscription
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Payment History & Ledger Card -->
      <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <h3 style="font-size: 16px; font-weight: 800; color: #14233D; margin: 0 0 16px 0;">
          Payment & Billing History
        </h3>

        <div id="payment-history-container">
          <div style="text-align: center; padding: 24px; color: #94A3B8; font-size: 13px;">
            No transactions recorded yet.
          </div>
        </div>
      </div>

    </div>

    <!-- Payment Modal (For Sandbox / Testing or Razorpay Fallback) -->
    <div id="sub-payment-modal" class="modal-overlay" style="display: none;">
      <div class="modal-content" style="max-width: 460px; padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 16px; font-weight: 800; color: #14233D;">Complete Subscription Payment</h3>
          <button id="btn-close-payment-modal" style="background: none; border: none; font-size: 20px; cursor: pointer; color: #64748B;">&times;</button>
        </div>

        <div id="payment-modal-body" style="font-size: 13px; color: #334155; line-height: 1.6;">
          <!-- Injected dynamically -->
        </div>
      </div>
    </div>
  `;

  const alertBox = container.querySelector("#sub-alert-box");
  const statusBadge = container.querySelector("#sub-status-badge");
  const planTitle = container.querySelector("#sub-plan-title");
  const planDesc = container.querySelector("#sub-plan-desc");
  const expiryDateVal = container.querySelector("#sub-expiry-date");
  const daysRemVal = container.querySelector("#sub-days-remaining");
  const progressContainer = container.querySelector("#sub-progress-container");
  const progressBar = container.querySelector("#sub-progress-bar");
  const progressLabel = container.querySelector("#sub-progress-label");
  const trialActionContainer = container.querySelector("#trial-action-container");
  const paidActionContainer = container.querySelector("#paid-action-container");
  const bizPriceDisplay = container.querySelector("#biz-price-display");
  const trialDurationBadge = container.querySelector("#trial-duration-badge");
  const paymentHistoryContainer = container.querySelector("#payment-history-container");
  const adminQuickLink = container.querySelector("#sub-admin-quick-link");
  const roleBadge = container.querySelector("#sub-role-badge");

  function showAlert(msg, type = "info") {
    if (!alertBox) return;
    alertBox.style.display = "block";
    alertBox.innerText = msg;
    if (type === "success") {
      alertBox.style.background = "#ECFDF5";
      alertBox.style.color = "#065F46";
      alertBox.style.border = "1px solid #A7F3D0";
    } else if (type === "warning") {
      alertBox.style.background = "#FFFBEB";
      alertBox.style.color = "#92400E";
      alertBox.style.border = "1px solid #FDE68A";
    } else if (type === "error") {
      alertBox.style.background = "#FEF2F2";
      alertBox.style.color = "#991B1B";
      alertBox.style.border = "1px solid #FECACA";
    } else {
      alertBox.style.background = "#EFF6FF";
      alertBox.style.color = "#1E40AF";
      alertBox.style.border = "1px solid #BFDBFE";
    }
  }

  async function loadSubscriptionData() {
    try {
      // 1. Fetch plans
      const plansRes = await API.getSubscriptionPlans();
      const plans = (plansRes && plansRes.plans) || [];
      const trialPlan = plans.find(p => p.code === "free_trial");
      const bizPlan = plans.find(p => p.code === "vyapar_business");

      if (bizPlan && bizPriceDisplay) {
        bizPriceDisplay.innerText = `₹${Math.round(bizPlan.price_inr)}`;
      }
      if (trialPlan && trialDurationBadge) {
        trialDurationBadge.innerText = `${trialPlan.trial_days_default || 7} Days Free`;
      }

      // 2. Fetch current user subscription
      const sub = await API.getCurrentSubscription();

      if (sub.user_role === "admin") {
        if (adminQuickLink) adminQuickLink.style.display = "block";
        if (roleBadge) roleBadge.innerText = "(Company Administrator)";
      }

      // Update hero card based on status
      const status = sub.status || "NONE";
      const isTrial = sub.plan_code === "free_trial";

      if (status === "TRIAL_ACTIVE") {
        statusBadge.innerText = "● Free Trial Active (Full Access)";
        statusBadge.style.background = "#DCFCE7";
        statusBadge.style.color = "#15803D";

        planTitle.innerText = "Vyapar Verse Free Trial";
        planDesc.innerText = `Your free evaluation period is active with full access to all 7 AI Operating Suites. Controlled by company administrator policy.`;

        expiryDateVal.innerText = sub.trial_end_ist || "Calculated by Admin";
        daysRemVal.innerText = `${sub.days_remaining} Days Remaining`;

        progressContainer.style.display = "block";
        progressLabel.innerText = `${sub.days_remaining} Days Remaining (${sub.hours_remaining} hrs)`;
        const pct = Math.min(100, Math.max(10, (sub.days_remaining / 7) * 100));
        progressBar.style.width = `${pct}%`;

        trialActionContainer.innerHTML = `
          <button disabled class="btn" style="width: 100%; padding: 12px; font-weight: 700; font-size: 13px; background: #E2E8F0; color: #64748B; border: none; border-radius: 8px; cursor: not-allowed;">
            ✓ Active Free Trial (${sub.days_remaining}d Left)
          </button>
        `;

        paidActionContainer.innerHTML = `
          <button id="btn-upgrade-now" class="btn btn-saffron" style="width: 100%; padding: 12px; font-weight: 800; font-size: 13px; border-radius: 8px;">
            Upgrade to Vyapar Business Now
          </button>
        `;
        const upBtn = container.querySelector("#btn-upgrade-now");
        if (upBtn) upBtn.onclick = () => handleStartPayment(bizPlan);

      } else if (status === "TRIAL_EXPIRED") {
        statusBadge.innerText = "● Free Trial Expired";
        statusBadge.style.background = "#FEF2F2";
        statusBadge.style.color = "#DC2626";

        planTitle.innerText = "Free Trial Has Expired";
        planDesc.innerText = "Your trial period ended. Your saved datasets, business workbooks, and analyses are safely preserved. Upgrade to continue.";

        expiryDateVal.innerText = sub.trial_end_ist || "Expired";
        daysRemVal.innerText = "0 Days Remaining";
        daysRemVal.style.color = "#DC2626";

        showAlert("Your Free Trial has expired. Please upgrade to Vyapar Business to continue executing automated AI analytics. Your data is 100% safe.", "warning");

        trialActionContainer.innerHTML = `
          <button disabled class="btn" style="width: 100%; padding: 12px; font-weight: 700; font-size: 13px; background: #F1F5F9; color: #94A3B8; border: none; border-radius: 8px; cursor: not-allowed;">
            Trial Already Completed
          </button>
        `;

        paidActionContainer.innerHTML = `
          <button id="btn-renew-biz" class="btn btn-saffron" style="width: 100%; padding: 12px; font-weight: 800; font-size: 13px; border-radius: 8px;">
            Upgrade to Vyapar Business — ₹${bizPlan ? Math.round(bizPlan.price_inr) : 799}/mo
          </button>
        `;
        const renBtn = container.querySelector("#btn-renew-biz");
        if (renBtn) renBtn.onclick = () => handleStartPayment(bizPlan);

      } else if (status === "ACTIVE") {
        statusBadge.innerText = "● Vyapar Business Active (Paid)";
        statusBadge.style.background = "#FEF3C7";
        statusBadge.style.color = "#B45309";

        planTitle.innerText = "Vyapar Business Enterprise License";
        planDesc.innerText = "Your commercial subscription is fully active. Enjoy unlimited neural queries, automated pipelines, and continuous backups.";

        expiryDateVal.innerText = sub.period_end_ist || "Active";
        daysRemVal.innerText = `${sub.days_remaining} Days in Current Period`;
        daysRemVal.style.color = "#047857";

        progressContainer.style.display = "block";
        progressLabel.innerText = `Current Billing Cycle: ${sub.days_remaining} Days Remaining`;

        trialActionContainer.innerHTML = `
          <button disabled class="btn" style="width: 100%; padding: 12px; font-weight: 700; font-size: 13px; background: #F1F5F9; color: #94A3B8; border: none; border-radius: 8px; cursor: not-allowed;">
            Enterprise Plan Active
          </button>
        `;

        paidActionContainer.innerHTML = `
          <button disabled class="btn" style="width: 100%; padding: 12px; font-weight: 800; font-size: 13px; background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; border-radius: 8px; cursor: default;">
            ✓ Active Commercial Plan
          </button>
        `;

      } else {
        // NONE or other
        statusBadge.innerText = "● No Active Subscription";
        statusBadge.style.background = "#F1F5F9";
        statusBadge.style.color = "#64748B";

        planTitle.innerText = "Ready to Unlock VSS AI";
        planDesc.innerText = "Select Free Trial to test with your actual spreadsheets or subscribe to Vyapar Business for immediate commercial access.";

        expiryDateVal.innerText = "Not Activated";
        daysRemVal.innerText = "Trial Available";

        const startTrialBtn = container.querySelector("#btn-start-trial");
        if (startTrialBtn) {
          startTrialBtn.onclick = handleStartFreeTrial;
        }

        const subBizBtn = container.querySelector("#btn-subscribe-biz");
        if (subBizBtn) {
          subBizBtn.onclick = () => handleStartPayment(bizPlan);
        }
      }

      // Render Payment History
      const history = sub.payment_history || [];
      if (history.length > 0) {
        let historyHtml = `
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px;">
              <thead>
                <tr style="border-bottom: 2px solid #E2E8F0; color: #64748B; font-weight: 700; text-transform: uppercase;">
                  <th style="padding: 10px 12px;">Date & Time (IST)</th>
                  <th style="padding: 10px 12px;">Order ID</th>
                  <th style="padding: 10px 12px;">Payment ID</th>
                  <th style="padding: 10px 12px;">Amount</th>
                  <th style="padding: 10px 12px;">Status</th>
                </tr>
              </thead>
              <tbody>
        `;
        history.forEach(tx => {
          const isSuccess = tx.status === "SUCCESS";
          const badgeBg = isSuccess ? "#DCFCE7" : "#FEE2E2";
          const badgeColor = isSuccess ? "#166534" : "#991B1B";

          historyHtml += `
            <tr style="border-bottom: 1px solid #F1F5F9;">
              <td style="padding: 12px; font-weight: 600; color: #14233D;">${tx.created_at_ist}</td>
              <td style="padding: 12px; font-family: monospace; color: #475569;">${tx.order_id}</td>
              <td style="padding: 12px; font-family: monospace; color: #475569;">${tx.payment_id || '--'}</td>
              <td style="padding: 12px; font-weight: 700; color: #14233D;">₹${tx.amount_inr}</td>
              <td style="padding: 12px;">
                <span style="background: ${badgeBg}; color: ${badgeColor}; font-weight: 800; font-size: 10px; padding: 3px 8px; border-radius: 12px;">
                  ${tx.status}
                </span>
              </td>
            </tr>
          `;
        });
        historyHtml += `</tbody></table></div>`;
        paymentHistoryContainer.innerHTML = historyHtml;
      }

    } catch (err) {
      console.error("Subscription load error:", err);
      showAlert(`Notice: ${err.message || "Failed to load subscription details"}`, "error");
    }
  }

  async function handleStartFreeTrial() {
    const btn = container.querySelector("#btn-start-trial");
    if (btn) {
      btn.disabled = true;
      btn.innerText = "Activating Free Trial...";
    }
    try {
      const activeBiz = API.getActiveBusinessId();
      const res = await API.startFreeTrial(activeBiz);
      showAlert("🎉 Free Trial Activated! All 7 AI Operating Suites are now fully unlocked for your business.", "success");
      await loadSubscriptionData();
    } catch (err) {
      showAlert(err.message || "Could not activate free trial.", "error");
      if (btn) {
        btn.disabled = false;
        btn.innerText = "Start Free Trial";
      }
    }
  }

  async function handleStartPayment(bizPlan) {
    const modal = container.querySelector("#sub-payment-modal");
    const modalBody = container.querySelector("#payment-modal-body");
    const activeBiz = API.getActiveBusinessId();

    try {
      showAlert("Initiating secure order...", "info");
      const orderRes = await API.createSubscriptionOrder(activeBiz, "vyapar_business");
      const order = orderRes.order;

      if (!order) throw new Error("Order creation failed.");

      // Check if Razorpay live keys are configured
      if (order.razorpay_configured && window.Razorpay) {
        // Open live Razorpay Checkout Modal
        const options = {
          key: order.key_id,
          amount: order.amount_paise,
          currency: order.currency,
          name: "Vyapar Verse (VSS AI)",
          description: "Vyapar Business Monthly Subscription",
          order_id: order.order_id,
          handler: async function (response) {
            try {
              showAlert("Verifying payment signature...", "info");
              await API.verifySubscriptionPayment({
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                business_id: activeBiz
              });
              showAlert("Payment successful! Your Vyapar Business subscription is now active.", "success");
              await loadSubscriptionData();
            } catch (vErr) {
              showAlert(`Payment verification error: ${vErr.message}`, "error");
            }
          },
          theme: {
            color: "#E99A3A"
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Open Sandbox / Direct Verification Modal
        modalBody.innerHTML = `
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #64748B;">Subscription Plan:</span>
              <b style="color: #14233D;">Vyapar Business</b>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #64748B;">Billing Cycle:</span>
              <b style="color: #14233D;">Monthly</b>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="color: #64748B;">Order Identifier:</span>
              <code style="color: #2563EB;">${order.order_id}</code>
            </div>
            <div style="display: flex; justify-content: space-between; border-top: 1px solid #CBD5E1; padding-top: 8px; font-size: 15px;">
              <span style="font-weight: 700; color: #14233D;">Total Payable:</span>
              <b style="color: #14233D; font-size: 18px;">₹${order.price_inr}</b>
            </div>
          </div>

          <div style="background: rgba(233,154,58,0.1); border: 1px solid rgba(233,154,58,0.3); border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 12px; color: #92400E; line-height: 1.5;">
            <b>Payment Gateway Notice:</b> Razorpay API keys can be supplied via environment variables (<code style="background: white; padding: 1px 4px; border-radius: 3px;">RAZORPAY_KEY_ID</code>). For immediate testing and demonstration, use the button below to verify and complete activation in sandbox mode.
          </div>

          <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button id="btn-cancel-modal-pay" class="btn btn-outline" style="font-size: 12px;">Cancel</button>
            <button id="btn-confirm-sandbox-pay" class="btn btn-saffron" style="font-size: 12px; padding: 8px 18px; font-weight: 800;">
              Verify & Activate Vyapar Business (₹${order.price_inr})
            </button>
          </div>
        `;

        if (modal) modal.style.display = "flex";

        const closeBtn = container.querySelector("#btn-close-payment-modal");
        const cancelBtn = container.querySelector("#btn-cancel-modal-pay");
        const confirmBtn = container.querySelector("#btn-confirm-sandbox-pay");

        const closeModal = () => { if (modal) modal.style.display = "none"; };
        if (closeBtn) closeBtn.onclick = closeModal;
        if (cancelBtn) cancelBtn.onclick = closeModal;

        if (confirmBtn) {
          confirmBtn.onclick = async () => {
            confirmBtn.disabled = true;
            confirmBtn.innerText = "Activating Subscription...";
            try {
              const testPayId = `pay_mock_${Date.now().toString(36)}`;
              await API.verifySubscriptionPayment({
                order_id: order.order_id,
                payment_id: testPayId,
                signature: "sandbox_verified_signature",
                business_id: activeBiz
              });
              closeModal();
              showAlert("Payment successful! Vyapar Business subscription has been activated.", "success");
              await loadSubscriptionData();
            } catch (sErr) {
              showAlert(`Activation error: ${sErr.message}`, "error");
              confirmBtn.disabled = false;
              confirmBtn.innerText = "Try Again";
            }
          };
        }
      }
    } catch (err) {
      showAlert(`Could not initiate payment order: ${err.message}`, "error");
    }
  }

  // Refresh button listener
  const refreshBtn = container.querySelector("#btn-sub-refresh");
  if (refreshBtn) {
    refreshBtn.onclick = () => {
      showAlert("Refreshed latest subscription posture.", "info");
      loadSubscriptionData();
    };
  }

  // Initial load
  await loadSubscriptionData();
}
