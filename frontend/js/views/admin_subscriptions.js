import { API } from "../api.js";

export async function renderAdminSubscriptions(container) {
  container.innerHTML = `
    <div style="max-width: 1200px; margin: 0 auto; padding: 24px 16px; font-family: 'Inter', sans-serif;">
      
      <!-- Top Title Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="font-size: 11px; font-weight: 800; background: #14233D; color: #FFFFFF; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">
              Company Admin Portal
            </span>
            <span style="font-size: 11px; font-weight: 700; color: #E99A3A;">Strictly Confidential</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 800; color: #14233D; margin: 0; font-family: 'Manrope', sans-serif;">
            Subscription & Trial Expiry Management
          </h1>
          <p style="font-size: 13px; color: #64748B; margin: 4px 0 0 0;">
            Control company-wide Free Trial expiration dates, extend evaluation periods, update pricing, and audit subscription transitions.
          </p>
        </div>

        <div style="display: flex; gap: 10px;">
          <button id="btn-admin-refresh" class="btn btn-outline" style="font-size: 12px; padding: 6px 14px; display: inline-flex; align-items: center; gap: 6px;">
            <span>↻</span> Refresh Records
          </button>
          <button onclick="window.navigateTo('#subscription')" class="btn" style="background: rgba(20, 35, 61, 0.08); color: #14233D; border: 1px solid #CBD5E1; font-size: 12px; padding: 6px 14px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; cursor: pointer;">
            <span>&larr;</span> User Billing View
          </button>
        </div>
      </div>

      <!-- Alert Banner -->
      <div id="admin-sub-alert" style="display: none; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; font-weight: 600;"></div>

      <!-- Overview Analytics Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
        
        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; padding: 18px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase;">Total Registered Users</div>
          <div id="metric-total-users" style="font-size: 26px; font-weight: 900; color: #14233D; margin-top: 4px;">--</div>
          <div style="font-size: 11px; color: #94A3B8; margin-top: 2px;">Corporate Accounts</div>
        </div>

        <div style="background: #FFFFFF; border: 1px solid #BBF7D0; border-radius: 10px; padding: 18px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          <div style="font-size: 11px; font-weight: 700; color: #15803D; text-transform: uppercase;">Active Free Trials</div>
          <div id="metric-active-trials" style="font-size: 26px; font-weight: 900; color: #15803D; margin-top: 4px;">--</div>
          <div style="font-size: 11px; color: #16A34A; margin-top: 2px;">Full Feature Access</div>
        </div>

        <div style="background: #FFFFFF; border: 1px solid #FECACA; border-radius: 10px; padding: 18px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          <div style="font-size: 11px; font-weight: 700; color: #B91C1C; text-transform: uppercase;">Expired Free Trials</div>
          <div id="metric-expired-trials" style="font-size: 26px; font-weight: 900; color: #DC2626; margin-top: 4px;">--</div>
          <div style="font-size: 11px; color: #EF4444; margin-top: 2px;">Pending Paid Upgrade</div>
        </div>

        <div style="background: #FFFFFF; border: 1px solid #FEF08A; border-radius: 10px; padding: 18px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          <div style="font-size: 11px; font-weight: 700; color: #854D0E; text-transform: uppercase;">Paid Subscribers</div>
          <div id="metric-active-paid" style="font-size: 26px; font-weight: 900; color: #B45309; margin-top: 4px;">--</div>
          <div style="font-size: 11px; color: #D97706; margin-top: 2px;">Vyapar Business License</div>
        </div>

        <div style="background: #14233D; border-radius: 10px; padding: 18px; color: #FFFFFF; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <div style="font-size: 11px; font-weight: 700; color: #94A3B8; text-transform: uppercase;">Monthly Recurring Revenue</div>
          <div id="metric-mrr" style="font-size: 26px; font-weight: 900; color: #E99A3A; margin-top: 4px;">--</div>
          <div style="font-size: 11px; color: #CBD5E1; margin-top: 2px;">Estimated Active MRR</div>
        </div>

      </div>

      <!-- Plan Pricing & Duration Configuration Box -->
      <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 style="font-size: 15px; font-weight: 800; color: #14233D; margin: 0;">Subscription Plan Configuration</h3>
            <p style="font-size: 12px; color: #64748B; margin: 2px 0 0 0;">Update default free trial duration and monthly pricing without changing source code.</p>
          </div>
          <button id="btn-save-plan-config" class="btn btn-saffron" style="font-size: 12px; padding: 6px 16px; font-weight: 700;">
            Save Plan Configuration
          </button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px;">
          <div>
            <label style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 4px;">
              Default Free Trial Days
            </label>
            <input type="number" id="cfg-trial-days" min="1" max="90" style="width: 100%; padding: 8px 12px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 13px; font-weight: 700;" placeholder="7" />
            <span style="font-size: 10px; color: #64748B;">Duration assigned to new registrations (e.g. 7 or 14 days)</span>
          </div>

          <div>
            <label style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 4px;">
              Vyapar Business Price (INR / Month)
            </label>
            <input type="number" id="cfg-biz-price" min="0" step="1" style="width: 100%; padding: 8px 12px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 13px; font-weight: 700;" placeholder="799" />
            <span style="font-size: 10px; color: #64748B;">Monthly subscription fee charged via payment gateway</span>
          </div>
        </div>
      </div>

      <!-- Users & Expiry Control Table -->
      <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h3 style="font-size: 16px; font-weight: 800; color: #14233D; margin: 0;">User Access & Trial Expiration Directory</h3>
            <p style="font-size: 12px; color: #64748B; margin: 2px 0 0 0;">View real-time status and customize evaluation end dates for any corporate user.</p>
          </div>

          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <input type="text" id="admin-user-search" placeholder="Search by name or email..." style="padding: 6px 12px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 12px; width: 220px;" />
            
            <select id="admin-status-filter" style="padding: 6px 10px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 12px; font-weight: 600; color: #14233D;">
              <option value="ALL">All Statuses</option>
              <option value="TRIAL_ACTIVE">Active Free Trials</option>
              <option value="TRIAL_EXPIRED">Expired Trials</option>
              <option value="ACTIVE">Paid Subscribers</option>
              <option value="NO_SUBSCRIPTION">No Subscription</option>
            </select>
          </div>
        </div>

        <div id="admin-users-table-container">
          <div style="text-align: center; padding: 40px; color: #94A3B8; font-size: 13px;">
            Loading users directory...
          </div>
        </div>
      </div>

      <!-- Audit History of Trial Modifications -->
      <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03);">
        <h3 style="font-size: 16px; font-weight: 800; color: #14233D; margin: 0 0 12px 0;">
          Trial Modification Audit Log
        </h3>
        <p style="font-size: 12px; color: #64748B; margin: 0 0 16px 0;">
          Immutable ledger of trial extensions, shortenings, and manual adjustments performed by company administrators.
        </p>

        <div id="admin-extensions-log-container">
          <div style="text-align: center; padding: 30px; color: #94A3B8; font-size: 13px;">
            No trial modifications recorded yet.
          </div>
        </div>
      </div>

    </div>

    <!-- Company Admin Modify Expiry Modal -->
    <div id="admin-modify-trial-modal" class="modal-overlay" style="display: none;">
      <div class="modal-content" style="max-width: 480px; padding: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 16px; font-weight: 800; color: #14233D; margin: 0;">Adjust Free Trial Expiration</h3>
            <div id="modal-target-user-info" style="font-size: 12px; color: #64748B; margin-top: 2px;">--</div>
          </div>
          <button id="btn-close-modify-modal" style="background: none; border: none; font-size: 22px; cursor: pointer; color: #64748B;">&times;</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 14px;">
          
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="color: #64748B;">Current Expiry Date:</span>
              <b id="modal-current-expiry" style="color: #14233D;">--</b>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748B;">Current Status:</span>
              <b id="modal-current-status" style="color: #14233D;">--</b>
            </div>
          </div>

          <!-- Quick Action Buttons -->
          <div>
            <label style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 6px;">
              Quick Presets
            </label>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
              <button type="button" class="btn btn-outline btn-quick-ext" data-days="7" style="font-size: 11px; padding: 6px 4px; font-weight: 700;">+7 Days</button>
              <button type="button" class="btn btn-outline btn-quick-ext" data-days="14" style="font-size: 11px; padding: 6px 4px; font-weight: 700;">+14 Days</button>
              <button type="button" class="btn btn-outline btn-quick-ext" data-days="30" style="font-size: 11px; padding: 6px 4px; font-weight: 700;">+30 Days</button>
              <button type="button" class="btn btn-outline btn-quick-ext" data-days="0" style="font-size: 11px; padding: 6px 4px; font-weight: 700; color: #DC2626; border-color: #FECACA;">Expire Now</button>
            </div>
          </div>

          <!-- Custom Expiry Date Input -->
          <div>
            <label style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 4px;">
              Or Select Specific Expiry Date & Time
            </label>
            <input type="datetime-local" id="modal-custom-datetime" style="width: 100%; padding: 8px 12px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 13px;" />
          </div>

          <!-- Audit Reason -->
          <div>
            <label style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 4px;">
              Reason / Admin Notes (Required for Audit Log)
            </label>
            <input type="text" id="modal-audit-reason" placeholder="e.g. Granted extra demo days for FMCG wholesaler" style="width: 100%; padding: 8px 12px; border: 1px solid #CBD5E1; border-radius: 6px; font-size: 13px;" />
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 8px;">
            <button type="button" id="btn-cancel-modal-modify" class="btn btn-outline" style="font-size: 12px;">Cancel</button>
            <button type="button" id="btn-submit-modal-modify" class="btn btn-saffron" style="font-size: 12px; font-weight: 800; padding: 8px 18px;">
              Update Expiry Date
            </button>
          </div>

        </div>
      </div>
    </div>
  `;

  const alertBox = container.querySelector("#admin-sub-alert");
  const metricTotalUsers = container.querySelector("#metric-total-users");
  const metricActiveTrials = container.querySelector("#metric-active-trials");
  const metricExpiredTrials = container.querySelector("#metric-expired-trials");
  const metricActivePaid = container.querySelector("#metric-active-paid");
  const metricMrr = container.querySelector("#metric-mrr");
  const usersTableContainer = container.querySelector("#admin-users-table-container");
  const extensionsLogContainer = container.querySelector("#admin-extensions-log-container");

  const cfgTrialDays = container.querySelector("#cfg-trial-days");
  const cfgBizPrice = container.querySelector("#cfg-biz-price");
  const btnSavePlanConfig = container.querySelector("#btn-save-plan-config");

  const searchInput = container.querySelector("#admin-user-search");
  const statusFilterSelect = container.querySelector("#admin-status-filter");
  const refreshBtn = container.querySelector("#btn-admin-refresh");

  // Modal elements
  const modal = container.querySelector("#admin-modify-trial-modal");
  const modalUserInfo = container.querySelector("#modal-target-user-info");
  const modalCurrentExpiry = container.querySelector("#modal-current-expiry");
  const modalCurrentStatus = container.querySelector("#modal-current-status");
  const modalCustomDatetime = container.querySelector("#modal-custom-datetime");
  const modalAuditReason = container.querySelector("#modal-audit-reason");
  const btnCloseModal = container.querySelector("#btn-close-modify-modal");
  const btnCancelModal = container.querySelector("#btn-cancel-modal-modify");
  const btnSubmitModal = container.querySelector("#btn-submit-modal-modify");

  let activeModalUserId = null;
  let activeModalUserEmail = "";

  function showAlert(msg, type = "info") {
    if (!alertBox) return;
    alertBox.style.display = "block";
    alertBox.innerText = msg;
    if (type === "success") {
      alertBox.style.background = "#ECFDF5";
      alertBox.style.color = "#065F46";
      alertBox.style.border = "1px solid #A7F3D0";
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

  async function loadAdminData() {
    try {
      // 1. Fetch overview metrics
      const overviewRes = await API.getAdminSubscriptionOverview();
      const m = (overviewRes && overviewRes.metrics) || {};

      metricTotalUsers.innerText = m.total_users ?? "--";
      metricActiveTrials.innerText = m.active_trials ?? "--";
      metricExpiredTrials.innerText = m.expired_trials ?? "--";
      metricActivePaid.innerText = m.active_paid ?? "--";
      metricMrr.innerText = m.mrr_formatted ?? "--";

      // Populate plan config inputs
      const plans = m.plans || [];
      const trialPlan = plans.find(p => p.code === "free_trial");
      const bizPlan = plans.find(p => p.code === "vyapar_business");

      if (trialPlan && cfgTrialDays) {
        cfgTrialDays.value = trialPlan.trial_days_default || 7;
      }
      if (bizPlan && cfgBizPrice) {
        cfgBizPrice.value = Math.round(bizPlan.price_inr || 799);
      }

      // 2. Fetch users table
      await loadUsersTable();

      // 3. Fetch extensions log
      await loadExtensionsLog();

    } catch (err) {
      console.error("Admin subscription load error:", err);
      showAlert(`Notice: ${err.message || "Failed to load admin subscription dashboard. Ensure you have admin privileges."}`, "error");
    }
  }

  async function loadUsersTable() {
    const search = searchInput ? searchInput.value.trim() : "";
    const statusFilter = statusFilterSelect ? statusFilterSelect.value : "ALL";

    try {
      const res = await API.getAdminSubscriptionUsers(search, statusFilter, 1, 100);
      const data = (res && res.data) || {};
      const users = data.users || [];

      if (users.length === 0) {
        usersTableContainer.innerHTML = `
          <div style="text-align: center; padding: 30px; color: #94A3B8; font-size: 13px;">
            No users found matching query.
          </div>
        `;
        return;
      }

      let html = `
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px;">
            <thead>
              <tr style="border-bottom: 2px solid #E2E8F0; color: #64748B; font-weight: 700; text-transform: uppercase;">
                <th style="padding: 10px 12px;">User Account</th>
                <th style="padding: 10px 12px;">Role</th>
                <th style="padding: 10px 12px;">Current Status</th>
                <th style="padding: 10px 12px;">Plan</th>
                <th style="padding: 10px 12px;">Trial Expiry (IST)</th>
                <th style="padding: 10px 12px;">Days Remaining</th>
                <th style="padding: 10px 12px; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
      `;

      users.forEach(u => {
        let badgeBg = "#F1F5F9";
        let badgeColor = "#475569";
        let statusLabel = u.status;

        if (u.status === "TRIAL_ACTIVE") {
          badgeBg = "#DCFCE7";
          badgeColor = "#15803D";
          statusLabel = "Trial Active";
        } else if (u.status === "TRIAL_EXPIRED") {
          badgeBg = "#FEE2E2";
          badgeColor = "#B91C1C";
          statusLabel = "Trial Expired";
        } else if (u.status === "ACTIVE") {
          badgeBg = "#FEF3C7";
          badgeColor = "#B45309";
          statusLabel = "Paid Active";
        } else if (u.status === "NO_SUBSCRIPTION") {
          badgeBg = "#F1F5F9";
          badgeColor = "#64748B";
          statusLabel = "Not Started";
        }

        const daysBadge = u.days_remaining > 0
          ? `<span style="font-weight: 700; color: #047857;">${u.days_remaining} Days</span>`
          : `<span style="color: #94A3B8;">--</span>`;

        html += `
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 12px;">
              <b style="color: #14233D; display: block;">${u.name}</b>
              <span style="color: #64748B; font-size: 11px;">${u.email}</span>
            </td>
            <td style="padding: 10px 12px;">
              <span style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: ${u.role === 'admin' ? '#E99A3A' : '#64748B'};">
                ${u.role}
              </span>
            </td>
            <td style="padding: 10px 12px;">
              <span style="background: ${badgeBg}; color: ${badgeColor}; font-weight: 800; font-size: 10px; padding: 3px 8px; border-radius: 12px;">
                ${statusLabel}
              </span>
            </td>
            <td style="padding: 10px 12px; font-weight: 600; color: #14233D;">
              ${u.plan_code === 'free_trial' ? 'Free Trial' : (u.plan_code === 'vyapar_business' ? 'Vyapar Business' : '--')}
            </td>
            <td style="padding: 10px 12px; font-weight: 600; color: #334155;">
              ${u.trial_end_ist || '--'}
            </td>
            <td style="padding: 10px 12px;">
              ${daysBadge}
            </td>
            <td style="padding: 10px 12px; text-align: right;">
              <button 
                class="btn-open-modify-modal btn btn-outline" 
                data-user-id="${u.user_id}" 
                data-user-name="${u.name}" 
                data-user-email="${u.email}"
                data-current-expiry="${u.trial_end_ist || 'None'}"
                data-current-status="${statusLabel}"
                style="font-size: 11px; padding: 5px 10px; font-weight: 700;"
              >
                ⚙️ Modify Trial
              </button>
            </td>
          </tr>
        `;
      });

      html += `</tbody></table></div>`;
      usersTableContainer.innerHTML = html;

      // Attach click handlers to modify buttons
      const modifyButtons = usersTableContainer.querySelectorAll(".btn-open-modify-modal");
      modifyButtons.forEach(btn => {
        btn.onclick = () => {
          activeModalUserId = btn.getAttribute("data-user-id");
          activeModalUserEmail = btn.getAttribute("data-user-email");
          const uName = btn.getAttribute("data-user-name");
          const cExpiry = btn.getAttribute("data-current-expiry");
          const cStatus = btn.getAttribute("data-current-status");

          modalUserInfo.innerText = `${uName} (${activeModalUserEmail})`;
          modalCurrentExpiry.innerText = cExpiry;
          modalCurrentStatus.innerText = cStatus;
          modalAuditReason.value = "";
          modalCustomDatetime.value = "";

          if (modal) modal.style.display = "flex";
        };
      });

    } catch (err) {
      usersTableContainer.innerHTML = `
        <div style="padding: 20px; color: #DC2626; font-size: 13px;">
          Failed to load users list: ${err.message}
        </div>
      `;
    }
  }

  async function loadExtensionsLog() {
    try {
      const res = await API.getAdminExtensionsLog(50);
      const logs = (res && res.logs) || [];

      if (logs.length === 0) {
        extensionsLogContainer.innerHTML = `
          <div style="text-align: center; padding: 24px; color: #94A3B8; font-size: 13px;">
            No trial extension actions recorded yet.
          </div>
        `;
        return;
      }

      let html = `
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12px;">
            <thead>
              <tr style="border-bottom: 2px solid #E2E8F0; color: #64748B; font-weight: 700; text-transform: uppercase;">
                <th style="padding: 10px 12px;">Action Timestamp (IST)</th>
                <th style="padding: 10px 12px;">Target User</th>
                <th style="padding: 10px 12px;">Admin Actor</th>
                <th style="padding: 10px 12px;">Previous Expiry</th>
                <th style="padding: 10px 12px;">New Expiry</th>
                <th style="padding: 10px 12px;">Change</th>
                <th style="padding: 10px 12px;">Audit Reason</th>
              </tr>
            </thead>
            <tbody>
      `;

      logs.forEach(l => {
        const extDays = l.extension_days;
        const extStr = extDays >= 0 ? `+${extDays} Days` : `${extDays} Days`;
        const extColor = extDays >= 0 ? "#047857" : "#DC2626";

        html += `
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 10px 12px; font-weight: 600; color: #14233D;">${l.timestamp_ist}</td>
            <td style="padding: 10px 12px;">
              <b style="color: #14233D; display: block;">${l.user_name}</b>
              <span style="color: #64748B; font-size: 11px;">${l.user_email}</span>
            </td>
            <td style="padding: 10px 12px; font-family: monospace; font-size: 11px; color: #2563EB;">
              ${l.admin_email}
            </td>
            <td style="padding: 10px 12px; color: #64748B;">${l.previous_end_ist || 'None'}</td>
            <td style="padding: 10px 12px; font-weight: 700; color: #14233D;">${l.new_end_ist}</td>
            <td style="padding: 10px 12px; font-weight: 800; color: ${extColor};">${extStr}</td>
            <td style="padding: 10px 12px; color: #334155; font-style: italic;">"${l.reason}"</td>
          </tr>
        `;
      });

      html += `</tbody></table></div>`;
      extensionsLogContainer.innerHTML = html;

    } catch (err) {
      extensionsLogContainer.innerHTML = `<div style="padding: 16px; color: #DC2626;">Log load error: ${err.message}</div>`;
    }
  }

  // Quick Preset Buttons in Modal
  const quickExtButtons = container.querySelectorAll(".btn-quick-ext");
  quickExtButtons.forEach(btn => {
    btn.onclick = async () => {
      const days = parseInt(btn.getAttribute("data-days"), 10);
      if (!activeModalUserId) return;

      const reason = modalAuditReason.value.trim() || `Admin quick adjustment (${days >= 0 ? '+' : ''}${days} days)`;
      btn.disabled = true;

      try {
        await API.modifyUserTrial({
          user_id: activeModalUserId,
          days_to_add: days,
          reason: reason
        });
        if (modal) modal.style.display = "none";
        showAlert(`Trial expiry updated for ${activeModalUserEmail} (${days} days applied).`, "success");
        await loadAdminData();
      } catch (err) {
        showAlert(`Error updating trial: ${err.message}`, "error");
      } finally {
        btn.disabled = false;
      }
    };
  });

  // Custom Date Submit
  if (btnSubmitModal) {
    btnSubmitModal.onclick = async () => {
      if (!activeModalUserId) return;
      const customDt = modalCustomDatetime.value;
      if (!customDt) {
        showAlert("Please select a valid date/time or pick a quick preset button.", "error");
        return;
      }
      const reason = modalAuditReason.value.trim() || "Admin custom expiry date selection";

      btnSubmitModal.disabled = true;
      btnSubmitModal.innerText = "Saving...";

      try {
        const isoStr = new Date(customDt).toISOString();
        await API.modifyUserTrial({
          user_id: activeModalUserId,
          new_end_date_iso: isoStr,
          reason: reason
        });
        if (modal) modal.style.display = "none";
        showAlert(`Trial expiry updated for ${activeModalUserEmail} to ${customDt}.`, "success");
        await loadAdminData();
      } catch (err) {
        showAlert(`Error: ${err.message}`, "error");
      } finally {
        btnSubmitModal.disabled = false;
        btnSubmitModal.innerText = "Update Expiry Date";
      }
    };
  }

  // Modal Close Handlers
  const closeModal = () => { if (modal) modal.style.display = "none"; };
  if (btnCloseModal) btnCloseModal.onclick = closeModal;
  if (btnCancelModal) btnCancelModal.onclick = closeModal;

  // Save Plan Config Handler
  if (btnSavePlanConfig) {
    btnSavePlanConfig.onclick = async () => {
      const trialDays = parseInt(cfgTrialDays.value, 10);
      const bizPrice = parseFloat(cfgBizPrice.value);

      if (isNaN(trialDays) || trialDays < 1) {
        showAlert("Default trial duration must be at least 1 day.", "error");
        return;
      }
      if (isNaN(bizPrice) || bizPrice < 0) {
        showAlert("Subscription price must be a valid non-negative number.", "error");
        return;
      }

      btnSavePlanConfig.disabled = true;
      btnSavePlanConfig.innerText = "Saving Plan...";

      try {
        // Update trial plan
        await API.configureSubscriptionPlan({
          plan_code: "free_trial",
          trial_days_default: trialDays
        });

        // Update vyapar business plan
        await API.configureSubscriptionPlan({
          plan_code: "vyapar_business",
          price_inr: bizPrice
        });

        showAlert("✓ Plan configuration saved successfully. New prices and trial durations are now live.", "success");
        await loadAdminData();
      } catch (err) {
        showAlert(`Failed to save plan configuration: ${err.message}`, "error");
      } finally {
        btnSavePlanConfig.disabled = false;
        btnSavePlanConfig.innerText = "Save Plan Configuration";
      }
    };
  }

  // Search & Filter Listeners
  if (searchInput) {
    let debounceTimer;
    searchInput.oninput = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(loadUsersTable, 300);
    };
  }
  if (statusFilterSelect) {
    statusFilterSelect.onchange = loadUsersTable;
  }
  if (refreshBtn) {
    refreshBtn.onclick = () => {
      showAlert("Refreshed administrator metrics and user records.", "info");
      loadAdminData();
    };
  }

  // Initial load
  await loadAdminData();
}
