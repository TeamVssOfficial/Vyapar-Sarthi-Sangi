import { API } from "../api.js";
import { ensurePlotly } from "../utils/plotly_loader.js";
import { autoRenderSpec } from "../utils/svg_charts.js";

export async function renderBIDashboard(container) {
  const activeDatasetId = API.getActiveDatasetId();

  if (!activeDatasetId) {
    container.innerHTML = `
      <div class="vss-card p-12 text-center max-w-lg mx-auto mt-8" style="padding: 40px 30px; text-align: center; max-width: 540px; margin: 40px auto;">
        <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(233,154,58,0.15); color: #E99A3A; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">📈</div>
        <h3 style="font-size: 18px; font-weight: 800; color: #14233D; margin-bottom: 8px;">No Active Dataset Selected</h3>
        <p style="font-size: 13px; color: #64748B; margin-bottom: 24px; line-height: 1.6;">Select a dataset from the Datasets Hub to view commercial KPIs and analytics, or return to the Business OS Launchpad.</p>
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
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(16,185,129,0.18); color: #10B981; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(16,185,129,0.15);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.2"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path><circle cx="12" cy="12" r="3" fill="#10B981"></circle></svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-[#14233D] brand-font" style="margin: 0;">Business Intelligence Dashboard</h1>
            <p class="text-sm text-slate-500" style="margin-top: 2px;">Commercial KPIs, revenue drivers, dimension analysis, and interactive visualizations.</p>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button onclick="window.navigateTo('#overview')" class="btn btn-outline" style="font-size: 12px; padding: 6px 14px; display: inline-flex; align-items: center; gap: 6px;">
            <span>&larr;</span> Back to Business OS
          </button>
          <button id="btn-edit-mapping" class="bg-white border border-slate-300 hover:bg-slate-50 text-[#14233D] px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition">
            <i data-lucide="sliders" class="w-4 h-4 text-[#E99A3A]"></i> Configure Column Mapping
          </button>
        </div>
      </div>

      <div id="bi-loading" class="text-center py-16 text-slate-500">
        <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto mb-3 text-[#E99A3A]"></i>
        Loading business metrics and generating revenue charts...
      </div>

      <div id="bi-content" class="hidden space-y-6">
        <!-- Headline KPI Cards -->
        <div id="bi-kpis-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"></div>

        <!-- Charts Grid -->
        <div id="bi-charts-container" class="grid grid-cols-1 lg:grid-cols-2 gap-6"></div>

        <!-- Dimension Tables: Categories & Top Products -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="vss-card p-5">
            <h3 class="font-bold text-[#14233D] text-sm brand-font mb-3">Revenue Contribution by Category</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-500 uppercase border-b">
                  <tr>
                    <th class="py-2.5 px-3">Category</th>
                    <th class="py-2.5 px-3">Revenue</th>
                    <th class="py-2.5 px-3">Transactions</th>
                    <th class="py-2.5 px-3">Share</th>
                  </tr>
                </thead>
                <tbody id="bi-categories-tbody" class="divide-y divide-slate-100"></tbody>
              </table>
            </div>
          </div>

          <div class="vss-card p-5">
            <h3 class="font-bold text-[#14233D] text-sm brand-font mb-3">Top 10 Commercial Accounts / Customers</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 text-slate-500 uppercase border-b">
                  <tr>
                    <th class="py-2.5 px-3">Customer</th>
                    <th class="py-2.5 px-3">Total Spend</th>
                    <th class="py-2.5 px-3">Orders</th>
                    <th class="py-2.5 px-3">Avg Spend</th>
                  </tr>
                </thead>
                <tbody id="bi-customers-tbody" class="divide-y divide-slate-100"></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  try {
    const [kpiRes, presetsRes] = await Promise.all([
      API.getKPIs(activeDatasetId),
      API.getDashboardPresets(activeDatasetId)
    ]);

    document.getElementById("bi-loading").classList.add("hidden");
    document.getElementById("bi-content").classList.remove("hidden");

    const h = kpiRes.headline_metrics || {};

    // Render KPIs
    const kpisGrid = document.getElementById("bi-kpis-grid");
    if (kpisGrid) {
      kpisGrid.innerHTML = `
        <div class="vss-card p-5">
          <div class="text-xs uppercase text-slate-400 font-semibold mb-1">Total Commercial Volume</div>
          <div class="text-2xl font-black text-[#14233D] brand-font">₹${Number(h.total_revenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          <div class="text-xs text-slate-500 mt-1">Aggregated ${h.primary_metric_name}</div>
        </div>
        <div class="vss-card p-5">
          <div class="text-xs uppercase text-slate-400 font-semibold mb-1">Transactions Processed</div>
          <div class="text-2xl font-black text-[#14233D] brand-font">${Number(h.total_transactions || 0).toLocaleString()}</div>
          <div class="text-xs text-slate-500 mt-1">Distinct order transactions</div>
        </div>
        <div class="vss-card p-5">
          <div class="text-xs uppercase text-slate-400 font-semibold mb-1">Average Deal Size (AOV)</div>
          <div class="text-2xl font-black text-[#E99A3A] brand-font">₹${Number(h.average_order_value || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
          <div class="text-xs text-slate-500 mt-1">Mean transaction value</div>
        </div>
        <div class="vss-card p-5">
          <div class="text-xs uppercase text-slate-400 font-semibold mb-1">${h.total_profit ? 'Net Profit Margin' : 'Total Units Sold'}</div>
          <div class="text-2xl font-black text-[#31856C] brand-font">
            ${h.total_profit ? h.profit_margin_pct + '%' : (h.total_units_sold ? Number(h.total_units_sold).toLocaleString() : 'N/A')}
          </div>
          <div class="text-xs text-slate-500 mt-1">${h.total_profit ? 'Commercial Net Margin' : 'Aggregated physical inventory units'}</div>
        </div>
      `;
    }

    // Render Categories
    const catTbody = document.getElementById("bi-categories-tbody");
    const cats = kpiRes.category_breakdown || [];
    if (catTbody) {
      if (cats.length === 0) {
        catTbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400">No category field detected.</td></tr>`;
      } else {
        catTbody.innerHTML = cats.map(c => `
          <tr class="hover:bg-slate-50 font-medium">
            <td class="py-2.5 px-3 text-[#14233D]">${c.category}</td>
            <td class="py-2.5 px-3">₹${Number(c.revenue).toLocaleString()}</td>
            <td class="py-2.5 px-3 text-slate-600">${c.transactions}</td>
            <td class="py-2.5 px-3"><span class="px-2 py-0.5 rounded text-[11px] font-bold badge-saffron">${c.share_pct}%</span></td>
          </tr>
        `).join("");
      }
    }

    // Render Customers
    const custTbody = document.getElementById("bi-customers-tbody");
    const custs = kpiRes.customer_performance || [];
    if (custTbody) {
      if (custs.length === 0) {
        custTbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-slate-400">No customer dimension detected.</td></tr>`;
      } else {
        custTbody.innerHTML = custs.map(c => `
          <tr class="hover:bg-slate-50 font-medium">
            <td class="py-2.5 px-3 text-[#14233D] truncate max-w-[150px]">${c.customer}</td>
            <td class="py-2.5 px-3 font-semibold text-[#14233D]">₹${Number(c.revenue).toLocaleString()}</td>
            <td class="py-2.5 px-3 text-slate-600">${c.orders_count}</td>
            <td class="py-2.5 px-3 text-slate-600">₹${Number(c.average_spend).toLocaleString()}</td>
          </tr>
        `).join("");
      }
    }

    // Render Plotly Preset Charts
    const chartsContainer = document.getElementById("bi-charts-container");
    const presetList = presetsRes.charts || [];
    if (chartsContainer) {
      if (presetList.length === 0) {
        chartsContainer.innerHTML = `<div class="p-8 text-center text-slate-400 col-span-2">No automatic chart presets could be synthesized from available fields.</div>`;
      } else {
        chartsContainer.innerHTML = presetList.map((ch, idx) => `
          <div class="vss-card p-5">
            <h4 class="font-bold text-[#14233D] text-xs brand-font uppercase tracking-wider text-slate-400 mb-3">${ch.title}</h4>
            <div id="chart-preset-${idx}" class="w-full h-72"></div>
          </div>
        `).join("");

        // 1. Instantly render high-definition native SVG charts (0ms, zero external dependencies)
        presetList.forEach((ch, idx) => {
          try {
            autoRenderSpec(`chart-preset-${idx}`, ch.spec, ch.title);
          } catch (e) {
            console.warn("SVG chart render error:", e);
          }
        });

        // 2. Enhance with Plotly if loaded in background
        ensurePlotly().then(plotly => {
          if (plotly) {
            presetList.forEach((ch, idx) => {
              try {
                plotly.newPlot(`chart-preset-${idx}`, ch.spec.data, ch.spec.layout, { responsive: true, displayModeBar: false });
              } catch (e) {}
            });
          }
        });
      }
    }

  } catch (err) {
    console.error("BI Dashboard render error:", err);
    if (err.message && err.message.includes("404")) {
      try {
        const datasets = await API.listDatasets();
        if (datasets && datasets.length > 0 && datasets[0].id !== activeDatasetId) {
          API.setActiveDatasetId(datasets[0].id);
          renderBIDashboard(container);
          return;
        }
      } catch (e) {}
    }
    const loadingEl = document.getElementById("bi-loading");
    if (loadingEl) {
      loadingEl.innerHTML = `<div class="p-6 text-red-600">Failed to render dashboard metrics: ${err.message}</div>`;
    }
  }
}
