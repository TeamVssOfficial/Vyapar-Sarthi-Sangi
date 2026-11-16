import { API } from "../api.js";

export async function renderReports(container) {
  const activeDatasetId = API.getActiveDatasetId();

  if (!activeDatasetId) {
    container.innerHTML = `
      <div class="vss-card p-12 text-center max-w-lg mx-auto mt-8" style="padding: 40px 30px; text-align: center; max-width: 540px; margin: 40px auto;">
        <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(245,158,11,0.15); color: #F59E0B; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">📋</div>
        <h3 style="font-size: 18px; font-weight: 800; color: #14233D; margin-bottom: 8px;">No Active Dataset Selected</h3>
        <p style="font-size: 13px; color: #64748B; margin-bottom: 24px; line-height: 1.6;">Select a dataset from the Datasets Hub to generate commercial PDF and Excel intelligence reports, or return to the Business OS Launchpad.</p>
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
          <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(225,29,72,0.18); color: #E11D48; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(225,29,72,0.15);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E11D48" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><circle cx="12" cy="15" r="2.5" fill="#E11D48"></circle><line x1="12" y1="11" x2="12" y2="12"></line></svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-[#14233D] brand-font" style="margin: 0;">Executive Reports & Exports</h1>
            <p class="text-sm text-slate-500" style="margin-top: 2px;">Generate executive boardroom PDF briefings and structured multi-sheet Excel workbooks for stakeholders.</p>
          </div>
        </div>
        <button onclick="window.navigateTo('#overview')" class="btn btn-outline" style="font-size: 12px; padding: 6px 14px; display: inline-flex; align-items: center; gap: 6px;">
          <span>&larr;</span> Back to Business OS
        </button>
      </div>

      <!-- Action Cards for Export -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- PDF Card -->
        <div class="vss-card p-6 flex flex-col justify-between border-t-4 border-t-[#14233D]">
          <div class="space-y-3">
            <div class="w-12 h-12 rounded-xl bg-[#14233D]/10 text-[#14233D] flex items-center justify-center">
              <i data-lucide="file-text" class="w-6 h-6"></i>
            </div>
            <h3 class="text-base font-bold text-[#14233D] brand-font">Executive PDF Briefing</h3>
            <p class="text-xs text-slate-500 leading-relaxed">
              Synthesizes commercial KPIs, top performing categories, data quality health scores, and critical alerts into a publication-ready management document.
            </p>
          </div>
          <div class="pt-6">
            <button id="btn-generate-pdf" class="w-full bg-[#14233D] hover:bg-[#0C1729] text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition shadow">
              <i data-lucide="download" class="w-4 h-4 text-[#E99A3A]"></i> Generate Executive PDF
            </button>
          </div>
        </div>

        <!-- Excel Card -->
        <div class="vss-card p-6 flex flex-col justify-between border-t-4 border-t-[#31856C]">
          <div class="space-y-3">
            <div class="w-12 h-12 rounded-xl bg-[#31856C]/10 text-[#31856C] flex items-center justify-center">
              <i data-lucide="sheet" class="w-6 h-6"></i>
            </div>
            <h3 class="text-base font-bold text-[#14233D] brand-font">Comprehensive Excel Audit (.xlsx)</h3>
            <p class="text-xs text-slate-500 leading-relaxed">
              Multi-tab spreadsheet workbook including Dataset Summary, Column Data Profiling, Numeric Descriptive Statistics, Category Breakdowns, and Data Samples.
            </p>
          </div>
          <div class="pt-6">
            <button id="btn-generate-excel" class="w-full bg-[#31856C] hover:bg-[#256c57] text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition shadow">
              <i data-lucide="download" class="w-4 h-4 text-[#E99A3A]"></i> Generate Multi-Tab Excel Workbook
            </button>
          </div>
        </div>
      </div>

      <div id="report-generation-status" class="hidden text-xs p-3 rounded-lg"></div>

      <!-- Generated Reports History Table -->
      <div class="vss-card overflow-hidden">
        <div class="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-bold text-[#14233D] text-sm brand-font">Generated Reports History</h3>
          <span class="text-xs text-slate-400">Available for Immediate Download</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-600 uppercase text-[11px] border-b">
              <tr>
                <th class="p-3">Report Title</th>
                <th class="p-3">Format</th>
                <th class="p-3">Created</th>
                <th class="p-3 text-right">Download</th>
              </tr>
            </thead>
            <tbody id="reports-table-body" class="divide-y divide-slate-100">
              <tr><td colspan="4" class="p-6 text-center text-slate-400">Loading reports history...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  const statusEl = document.getElementById("report-generation-status");

  async function loadReportsTable() {
    try {
      const reports = await API.listReports(activeDatasetId);
      const tbody = document.getElementById("reports-table-body");
      if (!tbody) return;
      if (reports.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-slate-400">No reports generated yet for this dataset. Click a button above to create one.</td></tr>`;
      } else {
        tbody.innerHTML = reports.map(r => `
          <tr class="hover:bg-slate-50">
            <td class="p-3 font-semibold text-[#14233D] flex items-center gap-2">
              <i data-lucide="${r.report_type === 'pdf' ? 'file-text' : 'sheet'}" class="w-4 h-4 ${r.report_type === 'pdf' ? 'text-red-500' : 'text-emerald-600'}"></i>
              ${r.title}
            </td>
            <td class="p-3 uppercase font-mono font-bold text-slate-500">${r.report_type}</td>
            <td class="p-3 text-slate-500">${new Date(r.created_at).toLocaleString()}</td>
            <td class="p-3 text-right">
              <a href="${API.getDownloadUrl(r.id)}" target="_blank" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#14233D] rounded text-xs font-semibold inline-flex items-center gap-1 transition">
                <i data-lucide="download" class="w-3.5 h-3.5"></i> Download
              </a>
            </td>
          </tr>
        `).join("");
        if (window.lucide) window.lucide.createIcons();
      }
    } catch (e) {
      console.error("Error loading reports table:", e);
    }
  }

  // Generate PDF
  document.getElementById("btn-generate-pdf")?.addEventListener("click", async () => {
    statusEl.className = "text-xs p-3 rounded-lg bg-slate-100 text-slate-700 flex items-center gap-2";
    statusEl.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin text-[#E99A3A]"></i> Generating executive PDF with ReportLab...`;
    statusEl.classList.remove("hidden");
    if (window.lucide) window.lucide.createIcons();

    try {
      await API.generateReport(activeDatasetId, "pdf");
      statusEl.className = "text-xs p-3 rounded-lg bg-green-50 text-green-700 border border-green-200";
      statusEl.innerText = "Executive PDF successfully generated and saved!";
      await loadReportsTable();
    } catch (err) {
      statusEl.className = "text-xs p-3 rounded-lg bg-red-50 text-red-600 border border-red-200";
      statusEl.innerText = "Error generating PDF: " + err.message;
    }
  });

  // Generate Excel
  document.getElementById("btn-generate-excel")?.addEventListener("click", async () => {
    statusEl.className = "text-xs p-3 rounded-lg bg-slate-100 text-slate-700 flex items-center gap-2";
    statusEl.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin text-[#E99A3A]"></i> Compiling multi-sheet Excel workbook...`;
    statusEl.classList.remove("hidden");
    if (window.lucide) window.lucide.createIcons();

    try {
      await API.generateReport(activeDatasetId, "excel");
      statusEl.className = "text-xs p-3 rounded-lg bg-green-50 text-green-700 border border-green-200";
      statusEl.innerText = "Comprehensive Excel Workbook successfully generated!";
      await loadReportsTable();
    } catch (err) {
      statusEl.className = "text-xs p-3 rounded-lg bg-red-50 text-red-600 border border-red-200";
      statusEl.innerText = "Error generating Excel: " + err.message;
    }
  });

  await loadReportsTable();
}
