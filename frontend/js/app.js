import { API } from "./api.js";
import { renderOverview } from "./views/overview.js";
import { renderDatasets } from "./views/datasets.js";
import { renderDataStudio } from "./views/data_studio.js";
import { renderAnalyticsStudio } from "./views/analytics_studio.js";
import { renderBIDashboard } from "./views/bi_dashboard.js";
import { renderMLStudio } from "./views/ml_studio.js";
import { renderAIAnalyst } from "./views/ai_analyst.js";
import { renderReports } from "./views/reports.js";
import { renderSettings } from "./views/settings.js";

const routes = {
  "": renderOverview,
  "#": renderOverview,
  "#overview": renderOverview,
  "#datasets": renderDatasets,
  "#data-studio": renderDataStudio,
  "#analytics-studio": renderAnalyticsStudio,
  "#bi-dashboard": renderBIDashboard,
  "#ml-studio": renderMLStudio,
  "#ai-analyst": renderAIAnalyst,
  "#reports": renderReports,
  "#settings": renderSettings
};

export function openDirectUploadModal() {
  const modal = document.getElementById("direct-upload-modal");
  if (modal) modal.style.display = "flex";
}

export function closeDirectUploadModal() {
  const modal = document.getElementById("direct-upload-modal");
  if (modal) modal.style.display = "none";
}

export function switchAuthTab(tab = "login") {
  const tabLogin = document.getElementById("auth-tab-btn-login");
  const tabRegister = document.getElementById("auth-tab-btn-register");
  const tabOtp = document.getElementById("auth-tab-btn-otp");
  const loginForm = document.getElementById("direct-login-form");
  const regForm = document.getElementById("direct-register-form");
  const forgotForm = document.getElementById("direct-forgot-form");
  const forgotStep1 = document.getElementById("forgot-step-1");
  const forgotStep2 = document.getElementById("forgot-step-2");
  const authErr = document.getElementById("direct-auth-error");

  if (authErr) authErr.style.display = "none";

  const resetTabStyle = (btn) => {
    if (!btn) return;
    btn.style.borderBottom = "none";
    btn.style.background = "#F8FAFC";
    btn.style.color = "var(--slate)";
  };

  const activeTabStyle = (btn) => {
    if (!btn) return;
    btn.style.borderBottom = "2px solid var(--saffron)";
    btn.style.background = "#FFFFFF";
    btn.style.color = "var(--navy)";
  };

  resetTabStyle(tabLogin);
  resetTabStyle(tabRegister);
  resetTabStyle(tabOtp);

  if (loginForm) loginForm.style.display = "none";
  if (regForm) regForm.style.display = "none";
  if (forgotForm) forgotForm.style.display = "none";

  if (tab === "otp") {
    activeTabStyle(tabOtp);
    if (forgotForm) forgotForm.style.display = "flex";
    if (forgotStep1) forgotStep1.style.display = "block";
    if (forgotStep2) forgotStep2.style.display = "none";
    const loginEmail = document.getElementById("auth-login-email")?.value?.trim();
    const forgotEmail = document.getElementById("auth-forgot-email");
    if (loginEmail && forgotEmail && !forgotEmail.value) {
      forgotEmail.value = loginEmail;
    }
    setTimeout(() => forgotEmail?.focus(), 100);
  } else if (tab === "register") {
    activeTabStyle(tabRegister);
    if (regForm) regForm.style.display = "flex";
  } else {
    activeTabStyle(tabLogin);
    if (loginForm) loginForm.style.display = "flex";
  }
}

export function openDirectAuthModal(message, defaultTab = "login") {
  const modal = document.getElementById("direct-auth-modal");
  const authErr = document.getElementById("direct-auth-error");
  if (authErr) {
    if (message) {
      authErr.innerText = message;
      authErr.style.display = "block";
      authErr.style.background = "#EFF6FF";
      authErr.style.color = "#1E40AF";
      authErr.style.border = "1px solid #BFDBFE";
    } else {
      authErr.style.display = "none";
    }
  }
  switchAuthTab(defaultTab);
  if (modal) modal.style.display = "flex";
}

export function closeDirectAuthModal() {
  const modal = document.getElementById("direct-auth-modal");
  if (modal) modal.style.display = "none";
}

export function navigateTo(route) {
  let target = route;
  if (!target || target === "#" || target === "") {
    target = "#overview";
  }
  if (window.location.hash === target) {
    handleRoute();
  } else {
    window.location.hash = target;
  }
}

// Make accessible globally to views and inline handlers
window.navigateTo = navigateTo;
window.openDirectUploadModal = openDirectUploadModal;
window.closeDirectUploadModal = closeDirectUploadModal;
window.openDirectAuthModal = openDirectAuthModal;
window.closeDirectAuthModal = closeDirectAuthModal;

function setupGlobalModals() {
  // 1. Top Upload Button & Modal
  const topUploadBtn = document.getElementById("top-direct-upload-btn");
  if (topUploadBtn) {
    topUploadBtn.addEventListener("click", openDirectUploadModal);
  }
  document.getElementById("btn-close-direct-upload")?.addEventListener("click", closeDirectUploadModal);
  document.getElementById("btn-cancel-direct-upload")?.addEventListener("click", closeDirectUploadModal);

  // File Picker & Drag-and-drop
  const dropCard = document.getElementById("file-drop-card");
  const fileInput = document.getElementById("direct-file-input");
  const fileLabel = document.getElementById("file-selected-label");

  if (dropCard && fileInput) {
    dropCard.addEventListener("click", () => fileInput.click());

    dropCard.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropCard.style.borderColor = "var(--saffron)";
      dropCard.style.background = "#FEF3C7";
    });

    dropCard.addEventListener("dragleave", (e) => {
      e.preventDefault();
      dropCard.style.borderColor = "#CBD5E1";
      dropCard.style.background = "#F8FAFC";
    });

    dropCard.addEventListener("drop", (e) => {
      e.preventDefault();
      dropCard.style.borderColor = "#CBD5E1";
      dropCard.style.background = "#F8FAFC";
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        updateSelectedFileLabel(fileInput.files[0]);
      }
    });

    fileInput.addEventListener("change", () => {
      if (fileInput.files && fileInput.files.length > 0) {
        updateSelectedFileLabel(fileInput.files[0]);
      }
    });
  }

  function updateSelectedFileLabel(file) {
    if (!file || !fileLabel) return;
    const sizeKB = (file.size / 1024).toFixed(1);
    fileLabel.innerHTML = `<span style="color: var(--navy); font-weight: 700;">${file.name}</span> <span style="color: var(--saffron);">(${sizeKB} KB)</span>`;
  }

  // Upload Form Submission
  const uploadForm = document.getElementById("direct-upload-form");
  if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const statusDiv = document.getElementById("direct-upload-status");
      const submitBtn = document.getElementById("btn-submit-direct-upload");

      const file = fileInput?.files?.[0];
      if (!file) {
        statusDiv.style.display = "block";
        statusDiv.style.background = "#FEE2E2";
        statusDiv.style.color = "#DC2626";
        statusDiv.innerText = "Please select a CSV or Excel file to upload.";
        return;
      }

      // Check auth: if user has no token, prompt sign-in
      if (!API.getToken()) {
        statusDiv.style.display = "block";
        statusDiv.style.background = "#FEF3C7";
        statusDiv.style.color = "#92400E";
        statusDiv.innerText = "Please sign in to upload business datasets.";
        setTimeout(() => {
          closeDirectUploadModal();
          openDirectAuthModal("🔒 Please sign in to your enterprise account to upload datasets.");
        }, 800);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      const titleInput = document.getElementById("direct-upload-title");
      if (titleInput?.value?.trim()) {
        formData.append("name", titleInput.value.trim());
      }

      statusDiv.style.display = "block";
      statusDiv.style.background = "#EFF6FF";
      statusDiv.style.color = "#1E40AF";
      statusDiv.innerText = "Ingesting, detecting schema, and profiling dataset... Please wait.";
      if (submitBtn) submitBtn.disabled = true;

      try {
        const result = await API.uploadDataset(formData);
        statusDiv.style.background = "#ECFDF5";
        statusDiv.style.color = "#065F46";
        statusDiv.innerText = `Dataset '${result.name}' successfully uploaded and profiled (${result.row_count} rows, ${result.column_count} columns)!`;

        API.setActiveDatasetId(result.id);
        window.dispatchEvent(new CustomEvent("vss:dataset-changed", { detail: { id: result.id } }));

        setTimeout(() => {
          closeDirectUploadModal();
          uploadForm.reset();
          if (fileLabel) fileLabel.innerText = "Click to Browse or Drag File Here";
          statusDiv.style.display = "none";
          if (submitBtn) submitBtn.disabled = false;
          handleRoute();
        }, 900);
      } catch (err) {
        statusDiv.style.background = "#FEE2E2";
        statusDiv.style.color = "#DC2626";
        statusDiv.innerText = `Upload failed: ${err.message}`;
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // 2. Top Auth Button & Auth Modal
  const topAuthBtn = document.getElementById("top-auth-btn");
  if (topAuthBtn) {
    topAuthBtn.addEventListener("click", () => {
      const token = API.getToken();
      if (token) {
        const confirmLogout = confirm("You are currently signed in. Would you like to sign out of this workspace?");
        if (confirmLogout) {
          API.logout();
          API.setToken(null);
          API.setActiveBusinessId(null);
          API.setActiveDatasetId(null);
          updateUserUI(null, []);
          handleRoute();
        }
      } else {
        openDirectAuthModal();
      }
    });
  }

  // Top Email OTP Button
  document.getElementById("top-otp-btn")?.addEventListener("click", () => {
    openDirectAuthModal(null, "otp");
  });

  // Modal Auth Tabs
  const tabLogin = document.getElementById("auth-tab-btn-login");
  const tabRegister = document.getElementById("auth-tab-btn-register");
  const tabOtp = document.getElementById("auth-tab-btn-otp");
  const forgotForm = document.getElementById("direct-forgot-form");
  const forgotStep1 = document.getElementById("forgot-step-1");
  const forgotStep2 = document.getElementById("forgot-step-2");
  const authErr = document.getElementById("direct-auth-error");

  tabLogin?.addEventListener("click", () => switchAuthTab("login"));
  tabRegister?.addEventListener("click", () => switchAuthTab("register"));
  tabOtp?.addEventListener("click", () => switchAuthTab("otp"));
  document.getElementById("btn-show-forgot-form")?.addEventListener("click", () => switchAuthTab("otp"));
  document.getElementById("btn-back-to-login")?.addEventListener("click", () => switchAuthTab("login"));

  // Send OTP handler
  document.getElementById("btn-request-otp")?.addEventListener("click", async () => {
    const email = document.getElementById("auth-forgot-email")?.value?.trim();
    const btn = document.getElementById("btn-request-otp");
    if (!email) {
      if (authErr) {
        authErr.style.display = "block";
        authErr.style.background = "#FEE2E2";
        authErr.style.color = "#DC2626";
        authErr.innerText = "Please enter your registered corporate email.";
      }
      return;
    }
    if (authErr) authErr.style.display = "none";
    if (btn) {
      btn.disabled = true;
      btn.innerText = "Sending OTP...";
    }

    try {
      await API.sendOtp(email);
      if (forgotStep1) forgotStep1.style.display = "none";
      if (forgotStep2) forgotStep2.style.display = "block";
    } catch (err) {
      if (authErr) {
        authErr.style.display = "block";
        authErr.style.background = "#FEE2E2";
        authErr.style.color = "#DC2626";
        authErr.innerText = err.message || "Failed to send OTP.";
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerText = "Send OTP to Email";
      }
    }
  });

  // Reset Password with OTP submit handler
  forgotForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-forgot-email")?.value?.trim();
    const otp = document.getElementById("auth-forgot-otp")?.value?.trim();
    const newPassword = document.getElementById("auth-forgot-new-pwd")?.value;
    const submitBtn = document.getElementById("btn-submit-reset-pwd");

    if (authErr) authErr.style.display = "none";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = "Verifying & Updating...";
    }

    try {
      const res = await API.resetPassword(email, otp, newPassword);
      if (authErr) {
        authErr.style.display = "block";
        authErr.style.background = "#ECFDF5";
        authErr.style.color = "#065F46";
        authErr.innerText = "✓ Password updated successfully! Signing you in...";
      }
      // Auto-login with new credentials
      setTimeout(async () => {
        try {
          const data = await API.login({ email, password: newPassword });
          API.setToken(data.token);
          if (data.businesses && data.businesses.length > 0) {
            API.setActiveBusinessId(data.businesses[0].id);
          }
          closeDirectAuthModal();
          showLoginForm();
          updateUserUI(data.user, data.businesses);
          handleRoute();
        } catch {
          showLoginForm();
          const loginEmail = document.getElementById("auth-login-email");
          if (loginEmail) loginEmail.value = email;
        }
      }, 1000);
    } catch (err) {
      if (authErr) {
        authErr.style.display = "block";
        authErr.style.background = "#FEE2E2";
        authErr.style.color = "#DC2626";
        authErr.innerText = err.message || "Invalid OTP code or password reset error.";
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = "Verify OTP & Reset Password";
      }
    }
  });

  document.getElementById("btn-close-auth-modal")?.addEventListener("click", closeDirectAuthModal);

  // Direct Login Form Submit
  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-login-email")?.value;
    const password = document.getElementById("auth-login-password")?.value;
    const submitBtn = document.getElementById("btn-submit-direct-login");

    if (authErr) authErr.style.display = "none";
    if (submitBtn) submitBtn.disabled = true;

    try {
      const data = await API.login({ email, password });
      API.setToken(data.token);
      if (data.businesses && data.businesses.length > 0) {
        API.setActiveBusinessId(data.businesses[0].id);
      }
      closeDirectAuthModal();
      loginForm.reset();
      updateUserUI(data.user, data.businesses);
      handleRoute();
    } catch (err) {
      if (authErr) {
        authErr.style.display = "block";
        authErr.style.background = "#FEE2E2";
        authErr.style.color = "#DC2626";
        authErr.innerText = err.message || "Invalid email or password.";
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // Direct Register Form Submit
  regForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("auth-reg-name")?.value;
    const email = document.getElementById("auth-reg-email")?.value;
    const password = document.getElementById("auth-reg-password")?.value;
    const biz = document.getElementById("auth-reg-biz")?.value;
    const submitBtn = document.getElementById("btn-submit-direct-reg");

    if (authErr) authErr.style.display = "none";
    if (submitBtn) submitBtn.disabled = true;

    try {
      const data = await API.register({
        name,
        email,
        password,
        business_name: biz || `${name}'s Enterprise`
      });
      API.setToken(data.token);
      if (data.business) {
        API.setActiveBusinessId(data.business.id);
      }
      closeDirectAuthModal();
      regForm.reset();
      updateUserUI(data.user, data.business ? [data.business] : []);
      handleRoute();
    } catch (err) {
      if (authErr) {
        authErr.style.display = "block";
        authErr.style.background = "#FEE2E2";
        authErr.style.color = "#DC2626";
        authErr.innerText = err.message || "Registration failed.";
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

export async function initApp() {
  // Always force boot directly into Business OS Launchpad Desktop on app startup/refresh
  try {
    history.replaceState(null, "", window.location.pathname + "#overview");
  } catch (e) {}
  window.location.hash = "#overview";
  document.body.classList.add("is-os-desktop");

  setupGlobalModals();

  // Intercept all hash clicks to guarantee navigation even if hash is identical
  document.addEventListener("click", (e) => {
    const navLink = e.target.closest("a[href^='#']");
    if (navLink) {
      const targetHash = navLink.getAttribute("href");
      if (targetHash) {
        e.preventDefault();
        navigateTo(targetHash);
      }
    }
  });

  // App routing and lifecycle events
  window.addEventListener("hashchange", handleRoute);
  let isHandlingUnauthorized = false;
  window.addEventListener("vss:unauthorized", () => {
    if (isHandlingUnauthorized) return;
    isHandlingUnauthorized = true;
    updateUserUI(null, []);
    openDirectAuthModal("Your session has expired or requires authentication.");
    setTimeout(() => { isHandlingUnauthorized = false; }, 1500);
  });

  window.addEventListener("vss:business-changed", async () => {
    try {
      const profile = await API.getProfile();
      updateUserUI(profile.user, profile.businesses);
    } catch (e) {}
    handleRoute();
  });

  window.addEventListener("vss:dataset-changed", () => {
    updateDatasetBadge();
    handleRoute();
  });

  // Paint the Business OS Launchpad Desktop immediately (0ms) so user never sees any flash
  handleRoute();

  // Background token check & profile hydration (non-blocking)
  const token = API.getToken();
  if (token) {
    API.getProfile().then(profile => {
      updateUserUI(profile.user, profile.businesses);
      if (profile.businesses && profile.businesses.length > 0) {
        if (!API.getActiveBusinessId()) {
          API.setActiveBusinessId(profile.businesses[0].id);
        }
      }
    }).catch(err => {
      console.warn("Stored token check notice:", err);
      if (err.message && err.message.includes("Session expired")) {
        API.setToken(null);
        updateUserUI(null, []);
      }
    });
  } else {
    updateUserUI(null, []);
  }
}

function updateUserUI(user, businesses) {
  const authBtnText = document.getElementById("top-auth-btn-text");
  if (user) {
    if (authBtnText) authBtnText.innerText = `${user.name} (Sign Out)`;
  } else {
    if (authBtnText) authBtnText.innerText = "Sign In / Register";
  }

  const bizSelector = document.getElementById("top-business-select");
  if (bizSelector) {
    if (businesses && businesses.length > 0) {
      const activeBizId = API.getActiveBusinessId();
      bizSelector.innerHTML = businesses.map(b => `
        <option value="${b.id}" ${b.id === activeBizId ? 'selected' : ''}>${b.name}</option>
      `).join("");

      bizSelector.onchange = (e) => {
        API.setActiveBusinessId(e.target.value);
        API.setActiveDatasetId(null);
        window.dispatchEvent(new CustomEvent("vss:business-changed", { detail: { id: e.target.value } }));
      };
    } else {
      bizSelector.innerHTML = `<option value="">Default Business Workspace</option>`;
    }
  }

  updateDatasetBadge();
}

async function updateDatasetBadge() {
  const badgeEl = document.getElementById("top-active-dataset-name");
  if (!badgeEl) return;

  const token = API.getToken();
  if (!token) {
    badgeEl.innerText = "No Dataset Selected";
    return;
  }

  let activeDatasetId = API.getActiveDatasetId();
  try {
    const datasets = await API.listDatasets();
    if (Array.isArray(datasets)) {
      const match = datasets.find(d => d.id === activeDatasetId);
      if (match) {
        badgeEl.innerText = match.name;
        return;
      } else if (datasets.length > 0) {
        // Auto-heal stale or deleted dataset ID to first available dataset
        activeDatasetId = datasets[0].id;
        API.setActiveDatasetId(activeDatasetId);
        badgeEl.innerText = datasets[0].name;
        return;
      }
    }
  } catch (e) {}

  API.setActiveDatasetId(null);
  badgeEl.innerText = "No Dataset Selected";
}

let activeRouteId = 0;

export async function handleRoute() {
  const thisRouteId = ++activeRouteId;
  const rawHash = (window.location.hash || "").trim().toLowerCase();
  const isOS = (!rawHash || rawHash === "#" || rawHash === "#overview" || rawHash === "#os");
  const hash = isOS ? "#overview" : (window.location.hash || "#overview");

  if (isOS) {
    document.body.classList.add("is-os-desktop");
  } else {
    document.body.classList.remove("is-os-desktop");
  }

  // 1. Strict Authentication Guard: No guest access to any studio or feature!
  const token = API.getToken();
  if (!isOS && !token) {
    window.location.hash = "#overview";
    openDirectAuthModal("🔒 Authentication Required: Guest access is disabled. Please sign in or register to access VSS AI Enterprise Studios.");
    return;
  }

  const mainContent = document.getElementById("main-view-container");
  if (!mainContent) return;

  // 2. Mandatory Business CSV / Excel Dataset Requirement for Intelligence Studios
  const studiosNeedingCSV = ["#data-studio", "#analytics-studio", "#bi-dashboard", "#ml-studio", "#ai-analyst"];
  if (studiosNeedingCSV.includes(hash)) {
    let activeDsId = API.getActiveDatasetId();
    try {
      const dsList = await API.listDatasets();
      if (Array.isArray(dsList)) {
        const found = dsList.find(d => d.id === activeDsId);
        if (found) {
          activeDsId = found.id;
        } else if (dsList.length > 0) {
          // Auto-heal stale/deleted dataset in localStorage to valid available dataset
          activeDsId = dsList[0].id;
          API.setActiveDatasetId(activeDsId);
          updateDatasetBadge();
        } else {
          activeDsId = null;
          API.setActiveDatasetId(null);
        }
      }
    } catch (e) {}

    if (!activeDsId) {
      // Enforce upload before any studio feature can be used
      mainContent.innerHTML = `
        <div class="vss-card" style="padding: 48px 32px; text-align: center; max-width: 580px; margin: 40px auto; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
          <div style="width: 64px; height: 64px; border-radius: 16px; background: rgba(233,154,58,0.14); color: #E99A3A; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E99A3A" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          </div>
          <h2 style="font-size: 20px; font-weight: 800; color: #14233D; margin-bottom: 10px;">Upload CSV / Excel to Unlock Studio</h2>
          <p style="font-size: 13px; color: #64748B; margin-bottom: 24px; line-height: 1.6;">
            All Intelligence Studios require an uploaded business dataset. Please upload your company's CSV or Excel spreadsheet to generate immediate analytics, insights, and models.
          </p>
          <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
            <button onclick="window.openDirectUploadModal()" class="btn btn-saffron" style="padding: 11px 24px; font-size: 13px; font-weight: 700; display: inline-flex; align-items: center; gap: 8px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              Upload Business Dataset
            </button>
            <button onclick="window.navigateTo('#overview')" class="btn" style="background: rgba(20, 35, 61, 0.08); color: #14233D; border: 1px solid #CBD5E1; font-weight: 700; padding: 11px 20px; font-size: 13px;">
              &larr; Launchpad
            </button>
          </div>
        </div>
      `;
      return;
    }
  }

  const renderFn = routes[hash] || renderOverview;

  // Update active sidebar state - cleanly toggle both active and nav-item-active
  document.querySelectorAll(".nav-link").forEach(link => {
    const href = link.getAttribute("href");
    if (href === hash) {
      link.classList.add("active");
      link.classList.add("nav-item-active");
    } else {
      link.classList.remove("active");
      link.classList.remove("nav-item-active");
    }
  });

  mainContent.innerHTML = `
    <div style="text-align: center; padding: 60px 20px; color: var(--slate);">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--saffron)" stroke-width="2" style="animation: spin 1s linear infinite; margin: 0 auto 10px;">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
      </svg>
      <div style="font-size: 13px; font-weight: 600;">Loading Business OS module...</div>
    </div>
  `;

  try {
    await renderFn(mainContent);
  } catch (err) {
    if (thisRouteId !== activeRouteId) return;
    console.error(`Route handler failed for ${hash}:`, err);
    mainContent.innerHTML = `
      <div class="vss-card" style="padding: 30px; text-align: center; color: #DC2626; max-width: 600px; margin: 40px auto;">
        <h3 style="font-weight: 800; font-size: 16px; margin-bottom: 8px;">Failed to render page: ${err.message}</h3>
        <button onclick="window.navigateTo('#overview')" class="btn btn-primary" style="margin-top: 16px; padding: 8px 18px; font-size: 12px;">
          &larr; Launchpad
        </button>
      </div>
    `;
  }
}

// Start app safely on DOM ready (guarantees execution even if DOMContentLoaded already fired)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
