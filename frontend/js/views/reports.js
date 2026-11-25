import { API } from "../api.js";

export async function renderReports(container) {
  const activeDatasetId = API.getActiveDatasetId();

  if (!activeDatasetId) {
    container.innerHTML = `
      <div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 14px; padding: 40px 30px; text-align: center; max-width: 560px; margin: 40px auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05); font-family: 'Inter', sans-serif;">
        <div style="width: 52px; height: 52px; border-radius: 14px; background: rgba(245,158,11,0.15); color: #F59E0B; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 26px;">📋</div>
        <h3 style="font-size: 19px; font-weight: 800; color: var(--text-main); margin-bottom: 8px; font-family: var(--font-heading);">No Active Dataset Selected</h3>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 24px; line-height: 1.6;">Please select or upload a dataset (e.g. sales records or invoices) from the Datasets Hub to generate commercial PDF and Excel intelligence reports.</p>
        <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
          <button onclick="window.navigateTo('#overview')" class="btn btn-outline" style="font-weight: 700; padding: 10px 20px; font-size: 13px;">
            &larr; Back to Launchpad
          </button>
          <button onclick="window.navigateTo('#datasets')" class="btn btn-saffron" style="padding: 10px 20px; font-size: 13px; font-weight: 800;">
            Go to Datasets Hub &rarr;
          </button>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="max-width: 1300px; margin: 0 auto; font-family: 'Inter', sans-serif;">
      
      <!-- Executive Header with Human Indian Touch -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 14px; margin-bottom: 24px;">
        <div style="display: flex; gap: 14px; align-items: center;">
          <div style="width: 48px; height: 48px; border-radius: 14px; background: rgba(233, 154, 58, 0.15); color: var(--saffron); display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; box-shadow: 0 4px 12px rgba(233,154,58,0.15);">
            📄
          </div>
          <div>
            <h1 style="font-size: 24px; font-weight: 800; color: var(--text-main); margin: 0; font-family: var(--font-heading); display: flex; align-items: center; gap: 10px;">
              Executive Reports & Exports
              <span style="font-size: 11px; font-weight: 700; background: rgba(16, 185, 129, 0.15); color: #10B981; padding: 3px 10px; border-radius: 20px;">Deterministic v2.0</span>
            </h1>
            <p style="font-size: 13px; color: var(--text-muted); margin: 4px 0 0 0;">
              नमस्ते! Boardroom PDF briefings & structured Excel workbooks with bank-grade Zero-Hallucination math.
            </p>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <button id="btn-copy-whatsapp-summary" class="btn" style="background: #25D366; color: #FFFFFF; border: none; font-size: 12.5px; padding: 8px 16px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; border-radius: 8px; cursor: pointer;">
            <span>📱</span> Copy WhatsApp Summary
          </button>
          <button onclick="window.navigateTo('#overview')" class="btn btn-outline" style="font-size: 12.5px; padding: 8px 18px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px;">
            <span>&larr;</span> Back to Business OS
          </button>
        </div>
      </div>

      <!-- Action Cards for Export (Adaptive Light & Dark System, Mobile Touch Optimized) -->
      <div class="export-grid">
        
        <!-- 1. Executive PDF Briefing Card -->
        <div class="export-card export-card-pdf">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <div class="export-badge-pdf">
                📄 Boardroom Intelligence
              </div>
              <span style="font-size: 11px; font-weight: 700; color: #10B981;">✓ Visual Graphs Ready</span>
            </div>

            <h3 class="export-card-title">
              Executive PDF Briefing (बोर्ड बैठक रिपोर्ट)
            </h3>
            
            <p class="export-card-desc">
              Synthesizes commercial KPIs, sales velocity, category revenue share, working capital receivables, data health scores, and strategic directives into a 2-page boardroom presentation.
            </p>

            <!-- PDF Customization Controls (Corporate Light Standard) -->
            <div class="export-config-panel">
              <div style="display: grid; grid-template-columns: 1fr; gap: 12px;">
                <!-- Language Option -->
                <div>
                  <label class="export-field-label">
                    Report Language / भाषा
                  </label>
                  <select id="pdf-opt-language" class="export-control-select">
                    <option value="en" selected>Executive English (Boardroom Standard)</option>
                    <option value="bilingual">Bilingual (English + Hindi Context)</option>
                  </select>
                </div>
              </div>

              <!-- Graphs Toggle -->
              <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-main); font-weight: 600;">
                <input type="checkbox" id="pdf-opt-charts" checked style="accent-color: #E99A3A; width: 16px; height: 16px; cursor: pointer;" />
                <label for="pdf-opt-charts" style="cursor: pointer;">
                  Include High-Resolution Dual-Panel Charts (ग्राफ़ शामिल करें)
                </label>
              </div>
            </div>
          </div>

          <!-- Pinned Generate Button Container -->
          <div style="margin-top: auto; padding-top: 14px; border-top: 1px solid var(--border-color);">
            <button id="btn-generate-pdf" class="export-btn-pdf">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              <span>Generate Executive PDF Briefing</span>
            </button>
          </div>
        </div>

        <!-- 2. Comprehensive Excel Audit Card -->
        <div class="export-card export-card-excel">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <div class="export-badge-excel">
                📊 Spreadsheet Audit (.xlsx)
              </div>
              <span style="font-size: 11px; font-weight: 700; color: #10B981;">6 Multi-Worksheets</span>
            </div>

            <h3 class="export-card-title">
              Comprehensive Excel Audit Workbook
            </h3>
            
            <p class="export-card-desc">
              Exports a structured enterprise spreadsheet workbook featuring automatic cross-tabulation, category breakdowns, working capital aging, numeric statistics, and audit-ready data samples.
            </p>

            <div class="export-features-box">
              <div class="export-features-heading">Included Excel Worksheets:</div>
              <ul class="export-features-list">
                <li><b>Sheet 1:</b> Executive Dashboard & Commercial Posture</li>
                <li><b>Sheet 2:</b> Category Performance & Market Share Breakdown</li>
                <li><b>Sheet 3:</b> Working Capital Aging & Invoice Receivables</li>
                <li><b>Sheet 4:</b> Numeric Feature Distributions & Statistical Summary</li>
                <li><b>Sheet 5:</b> Column Health Profiles & Data Quality Audit</li>
                <li><b>Sheet 6:</b> Verified Raw Data Samples (Top 250 Rows)</li>
              </ul>
            </div>
          </div>

          <!-- Pinned Generate Button Container -->
          <div style="margin-top: auto; padding-top: 14px; border-top: 1px solid var(--border-color);">
            <button id="btn-generate-excel" class="export-btn-excel">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              <span>Generate Multi-Tab Excel Workbook</span>
            </button>
          </div>
        </div>

      </div>

      <!-- Live Generation Status Banner -->
      <div id="report-generation-status" style="display: none; padding: 14px 18px; border-radius: 10px; margin-bottom: 24px; font-size: 13px; font-weight: 600; line-height: 1.5;"></div>

      <!-- Generated Reports History Table -->
      <div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 14px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 style="font-size: 16px; font-weight: 800; color: var(--text-main); margin: 0;">Generated Reports History</h3>
            <p style="font-size: 11px; color: var(--text-muted); margin: 2px 0 0 0;">Historical exports generated for this active dataset</p>
          </div>
          <span style="font-size: 11px; font-weight: 700; color: #10B981; background: rgba(16, 185, 129, 0.15); padding: 4px 10px; border-radius: 20px;">
            Available for Immediate Download
          </span>
        </div>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 12.5px;">
            <thead>
              <tr style="background: var(--card-bg); border-bottom: 2px solid var(--border-color); color: var(--text-muted); font-weight: 700; text-transform: uppercase;">
                <th style="padding: 12px 18px;">Report Title</th>
                <th style="padding: 12px 18px;">Format</th>
                <th style="padding: 12px 18px;">Created (IST)</th>
                <th style="padding: 12px 18px; text-align: right;">Download Action</th>
              </tr>
            </thead>
            <tbody id="reports-table-body">
              <tr>
                <td colspan="4" style="padding: 24px; text-align: center; color: var(--text-muted);">Loading reports history...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;

  const statusEl = container.querySelector("#report-generation-status");

  function showStatus(msg, type = "info", downloadUrl = null, reportId = null, reportTitle = null) {
    if (!statusEl) return;
    statusEl.style.display = "block";
    let downloadHtml = "";
    if (downloadUrl) {
      downloadHtml = `
        <div style="margin-top: 10px;">
          <a href="${downloadUrl}" target="_blank" id="status-download-btn" class="btn" style="background: #14233D; color: #FFFFFF; font-size: 12px; padding: 7px 16px; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; border-radius: 8px;">
            <span>⬇</span> Download File Now
          </a>
        </div>
      `;
    }
    statusEl.innerHTML = `<div>${msg}</div>${downloadHtml}`;

    if (reportId) {
      const btn = statusEl.querySelector("#status-download-btn");
      if (btn) {
        btn.onclick = async (e) => {
          e.preventDefault();
          const orig = btn.innerHTML;
          btn.innerHTML = `<span>⏳</span> Downloading...`;
          try {
            await API.downloadReportFile(reportId, reportTitle || "Executive_Report");
          } catch (err) {
            window.open(downloadUrl, "_blank");
          } finally {
            btn.innerHTML = orig;
          }
        };
      }
    }

    if (type === "success") {
      statusEl.style.background = "#DCFCE7";
      statusEl.style.color = "#15803D";
      statusEl.style.border = "1px solid #86EFAC";
    } else if (type === "error") {
      statusEl.style.background = "#FEE2E2";
      statusEl.style.color = "#B91C1C";
      statusEl.style.border = "1px solid #FCA5A5";
    } else {
      statusEl.style.background = "#EFF6FF";
      statusEl.style.color = "#1E40AF";
      statusEl.style.border = "1px solid #BFDBFE";
    }
  }

  async function loadReportsTable() {
    try {
      const reports = await API.listReports(activeDatasetId);
      const tbody = container.querySelector("#reports-table-body");
      if (!tbody) return;

      if (!Array.isArray(reports) || reports.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" style="padding: 24px; text-align: center; color: var(--text-muted);">
              No reports generated yet for this dataset. Click a button above to generate a boardroom PDF or Excel audit.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = reports.map(r => {
        const isPdf = (r.report_type === "pdf");
        const formatBadge = isPdf
          ? `<span style="background: rgba(239, 68, 68, 0.15); color: #EF4444; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 6px;">PDF</span>`
          : `<span style="background: rgba(16, 185, 129, 0.15); color: #10B981; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 6px;">EXCEL</span>`;

        const dateStr = r.created_at ? new Date(r.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "--";
        const downloadUrl = API.getDownloadUrl(r.id);

        return `
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 14px 18px; font-weight: 700; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
              <span>${isPdf ? '📄' : '📊'}</span>
              <span>${r.title}</span>
            </td>
            <td style="padding: 14px 18px;">${formatBadge}</td>
            <td style="padding: 14px 18px; color: var(--text-muted);">${dateStr}</td>
            <td style="padding: 14px 18px; text-align: right;">
              <a href="${downloadUrl}" data-report-id="${r.id}" data-report-title="${r.title}" target="_blank" class="btn btn-outline btn-download-report" style="font-size: 11.5px; padding: 6px 14px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; border-radius: 6px;">
                <span>⬇</span> Download
              </a>
            </td>
          </tr>
        `;
      }).join("");

      tbody.onclick = async (e) => {
        const btn = e.target.closest(".btn-download-report");
        if (!btn) return;
        const reportId = btn.getAttribute("data-report-id");
        const reportTitle = btn.getAttribute("data-report-title");
        if (!reportId) return;
        e.preventDefault();
        const origHtml = btn.innerHTML;
        btn.innerHTML = `<span>⏳</span> Downloading...`;
        try {
          await API.downloadReportFile(reportId, reportTitle);
        } catch (err) {
          console.warn("Direct blob download failed, falling back to direct URL:", err);
          window.open(btn.href, "_blank");
        } finally {
          btn.innerHTML = origHtml;
        }
      };

    } catch (e) {
      console.error("Error loading reports table:", e);
    }
  }

  // Generate PDF Handler
  const btnPdf = container.querySelector("#btn-generate-pdf");
  if (btnPdf) {
    btnPdf.onclick = async () => {
      const lang = container.querySelector("#pdf-opt-language")?.value || "en";
      const includeCharts = !!container.querySelector("#pdf-opt-charts")?.checked;

      btnPdf.disabled = true;
      btnPdf.innerHTML = `<span>⏳</span> Compiling Executive PDF...`;
      showStatus("Generating executive boardroom PDF briefing with high-resolution visual charts...", "info");

      try {
        const res = await API.generateReport(activeDatasetId, "pdf", {
          language: lang,
          theme: "light",
          include_charts: includeCharts,
          title: `Executive Intelligence Briefing (${lang.toUpperCase()})`
        });

        const dlUrl = API.getDownloadUrl(res.report_id);
        showStatus(`✓ Executive PDF successfully generated and saved! (Corporate Light, ${lang.toUpperCase()})`, "success", dlUrl, res.report_id, res.title);
        await loadReportsTable();
      } catch (err) {
        showStatus(`Error generating PDF: ${err.message}`, "error");
      } finally {
        btnPdf.disabled = false;
        btnPdf.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          <span>Generate Executive PDF Briefing</span>
        `;
      }
    };
  }

  // Generate Excel Handler
  const btnExcel = container.querySelector("#btn-generate-excel");
  if (btnExcel) {
    btnExcel.onclick = async () => {
      btnExcel.disabled = true;
      btnExcel.innerHTML = `<span>⏳</span> Compiling Multi-Sheet Excel Workbook...`;
      showStatus("Compiling structured multi-sheet Excel audit workbook...", "info");

      try {
        const res = await API.generateReport(activeDatasetId, "excel", {
          title: `Comprehensive Commercial Audit (.xlsx)`
        });
        const dlUrl = API.getDownloadUrl(res.report_id);
        showStatus("✓ Comprehensive Excel Workbook successfully generated and indexed!", "success", dlUrl, res.report_id, res.title);
        await loadReportsTable();
      } catch (err) {
        showStatus(`Error generating Excel: ${err.message}`, "error");
      } finally {
        btnExcel.disabled = false;
        btnExcel.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          <span>Generate Multi-Tab Excel Workbook</span>
        `;
      }
    };
  }

  // 1-Click WhatsApp Business Summary Copy
  const btnWa = container.querySelector("#btn-copy-whatsapp-summary");
  if (btnWa) {
    btnWa.onclick = async () => {
      const orig = btnWa.innerHTML;
      btnWa.innerHTML = `<span>⏳</span> Preparing Summary...`;
      try {
        const kpis = await API.getBIKPIs(activeDatasetId);
        const h = kpis?.headline_metrics || {};
        const cats = (kpis?.category_breakdown || []).slice(0, 3);
        const topLines = cats.map((c, idx) => `  ${idx + 1}. ${c.category}: ₹${Number(c.revenue || 0).toLocaleString("en-IN")} (${c.share_pct}%)`).join("\n");
        const dsName = document.getElementById("top-active-dataset-name")?.innerText || "Active Dataset";

        const waText = [
          `📊 *VYAPAR VERSE — EXECUTIVE BRIEFING*`,
          `📁 *Dataset:* ${dsName}`,
          `━━━━━━━━━━━━━━━━━━━━`,
          `💰 *Total Revenue:* ₹${Number(h.total_revenue || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
          `📦 *Total Orders:* ${Number(h.total_transactions || 0).toLocaleString("en-IN")}`,
          `🧾 *Avg Ticket (AOV):* ₹${Number(h.average_order_value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`,
          cats.length ? `\n🏆 *Top Categories:*\n${topLines}` : "",
          `\n✅ _Verified by VSS AI Zero-Hallucination Engine_`
        ].filter(Boolean).join("\n");

        await navigator.clipboard.writeText(waText);
        showStatus("✓ WhatsApp Business Summary copied to clipboard! Ready to paste in WhatsApp.", "success");
      } catch (err) {
        showStatus(`Could not copy summary: ${err.message}`, "error");
      } finally {
        btnWa.innerHTML = orig;
      }
    };
  }

  // Initial load of history
  await loadReportsTable();
}
