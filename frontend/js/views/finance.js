// Vyapar Verse — Finance Management View
import { API } from "../api.js";

export async function renderFinance(container) {
  container.innerHTML = `
    <div style="max-width: 1400px; margin: 0 auto;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
        <div>
          <div style="display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 20px; background: rgba(49, 133, 108, 0.14); color: #31856C; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">
            <span>💼</span> Corporate Treasury & P&L Engine
          </div>
          <h1 style="font-size: 22px; font-weight: 800; color: var(--navy);">Finance & P&L Management</h1>
          <p style="font-size: 13px; color: var(--slate);">Track audited Profit & Loss, cash flow velocity, operating expenses, and commercial revenue streams.</p>
        </div>

        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button id="btn-sync-finance-dataset" class="btn btn-outline" style="font-size: 12px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            Sync Revenue from Dataset
          </button>
          <button id="btn-record-transaction" class="btn btn-saffron" style="font-size: 12px; font-weight: 700;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Record Transaction
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div class="vss-card" style="padding: 18px; border-left: 4px solid #10B981;">
          <div style="font-size: 11px; font-weight: 700; color: var(--slate); text-transform: uppercase;">Total Income (Revenue)</div>
          <div id="fin-kpi-income" style="font-size: 24px; font-weight: 800; color: #10B981; margin-top: 6px;">₹0.00</div>
          <div style="font-size: 11px; color: var(--slate); margin-top: 4px;">Recognized business income</div>
        </div>

        <div class="vss-card" style="padding: 18px; border-left: 4px solid #EF4444;">
          <div style="font-size: 11px; font-weight: 700; color: var(--slate); text-transform: uppercase;">Total Operating Expenses</div>
          <div id="fin-kpi-expense" style="font-size: 24px; font-weight: 800; color: #EF4444; margin-top: 6px;">₹0.00</div>
          <div style="font-size: 11px; color: var(--slate); margin-top: 4px;">Procurement, payroll, ops</div>
        </div>

        <div class="vss-card" style="padding: 18px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--slate); text-transform: uppercase;">Net Operating Profit</div>
          <div id="fin-kpi-profit" style="font-size: 24px; font-weight: 800; color: var(--navy); margin-top: 6px;">₹0.00</div>
          <div id="fin-kpi-status" style="font-size: 11px; font-weight: 700; margin-top: 4px; color: #10B981;">Profitable</div>
        </div>

        <div class="vss-card" style="padding: 18px;">
          <div style="font-size: 11px; font-weight: 700; color: var(--slate); text-transform: uppercase;">Net Profit Margin</div>
          <div id="fin-kpi-margin" style="font-size: 24px; font-weight: 800; color: var(--navy); margin-top: 6px;">0.0%</div>
          <div style="font-size: 11px; color: var(--slate); margin-top: 4px;">Return on Revenue</div>
        </div>
      </div>

      <!-- Financial Distribution & Cash Flow Grid -->
      <div style="display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 20px; margin-bottom: 24px;">
        <!-- Cash Flow Timeline -->
        <div class="vss-card" style="padding: 20px;">
          <h3 style="font-size: 15px; font-weight: 700; color: var(--navy); margin-bottom: 14px;">Cash Balance & Chronological Flow</h3>
          <div id="cash-flow-timeline" style="font-size: 12px; color: var(--slate); line-height: 1.6;">Loading cash flow ledger...</div>
        </div>

        <!-- Categorical Breakdown -->
        <div class="vss-card" style="padding: 20px;">
          <h3 style="font-size: 15px; font-weight: 700; color: var(--navy); margin-bottom: 14px;">Expense Allocation Breakdown</h3>
          <div id="expense-breakdown-list" style="font-size: 13px; color: var(--slate);">Loading allocations...</div>
        </div>
      </div>

      <!-- General Ledger Entries -->
      <div class="vss-card" style="padding: 24px;">
        <h3 style="font-size: 16px; font-weight: 700; color: var(--navy); margin-bottom: 16px;">Audited Transaction Register</h3>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
            <thead>
              <tr style="border-bottom: 2px solid var(--border-color); color: var(--slate); font-size: 11px; text-transform: uppercase;">
                <th style="padding: 10px 14px;">Date</th>
                <th style="padding: 10px 14px;">Type</th>
                <th style="padding: 10px 14px;">Category</th>
                <th style="padding: 10px 14px;">Description</th>
                <th style="padding: 10px 14px;">Account</th>
                <th style="padding: 10px 14px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody id="finance-table-body">
              <tr>
                <td colspan="6" style="padding: 20px; text-align: center; color: var(--slate);">Loading ledger transactions...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Record Transaction Modal -->
    <div id="tx-modal" class="modal-overlay" style="display: none;">
      <div class="modal-content" style="padding: 24px; max-width: 480px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="font-size: 16px; font-weight: 800; color: var(--navy);">Record Financial Entry</h3>
          <button id="btn-close-tx-modal" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--slate);">&times;</button>
        </div>

        <form id="tx-form" style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--slate); margin-bottom: 4px;">Entry Type</label>
            <div style="display: flex; gap: 16px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #10B981;">
                <input type="radio" name="txtype" value="INCOME" checked> Income / Revenue
              </label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #EF4444;">
                <input type="radio" name="txtype" value="EXPENSE"> Expense / Cost
              </label>
            </div>
          </div>

          <div>
            <label style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--slate); margin-bottom: 4px;">Category</label>
            <input type="text" id="tx-category" required placeholder="e.g. Product Sales, Logistics, Cloud Servers" style="width: 100%; padding: 8px; font-size: 13px; border-radius: 6px; border: 1px solid var(--border-color);">
          </div>

          <div>
            <label style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--slate); margin-bottom: 4px;">Amount (₹)</label>
            <input type="number" step="0.01" min="0.01" id="tx-amount" required placeholder="e.g. 25000.00" style="width: 100%; padding: 8px; font-size: 13px; border-radius: 6px; border: 1px solid var(--border-color);">
          </div>

          <div>
            <label style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--slate); margin-bottom: 4px;">Description</label>
            <input type="text" id="tx-desc" placeholder="e.g. Quarterly vendor settlement" style="width: 100%; padding: 8px; font-size: 13px; border-radius: 6px; border: 1px solid var(--border-color);">
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
            <button type="button" id="btn-cancel-tx" class="btn btn-outline">Cancel</button>
            <button type="submit" class="btn btn-saffron">Record Entry</button>
          </div>
        </form>
      </div>
    </div>
  `;

  async function loadFinanceData() {
    try {
      const summary = await API.getFinanceSummary();
      const kpis = summary.kpis || {};
      container.querySelector("#fin-kpi-income").innerText = `₹${(kpis.total_income || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
      container.querySelector("#fin-kpi-expense").innerText = `₹${(kpis.total_expense || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
      const net = kpis.net_profit || 0;
      const profitEl = container.querySelector("#fin-kpi-profit");
      profitEl.innerText = `₹${net.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
      profitEl.style.color = net >= 0 ? "#10B981" : "#EF4444";

      const statusEl = container.querySelector("#fin-kpi-status");
      statusEl.innerText = net >= 0 ? "Profitable Operation" : "Net Operating Loss";
      statusEl.style.color = net >= 0 ? "#10B981" : "#EF4444";

      container.querySelector("#fin-kpi-margin").innerText = `${(kpis.profit_margin_pct || 0).toFixed(1)}%`;

      // Expenses breakdown
      const expList = container.querySelector("#expense-breakdown-list");
      const expenses = (summary.breakdown && summary.breakdown.expenses) || [];
      if (expenses.length > 0) {
        expList.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${expenses.map(e => `
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                  <span style="font-weight: 600; color: var(--navy);">${e.category}</span>
                  <span style="font-weight: 700; color: var(--navy);">₹${e.amount.toLocaleString("en-IN")}</span>
                </div>
                <div style="height: 6px; border-radius: 3px; background: #E2E8F0; overflow: hidden;">
                  <div style="height: 100%; width: ${Math.min(100, (e.amount / (kpis.total_expense || 1)) * 100)}%; background: #EF4444; border-radius: 3px;"></div>
                </div>
              </div>
            `).join("")}
          </div>
        `;
      } else {
        expList.innerHTML = `<span style="color: var(--slate);">No categorized expenses logged yet.</span>`;
      }

      // Transactions register
      const tbody = container.querySelector("#finance-table-body");
      const recent = summary.recent_entries || [];
      if (recent.length > 0) {
        tbody.innerHTML = recent.map(tx => `
          <tr style="border-bottom: 1px solid var(--border-color);">
            <td style="padding: 10px 14px; color: var(--slate); font-family: monospace;">${tx.date || 'Today'}</td>
            <td style="padding: 10px 14px;">
              <span style="background: ${tx.type === 'INCOME' ? '#DCFCE7' : '#FEE2E2'}; color: ${tx.type === 'INCOME' ? '#15803D' : '#DC2626'}; font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px;">${tx.type}</span>
            </td>
            <td style="padding: 10px 14px; font-weight: 600; color: var(--navy);">${tx.category}</td>
            <td style="padding: 10px 14px; color: var(--slate);">${tx.description || '-'}</td>
            <td style="padding: 10px 14px; color: var(--slate); font-size: 12px;">${tx.account || 'Operating'}</td>
            <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: ${tx.type === 'INCOME' ? '#10B981' : '#EF4444'};">
              ${tx.type === 'INCOME' ? '+' : '-'}₹${tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </td>
          </tr>
        `).join("");
      } else {
        tbody.innerHTML = `<tr><td colspan="6" style="padding: 20px; text-align: center; color: var(--slate);">No financial transactions recorded.</td></tr>`;
      }

      // Cash flow series
      const cfRes = await API.getCashFlow();
      const cfList = container.querySelector("#cash-flow-timeline");
      const flows = cfRes.flow_series || [];
      if (flows.length > 0) {
        cfList.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="font-size: 11px; color: var(--slate); margin-bottom: 4px;">Running Treasury Balance: <b style="color: var(--navy);">₹${(cfRes.current_balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</b></div>
            ${flows.slice(-6).map(f => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #F8FAFC; border-radius: 6px;">
                <span style="color: var(--navy); font-weight: 600;">${f.category} (${f.date})</span>
                <span style="font-weight: 700; color: ${f.net_impact >= 0 ? '#10B981' : '#EF4444'};">
                  ${f.net_impact >= 0 ? '+' : ''}₹${f.net_impact.toLocaleString("en-IN")}
                </span>
              </div>
            `).join("")}
          </div>
        `;
      }
    } catch (e) {
      console.warn("Failed to load finance data:", e);
    }
  }

  await loadFinanceData();

  // Modal logic
  const modal = container.querySelector("#tx-modal");
  const btnOpen = container.querySelector("#btn-record-transaction");
  const btnClose = container.querySelector("#btn-close-tx-modal");
  const btnCancel = container.querySelector("#btn-cancel-tx");
  const form = container.querySelector("#tx-form");

  btnOpen.addEventListener("click", () => { modal.style.display = "flex"; });
  btnClose.addEventListener("click", () => { modal.style.display = "none"; });
  btnCancel.addEventListener("click", () => { modal.style.display = "none"; });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const type = container.querySelector("input[name='txtype']:checked").value;
    const category = container.querySelector("#tx-category").value;
    const amount = parseFloat(container.querySelector("#tx-amount").value);
    const description = container.querySelector("#tx-desc").value;

    try {
      await API.recordTransaction({ type, category, amount, description });
      modal.style.display = "none";
      form.reset();
      await loadFinanceData();
    } catch (err) {
      alert("Error recording entry: " + err.message);
    }
  });

  // Sync from dataset
  container.querySelector("#btn-sync-finance-dataset").addEventListener("click", async () => {
    const dsId = API.getActiveDatasetId();
    if (!dsId) {
      alert("Please upload and activate a sales/finance dataset first to synchronize revenue records.");
      return;
    }
    try {
      const res = await API.syncFinanceFromDataset(dsId);
      alert(res.message);
      await loadFinanceData();
    } catch (err) {
      alert("Sync notice: " + err.message);
    }
  });
}
