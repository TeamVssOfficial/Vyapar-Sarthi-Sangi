import { API } from "../api.js";

export async function renderSettings(container) {
  container.innerHTML = `
    <div class="space-y-6 max-w-4xl">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-[#14233D] brand-font">Account & Workspace Settings</h1>
          <p class="text-sm text-slate-500">Manage your profile, business workspaces, and check system connection status.</p>
        </div>
        <button onclick="window.navigateTo('#overview')" class="btn btn-outline" style="font-size: 12px; padding: 6px 14px; display: inline-flex; align-items: center; gap: 6px;">
          <span>&larr;</span> Dashboard Home
        </button>
      </div>

      <!-- User Profile Card -->
      <div class="vss-card p-6 space-y-4">
        <h3 class="text-base font-bold text-[#14233D] brand-font">User Account Profile</h3>
        <div id="settings-user-info" class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div class="p-3 bg-slate-50 rounded-lg">
            <span class="text-slate-400 block uppercase font-semibold">User Name</span>
            <b id="user-name-val" class="text-sm text-[#14233D]">--</b>
          </div>
          <div class="p-3 bg-slate-50 rounded-lg">
            <span class="text-slate-400 block uppercase font-semibold">Email Address</span>
            <b id="user-email-val" class="text-sm text-[#14233D]">--</b>
          </div>
          <div class="p-3 bg-slate-50 rounded-lg">
            <span class="text-slate-400 block uppercase font-semibold">Access Role</span>
            <b id="user-role-val" class="text-sm text-[#31856C] uppercase">--</b>
          </div>
        </div>
      </div>

      <!-- Subscription & License Status Card -->
      <div class="vss-card p-6 space-y-4" style="border-left: 4px solid #E99A3A; background: #FFFFFF; border-radius: 10px; border: 1px solid #E2E8F0; padding: 20px; margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 style="font-size: 15px; font-weight: 800; color: #14233D; margin: 0;">Subscription & Free Trial Status</h3>
            <p style="font-size: 12px; color: #64748B; margin: 2px 0 0 0;">Review evaluation dates, renewal status, and commercial license.</p>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button onclick="window.navigateTo('#subscription')" class="btn btn-saffron" style="font-size: 11px; padding: 6px 14px; font-weight: 700;">
              Manage Subscription &rarr;
            </button>
            <button id="btn-settings-admin-sub" onclick="window.navigateTo('#admin-subscriptions')" class="btn btn-outline" style="font-size: 11px; padding: 6px 12px; font-weight: 700; display: none;">
              ⚙️ Company Admin
            </button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 14px; font-size: 12px;">
          <div style="padding: 12px; background: #F8FAFC; border-radius: 8px;">
            <span style="color: #64748B; display: block; text-transform: uppercase; font-size: 10px; font-weight: 700;">Active Plan</span>
            <b id="settings-sub-plan-val" style="font-size: 13px; color: #14233D;">--</b>
          </div>
          <div style="padding: 12px; background: #F8FAFC; border-radius: 8px;">
            <span style="color: #64748B; display: block; text-transform: uppercase; font-size: 10px; font-weight: 700;">Status Posture</span>
            <b id="settings-sub-status-val" style="font-size: 13px; color: #047857;">--</b>
          </div>
          <div style="padding: 12px; background: #F8FAFC; border-radius: 8px;">
            <span style="color: #64748B; display: block; text-transform: uppercase; font-size: 10px; font-weight: 700;">Expiry Date (IST)</span>
            <b id="settings-sub-expiry-val" style="font-size: 13px; color: #14233D;">--</b>
          </div>
        </div>
      </div>

      <!-- Business Workspaces Card -->
      <div class="vss-card p-6 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-bold text-[#14233D] brand-font">Business Workspaces</h3>
            <p class="text-xs text-slate-500">Switch active commercial workspace or register a new subsidiary business unit.</p>
          </div>
          <button id="btn-show-new-biz" class="bg-[#14233D] hover:bg-[#0C1729] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
            <i data-lucide="plus" class="w-3.5 h-3.5 text-[#E99A3A]"></i> Create Workspace
          </button>
        </div>

        <div id="new-biz-form-box" class="hidden p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
          <h4 class="text-xs font-bold text-[#14233D] uppercase">New Commercial Business</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" id="new-biz-name" placeholder="Business Name (e.g., Delhi Retail Logistics)" class="px-3 py-2 border rounded-lg text-xs" />
            <input type="text" id="new-biz-industry" placeholder="Industry (e.g., FMCG, Retail)" class="px-3 py-2 border rounded-lg text-xs" />
          </div>
          <div class="flex justify-end gap-2">
            <button id="btn-cancel-new-biz" class="px-3 py-1.5 border rounded text-xs text-slate-600">Cancel</button>
            <button id="btn-submit-new-biz" class="bg-[#E99A3A] text-[#0C1729] font-bold px-4 py-1.5 rounded text-xs">Register Workspace</button>
          </div>
        </div>

        <div id="workspaces-list" class="space-y-2"></div>
      </div>

      <!-- Appearance & Theme Mode Card (Dark and Light Mode) -->
      <div class="vss-card p-6 space-y-4" style="border: 1px solid var(--border-color); border-radius: 10px; padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 class="text-base font-bold text-[#14233D] brand-font" style="margin: 0;">Appearance & Theme Mode (डार्क और लाइट थीम)</h3>
            <p class="text-xs text-slate-500" style="margin-top: 2px;">Switch visual presentation theme between Corporate Light and Executive Dark mode across the entire workspace.</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-top: 14px;">
          <!-- Light Mode Option -->
          <div id="settings-theme-light" class="theme-select-card" style="padding: 16px; border: 2px solid var(--border-color); border-radius: 10px; cursor: pointer; transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-size: 22px;">☀️</span>
              <span id="badge-theme-light" style="display: none; font-size: 10px; font-weight: 800; background: #DCFCE7; color: #15803D; padding: 2px 8px; border-radius: 12px;">ACTIVE</span>
            </div>
            <div style="font-weight: 800; font-size: 14px;">Corporate Light (लाइट)</div>
            <div style="font-size: 11px; color: var(--slate); margin-top: 4px;">Crisp ivory palette optimized for daytime operation and high-clarity data viewing.</div>
          </div>

          <!-- Dark Mode Option -->
          <div id="settings-theme-dark" class="theme-select-card" style="padding: 16px; border: 2px solid var(--border-color); border-radius: 10px; cursor: pointer; transition: all 0.2s ease;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-size: 22px;">🌙</span>
              <span id="badge-theme-dark" style="display: none; font-size: 10px; font-weight: 800; background: #FEF3C7; color: #B45309; padding: 2px 8px; border-radius: 12px;">ACTIVE</span>
            </div>
            <div style="font-weight: 800; font-size: 14px;">Executive Dark (डार्क)</div>
            <div style="font-size: 11px; color: var(--slate); margin-top: 4px;">High-contrast obsidian navy palette engineered for eye comfort and boardroom dashboards.</div>
          </div>
        </div>
      </div>

      <!-- System Telemetry & Diagnostic Status -->
      <div class="vss-card p-6 space-y-3">
        <h3 class="text-base font-bold text-[#14233D] brand-font">System Status & Connections</h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div class="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 flex items-center gap-2">
            <i data-lucide="check-circle" class="w-4 h-4 text-emerald-600"></i>
            <div>
              <div class="font-bold">FastAPI Core</div>
              <div class="text-[11px] text-emerald-600">v1.0.0 Online (Port 8000)</div>
            </div>
          </div>
          <div class="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 flex items-center gap-2">
            <i data-lucide="database" class="w-4 h-4 text-emerald-600"></i>
            <div>
              <div class="font-bold">Database Persistence</div>
              <div class="text-[11px] text-emerald-600">SQLAlchemy Relational</div>
            </div>
          </div>
          <div class="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 flex items-center gap-2">
            <i data-lucide="shield" class="w-4 h-4 text-emerald-600"></i>
            <div>
              <div class="font-bold">Tenant Isolation</div>
              <div class="text-[11px] text-emerald-600">Active Business Boundary</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Logout Button -->
      <div class="pt-2">
        <button id="btn-logout" class="bg-red-50 hover:bg-red-100 text-red-600 px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition border border-red-200">
          <i data-lucide="log-out" class="w-4 h-4"></i> Sign Out from VSS AI
        </button>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Load User & Business Data
  try {
    const profile = await API.getProfile();
    const u = profile.user || {};
    document.getElementById("user-name-val").innerText = u.name || "--";
    document.getElementById("user-email-val").innerText = u.email || "--";
    document.getElementById("user-role-val").innerText = u.role || "User";

    await renderWorkspaces();
  } catch (err) {
    console.error("Error loading settings:", err);
  }

  // Toggle new business form
  const newBizBox = document.getElementById("new-biz-form-box");
  document.getElementById("btn-show-new-biz")?.addEventListener("click", () => newBizBox.classList.remove("hidden"));
  document.getElementById("btn-cancel-new-biz")?.addEventListener("click", () => newBizBox.classList.add("hidden"));

  // Submit new business
  document.getElementById("btn-submit-new-biz")?.addEventListener("click", async () => {
    const name = document.getElementById("new-biz-name").value.trim();
    const ind = document.getElementById("new-biz-industry").value.trim();
    if (!name) return alert("Please specify a business name.");

    try {
      const biz = await API.createBusiness({ name, industry: ind || "General Business" });
      API.setActiveBusinessId(biz.id);
      newBizBox.classList.add("hidden");
      document.getElementById("new-biz-name").value = "";
      document.getElementById("new-biz-industry").value = "";
      await renderWorkspaces();
      window.dispatchEvent(new CustomEvent("vss:business-changed", { detail: { id: biz.id } }));
    } catch (e) {
      alert("Error creating business: " + e.message);
    }
  });

  // Theme selection handlers
  const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  const lightCard = document.getElementById("settings-theme-light");
  const darkCard = document.getElementById("settings-theme-dark");
  const lightBadge = document.getElementById("badge-theme-light");
  const darkBadge = document.getElementById("badge-theme-dark");

  function updateSettingsThemeUI(th) {
    const isD = (th === "dark");
    if (lightBadge) lightBadge.style.display = isD ? "none" : "inline-block";
    if (darkBadge) darkBadge.style.display = isD ? "inline-block" : "none";
    if (lightCard) {
      lightCard.style.borderColor = isD ? "var(--border-color)" : "var(--saffron)";
      lightCard.style.boxShadow = isD ? "none" : "0 4px 12px rgba(233, 154, 58, 0.15)";
    }
    if (darkCard) {
      darkCard.style.borderColor = isD ? "var(--saffron)" : "var(--border-color)";
      darkCard.style.boxShadow = isD ? "0 4px 12px rgba(233, 154, 58, 0.2)" : "none";
    }
  }

  updateSettingsThemeUI(currentTheme);

  if (lightCard) {
    lightCard.onclick = () => {
      if (window.applyTheme) window.applyTheme("light");
      updateSettingsThemeUI("light");
    };
  }
  if (darkCard) {
    darkCard.onclick = () => {
      if (window.applyTheme) window.applyTheme("dark");
      updateSettingsThemeUI("dark");
    };
  }

  // Logout handler
  document.getElementById("btn-logout")?.addEventListener("click", async () => {
    if (confirm("Are you sure you want to log out?")) {
      await API.logout();
      window.location.reload();
    }
  });
}

async function renderWorkspaces() {
  const container = document.getElementById("workspaces-list");
  if (!container) return;
  const businesses = await API.listBusinesses();
  const activeId = API.getActiveBusinessId();

  container.innerHTML = businesses.map(b => {
    const isActive = b.id === activeId || (!activeId && businesses[0]?.id === b.id);
    if (isActive && !activeId) API.setActiveBusinessId(b.id);

    return `
      <div class="p-3 rounded-lg border ${isActive ? 'bg-[#E99A3A]/10 border-[#E99A3A]' : 'bg-slate-50 border-slate-200'} flex items-center justify-between text-xs transition">
        <div>
          <div class="font-bold text-[#14233D] text-sm flex items-center gap-2">
            ${b.name}
            ${isActive ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E99A3A] text-white">ACTIVE</span>' : ''}
          </div>
          <div class="text-slate-500">${b.industry} • Role: ${b.role} • ${b.datasets_count || 0} datasets</div>
        </div>
        ${!isActive ? `
          <button onclick="window.switchWorkspace('${b.id}')" class="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-[#14233D] font-semibold transition">
            Switch to This
          </button>
        ` : ''}
      </div>
    `;
  }).join("");

  window.switchWorkspace = (id) => {
    API.setActiveBusinessId(id);
    API.setActiveDatasetId(null);
    renderWorkspaces();
    window.dispatchEvent(new CustomEvent("vss:business-changed", { detail: { id } }));
  };
}
