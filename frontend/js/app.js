import { API } from "./api.js";
import { renderLanding } from "./views/landing.js";
import { renderAutoAnalyst } from "./views/auto_analyst.js";
import { renderOverview } from "./views/overview.js";
import { renderDatasets } from "./views/datasets.js";
import { renderDataStudio } from "./views/data_studio.js";
import { renderAnalyticsStudio } from "./views/analytics_studio.js";
import { renderBIDashboard } from "./views/bi_dashboard.js";
import { renderInventory } from "./views/inventory.js";
import { renderFinance } from "./views/finance.js";
import { renderAIAssistant } from "./views/ai_assistant.js";
import { renderExcelStudio } from "./views/excel_studio.js";
import { renderMLStudio } from "./views/ml_studio.js";
import { renderReports } from "./views/reports.js";
import { renderSettings } from "./views/settings.js";
import { renderSubscription } from "./views/subscription.js";
import { renderAdminSubscriptions } from "./views/admin_subscriptions.js";

const routes = {
  "": renderAutoAnalyst,
  "#": renderAutoAnalyst,
  "#landing": renderLanding,
  "#auto-analyst": renderAutoAnalyst,
  "#overview": renderOverview,
  "#datasets": renderDatasets,
  "#data-studio": renderAutoAnalyst, // Automated by AI Data Science Agent
  "#analytics-studio": renderAnalyticsStudio,
  "#bi-dashboard": renderBIDashboard,
  "#business-intelligence": renderBIDashboard,
  "#inventory": renderInventory,
  "#finance": renderFinance,
  "#ai-assistant": renderAIAssistant,
  "#ai-analyst": renderAIAssistant,
  "#excel-integration": renderExcelStudio,
  "#ml-studio": renderAutoAnalyst, // Automated by AI Data Science Agent
  "#reports": renderReports,
  "#settings": renderSettings,
  "#subscription": renderSubscription,
  "#admin-subscriptions": renderAdminSubscriptions
};

export function openDirectUploadModal() {
  const modal = document.getElementById("direct-upload-modal");
  if (modal) modal.style.display = "flex";
}

export function closeDirectUploadModal() {
  const modal = document.getElementById("direct-upload-modal");
  if (modal) modal.style.display = "none";
}

export function openDirectAuthModal(message) {
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
  if (modal) modal.style.display = "flex";
}

export function closeDirectAuthModal() {
  const modal = document.getElementById("direct-auth-modal");
  if (modal) modal.style.display = "none";
}

function showTravelWarpAnimation(callback) {
  let overlay = document.getElementById("warp-portal-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "warp-portal-overlay";
    overlay.className = "warp-portal-overlay";
    overlay.innerHTML = `
      <div class="warp-portal-core">
        <div class="warp-ring warp-ring-1"></div>
        <div class="warp-ring warp-ring-2"></div>
        <div class="warp-ring warp-ring-3"></div>
        <div class="warp-badge-text">VV</div>
      </div>
      <div class="warp-travel-caption">Entering Vyapar Verse...</div>
    `;
    document.body.appendChild(overlay);
  }

  overlay.classList.add("warp-active");
  setTimeout(() => {
    if (callback) callback();
    setTimeout(() => {
      overlay.classList.remove("warp-active");
    }, 350);
  }, 600);
}

export function navigateTo(route) {
  let target = route;
  if (!target || target === "#" || target === "") {
    target = "#overview";
  }

  const current = (window.location.hash || "").trim().toLowerCase();
  const isFromLanding = (current === "#landing" || current === "");
  const isToOS = (target !== "#landing");

  // "Osm se travel wala animation" when entering OS from landing
  if (isFromLanding && isToOS) {
    try { localStorage.setItem("vss_landing_seen", "true"); } catch (e) {}
    showTravelWarpAnimation(() => {
      window.location.hash = target;
      handleRoute();
    });
    return;
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

// ==========================================
// App Theme Manager (Corporate Light Mode Locked)
// ==========================================
export function getInitialTheme() {
  return "light";
}

export function applyTheme(theme = "light") {
  document.documentElement.setAttribute("data-theme", "light");
  if (document.body) {
    document.body.classList.remove("dark-mode");
  }
  localStorage.setItem("vss_theme", "light");

  // Dispatch custom event for views to maintain light styling across canvas/charts
  window.dispatchEvent(new CustomEvent("vss:theme_changed", { detail: { theme: "light", isDark: false } }));
}

export function toggleTheme() {
  applyTheme("light");
}

window.applyTheme = applyTheme;
window.toggleTheme = toggleTheme;
window.getInitialTheme = getInitialTheme;

// Apply light theme immediately
applyTheme("light");

function setupGlobalModals() {
  // Mobile Sidebar Drawer Toggle & Backdrop Overlay (Android & Touch Friendly)
  const mobileToggleBtn = document.getElementById("btn-mobile-sidebar-toggle");
  const sidebarEl = document.getElementById("app-sidebar");
  const backdropEl = document.getElementById("mobile-sidebar-backdrop");

  function openMobileSidebar() {
    if (sidebarEl) sidebarEl.classList.add("mobile-open");
    if (backdropEl) backdropEl.classList.add("active");
  }

  function closeMobileSidebar() {
    if (sidebarEl) sidebarEl.classList.remove("mobile-open");
    if (backdropEl) backdropEl.classList.remove("active");
  }

  if (mobileToggleBtn) {
    mobileToggleBtn.addEventListener("click", () => {
      if (sidebarEl && sidebarEl.classList.contains("mobile-open")) {
        closeMobileSidebar();
      } else {
        openMobileSidebar();
      }
    });
  }

  if (backdropEl) {
    backdropEl.addEventListener("click", closeMobileSidebar);
  }

  if (sidebarEl) {
    sidebarEl.addEventListener("click", (e) => {
      if (e.target.closest("a.nav-link")) {
        closeMobileSidebar();
      }
    });
  }

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
    const sizeStr = file.size >= 1024 * 1024 * 1024
      ? `${(file.size / (1024 * 1024 * 1024)).toFixed(2)} GB`
      : file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(1)} KB`;
    fileLabel.innerHTML = `<span style="color: var(--navy); font-weight: 700;">${file.name}</span> <span style="color: var(--saffron);">(${sizeStr})</span>`;
  }

  // Upload Form Submission
  const uploadForm = document.getElementById("direct-upload-form");
  if (uploadForm) {
    uploadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const statusDiv = document.getElementById("direct-upload-status");
      const submitBtn = document.getElementById("btn-submit-direct-upload");
      const progWrap = document.getElementById("direct-upload-progress-wrap");
      const progBar = document.getElementById("direct-upload-progress-bar");
      const progText = document.getElementById("direct-upload-progress-text");
      const progPct = document.getElementById("direct-upload-progress-pct");

      const file = fileInput?.files?.[0];
      if (!file) {
        statusDiv.style.display = "block";
        statusDiv.style.background = "#FEE2E2";
        statusDiv.style.color = "#DC2626";
        statusDiv.innerText = "Please select a CSV, TSV, Excel, or JSON file to upload.";
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
      statusDiv.innerText = "Streaming dataset to vault & profiling schema... Please wait.";
      if (progWrap) progWrap.style.display = "block";
      if (progBar) progBar.style.width = "2%";
      if (progPct) progPct.innerText = "2%";
      if (progText) progText.innerText = "Starting upload...";
      if (submitBtn) submitBtn.disabled = true;

      try {
        const result = await API.uploadDataset(formData, (pct, loaded, total, phase) => {
          if (progBar) progBar.style.width = `${pct}%`;
          if (progPct) progPct.innerText = `${pct}%`;
          if (progText) {
            const loadedMB = (loaded / (1024 * 1024)).toFixed(1);
            const totalMB = (total / (1024 * 1024)).toFixed(1);
            progText.innerText = phase === "finalizing"
              ? "Stream-encrypting & indexing rows..."
              : `Uploading ${loadedMB} MB / ${totalMB} MB`;
          }
        });
        statusDiv.style.background = "#ECFDF5";
        statusDiv.style.color = "#065F46";
        statusDiv.innerText = `Dataset '${result.name}' successfully uploaded and profiled (${Number(result.row_count).toLocaleString()} rows, ${result.column_count} columns)!`;

        const dsId = result.dataset_id || result.id;
        API.setActiveDatasetId(dsId);
        window.dispatchEvent(new CustomEvent("vss:dataset-changed", { detail: { id: dsId } }));

        setTimeout(() => {
          closeDirectUploadModal();
          uploadForm.reset();
          if (progWrap) progWrap.style.display = "none";
          if (fileLabel) fileLabel.innerText = "Click to Browse or Drag File Here";
          statusDiv.style.display = "none";
          if (submitBtn) submitBtn.disabled = false;
          navigateTo("#auto-analyst");
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

  // Modal Auth Tabs & Forms Navigation
  const tabsBar = document.getElementById("auth-tabs-bar");
  const tabLogin = document.getElementById("auth-tab-btn-login");
  const tabRegister = document.getElementById("auth-tab-btn-register");
  const loginForm = document.getElementById("direct-login-form");
  const regForm = document.getElementById("direct-register-form");
  const otpForm = document.getElementById("direct-otp-form");
  const forgotForm = document.getElementById("direct-forgot-form");
  const resetForm = document.getElementById("direct-reset-form");
  const authErr = document.getElementById("direct-auth-error");

  let currentAuthEmail = "";
  let currentAuthPurpose = "signup";
  let otpTimerInterval = null;
  let resendCooldownInterval = null;

  function showAuthMessage(msg, isError = true) {
    if (!authErr) return;
    authErr.style.display = "block";
    if (isError) {
      authErr.style.background = "#FEE2E2";
      authErr.style.color = "#DC2626";
      authErr.style.border = "1px solid #FECACA";
    } else {
      authErr.style.background = "#ECFDF5";
      authErr.style.color = "#065F46";
      authErr.style.border = "1px solid #A7F3D0";
    }
    authErr.innerText = msg;
  }

  function hideAllAuthForms() {
    if (loginForm) loginForm.style.display = "none";
    if (regForm) regForm.style.display = "none";
    if (otpForm) otpForm.style.display = "none";
    if (forgotForm) forgotForm.style.display = "none";
    if (resetForm) resetForm.style.display = "none";
    if (authErr) authErr.style.display = "none";
  }

  function switchToLogin() {
    hideAllAuthForms();
    if (tabsBar) tabsBar.style.display = "flex";
    if (loginForm) loginForm.style.display = "flex";
    if (tabLogin) {
      tabLogin.style.borderBottom = "2px solid var(--saffron)";
      tabLogin.style.background = "#FFFFFF";
      tabLogin.style.color = "var(--navy)";
    }
    if (tabRegister) {
      tabRegister.style.borderBottom = "none";
      tabRegister.style.background = "#F8FAFC";
      tabRegister.style.color = "var(--slate)";
    }
  }

  function switchToRegister() {
    hideAllAuthForms();
    if (tabsBar) tabsBar.style.display = "flex";
    if (regForm) regForm.style.display = "flex";
    if (tabRegister) {
      tabRegister.style.borderBottom = "2px solid var(--saffron)";
      tabRegister.style.background = "#FFFFFF";
      tabRegister.style.color = "var(--navy)";
    }
    if (tabLogin) {
      tabLogin.style.borderBottom = "none";
      tabLogin.style.background = "#F8FAFC";
      tabLogin.style.color = "var(--slate)";
    }
  }

  function switchToOTP(email, purpose = "signup") {
    currentAuthEmail = email;
    currentAuthPurpose = purpose;
    hideAllAuthForms();
    if (tabsBar) tabsBar.style.display = "none";
    if (otpForm) otpForm.style.display = "flex";

    const emailLabel = document.getElementById("otp-target-email");
    if (emailLabel) emailLabel.innerText = email;

    const otpInput = document.getElementById("auth-otp-input");
    if (otpInput) {
      otpInput.value = "";
      setTimeout(() => otpInput.focus(), 100);
    }

    startOTPTimer(300); // 5 minutes = 300s
  }

  function startOTPTimer(durationSeconds) {
    if (otpTimerInterval) clearInterval(otpTimerInterval);
    let remaining = durationSeconds;
    const timerEl = document.getElementById("auth-otp-timer");

    function updateDisplay() {
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      if (timerEl) {
        timerEl.innerText = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      }
      if (remaining <= 0) {
        clearInterval(otpTimerInterval);
        showAuthMessage("Verification code has expired. Please click 'Resend OTP'.", true);
      }
      remaining--;
    }

    updateDisplay();
    otpTimerInterval = setInterval(updateDisplay, 1000);
  }

  tabLogin?.addEventListener("click", switchToLogin);
  tabRegister?.addEventListener("click", switchToRegister);
  document.getElementById("btn-close-auth-modal")?.addEventListener("click", closeDirectAuthModal);
  document.getElementById("btn-modal-x-close")?.addEventListener("click", closeDirectAuthModal);

  // Toggle Password Visibility
  const togglePwdBtn = document.getElementById("btn-toggle-login-pwd");
  const loginPwdInput = document.getElementById("auth-login-password");
  togglePwdBtn?.addEventListener("click", () => {
    if (loginPwdInput.type === "password") {
      loginPwdInput.type = "text";
      togglePwdBtn.innerText = "🔒";
    } else {
      loginPwdInput.type = "password";
      togglePwdBtn.innerText = "👁";
    }
  });

  // Forgot Password Links
  document.getElementById("auth-link-forgot")?.addEventListener("click", () => {
    hideAllAuthForms();
    if (tabsBar) tabsBar.style.display = "none";
    if (forgotForm) forgotForm.style.display = "flex";
  });
  document.getElementById("btn-forgot-back")?.addEventListener("click", switchToLogin);
  document.getElementById("btn-otp-back")?.addEventListener("click", switchToLogin);
  document.getElementById("btn-reset-back")?.addEventListener("click", switchToLogin);

  // 1. Direct Login Form Submit
  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-login-email")?.value?.trim();
    const password = document.getElementById("auth-login-password")?.value;
    const submitBtn = document.getElementById("btn-submit-direct-login");

    if (authErr) authErr.style.display = "none";
    if (submitBtn) submitBtn.disabled = true;

    try {
      const data = await API.login({ email, password });
      if (data.status === "otp_required") {
        switchToOTP(data.email, "signup");
        showAuthMessage(data.message || "Please enter the 6-digit verification code sent to your email.", false);
        return;
      }
      API.setToken(data.token);
      if (data.businesses && data.businesses.length > 0) {
        API.setActiveBusinessId(data.businesses[0].id);
      }

      // Check if user attached an Excel file during registration
      const regExcelInput = document.getElementById("auth-reg-excel");
      if (regExcelInput && regExcelInput.files && regExcelInput.files[0]) {
        try {
          const fd = new FormData();
          fd.append("file", regExcelInput.files[0]);
          fd.append("name", regExcelInput.files[0].name);
          const upRes = await API.uploadDataset(fd);
          if (upRes && upRes.dataset && upRes.dataset.id) {
            API.setActiveDatasetId(upRes.dataset.id);
          }
        } catch (upErr) {
          console.warn("Excel upload on register:", upErr);
        }
      }

      // Check if user attached an Excel file
      const loginExcelInput = document.getElementById("auth-login-excel");
      if (loginExcelInput && loginExcelInput.files && loginExcelInput.files[0]) {
        try {
          const fd = new FormData();
          fd.append("file", loginExcelInput.files[0]);
          fd.append("name", loginExcelInput.files[0].name);
          const upRes = await API.uploadDataset(fd);
          if (upRes && upRes.dataset && upRes.dataset.id) {
            API.setActiveDatasetId(upRes.dataset.id);
          }
        } catch (upErr) {
          console.warn("Excel upload on login:", upErr);
        }
      }

      closeDirectAuthModal();
      loginForm.reset();
      updateUserUI(data.user, data.businesses);
      handleRoute();
    } catch (err) {
      showAuthMessage(err.message || "Invalid email or password.", true);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // 2. Direct Register Form Submit
  regForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("auth-reg-name")?.value?.trim();
    const email = document.getElementById("auth-reg-email")?.value?.trim();
    const password = document.getElementById("auth-reg-password")?.value;
    const confirm = document.getElementById("auth-reg-confirm")?.value;
    const biz = document.getElementById("auth-reg-biz")?.value?.trim();
    const terms = document.getElementById("auth-reg-terms")?.checked;
    const submitBtn = document.getElementById("btn-submit-direct-reg");

    if (!terms) {
      showAuthMessage("Please accept the terms of service to continue.", true);
      return;
    }

    if (password !== confirm) {
      showAuthMessage("Passwords do not match. Please verify.", true);
      return;
    }

    if (authErr) authErr.style.display = "none";
    if (submitBtn) submitBtn.disabled = true;

    try {
      const data = await API.register({
        name,
        email,
        password,
        confirm_password: confirm,
        business_name: biz || `${name}'s Enterprise`
      });

      if (data.status === "otp_required") {
        switchToOTP(data.email, "signup");
        showAuthMessage(data.message || `Verification code sent to ${data.email}.`, false);
      } else {
        API.setToken(data.token);
        if (data.business) API.setActiveBusinessId(data.business.id);
        closeDirectAuthModal();
        regForm.reset();
        updateUserUI(data.user, data.business ? [data.business] : []);
        handleRoute();
      }
    } catch (err) {
      showAuthMessage(err.message || "Registration failed. Please try again.", true);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // 3. Email OTP Form Submit
  otpForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const otp = document.getElementById("auth-otp-input")?.value?.trim();
    const submitBtn = document.getElementById("btn-submit-direct-otp");

    if (!otp || otp.length !== 6) {
      showAuthMessage("Please enter the complete 6-digit OTP code.", true);
      return;
    }

    if (authErr) authErr.style.display = "none";
    if (submitBtn) submitBtn.disabled = true;

    try {
      const data = await API.verifyOTP({
        email: currentAuthEmail,
        otp: otp,
        purpose: currentAuthPurpose
      });

      if (otpTimerInterval) clearInterval(otpTimerInterval);
      showAuthMessage(data.message || "Account verified successfully!", false);

      API.setToken(data.token);
      if (data.businesses && data.businesses.length > 0) {
        API.setActiveBusinessId(data.businesses[0].id);
      }

      // Check if user attached an Excel file during registration
      const regExcelInput = document.getElementById("auth-reg-excel");
      if (regExcelInput && regExcelInput.files && regExcelInput.files[0]) {
        try {
          const fd = new FormData();
          fd.append("file", regExcelInput.files[0]);
          fd.append("name", regExcelInput.files[0].name);
          const upRes = await API.uploadDataset(fd);
          if (upRes && upRes.dataset && upRes.dataset.id) {
            API.setActiveDatasetId(upRes.dataset.id);
          }
        } catch (upErr) {
          console.warn("Excel upload on register:", upErr);
        }
      }

      setTimeout(() => {
        closeDirectAuthModal();
        otpForm.reset();
        updateUserUI(data.user, data.businesses);
        handleRoute();
      }, 700);
    } catch (err) {
      showAuthMessage(err.message || "Invalid OTP code. Please check your email and try again.", true);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // 4. Resend OTP Button with 60s Cooldown
  document.getElementById("btn-resend-otp")?.addEventListener("click", async () => {
    const resendBtn = document.getElementById("btn-resend-otp");
    if (!currentAuthEmail) return;

    if (resendBtn) resendBtn.disabled = true;
    try {
      const data = await API.resendOTP({ email: currentAuthEmail, purpose: currentAuthPurpose });
      showAuthMessage(data.message || "New OTP dispatched to your inbox.", false);
      startOTPTimer(300);

      // 60-second client-side cooldown
      let cooldown = 60;
      if (resendCooldownInterval) clearInterval(resendCooldownInterval);
      resendCooldownInterval = setInterval(() => {
        if (cooldown > 0) {
          if (resendBtn) resendBtn.innerText = `Resend (${cooldown}s)`;
          cooldown--;
        } else {
          clearInterval(resendCooldownInterval);
          if (resendBtn) {
            resendBtn.innerText = "Resend OTP";
            resendBtn.disabled = false;
          }
        }
      }, 1000);
    } catch (err) {
      showAuthMessage(err.message || "Could not resend OTP at this time.", true);
      if (resendBtn) resendBtn.disabled = false;
    }
  });

  // 5. Forgot Password Form Submit
  forgotForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-forgot-email")?.value?.trim();
    const submitBtn = document.getElementById("btn-submit-direct-forgot");

    if (authErr) authErr.style.display = "none";
    if (submitBtn) submitBtn.disabled = true;

    try {
      currentAuthEmail = email;
      const data = await API.forgotPassword({ email });
      hideAllAuthForms();
      if (resetForm) resetForm.style.display = "flex";
      showAuthMessage(data.message || `Password reset code sent to ${email}.`, false);
    } catch (err) {
      showAuthMessage(err.message || "Could not send reset code.", true);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });

  // 6. Reset Password Form Submit
  resetForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const otp = document.getElementById("auth-reset-otp")?.value?.trim();
    const newPwd = document.getElementById("auth-reset-password")?.value;
    const confirmPwd = document.getElementById("auth-reset-confirm")?.value;
    const submitBtn = document.getElementById("btn-submit-direct-reset");

    if (newPwd !== confirmPwd) {
      showAuthMessage("Passwords do not match.", true);
      return;
    }

    if (authErr) authErr.style.display = "none";
    if (submitBtn) submitBtn.disabled = true;

    try {
      const data = await API.resetPassword({
        email: currentAuthEmail,
        otp: otp,
        new_password: newPwd,
        confirm_password: confirmPwd
      });

      showAuthMessage(data.message || "Password updated successfully! Please sign in.", false);
      setTimeout(() => {
        resetForm.reset();
        switchToLogin();
      }, 1200);
    } catch (err) {
      showAuthMessage(err.message || "Password reset failed. Invalid or expired OTP.", true);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

export async function initApp() {
  const currentHash = (window.location.hash || "").trim().toLowerCase();
  const hasVisited = localStorage.getItem("vss_has_visited");

  // "Roz landing page nahi dikhega":
  // If returning user or logged in, navigate straight to the OS workspace (#overview)
  if (!currentHash || currentHash === "#") {
    const targetHash = (API.getToken() || hasVisited) ? "#overview" : "#landing";
    window.location.hash = targetHash;
  }
  localStorage.setItem("vss_has_visited", "true");

  setupGlobalModals();
  applyTheme(getInitialTheme());

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

  
  let isHandlingSubExpired = false;
  window.addEventListener("vss:subscription_expired", (e) => {
    if (isHandlingSubExpired) return;
    isHandlingSubExpired = true;
    const detail = (e && e.detail) || {};
    let subModal = document.getElementById("vss-sub-expired-modal");
    if (!subModal) {
      subModal = document.createElement("div");
      subModal.id = "vss-sub-expired-modal";
      subModal.className = "modal-overlay";
      subModal.innerHTML = `
        <div class="modal-content" style="max-width: 480px; padding: 24px; text-align: center;">
          <div style="width: 52px; height: 52px; border-radius: 50%; background: #FEF3C7; color: #D97706; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; font-size: 26px;">
            ⏳
          </div>
          <h3 style="font-size: 18px; font-weight: 800; color: #14233D; margin: 0 0 8px;">Free Trial Period Expired</h3>
          <p id="vss-sub-expired-msg" style="font-size: 13px; color: #64748B; margin: 0 0 20px; line-height: 1.5;">
            Your free evaluation period has concluded. All your business records, custom workbooks, and datasets are securely preserved. Upgrade to Vyapar Business to continue unlimited AI analytics.
          </p>
          <div style="display: flex; gap: 10px; justify-content: center;">
            <button id="btn-close-sub-expired" class="btn btn-outline" style="font-size: 12px; padding: 8px 16px;">Maybe Later</button>
            <button id="btn-goto-sub-plans" class="btn btn-saffron" style="font-size: 12px; padding: 8px 18px; font-weight: 800;">
              View Subscription Plans &rarr;
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(subModal);
      document.getElementById("btn-close-sub-expired")?.addEventListener("click", () => {
        subModal.style.display = "none";
      });
      document.getElementById("btn-goto-sub-plans")?.addEventListener("click", () => {
        subModal.style.display = "none";
        window.navigateTo("#subscription");
      });
    }
    const msgEl = document.getElementById("vss-sub-expired-msg");
    if (msgEl && detail.message) {
      msgEl.innerText = detail.message;
    }
    subModal.style.display = "flex";
    setTimeout(() => { isHandlingSubExpired = false; }, 1500);
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


async function updateSubscriptionPill(user) {
  const pillText = document.getElementById("top-subscription-status-text");
  const navAdminSub = document.getElementById("nav-admin-subscriptions");
  if (!user) {
    if (pillText) pillText.innerText = "Free Trial Available";
    if (navAdminSub) navAdminSub.style.display = "none";
    return;
  }
  if (navAdminSub) {
    navAdminSub.style.display = (user.role === "admin") ? "flex" : "none";
  }
  try {
    const sub = await API.getCurrentSubscription();
    if (!pillText) return;
    if (sub.status === "TRIAL_ACTIVE") {
      pillText.innerText = `Trial Active (${sub.days_remaining}d)`;
    } else if (sub.status === "TRIAL_EXPIRED") {
      pillText.innerText = "Trial Expired — Upgrade";
      if (pillText.parentElement) {
        pillText.parentElement.style.background = "#FEE2E2";
        pillText.parentElement.style.color = "#DC2626";
      }
    } else if (sub.status === "ACTIVE") {
      pillText.innerText = `Vyapar Business (${sub.days_remaining}d)`;
      if (pillText.parentElement) {
        pillText.parentElement.style.background = "#FEF3C7";
        pillText.parentElement.style.color = "#B45309";
      }
    } else {
      pillText.innerText = "Start Free Trial";
    }
  } catch (e) {
    if (pillText) pillText.innerText = "Start Free Trial";
  }
}

function updateUserUI(user, businesses) {
  updateSubscriptionPill(user);
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
  
  let hash = rawHash;
  if (!hash || hash === "#") {
    let hasSeenLanding = false;
    try { hasSeenLanding = !!localStorage.getItem("vss_landing_seen"); } catch (e) {}
    hash = (API.getToken() || hasSeenLanding) ? "#overview" : "#landing";
  }

  const isLanding = (hash === "#landing");
  if (isLanding) {
    document.body.classList.add("is-landing");
    document.body.classList.remove("is-os-desktop");
  } else {
    document.body.classList.remove("is-landing");
    if (hash === "#overview") {
      document.body.classList.add("is-os-desktop");
    } else {
      document.body.classList.remove("is-os-desktop");
    }
  }

  // Authentication check for protected areas (Landing, Auto-Analyst, Overview are open for seamless onboarding)
  const token = API.getToken();
  const publicRoutes = ["#landing", "#overview", "#auto-analyst"];
  if (!token && !publicRoutes.includes(hash)) {
    window.location.hash = "#auto-analyst";
    openDirectAuthModal("🔒 Authentication Required: Please sign in or register to access enterprise features.");
    return;
  }

  const mainContent = document.getElementById("main-view-container");
  if (!mainContent) return;

  // 2. Mandatory Business CSV / Excel Dataset Requirement for Intelligence Studios
  const studiosNeedingCSV = ["#auto-analyst", "#analytics-studio", "#bi-dashboard", "#ai-assistant", "#ai-analyst"];
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

  // Update Android Bottom Navigation Bar active state
  document.querySelectorAll(".android-tab-item").forEach(item => {
    const target = item.getAttribute("data-route");
    if (target === hash || (target === "#bi-cockpit" && ["#bi-cockpit", "#reports", "#analytics-studio", "#auto-analyst"].includes(hash))) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
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

// Start app immediately or on DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
