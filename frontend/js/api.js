// VSS AI Core API Client
// Automatically use relative path when hosted together with backend (Render, cloud, or FastAPI on :8000),
// or target http://localhost:8000 when frontend is served from an independent dev server (e.g., Vite/Live Server on port 3000/5173/5500).
const isStandaloneDev = window.location.hostname === "localhost" && window.location.port !== "8000" && window.location.port !== "";
const API_BASE = isStandaloneDev ? "http://localhost:8000" : "";

// High-speed In-Memory Cache & In-Flight Promise De-duplication
const _apiCache = new Map();
const _inFlight = new Map();
const CACHE_TTL_MS = 8000; // 8 seconds

function cachedRequest(key, fetcher, ttl = CACHE_TTL_MS) {
  const now = Date.now();
  const cached = _apiCache.get(key);
  if (cached && (now - cached.timestamp) < ttl) {
    return Promise.resolve(cached.data);
  }
  if (_inFlight.has(key)) {
    return _inFlight.get(key);
  }
  const promise = fetcher().then(data => {
    _apiCache.set(key, { timestamp: Date.now(), data });
    _inFlight.delete(key);
    return data;
  }).catch(err => {
    _inFlight.delete(key);
    throw err;
  });
  _inFlight.set(key, promise);
  return promise;
}

export function invalidateApiCache(prefix = "") {
  if (!prefix) {
    _apiCache.clear();
  } else {
    for (const k of Array.from(_apiCache.keys())) {
      if (k.startsWith(prefix)) _apiCache.delete(k);
    }
  }
}

export const API = {
  getToken() {
    const t = localStorage.getItem("vss_token");
    if (!t || t === "null" || t === "undefined") return null;
    return t;
  },
  setToken(token) {
    if (token && token !== "null" && token !== "undefined") {
      localStorage.setItem("vss_token", token);
    } else {
      localStorage.removeItem("vss_token");
    }
  },
  getActiveBusinessId() {
    const b = localStorage.getItem("vss_business_id");
    if (!b || b === "null" || b === "undefined") return null;
    return b;
  },
  setActiveBusinessId(id) {
    if (id && id !== "null" && id !== "undefined") {
      localStorage.setItem("vss_business_id", id);
    } else {
      localStorage.removeItem("vss_business_id");
    }
  },
  getActiveDatasetId() {
    const d = localStorage.getItem("vss_dataset_id");
    if (!d || d === "null" || d === "undefined") return null;
    return d;
  },
  setActiveDatasetId(id) {
    if (id && id !== "null" && id !== "undefined") {
      localStorage.setItem("vss_dataset_id", id);
    } else {
      localStorage.removeItem("vss_dataset_id");
    }
  },

  async request(endpoint, options = {}) {
    const headers = options.headers || {};
    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const businessId = this.getActiveBusinessId();
    if (businessId) {
      headers["X-Business-Id"] = businessId;
    }

    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const config = {
      ...options,
      headers
    };

    const url = `${API_BASE}${endpoint}`;
    try {
      const response = await fetch(url, config);
      if (response.status === 401) {
        if (endpoint.includes("/api/auth/me")) {
          const hadToken = !!this.getToken();
          this.setToken(null);
          if (hadToken) {
            window.dispatchEvent(new CustomEvent("vss:unauthorized"));
          }
        }
        throw new Error("Session expired or unauthorized. Please log in.");
      }

      if (!response.ok) {
        let errMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errData = await response.json();
          errMessage = errData.detail || errData.message || JSON.stringify(errData);
        } catch (e) {}
        throw new Error(errMessage);
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }
      return response;
    } catch (err) {
      console.error(`API Call failed [${endpoint}]:`, err);
      throw err;
    }
  },

  // Auth Endpoints
  register(payload) {
    invalidateApiCache();
    return this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  login(payload) {
    invalidateApiCache();
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  sendOtp(email, purpose = "password_reset") {
    return this.request("/api/auth/send-otp", {
      method: "POST",
      body: JSON.stringify({ email, purpose })
    });
  },
  verifyOtp(email, otp) {
    return this.request("/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp })
    });
  },
  resetPassword(email, otp, new_password) {
    return this.request("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, otp, new_password })
    });
  },
  demoLogin() {
    invalidateApiCache();
    return this.request("/api/auth/demo-login", {
      method: "POST"
    });
  },
  getProfile() {
    return cachedRequest("auth_me", () => this.request("/api/auth/me"), 15000);
  },
  getCurrentUser() {
    return this.getProfile();
  },
  clearToken() {
    invalidateApiCache();
    this.setToken(null);
  },
  logout() {
    invalidateApiCache();
    this.setToken(null);
    return this.request("/api/auth/logout", { method: "POST" }).catch(() => {});
  },

  // Business Workspaces
  listBusinesses() {
    return cachedRequest("businesses", () => this.request("/api/businesses/"), 12000);
  },
  createBusiness(payload) {
    invalidateApiCache();
    return this.request("/api/businesses/", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  // Datasets
  listDatasets() {
    const bizId = this.getActiveBusinessId() || "default";
    return cachedRequest(`datasets_${bizId}`, () => this.request("/api/datasets/"), 8000);
  },
  getDataset(datasetId, previewRows = 50) {
    return cachedRequest(`ds_preview_${datasetId}_${previewRows}`, () => this.request(`/api/datasets/${datasetId}?preview_rows=${previewRows}`), 10000);
  },
  uploadDataset(formData) {
    invalidateApiCache();
    return this.request("/api/upload/", {
      method: "POST",
      body: formData
    });
  },
  deleteDataset(datasetId) {
    invalidateApiCache();
    return this.request(`/api/datasets/${datasetId}`, {
      method: "DELETE"
    });
  },

  // Data Quality & Safe Cleaning
  getDataQuality(datasetId) {
    return cachedRequest(`quality_${datasetId}`, () => this.request(`/api/data-quality/${datasetId}`), 12000);
  },
  cleanDataset(datasetId, options) {
    invalidateApiCache();
    return this.request(`/api/data-quality/${datasetId}/clean`, {
      method: "POST",
      body: JSON.stringify(options)
    });
  },
  removeOutliers(datasetId, options = {}) {
    invalidateApiCache();
    return this.request(`/api/data-quality/${datasetId}/remove-outliers`, {
      method: "POST",
      body: JSON.stringify(options)
    });
  },

  // EDA Engine
  getFullEDA(datasetId) {
    return cachedRequest(`eda_${datasetId}`, () => this.request(`/api/analysis/${datasetId}/eda`), 15000);
  },
  getCorrelations(datasetId) {
    return cachedRequest(`corrs_${datasetId}`, () => this.request(`/api/analysis/${datasetId}/correlations`), 15000);
  },
  getOutliers(datasetId) {
    return cachedRequest(`outliers_${datasetId}`, () => this.request(`/api/analysis/${datasetId}/outliers`), 15000);
  },
  getTimeTrend(datasetId, dateCol, valCol, freq = "M", agg = "sum") {
    return this.request(`/api/analysis/${datasetId}/trend?date_col=${encodeURIComponent(dateCol)}&value_col=${encodeURIComponent(valCol)}&frequency=${freq}&agg=${agg}`);
  },

  // Business Intelligence
  getColumnMapping(datasetId) {
    return cachedRequest(`mapping_${datasetId}`, () => this.request(`/api/bi/${datasetId}/mapping`), 12000);
  },
  updateColumnMapping(datasetId, mapping) {
    invalidateApiCache(`mapping_${datasetId}`);
    invalidateApiCache(`kpis_${datasetId}`);
    return this.request(`/api/bi/${datasetId}/mapping`, {
      method: "POST",
      body: JSON.stringify({ mapping })
    });
  },
  getKPIs(datasetId) {
    return cachedRequest(`kpis_${datasetId}`, () => this.request(`/api/bi/${datasetId}/kpis`), 12000);
  },
  getBusinessKPIs(datasetId) {
    return this.getKPIs(datasetId);
  },

  // Charts
  getChartSpec(datasetId, chartType, x, y, color, title) {
    let url = `/api/charts/${datasetId}/spec?chart_type=${chartType}&x=${encodeURIComponent(x)}`;
    if (y) url += `&y=${encodeURIComponent(y)}`;
    if (color) url += `&color=${encodeURIComponent(color)}`;
    if (title) url += `&title=${encodeURIComponent(title)}`;
    return this.request(url);
  },
  getDashboardPresets(datasetId) {
    return this.request(`/api/charts/${datasetId}/dashboard-presets`);
  },

  // Machine Learning Studio
  getMLTasks(datasetId) {
    return this.request(`/api/ml/${datasetId}/tasks`);
  },
  trainModel(datasetId, payload) {
    return this.request(`/api/ml/${datasetId}/train`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  listModels(datasetId) {
    return this.request(`/api/ml/${datasetId}/models`);
  },

  // AI Analyst
  askAI(datasetId, question, conversationId = null) {
    return this.request(`/api/ai/${datasetId}/ask`, {
      method: "POST",
      body: JSON.stringify({ question, conversation_id: conversationId })
    });
  },
  listConversations(datasetId) {
    return this.request(`/api/ai/${datasetId}/conversations`);
  },
  getConversationMessages(conversationId) {
    return this.request(`/api/ai/conversations/${conversationId}/messages`);
  },

  // Reports
  generateReport(datasetId, reportType, title = null) {
    return this.request(`/api/reports/${datasetId}/generate`, {
      method: "POST",
      body: JSON.stringify({ report_type: reportType, title })
    });
  },
  listReports(datasetId) {
    return this.request(`/api/reports/${datasetId}`);
  },
  getDownloadUrl(reportId) {
    return `${API_BASE}/api/reports/${reportId}/download`;
  }
};
