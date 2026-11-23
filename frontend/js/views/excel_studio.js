// Vyapar Verse — Vyapar Excel Studio
// "Create. Manage. Analyze. Your Business Spreadsheets in One Place"
import { API } from "../api.js";
import {
  evaluateFormula,
  indexToColLetter,
  colLetterToIndex,
  parseCellReference
} from "../utils/excel_formula_engine.js";

export async function renderExcelStudio(container) {
  // Application State for Excel Studio
  let activeWorkbook = null;
  let activeSheetIndex = 0;
  let activeCell = { row: 0, col: 0 };
  let isEditingCell = false;
  let saveStatus = "saved"; // "saved", "saving", "unsaved"
  let autoSaveTimer = null;
  let historyStack = [];
  let historyIndex = -1;

  // Local storage and instant offline templates for Indian shopkeepers
  function getLocalWorkbooks() {
    try {
      const raw = localStorage.getItem("vss_local_workbooks");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLocalWorkbook(wb) {
    if (!wb || !wb.id) return;
    try {
      const list = getLocalWorkbooks();
      wb.updated_at = new Date().toISOString();
      const idx = list.findIndex(x => x.id === wb.id);
      if (idx >= 0) {
        list[idx] = wb;
      } else {
        list.unshift(wb);
      }
      localStorage.setItem("vss_local_workbooks", JSON.stringify(list.slice(0, 30)));
    } catch (e) {
      console.warn("localStorage save error:", e);
    }
  }

  function deleteLocalWorkbook(id) {
    try {
      const list = getLocalWorkbooks().filter(x => x.id !== id);
      localStorage.setItem("vss_local_workbooks", JSON.stringify(list));
    } catch (e) {}
  }

  function getLocalTemplate(type, title) {
    const defaultName = title || "Untitled Workbook";
    const templates = {
      blank: {
        name: "Blank Workbook",
        sheets: [{
          name: "Sheet1",
          color: "#3B82F6",
          columns: ["A", "B", "C", "D", "E", "F", "G", "H"],
          data: Array.from({ length: 25 }, () => Array(8).fill(""))
        }]
      },
      sales_register: {
        name: "Sales Register",
        sheets: [{
          name: "Daily Sales",
          color: "#10B981",
          columns: ["Date", "Invoice_No", "Customer_Name", "Product_Item", "Category", "Quantity", "Unit_Price", "Total_Amount", "Payment_Mode"],
          data: [
            ["2026-03-01", "INV-1001", "Sharma Mart", "Classic Basmati Rice 10kg", "Groceries", "15", "850.0", "=F2*G2", "UPI"],
            ["2026-03-01", "INV-1002", "Verma Traders", "Mustard Oil 5L", "Edibles", "20", "720.0", "=F3*G3", "Cash"],
            ["2026-03-02", "INV-1003", "Patel Brothers", "Chana Dal 1kg Pack", "Pulses", "50", "95.0", "=F4*G4", "Bank Transfer"],
            ["2026-03-02", "INV-1004", "Rajeshwari Retail", "Sugar 5kg", "Groceries", "30", "220.0", "=F5*G5", "UPI"],
            ["2026-03-03", "INV-1005", "Gupta Provision Store", "Wheat Flour 10kg", "Groceries", "40", "380.0", "=F6*G6", "Cheque"],
            ["", "", "", "", "Total Sales:", "=SUM(F2:F6)", "", "=SUM(H2:H6)", ""],
            ...Array.from({ length: 18 }, () => Array(9).fill(""))
          ]
        }]
      },
      inventory_register: {
        name: "Inventory Register",
        sheets: [{
          name: "Stock Register",
          color: "#F59E0B",
          columns: ["Item_Code", "Item_Name", "Category", "Opening_Stock", "Inward_Qty", "Outward_Qty", "Current_Stock", "Reorder_Level", "Stock_Status"],
          data: [
            ["SKU-001", "Basmati Rice 10kg", "Grains", "120", "50", "45", "=D2+E2-F2", "30", '=IF(G2<=H2,"LOW STOCK","OK")'],
            ["SKU-002", "Mustard Oil 5L", "Oils", "60", "20", "55", "=D3+E3-F3", "25", '=IF(G3<=H3,"LOW STOCK","OK")'],
            ["SKU-003", "Chana Dal 1kg", "Pulses", "200", "100", "120", "=D4+E4-F4", "50", '=IF(G4<=H4,"LOW STOCK","OK")'],
            ["SKU-004", "Sugar 5kg", "Groceries", "90", "40", "85", "=D5+E5-F5", "40", '=IF(G5<=H5,"LOW STOCK","OK")'],
            ["SKU-005", "Atta 10kg", "Flour", "150", "60", "90", "=D6+E6-F6", "50", '=IF(G6<=H6,"LOW STOCK","OK")'],
            ["", "Total Units in Stock:", "", "=SUM(D2:D6)", "=SUM(E2:E6)", "=SUM(F2:F6)", "=SUM(G2:G6)", "", ""],
            ...Array.from({ length: 18 }, () => Array(9).fill(""))
          ]
        }]
      },
      expense_tracker: {
        name: "Expense Tracker",
        sheets: [{
          name: "Operating Expenses",
          color: "#EF4444",
          columns: ["Date", "Expense_Category", "Description", "Vendor_Payee", "Amount", "Payment_Mode", "GST_Applicable", "Voucher_No"],
          data: [
            ["2026-03-01", "Shop Rent", "Monthly Shop Lease", "R.K. Properties", "25000", "Bank Transfer", "No", "V-101"],
            ["2026-03-02", "Electricity", "Commercial Power Bill", "State Power Corp", "4850", "Online Bill", "Yes", "V-102"],
            ["2026-03-03", "Logistics", "Goods Transport Tempo", "Express Logistics", "3200", "Cash", "No", "V-103"],
            ["2026-03-04", "Packaging", "Cardboard boxes & tape", "Shree Packaging", "1850", "UPI", "Yes", "V-104"],
            ["2026-03-05", "Staff Wages", "Sales Staff Weekly", "Mohan & Team", "8000", "Cash", "No", "V-105"],
            ["", "Total Expenses:", "", "", "=SUM(E2:E6)", "", "", ""],
            ...Array.from({ length: 18 }, () => Array(8).fill(""))
          ]
        }]
      },
      purchase_register: {
        name: "Purchase Register",
        sheets: [{
          name: "Inward Purchases",
          color: "#8B5CF6",
          columns: ["Date", "PO_Number", "Supplier_Name", "Item_Purchased", "Quantity", "Unit_Cost", "Tax_Pct", "Total_Cost", "Payment_Due_Date"],
          data: [
            ["2026-03-01", "PO-501", "Agro Foods Ltd", "Basmati Rice 10kg", "50", "720", "5", "=E2*F2*(1+G2/100)", "2026-03-25"],
            ["2026-03-02", "PO-502", "Bharat Mills", "Mustard Oil Cans", "30", "610", "5", "=E3*F3*(1+G3/100)", "2026-03-20"],
            ["2026-03-03", "PO-503", "Kisan Pulses Mandi", "Chana Dal Bags", "100", "78", "0", "=E4*F4*(1+G4/100)", "2026-03-15"],
            ["", "", "Total Purchases:", "", "=SUM(E2:E4)", "", "", "=SUM(H2:H4)", ""],
            ...Array.from({ length: 18 }, () => Array(9).fill(""))
          ]
        }]
      },
      customer_database: {
        name: "Customer Database",
        sheets: [{
          name: "Customer Directory",
          color: "#06B6D4",
          columns: ["Customer_ID", "Full_Name", "Phone_Number", "City", "GSTIN", "Total_Purchases", "Outstanding_Balance", "Credit_Status"],
          data: [
            ["CUST-001", "Sharma Mart", "9876543210", "Surat", "24AAAAA0000A1Z5", "85000", "12000", '=IF(G2>0,"DUE","CLEARED")'],
            ["CUST-002", "Verma Traders", "9823456789", "Ahmedabad", "24BBBBB1111B2Z6", "64000", "0", '=IF(G3>0,"DUE","CLEARED")'],
            ["CUST-003", "Patel Brothers", "9812345678", "Vadodara", "24CCCCC2222C3Z7", "112000", "28000", '=IF(G4>0,"DUE","CLEARED")'],
            ...Array.from({ length: 20 }, () => Array(8).fill(""))
          ]
        }]
      },
      business_budget: {
        name: "Business Budget",
        sheets: [{
          name: "Monthly P&L Budget",
          color: "#14B8A6",
          columns: ["Month", "Projected_Revenue", "Actual_Revenue", "Variance", "Operational_Cost", "Marketing_Cost", "Net_Margin", "Performance_Score"],
          data: [
            ["Jan 2026", "250000", "265000", "=C2-B2", "140000", "15000", "=C2-E2-F2", '=IF(D2>=0,"TARGET MET","DEFICIT")'],
            ["Feb 2026", "275000", "260000", "=C3-B3", "145000", "18000", "=C3-E3-F3", '=IF(D3>=0,"TARGET MET","DEFICIT")'],
            ["Mar 2026", "300000", "325000", "=C4-B4", "160000", "20000", "=C4-E4-F4", '=IF(D4>=0,"TARGET MET","DEFICIT")'],
            ...Array.from({ length: 18 }, () => Array(8).fill(""))
          ]
        }]
      },
      invoice_register: {
        name: "Invoice Register",
        sheets: [{
          name: "Billing Invoices",
          color: "#EC4899",
          columns: ["Invoice_No", "Billing_Date", "Client_Name", "GST_Number", "Subtotal", "GST_18_Pct", "Grand_Total", "Payment_Status", "Due_Days"],
          data: [
            ["INV-2026-01", "2026-03-01", "Apex Supermarket", "24AAAAA0000A1Z5", "45000", "=E2*0.18", "=E2+F2", "PAID", "0"],
            ["INV-2026-02", "2026-03-02", "Kisan General Store", "24BBBBB1111B2Z6", "28000", "=E3*0.18", "=E3+F3", "UNPAID", "15"],
            ["INV-2026-03", "2026-03-03", "Metro Departmental", "24CCCCC2222C3Z7", "95000", "=E4*0.18", "=E4+F4", "PARTIAL", "7"],
            ...Array.from({ length: 18 }, () => Array(9).fill(""))
          ]
        }]
      }
    };
    const t = templates[type] || templates["blank"];
    return {
      id: "wb_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      name: t.name || defaultName,
      template_type: type,
      sheets: JSON.parse(JSON.stringify(t.sheets)),
      created_at: new Date().toISOString()
    };
  }


  // Render Home Hub initially
  await showHomeHub();

  async function showHomeHub() {
    container.innerHTML = `
      <div class="excel-studio-hub">
        <!-- Hub Top Banner -->
        <div style="background: linear-gradient(135deg, #0B1528 0%, #14233D 60%, #1E3A5F 100%); border-radius: 16px; padding: 32px 36px; color: #FFFFFF; margin-bottom: 32px; border: 1px solid rgba(16, 185, 129, 0.3); box-shadow: 0 10px 30px rgba(11, 21, 40, 0.4); position: relative; overflow: hidden;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 20px; position: relative; z-index: 2;">
            <div>
              <div style="display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 20px; background: rgba(16, 185, 129, 0.2); color: #34D399; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 12px; border: 1px solid rgba(16, 185, 129, 0.4);">
                <span>📊</span> Enterprise Spreadsheet Suite
              </div>
              <h1 style="font-size: 28px; font-weight: 900; letter-spacing: -0.5px; margin-bottom: 8px; color: #FFFFFF;">
                Vyapar Excel Studio
              </h1>
              <p style="font-size: 14px; color: #94A3B8; max-width: 600px; line-height: 1.6;">
                Create, manage, and analyze your business spreadsheets in one place. Pre-built for Indian shopkeepers, retailers, and wholesalers with automated formulas, cloud sync, and AI formula assistance.
              </p>
            </div>

            <!-- Quick File Ingestion Card -->
            <div style="background: rgba(255, 255, 255, 0.07); border: 1px dashed rgba(52, 211, 153, 0.4); border-radius: 12px; padding: 18px 22px; text-align: center; min-width: 280px;">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2" style="margin: 0 auto 8px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              <div style="font-size: 13px; font-weight: 700; color: #FFFFFF; margin-bottom: 4px;">Open Any Excel or CSV File</div>
              <div style="font-size: 11px; color: #94A3B8; margin-bottom: 12px;">.xlsx, .xls, .csv supported</div>
              <input type="file" id="hub-file-input" accept=".xlsx,.xls,.csv" style="display: none;" />
              <button id="btn-hub-import-file" class="btn btn-saffron" style="font-size: 12px; padding: 7px 16px; font-weight: 700; width: 100%;">
                Choose File to Open
              </button>
            </div>
          </div>
        </div>

        <!-- 1. TEMPLATES SELECTOR SECTION -->
        <div style="margin-bottom: 36px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <h2 style="font-size: 18px; font-weight: 800; color: var(--navy); margin-bottom: 4px;">Start with a Shopkeeper Template</h2>
              <p style="font-size: 12px; color: var(--slate);">Pre-configured with standard retail columns, sample data, and automatic formulas.</p>
            </div>
          </div>

          <div class="excel-templates-grid">
            ${renderTemplateCard("blank", "Blank Workbook", "Start from a clean spreadsheet grid", "📄", "#3B82F6")}
            ${renderTemplateCard("sales_register", "Sales Register", "Daily sales, payment methods, customer names, taxes & totals", "💰", "#10B981")}
            ${renderTemplateCard("inventory_register", "Inventory Register", "Stock tracker with reorder alerts, cost price & selling price", "📦", "#F59E0B")}
            ${renderTemplateCard("expense_tracker", "Expense Tracker", "Rent, electricity, wages, tea/snacks & miscellaneous expenses", "📉", "#EF4444")}
            ${renderTemplateCard("purchase_register", "Purchase Register", "Supplier invoices, purchase costs, GST inputs & balance dues", "🚚", "#8B5CF6")}
            ${renderTemplateCard("customer_database", "Customer Database", "Customer ledger, contact numbers, credit limits & payment terms", "👥", "#06B6D4")}
            ${renderTemplateCard("business_budget", "Business Budget", "Monthly budgeted vs actual revenue, operational margins & net profit", "📈", "#14B8A6")}
            ${renderTemplateCard("invoice_register", "Invoice Register", "Invoice billing numbers, due dates, paid status & overdue alerts", "🧾", "#EC4899")}
          </div>
        </div>

        <!-- 2. RECENT WORKBOOKS LIST -->
        <div class="vss-card" style="padding: 24px; margin-bottom: 36px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 12px;">
            <div>
              <h2 style="font-size: 16px; font-weight: 800; color: var(--navy);">My Business Workbooks</h2>
              <p style="font-size: 12px; color: var(--slate);">Saved workbooks stored securely in your private business workspace.</p>
            </div>
            <div id="hub-workbooks-count" style="font-size: 12px; font-weight: 700; color: var(--slate);">Loading workbooks...</div>
          </div>

          <div id="hub-workbooks-table-wrap">
            <div style="text-align: center; padding: 40px; color: var(--slate); font-size: 13px;">Loading saved workbooks...</div>
          </div>
        </div>
      </div>
    `;

    // Wire Template Card Clicks
    container.querySelectorAll(".excel-template-card").forEach(card => {
      card.addEventListener("click", async () => {
        const tType = card.getAttribute("data-template");
        const tTitle = card.getAttribute("data-title");
        await createAndOpenWorkbook(tType, tTitle);
      });
    });

    // Wire Import File
    const fileInput = container.querySelector("#hub-file-input");
    const importBtn = container.querySelector("#btn-hub-import-file");
    if (importBtn && fileInput) {
      importBtn.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        importBtn.innerText = "Importing Workbook...";
        importBtn.disabled = true;
        try {
          let loadedWorkbook = null;
          if (file.name.endsWith(".csv")) {
            const text = await file.text();
            const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
            const dataRows = lines.map(line => {
              const row = [];
              let inQuotes = false;
              let curr = "";
              for (let i = 0; i < line.length; i++) {
                const c = line[i];
                if (c === '"') { inQuotes = !inQuotes; }
                else if (c === ',' && !inQuotes) { row.push(curr.trim()); curr = ""; }
                else { curr += c; }
              }
              row.push(curr.trim());
              return row;
            });
            const cols = dataRows.length > 0 ? dataRows[0] : ["A","B","C","D"];
            const rows = dataRows.length > 1 ? dataRows.slice(1, 300) : [[""]];
            loadedWorkbook = {
              id: "wb_" + Date.now(),
              name: file.name.replace(/\.[^/.]+$/, ""),
              sheets: [{
                name: file.name.substring(0, 20),
                color: "#10B981",
                columns: cols,
                data: rows
              }],
              created_at: new Date().toISOString()
            };
          } else {
            const res = await API.importFileToWorkbook(file).catch(err => {
              console.warn("Backend import fallback:", err);
              return null;
            });
            if (res) {
              loadedWorkbook = res.workbook || (res.sheets ? res : null);
            }
          }

          if (loadedWorkbook && loadedWorkbook.sheets) {
            activeWorkbook = loadedWorkbook;
            activeSheetIndex = 0;
            saveLocalWorkbook(activeWorkbook);
            renderEditorView();
          } else {
            alert("Could not parse file structure. Starting with blank workbook.");
            await createAndOpenWorkbook("blank", file.name.replace(/\.[^/.]+$/, ""));
          }
        } catch (err) {
          alert("Import error: " + err.message);
        } finally {
          importBtn.innerText = "Choose File to Open";
          importBtn.disabled = false;
        }
      });
    }

    // Load recent workbooks
    await loadRecentWorkbooks();
  }

  function renderTemplateCard(type, title, desc, icon, color) {
    return `
      <div class="excel-template-card" data-template="${type}" data-title="${title}">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div style="width: 40px; height: 40px; border-radius: 10px; background: ${color}15; color: ${color}; display: flex; align-items: center; justify-content: center; font-size: 20px;">
              ${icon}
            </div>
            <span style="font-size: 10px; font-weight: 700; color: ${color}; background: ${color}10; padding: 2px 8px; border-radius: 12px; border: 1px solid ${color}30;">Template</span>
          </div>
          <h3 style="font-size: 14px; font-weight: 800; color: var(--navy); margin-bottom: 6px;">${title}</h3>
          <p style="font-size: 11.5px; color: var(--slate); line-height: 1.5; margin-bottom: 14px;">${desc}</p>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #F1F5F9; padding-top: 10px;">
          <span style="font-size: 11px; font-weight: 700; color: #10B981;">Ready to use &rarr;</span>
          <span style="font-size: 10px; color: #94A3B8;">Auto-Calculated</span>
        </div>
      </div>
    `;
  }

  async function loadRecentWorkbooks() {
    const tableWrap = container.querySelector("#hub-workbooks-table-wrap");
    const countBadge = container.querySelector("#hub-workbooks-count");
    if (!tableWrap) return;

    let serverList = [];
    try {
      if (API.getToken()) {
        const data = await API.listWorkbooks().catch(() => ({ workbooks: [] }));
        serverList = Array.isArray(data) ? data : (data.workbooks || []);
      }
    } catch (e) {
      serverList = [];
    }

    const localList = getLocalWorkbooks();
    const mergedMap = new Map();
    serverList.forEach(w => mergedMap.set(w.id, w));
    localList.forEach(w => {
      if (!mergedMap.has(w.id)) mergedMap.set(w.id, w);
    });
    const list = Array.from(mergedMap.values());

    if (countBadge) countBadge.innerText = `${list.length} Workbooks Found`;

    if (list.length === 0) {
      tableWrap.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; background: #F8FAFC; border-radius: 8px; border: 1px dashed #CBD5E1;">
          <div style="font-size: 32px; margin-bottom: 8px;">📂</div>
          <div style="font-size: 14px; font-weight: 700; color: var(--navy); margin-bottom: 4px;">No Saved Workbooks Yet</div>
          <div style="font-size: 12px; color: var(--slate); margin-bottom: 16px;">Pick a template above or import your existing Excel file to start.</div>
        </div>
      `;
      return;
    }

    tableWrap.innerHTML = `
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr style="border-bottom: 2px solid #E2E8F0; text-align: left; color: #64748B; font-size: 11px; text-transform: uppercase;">
            <th style="padding: 10px 14px;">Workbook Name</th>
            <th style="padding: 10px 14px;">Template</th>
            <th style="padding: 10px 14px;">Sheets</th>
            <th style="padding: 10px 14px;">Last Modified</th>
            <th style="padding: 10px 14px; text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${list.map(wb => `
            <tr style="border-bottom: 1px solid #F1F5F9; transition: background 0.15s ease;" onmouseover="this.style.background='#F8FAFC'" onmouseout="this.style.background='transparent'">
              <td style="padding: 12px 14px; font-weight: 700; color: var(--navy); display: flex; align-items: center; gap: 8px;">
                <span style="color: #10B981;">📊</span> ${wb.name}
              </td>
              <td style="padding: 12px 14px; color: #64748B; font-size: 12px;">${wb.template_type || "Custom"}</td>
              <td style="padding: 12px 14px; color: #64748B; font-size: 12px;">${wb.sheet_count || (wb.sheets ? wb.sheets.length : 1)} Sheets</td>
              <td style="padding: 12px 14px; color: #94A3B8; font-size: 11.5px;">${new Date(wb.updated_at || wb.created_at || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</td>
              <td style="padding: 12px 14px; text-align: right;">
                <button class="btn-open-wb btn btn-saffron" data-wbid="${wb.id}" style="padding: 5px 12px; font-size: 11px; font-weight: 700; margin-right: 6px;">Open Grid</button>
                <button class="btn-del-wb btn" data-wbid="${wb.id}" style="padding: 5px 10px; font-size: 11px; background: rgba(239, 68, 68, 0.1); color: #EF4444; border: 1px solid rgba(239, 68, 68, 0.2);">Delete</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    // Wire Open buttons
    tableWrap.querySelectorAll(".btn-open-wb").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-wbid");
        btn.innerText = "Loading...";
        try {
          let foundWb = null;
          const localMatch = localList.find(x => x.id === id);
          if (localMatch && localMatch.sheets) {
            foundWb = localMatch;
          } else {
            const res = await API.getWorkbook(id).catch(() => null);
            foundWb = res ? (res.workbook || (res.sheets ? res : null)) : null;
          }

          if (foundWb && foundWb.sheets) {
            activeWorkbook = foundWb;
            activeSheetIndex = 0;
            renderEditorView();
          } else {
            alert("Workbook content not found.");
            btn.innerText = "Open Grid";
          }
        } catch (err) {
          alert("Error loading workbook: " + err.message);
          btn.innerText = "Open Grid";
        }
      });
    });

    // Wire Delete buttons
    tableWrap.querySelectorAll(".btn-del-wb").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-wbid");
        if (!confirm("Are you sure you want to delete this workbook?")) return;
        try {
          deleteLocalWorkbook(id);
          if (API.getToken()) {
            await API.deleteWorkbook(id).catch(() => {});
          }
          await loadRecentWorkbooks();
        } catch (err) {
          alert("Delete failed: " + err.message);
        }
      });
    });
  }

  async function createAndOpenWorkbook(templateType, templateTitle) {
    try {
      let wb = null;
      if (API.getToken()) {
        try {
          const res = await API.createWorkbook({
            name: `${templateTitle} - ${new Date().toLocaleDateString("en-IN")}`,
            template_type: templateType
          });
          if (res) {
            wb = res.workbook || (res.sheets ? res : null);
          }
        } catch (apiErr) {
          console.warn("API createWorkbook error, using instant local template:", apiErr);
        }
      }
      if (!wb || !wb.sheets) {
        wb = getLocalTemplate(templateType, templateTitle);
      }
      activeWorkbook = wb.workbook || wb;
      activeSheetIndex = 0;
      saveLocalWorkbook(activeWorkbook);
      renderEditorView();
    } catch (err) {
      console.error("Error creating workbook:", err);
      const fallback = getLocalTemplate(templateType, templateTitle);
      activeWorkbook = fallback;
      activeSheetIndex = 0;
      saveLocalWorkbook(activeWorkbook);
      renderEditorView();
    }
  }

  // =========================================================================
  // INTERACTIVE SPREADSHEET EDITOR VIEW
  // =========================================================================
  function renderEditorView() {
    if (!activeWorkbook || !activeWorkbook.sheets || activeWorkbook.sheets.length === 0) {
      showHomeHub();
      return;
    }

    const currentSheet = activeWorkbook.sheets[activeSheetIndex] || activeWorkbook.sheets[0];
    let sheetData = currentSheet.data || [[""]];

    container.innerHTML = `
      <div class="excel-editor-container">
        
        <!-- TOP CONTROL BAR -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: #0C1729; color: #FFFFFF; border-bottom: 1px solid rgba(255, 255, 255, 0.1); flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <button id="btn-editor-back" class="btn" style="background: rgba(255, 255, 255, 0.1); color: #FFFFFF; border: 1px solid rgba(255, 255, 255, 0.2); font-size: 11px; padding: 5px 10px;">
              &larr; Hub
            </button>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px; color: #10B981;">📊</span>
              <input type="text" id="editor-wb-name" value="${activeWorkbook.name || 'Untitled Workbook'}" style="background: transparent; border: 1px solid transparent; color: #FFFFFF; font-size: 15px; font-weight: 800; padding: 4px 8px; border-radius: 4px; outline: none;" onfocus="this.style.background='rgba(255,255,255,0.1)'; this.style.borderColor='rgba(52,211,153,0.5)';" onblur="this.style.background='transparent'; this.style.borderColor='transparent';" />
            </div>
            <span id="editor-save-badge" style="font-size: 11px; padding: 3px 8px; border-radius: 12px; background: rgba(16, 185, 129, 0.2); color: #34D399; font-weight: 700;">● Saved</span>
          </div>

          <div style="display: flex; align-items: center; gap: 8px;">
            <button id="btn-editor-save" class="btn btn-primary" style="font-size: 11px; padding: 6px 12px; font-weight: 700;">
              💾 Save
            </button>
            <button id="btn-editor-export-xlsx" class="btn btn-saffron" style="font-size: 11px; padding: 6px 12px; font-weight: 700;">
              📥 Export .XLSX
            </button>
            <button id="btn-editor-export-csv" class="btn" style="background: rgba(255, 255, 255, 0.1); color: #FFFFFF; border: 1px solid rgba(255, 255, 255, 0.2); font-size: 11px; padding: 6px 12px;">
              Export CSV
            </button>
            <button id="btn-editor-send-vis" class="btn" style="background: rgba(59, 130, 246, 0.2); color: #60A5FA; border: 1px solid rgba(59, 130, 246, 0.35); font-size: 11px; padding: 6px 12px; font-weight: 700;">
              📈 Send to Visualization Studio
            </button>
            <button id="btn-toggle-ai-assistant" class="btn" style="background: linear-gradient(135deg, rgba(233,154,58,0.2) 0%, rgba(245,158,11,0.2) 100%); color: #FCD34D; border: 1px solid rgba(233,154,58,0.4); font-size: 11px; padding: 6px 12px; font-weight: 800;">
              ✨ AI Assistant
            </button>
          </div>
        </div>

        <!-- FORMATTING TOOLBAR -->
        <div class="excel-toolbar">
          <button class="excel-toolbar-btn" id="tb-undo" title="Undo">↺</button>
          <button class="excel-toolbar-btn" id="tb-redo" title="Redo">↻</button>
          <div style="width: 1px; height: 18px; background: #CBD5E1; margin: 0 4px;"></div>
          
          <button class="excel-toolbar-btn" id="tb-bold" style="font-weight: 900;">B</button>
          <button class="excel-toolbar-btn" id="tb-italic" style="font-style: italic;">I</button>
          <button class="excel-toolbar-btn" id="tb-underline" style="text-decoration: underline;">U</button>
          <div style="width: 1px; height: 18px; background: #CBD5E1; margin: 0 4px;"></div>

          <button class="excel-toolbar-btn" id="tb-align-left" title="Align Left">⇤</button>
          <button class="excel-toolbar-btn" id="tb-align-center" title="Align Center">⇋</button>
          <button class="excel-toolbar-btn" id="tb-align-right" title="Align Right">⇥</button>
          <div style="width: 1px; height: 18px; background: #CBD5E1; margin: 0 4px;"></div>

          <button class="excel-toolbar-btn" id="tb-format-currency" title="Format Currency">₹ Currency</button>
          <button class="excel-toolbar-btn" id="tb-format-percent" title="Format Percentage">%</button>
          <button class="excel-toolbar-btn" id="tb-format-decimal" title="Format Two Decimals">.00</button>
          <div style="width: 1px; height: 18px; background: #CBD5E1; margin: 0 4px;"></div>

          <button class="excel-toolbar-btn" id="tb-insert-row" title="Insert Row Below">+ Row</button>
          <button class="excel-toolbar-btn" id="tb-delete-row" title="Delete Active Row" style="color: #EF4444;">- Row</button>
          <button class="excel-toolbar-btn" id="tb-insert-col" title="Insert Column Right">+ Col</button>
          <button class="excel-toolbar-btn" id="tb-delete-col" title="Delete Active Column" style="color: #EF4444;">- Col</button>
          <button class="excel-toolbar-btn" id="tb-clear-cell" title="Clear Cell Contents">Clear</button>
        </div>

        <!-- FORMULA BAR -->
        <div class="excel-formula-bar-wrap">
          <div id="active-cell-coord" class="excel-cell-address">A1</div>
          <span style="font-size: 13px; font-weight: 800; color: #64748B; font-style: italic;">fx</span>
          <input type="text" id="active-cell-formula" class="excel-formula-input" placeholder="Type text, number or formula (e.g. =SUM(B2:B10) or =B2*C2)" />
        </div>

        <!-- MAIN SPLIT (GRID + AI ASSISTANT DRAWER) -->
        <div style="display: flex; flex: 1; overflow: hidden; position: relative;">
          
          <!-- SPREADSHEET GRID VIEWPORT -->
          <div class="excel-grid-viewport" id="excel-grid-viewport" tabindex="0" style="outline: none;">
            <!-- Grid generated by renderGrid() -->
          </div>

          <!-- COLLAPSIBLE AI EXCEL ASSISTANT DRAWER -->
          <div class="excel-ai-drawer" id="excel-ai-drawer" style="display: none;">
            <div style="padding: 14px 18px; background: #F8FAFC; border-bottom: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 16px;">✨</span>
                <span style="font-size: 13px; font-weight: 800; color: var(--navy);">AI Spreadsheet Assistant</span>
              </div>
              <button id="btn-close-ai-drawer" style="background: none; border: none; font-size: 18px; cursor: pointer; color: var(--slate);">&times;</button>
            </div>

            <div style="padding: 16px; flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 14px;">
              <div>
                <label style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--slate); margin-bottom: 8px;">1-Click Shopkeeper Actions</label>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <button class="btn-ai-pill btn btn-outline" data-action="add_totals" style="text-align: left; font-size: 11.5px; padding: 7px 10px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                    <span>⚡</span> Add Total Row with =SUM()
                  </button>
                  <button class="btn-ai-pill btn btn-outline" data-action="add_profit_margin" style="text-align: left; font-size: 11.5px; padding: 7px 10px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                    <span>💰</span> Add Profit Margin % Column
                  </button>
                  <button class="btn-ai-pill btn btn-outline" data-action="sort_revenue_desc" style="text-align: left; font-size: 11.5px; padding: 7px 10px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                    <span>🏆</span> Sort Rows by Revenue (High to Low)
                  </button>
                  <button class="btn-ai-pill btn btn-outline" data-action="explain_active_cell" style="text-align: left; font-size: 11.5px; padding: 7px 10px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
                    <span>🔍</span> Explain Active Cell Formula
                  </button>
                </div>
              </div>

              <!-- AI Output / Explanation Box -->
              <div id="ai-assistant-output" style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 12px; font-size: 12px; color: var(--navy); line-height: 1.5; min-height: 80px;">
                Ask AI to calculate totals, build margins, fix formulas, or sort your data automatically.
              </div>

              <!-- Chat Input Box -->
              <div style="margin-top: auto;">
                <label style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--slate); margin-bottom: 4px;">Custom Request</label>
                <div style="display: flex; gap: 6px;">
                  <input type="text" id="ai-drawer-input" placeholder="e.g. Calculate average unit price" style="flex: 1; padding: 8px 10px; font-size: 12px; border: 1px solid #CBD5E1; border-radius: 6px; outline: none;" />
                  <button id="btn-submit-ai-drawer" class="btn btn-saffron" style="padding: 8px 12px; font-size: 12px; font-weight: 700;">Send</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- BOTTOM WORKSHEET TABS BAR -->
        <div class="excel-tabs-bar">
          <div style="display: flex; gap: 4px; overflow-x: auto; flex: 1;" id="excel-tabs-list">
            ${activeWorkbook.sheets.map((s, idx) => `
              <button class="excel-sheet-tab ${idx === activeSheetIndex ? 'active' : ''}" data-sheet-index="${idx}">
                📄 ${s.sheet_name || s.name || `Sheet${idx+1}`}
              </button>
            `).join("")}
          </div>
          <button id="btn-add-sheet" class="btn" style="background: #E2E8F0; color: var(--navy); border: none; font-size: 13px; font-weight: 800; padding: 4px 10px; border-radius: 4px; cursor: pointer;" title="Add Worksheet">
            +
          </button>
        </div>

      </div>
    `;

    // Render Grid Table
    renderGrid();

    // Event Wireups
    container.querySelector("#btn-editor-back").addEventListener("click", () => showHomeHub());

    // Workbook Name change
    const nameInput = container.querySelector("#editor-wb-name");
    nameInput.addEventListener("change", () => {
      activeWorkbook.name = nameInput.value.trim() || "Untitled Workbook";
      triggerAutoSave();
    });

    // Save Button
    container.querySelector("#btn-editor-save").addEventListener("click", () => saveWorkbookImmediate());

    // Export XLSX Button
    container.querySelector("#btn-editor-export-xlsx").addEventListener("click", async () => {
      try {
        await saveWorkbookImmediate();
        await API.exportWorkbookXLSX(activeWorkbook);
      } catch (err) {
        alert("Export failed: " + err.message);
      }
    });

    // Export CSV Button
    container.querySelector("#btn-editor-export-csv").addEventListener("click", () => {
      const csvStr = sheetData.map(r => r.map(c => `"${String(c || '').replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csvStr], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${activeWorkbook.name || 'workbook'}_sheet.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Send to Visualization Studio
    container.querySelector("#btn-editor-send-vis").addEventListener("click", () => {
      window.navigateTo("#analytics-studio");
    });

    // Toggle AI Assistant Drawer
    const aiDrawer = container.querySelector("#excel-ai-drawer");
    const toggleAiBtn = container.querySelector("#btn-toggle-ai-assistant");
    const closeAiBtn = container.querySelector("#btn-close-ai-drawer");
    toggleAiBtn.addEventListener("click", () => {
      aiDrawer.style.display = aiDrawer.style.display === "none" ? "flex" : "none";
    });
    closeAiBtn.addEventListener("click", () => {
      aiDrawer.style.display = "none";
    });

    // Sheet Tabs Switching
    container.querySelectorAll(".excel-sheet-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        const idx = parseInt(tab.getAttribute("data-sheet-index"), 10);
        if (idx !== activeSheetIndex) {
          activeSheetIndex = idx;
          activeCell = { row: 0, col: 0 };
          renderEditorView();
        }
      });
    });

    // Add Sheet Button
    container.querySelector("#btn-add-sheet").addEventListener("click", () => {
      const newIndex = activeWorkbook.sheets.length + 1;
      activeWorkbook.sheets.push({
        sheet_name: `Sheet${newIndex}`,
        data: [
          ["Item", "Quantity", "Price", "Total"],
          ["", "", "", ""]
        ]
      });
      activeSheetIndex = activeWorkbook.sheets.length - 1;
      triggerAutoSave();
      renderEditorView();
    });

    // Formula Input Bar Two-Way Live Binding
    const formulaInput = container.querySelector("#active-cell-formula");
    if (formulaInput) {
      formulaInput.addEventListener("input", () => {
        const currentSheet = activeWorkbook.sheets[activeSheetIndex];
        if (currentSheet && currentSheet.data && currentSheet.data[activeCell.row]) {
          currentSheet.data[activeCell.row][activeCell.col] = formulaInput.value;
          const activeTd = container.querySelector(`td[data-row="${activeCell.row}"][data-col="${activeCell.col}"]`);
          if (activeTd) {
            activeTd.innerText = formulaInput.value;
          }
        }
      });

      formulaInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          setCellValue(activeCell.row, activeCell.col, formulaInput.value);
          const currentSheet = activeWorkbook.sheets[activeSheetIndex];
          if (activeCell.row + 1 < (currentSheet.data || []).length) {
            activeCell.row++;
          }
          renderGrid();
          e.preventDefault();
        } else if (e.key === "Escape") {
          updateFormulaBar();
          const vp = container.querySelector("#excel-grid-viewport");
          vp?.focus();
        }
      });

      formulaInput.addEventListener("blur", () => {
        setCellValue(activeCell.row, activeCell.col, formulaInput.value);
        renderGrid();
      });
    }

    // Formatting Toolbar Buttons
    container.querySelector("#tb-insert-row").addEventListener("click", () => {
      const emptyRow = new Array((sheetData[0] || []).length).fill("");
      sheetData.splice(activeCell.row + 1, 0, emptyRow);
      triggerAutoSave();
      renderGrid();
    });

    container.querySelector("#tb-delete-row").addEventListener("click", () => {
      if (sheetData.length > 1) {
        sheetData.splice(activeCell.row, 1);
        if (activeCell.row >= sheetData.length) activeCell.row = sheetData.length - 1;
        triggerAutoSave();
        renderGrid();
      }
    });

    container.querySelector("#tb-insert-col").addEventListener("click", () => {
      sheetData.forEach(row => row.splice(activeCell.col + 1, 0, ""));
      triggerAutoSave();
      renderGrid();
    });

    container.querySelector("#tb-delete-col").addEventListener("click", () => {
      if ((sheetData[0] || []).length > 1) {
        sheetData.forEach(row => row.splice(activeCell.col, 1));
        if (activeCell.col >= sheetData[0].length) activeCell.col = sheetData[0].length - 1;
        triggerAutoSave();
        renderGrid();
      }
    });

    container.querySelector("#tb-clear-cell").addEventListener("click", () => {
      setCellValue(activeCell.row, activeCell.col, "");
      formulaInput.value = "";
      renderGrid();
    });

    // AI Assistant One-Click Pills & Chat
    container.querySelectorAll(".btn-ai-pill").forEach(pill => {
      pill.addEventListener("click", async () => {
        const action = pill.getAttribute("data-action");
        await runAIAssistant(action);
      });
    });

    const aiSubmitBtn = container.querySelector("#btn-submit-ai-drawer");
    const aiInput = container.querySelector("#ai-drawer-input");
    if (aiSubmitBtn && aiInput) {
      aiSubmitBtn.addEventListener("click", async () => {
        const text = aiInput.value.trim();
        if (!text) return;
        aiInput.value = "";
        await runAIAssistant(text);
      });
      aiInput.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
          const text = aiInput.value.trim();
          if (!text) return;
          aiInput.value = "";
          await runAIAssistant(text);
        }
      });
    }
  }

  // =========================================================================
  // RENDER GRID TABLE
  // =========================================================================
  function renderGrid() {
    const gridViewport = container.querySelector("#excel-grid-viewport");
    if (!gridViewport || !activeWorkbook) return;

    const currentSheet = activeWorkbook.sheets[activeSheetIndex] || activeWorkbook.sheets[0];
    let sheetData = currentSheet.data || [[""]];

    // Ensure at least 15 rows and 8 cols for smooth experience
    const numRows = Math.max(sheetData.length, 18);
    const numCols = Math.max((sheetData[0] || []).length, 8);

    // Normalize rectangular 2D array
    while (sheetData.length < numRows) {
      sheetData.push(new Array(numCols).fill(""));
    }
    sheetData.forEach(r => {
      while (r.length < numCols) r.push("");
    });
    currentSheet.data = sheetData;

    // Build Table HTML
    let tableHtml = `<table class="excel-grid-table"><thead><tr>`;
    tableHtml += `<th class="excel-row-header" style="z-index: 12; width: 44px;">#</th>`;

    for (let c = 0; c < numCols; c++) {
      tableHtml += `<th>${indexToColLetter(c)}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;

    for (let r = 0; r < numRows; r++) {
      tableHtml += `<tr>`;
      tableHtml += `<th class="excel-row-header">${r + 1}</th>`;

      for (let c = 0; c < numCols; c++) {
        const rawVal = sheetData[r][c] !== undefined ? sheetData[r][c] : "";
        let displayVal = rawVal;

        if (typeof rawVal === "string" && rawVal.startsWith("=")) {
          displayVal = evaluateFormula(rawVal, sheetData);
        }

        const isCurrentActive = (activeCell.row === r && activeCell.col === c);
        const cellClass = isCurrentActive ? "cell-active" : "";

        // Check if header row styling
        const isHeaderRow = (r === 0);
        const headerStyle = isHeaderRow ? "font-weight: 700; background: #F8FAFC;" : "";

        tableHtml += `
          <td class="${cellClass}" data-row="${r}" data-col="${c}" style="${headerStyle}" title="${String(rawVal).replace(/"/g, '&quot;')}">
            ${displayVal !== null && displayVal !== undefined ? displayVal : ""}
          </td>
        `;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table>`;
    gridViewport.innerHTML = tableHtml;

    // Update Formula Bar with active cell content
    updateFormulaBar();

    // Attach Cell Click and Double Click Listeners
    gridViewport.querySelectorAll("td").forEach(td => {
      td.addEventListener("click", (e) => {
        const r = parseInt(td.getAttribute("data-row"), 10);
        const c = parseInt(td.getAttribute("data-col"), 10);
        if (activeCell.row === r && activeCell.col === c && !isEditingCell) {
          // Clicking an already active cell directly enters in-cell edit mode!
          startInCellEdit(td, r, c);
          return;
        }
        activeCell = { row: r, col: c };
        renderGrid();
        gridViewport.focus();
      });

      td.addEventListener("dblclick", () => {
        const r = parseInt(td.getAttribute("data-row"), 10);
        const c = parseInt(td.getAttribute("data-col"), 10);
        activeCell = { row: r, col: c };
        startInCellEdit(td, r, c);
      });
    });

    // Wire Keyboard Navigation & Direct Typing into Grid
    gridViewport.onkeydown = (e) => {
      if (isEditingCell) return;
      const currentSheet = activeWorkbook.sheets[activeSheetIndex] || activeWorkbook.sheets[0];
      const sheetData = currentSheet.data || [];
      const numRows = sheetData.length;
      const numCols = (sheetData[0] || []).length;

      // 1. Arrow navigation
      if (e.key === "ArrowUp") {
        if (activeCell.row > 0) {
          activeCell.row--;
          renderGrid();
        }
        e.preventDefault();
        return;
      }
      if (e.key === "ArrowDown" || e.key === "Enter") {
        if (activeCell.row < numRows - 1) {
          activeCell.row++;
          renderGrid();
        }
        e.preventDefault();
        return;
      }
      if (e.key === "ArrowLeft") {
        if (activeCell.col > 0) {
          activeCell.col--;
          renderGrid();
        }
        e.preventDefault();
        return;
      }
      if (e.key === "ArrowRight" || e.key === "Tab") {
        if (activeCell.col < numCols - 1) {
          activeCell.col++;
          renderGrid();
        }
        e.preventDefault();
        return;
      }

      // 2. Clear cell contents
      if (e.key === "Delete" || e.key === "Backspace") {
        setCellValue(activeCell.row, activeCell.col, "");
        renderGrid();
        e.preventDefault();
        return;
      }

      // 3. F2 key for editing active cell
      if (e.key === "F2") {
        const activeTd = gridViewport.querySelector(`td[data-row="${activeCell.row}"][data-col="${activeCell.col}"]`);
        if (activeTd) startInCellEdit(activeTd, activeCell.row, activeCell.col);
        e.preventDefault();
        return;
      }

      // 4. Direct Typing: any printable character immediately starts typing in the cell!
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeTd = gridViewport.querySelector(`td[data-row="${activeCell.row}"][data-col="${activeCell.col}"]`);
        if (activeTd) {
          startInCellEdit(activeTd, activeCell.row, activeCell.col, e.key);
          e.preventDefault();
        }
      }
    };
  }

  function updateFormulaBar() {
    const addressBox = container.querySelector("#active-cell-coord");
    const formulaInput = container.querySelector("#active-cell-formula");
    if (!addressBox || !formulaInput || !activeWorkbook) return;

    const colLetter = indexToColLetter(activeCell.col);
    addressBox.innerText = `${colLetter}${activeCell.row + 1}`;

    const currentSheet = activeWorkbook.sheets[activeSheetIndex] || activeWorkbook.sheets[0];
    const rawVal = (currentSheet.data && currentSheet.data[activeCell.row]) ? currentSheet.data[activeCell.row][activeCell.col] : "";
    formulaInput.value = (rawVal !== undefined && rawVal !== null) ? String(rawVal) : "";
  }

  function startInCellEdit(td, row, col, initialChar = null) {
    if (isEditingCell) return;
    isEditingCell = true;

    const currentSheet = activeWorkbook.sheets[activeSheetIndex];
    const rawVal = currentSheet.data[row][col] || "";
    const startingVal = initialChar !== null ? initialChar : rawVal;
    
    td.classList.add("cell-editing");
    td.innerHTML = `<input type="text" class="cell-inline-input" value="${String(startingVal).replace(/"/g, '&quot;')}" style="width: 100%; height: 100%; border: none; outline: none; background: #FFFFFF; color: #0F172A; font-family: inherit; font-size: 12.5px; font-weight: inherit; padding: 2px 6px; box-sizing: border-box; box-shadow: 0 0 0 2px #2563EB;" />`;

    const input = td.querySelector("input");
    input.focus();
    if (initialChar === null) {
      input.select();
    } else {
      input.selectionStart = input.selectionEnd = input.value.length;
    }

    const formulaInput = container.querySelector("#active-cell-formula");
    if (formulaInput) formulaInput.value = startingVal;

    input.addEventListener("input", () => {
      if (formulaInput) formulaInput.value = input.value;
    });

    let committed = false;
    function commit() {
      if (committed) return;
      committed = true;
      isEditingCell = false;
      const newVal = input.value;
      setCellValue(row, col, newVal);
      renderGrid();
      const vp = container.querySelector("#excel-grid-viewport");
      vp?.focus();
    }

    input.addEventListener("blur", () => {
      commit();
    });

    input.addEventListener("keydown", (e) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        commit();
        if (row + 1 < currentSheet.data.length) {
          activeCell = { row: row + 1, col };
        }
        renderGrid();
        e.preventDefault();
      } else if (e.key === "Tab") {
        commit();
        if (col + 1 < (currentSheet.data[0] || []).length) {
          activeCell = { row, col: col + 1 };
        }
        renderGrid();
        e.preventDefault();
      } else if (e.key === "Escape") {
        committed = true;
        isEditingCell = false;
        renderGrid();
        e.preventDefault();
      }
    });
  }

  function setCellValue(row, col, val) {
    const currentSheet = activeWorkbook.sheets[activeSheetIndex];
    if (!currentSheet.data[row]) currentSheet.data[row] = [];
    currentSheet.data[row][col] = val;
    triggerAutoSave();
  }

  function triggerAutoSave() {
    const badge = container.querySelector("#editor-save-badge");
    if (badge) {
      badge.innerText = "● Unsaved Changes";
      badge.style.background = "rgba(245, 158, 11, 0.2)";
      badge.style.color = "#F59E0B";
    }
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      saveWorkbookImmediate();
    }, 1200);
  }

  async function saveWorkbookImmediate() {
    if (!activeWorkbook || !activeWorkbook.id) return;
    const badge = container.querySelector("#editor-save-badge");
    if (badge) {
      badge.innerText = "● Saving...";
      badge.style.background = "rgba(59, 130, 246, 0.2)";
      badge.style.color = "#60A5FA";
    }

    try {
      saveLocalWorkbook(activeWorkbook);
      if (API.getToken()) {
        await API.updateWorkbook(activeWorkbook.id, {
          name: activeWorkbook.name,
          sheets: activeWorkbook.sheets
        }).catch(err => console.warn("Cloud save warning:", err));
      }
      if (badge) {
        badge.innerText = "● Saved";
        badge.style.background = "rgba(16, 185, 129, 0.2)";
        badge.style.color = "#34D399";
      }
    } catch (err) {
      if (badge) {
        badge.innerText = "● Saved (Local)";
        badge.style.background = "rgba(16, 185, 129, 0.2)";
        badge.style.color = "#34D399";
      }
    }
  }

  // =========================================================================
  // AI SPREADSHEET ASSISTANT
  // =========================================================================
  async function runAIAssistant(instructionOrAction) {
    const outputBox = container.querySelector("#ai-assistant-output");
    if (!outputBox || !activeWorkbook) return;

    outputBox.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; color: var(--saffron);">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
        <span>AI Assistant analyzing workbook data...</span>
      </div>
    `;

    const currentSheet = activeWorkbook.sheets[activeSheetIndex];
    const cellCoord = `${indexToColLetter(activeCell.col)}${activeCell.row + 1}`;

    try {
      const payload = {
        workbook_id: activeWorkbook.id,
        sheet_name: currentSheet.sheet_name || currentSheet.name || "Sheet1",
        instruction: instructionOrAction,
        active_cell: cellCoord,
        sheet_data: currentSheet.data
      };

      const res = await API.askAIExcelAssistant(payload);
      if (res && res.updated_data) {
        currentSheet.data = res.updated_data;
        triggerAutoSave();
        renderGrid();
      }

      outputBox.innerHTML = `
        <div style="color: #10B981; font-weight: 700; margin-bottom: 4px;">✔ AI Assistant Completed</div>
        <div style="font-size: 12px; color: var(--navy); line-height: 1.5;">
          ${res.message || "Operation applied successfully to active worksheet."}
        </div>
      `;
    } catch (err) {
      outputBox.innerHTML = `
        <div style="color: #EF4444; font-weight: 700;">Operation Failed</div>
        <div style="font-size: 11px; color: var(--slate);">${err.message}</div>
      `;
    }
  }
}
