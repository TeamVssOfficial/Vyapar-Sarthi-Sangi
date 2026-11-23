// Vyapar Verse — Inventory Management View
import { API } from "../api.js";

export async function renderInventory(container) {
  container.innerHTML = `
    <div style="max-width: 1400px; margin: 0 auto; font-family: 'Inter', sans-serif;">
      
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 14px;">
        <div>
          <div style="display: inline-flex; align-items: center; gap: 8px; padding: 4px 12px; border-radius: 20px; background: rgba(233,154,58,0.14); color: #B45309; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 6px;">
            <span>📦</span> Enterprise Supply Chain & Warehouse
          </div>
          <h1 style="font-size: 24px; font-weight: 800; color: #14233D; margin: 0; font-family: 'Manrope', sans-serif;">Inventory Management</h1>
          <p style="font-size: 13px; color: #64748B; margin: 4px 0 0 0;">Monitor live SKU stock levels, reorder thresholds, stock valuation, and inbound/outbound movements.</p>
        </div>

        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button id="btn-sync-inventory-dataset" class="btn btn-outline" style="font-size: 12px; font-weight: 700; padding: 8px 16px; display: inline-flex; align-items: center; gap: 6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
            Sync from Active Dataset
          </button>
          <button id="btn-add-stock-movement" class="btn btn-saffron" style="font-size: 12px; font-weight: 800; padding: 8px 18px; display: inline-flex; align-items: center; gap: 6px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Record Stock In / Out
          </button>
        </div>
      </div>

      <!-- Live Sync / Alert Status Toast -->
      <div id="inv-status-toast" style="display: none; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; font-weight: 600; line-height: 1.5;"></div>

      <!-- KPI Summary Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;">
        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase;">Total Inventory Value</div>
          <div id="inv-kpi-valuation" style="font-size: 26px; font-weight: 900; color: #14233D; margin-top: 4px;">₹0.00</div>
          <div style="font-size: 11px; color: #10B981; font-weight: 700; margin-top: 4px;">Asset Valuation</div>
        </div>

        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase;">Total Units in Stock</div>
          <div id="inv-kpi-units" style="font-size: 26px; font-weight: 900; color: #14233D; margin-top: 4px;">0</div>
          <div style="font-size: 11px; color: #64748B; margin-top: 4px;">Available units across SKUs</div>
        </div>

        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 10px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase;">Monitored SKUs</div>
          <div id="inv-kpi-skus" style="font-size: 26px; font-weight: 900; color: #14233D; margin-top: 4px;">0</div>
          <div style="font-size: 11px; color: #64748B; margin-top: 4px;">Active catalog items</div>
        </div>

        <div style="background: #FFFFFF; border: 1px solid #FECACA; border-left: 4px solid #EF4444; border-radius: 10px; padding: 18px; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
          <div style="font-size: 11px; font-weight: 700; color: #DC2626; text-transform: uppercase;">Low Stock Warnings</div>
          <div id="inv-kpi-lowstock" style="font-size: 26px; font-weight: 900; color: #DC2626; margin-top: 4px;">0</div>
          <div style="font-size: 11px; color: #EF4444; font-weight: 600; margin-top: 4px;">SKUs below reorder threshold</div>
        </div>
      </div>

      <!-- Inventory Catalog Table Card -->
      <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h3 style="font-size: 16px; font-weight: 800; color: #14233D; margin: 0;">SKU Catalog & Real-Time Stock</h3>
            <p id="inv-catalog-subtitle" style="font-size: 12px; color: #64748B; margin: 2px 0 0 0;">Showing mapped inventory records</p>
          </div>

          <div style="display: flex; gap: 10px;">
            <input type="text" id="inv-search-input" placeholder="Search product or SKU..." style="padding: 6px 12px; font-size: 12px; border: 1px solid #CBD5E1; border-radius: 6px; width: 220px;" />
            <select id="inv-filter-status" style="padding: 6px 10px; font-size: 12px; border: 1px solid #CBD5E1; border-radius: 6px; font-weight: 600; color: #14233D;">
              <option value="ALL">All Items</option>
              <option value="LOW">Low Stock Only</option>
              <option value="HEALTHY">Healthy Stock Only</option>
            </select>
          </div>
        </div>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px; text-align: left;">
            <thead>
              <tr style="border-bottom: 2px solid #E2E8F0; color: #64748B; font-size: 11px; text-transform: uppercase; font-weight: 700;">
                <th style="padding: 10px 14px;">Product Name</th>
                <th style="padding: 10px 14px;">SKU Code</th>
                <th style="padding: 10px 14px;">Category</th>
                <th style="padding: 10px 14px;">In Stock</th>
                <th style="padding: 10px 14px;">Reorder Point</th>
                <th style="padding: 10px 14px;">Unit Cost</th>
                <th style="padding: 10px 14px;">Supplier</th>
                <th style="padding: 10px 14px;">Status</th>
                <th style="padding: 10px 14px; text-align: right;">Quick Action</th>
              </tr>
            </thead>
            <tbody id="inventory-table-body">
              <tr>
                <td colspan="9" style="padding: 24px; text-align: center; color: #64748B;">Loading inventory records...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Stock Movement History -->
      <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03);">
        <h3 style="font-size: 16px; font-weight: 800; color: #14233D; margin: 0 0 16px 0;">Recent Stock Movements (Audit Trail)</h3>
        <div id="stock-movements-list" style="font-size: 13px; color: #64748B;">No stock movements recorded yet.</div>
      </div>
    </div>

    <!-- Record Movement Modal -->
    <div id="movement-modal" class="modal-overlay" style="display: none;">
      <div class="modal-content" style="padding: 24px; max-width: 500px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 17px; font-weight: 800; color: #14233D; margin: 0;">Record Stock In / Out</h3>
            <p style="font-size: 12px; color: #64748B; margin: 2px 0 0 0;">Update on-hand warehouse inventory and generate ledger audit trail.</p>
          </div>
          <button id="btn-close-movement-modal" style="background: none; border: none; font-size: 22px; cursor: pointer; color: #64748B;">&times;</button>
        </div>

        <form id="movement-form" style="display: flex; flex-direction: column; gap: 14px;">
          <div>
            <label style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 5px;">
              Select Product <span style="color: #DC2626;">*</span>
            </label>
            <select id="movement-product-select" required style="width: 100%; padding: 10px 12px; font-size: 13px; border-radius: 6px; border: 1px solid #CBD5E1; color: #14233D; font-weight: 600; background: #FFFFFF;">
              <option value="">-- Choose Product --</option>
            </select>
            <!-- Live Product Stock Badge in Modal -->
            <div id="modal-product-live-info" style="display: none; margin-top: 6px; padding: 6px 10px; background: #F1F5F9; border-radius: 6px; font-size: 11px; color: #334155;">
              <!-- Live info injected dynamically -->
            </div>
          </div>

          <div>
            <label style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 6px;">
              Movement Type
            </label>
            <div style="display: flex; gap: 16px; background: #F8FAFC; padding: 10px 14px; border-radius: 8px; border: 1px solid #E2E8F0;">
              <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #047857; cursor: pointer;">
                <input type="radio" name="mtype" value="IN" checked style="accent-color: #10B981;">
                <span>Stock In (Replenishment)</span>
              </label>
              <label style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #B45309; cursor: pointer;">
                <input type="radio" name="mtype" value="OUT" style="accent-color: #E99A3A;">
                <span>Stock Out (Sales / Dispatch)</span>
              </label>
            </div>
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <label style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569;">
                Quantity <span style="color: #DC2626;">*</span>
              </label>
              <span id="modal-max-stock-hint" style="font-size: 11px; color: #64748B;"></span>
            </div>
            <input type="number" id="movement-quantity" min="1" required placeholder="e.g. 50" style="width: 100%; padding: 10px 12px; font-size: 13px; border-radius: 6px; border: 1px solid #CBD5E1; font-weight: 700;" />
          </div>

          <div>
            <label style="display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; margin-bottom: 4px;">
              Reason / Notes
            </label>
            <input type="text" id="movement-reason" placeholder="e.g. Supplier Batch #912 / Invoice Delivery" style="width: 100%; padding: 10px 12px; font-size: 13px; border-radius: 6px; border: 1px solid #CBD5E1;" />
          </div>

          <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 10px;">
            <button type="button" id="btn-cancel-movement" class="btn btn-outline" style="font-size: 12px; padding: 8px 16px;">Cancel</button>
            <button type="submit" id="btn-submit-movement" class="btn btn-saffron" style="font-size: 12px; font-weight: 800; padding: 8px 20px;">Commit Movement</button>
          </div>
        </form>
      </div>
    </div>
  `;

  let currentProducts = [];
  const toast = container.querySelector("#inv-status-toast");
  const modal = container.querySelector("#movement-modal");
  const btnOpenModal = container.querySelector("#btn-add-stock-movement");
  const btnCloseModal = container.querySelector("#btn-close-movement-modal");
  const btnCancelModal = container.querySelector("#btn-cancel-movement");
  const movementForm = container.querySelector("#movement-form");
  const prodSelect = container.querySelector("#movement-product-select");
  const liveProductInfo = container.querySelector("#modal-product-live-info");
  const maxStockHint = container.querySelector("#modal-max-stock-hint");
  const searchInput = container.querySelector("#inv-search-input");
  const statusFilter = container.querySelector("#inv-filter-status");

  function showToast(msg, type = "info") {
    if (!toast) return;
    toast.style.display = "block";
    toast.innerText = msg;
    if (type === "success") {
      toast.style.background = "#DCFCE7";
      toast.style.color = "#15803D";
      toast.style.border = "1px solid #86EFAC";
    } else if (type === "error") {
      toast.style.background = "#FEE2E2";
      toast.style.color = "#B91C1C";
      toast.style.border = "1px solid #FCA5A5";
    } else {
      toast.style.background = "#EFF6FF";
      toast.style.color = "#1E40AF";
      toast.style.border = "1px solid #BFDBFE";
    }
    setTimeout(() => {
      if (type === "success" || type === "info") {
        toast.style.display = "none";
      }
    }, 4500);
  }

  function renderTable(products) {
    const tbody = container.querySelector("#inventory-table-body");
    const q = (searchInput ? searchInput.value : "").toLowerCase().trim();
    const filter = statusFilter ? statusFilter.value : "ALL";

    let filtered = products.filter(p => {
      if (q) {
        const nameMatch = (p.name || "").toLowerCase().includes(q);
        const skuMatch = (p.sku || "").toLowerCase().includes(q);
        const catMatch = (p.category || "").toLowerCase().includes(q);
        if (!nameMatch && !skuMatch && !catMatch) return false;
      }
      const isLow = p.current_stock <= p.reorder_threshold;
      if (filter === "LOW" && !isLow) return false;
      if (filter === "HEALTHY" && isLow) return false;
      return true;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="padding: 24px; text-align: center; color: #64748B;">
            No inventory items matching filter. Click 'Sync from Active Dataset' to import products.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(p => {
      const isLow = p.current_stock <= p.reorder_threshold;
      const statusBadge = isLow
        ? `<span style="background: #FEE2E2; color: #DC2626; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 12px; text-transform: uppercase;">Low Stock</span>`
        : `<span style="background: #DCFCE7; color: #15803D; font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 12px; text-transform: uppercase;">Healthy</span>`;

      return `
        <tr style="border-bottom: 1px solid #F1F5F9;">
          <td style="padding: 12px 14px; font-weight: 700; color: #14233D;">${p.name}</td>
          <td style="padding: 12px 14px; color: #475569; font-family: monospace; font-size: 12px;">${p.sku}</td>
          <td style="padding: 12px 14px; color: #64748B;">${p.category || 'General'}</td>
          <td style="padding: 12px 14px; font-weight: 800; color: ${isLow ? '#DC2626' : '#14233D'};">
            ${p.current_stock.toLocaleString()} units
          </td>
          <td style="padding: 12px 14px; color: #64748B;">${p.reorder_threshold.toLocaleString()}</td>
          <td style="padding: 12px 14px; font-weight: 600; color: #14233D;">₹${(p.unit_cost || 0).toFixed(2)}</td>
          <td style="padding: 12px 14px; color: #64748B; font-size: 12px;">${p.supplier || 'Primary'}</td>
          <td style="padding: 12px 14px;">${statusBadge}</td>
          <td style="padding: 12px 14px; text-align: right;">
            <button 
              class="btn-row-stock-in btn" 
              data-id="${p.id}" 
              data-name="${p.name}" 
              data-sku="${p.sku}"
              style="padding: 3px 8px; font-size: 10px; font-weight: 700; background: #DCFCE7; color: #15803D; border: 1px solid #86EFAC; border-radius: 4px; cursor: pointer; margin-right: 4px;"
            >
              + In
            </button>
            <button 
              class="btn-row-stock-out btn" 
              data-id="${p.id}" 
              data-name="${p.name}" 
              data-sku="${p.sku}"
              style="padding: 3px 8px; font-size: 10px; font-weight: 700; background: #FEF3C7; color: #B45309; border: 1px solid #FDE68A; border-radius: 4px; cursor: pointer;"
            >
              - Out
            </button>
          </td>
        </tr>
      `;
    }).join("");

    // Attach row quick-action listeners
    tbody.querySelectorAll(".btn-row-stock-in").forEach(btn => {
      btn.onclick = () => {
        openMovementModal(btn.getAttribute("data-id"), "IN");
      };
    });
    tbody.querySelectorAll(".btn-row-stock-out").forEach(btn => {
      btn.onclick = () => {
        openMovementModal(btn.getAttribute("data-id"), "OUT");
      };
    });
  }

  function updateProductSelectOptions(products, selectedId = "") {
    if (!prodSelect) return;
    if (products.length === 0) {
      prodSelect.innerHTML = `<option value="">No products available. Click 'Sync from Active Dataset'.</option>`;
      return;
    }

    prodSelect.innerHTML = `
      <option value="">-- Choose Product (${products.length} Products Available) --</option>
      ${products.map(p => `
        <option value="${p.id}" ${p.id === selectedId ? 'selected' : ''}>
          ${p.name} [${p.sku}] — In Stock: ${p.current_stock.toLocaleString()} @ ₹${(p.unit_cost || 0).toFixed(2)}
        </option>
      `).join("")}
    `;

    updateSelectedProductDetails();
  }

  function updateSelectedProductDetails() {
    if (!prodSelect || !liveProductInfo) return;
    const selectedId = prodSelect.value;
    const prod = currentProducts.find(p => p.id === selectedId);

    if (prod) {
      liveProductInfo.style.display = "block";
      liveProductInfo.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span><b>SKU:</b> ${prod.sku} | <b>Unit Cost:</b> ₹${(prod.unit_cost || 0).toFixed(2)}</span>
          <span style="font-weight: 800; color: ${prod.current_stock <= prod.reorder_threshold ? '#DC2626' : '#047857'};">
            Current Stock: ${prod.current_stock.toLocaleString()} units
          </span>
        </div>
      `;

      const mtypeInput = container.querySelector("input[name='mtype']:checked");
      const mtype = mtypeInput ? mtypeInput.value : "IN";
      if (mtype === "OUT") {
        if (maxStockHint) maxStockHint.innerText = `Max dispatchable: ${prod.current_stock}`;
      } else {
        if (maxStockHint) maxStockHint.innerText = "Replenishment to inventory";
      }
    } else {
      liveProductInfo.style.display = "none";
      if (maxStockHint) maxStockHint.innerText = "";
    }
  }

  function openMovementModal(productId = "", movementType = "IN") {
    if (!modal) return;
    updateProductSelectOptions(currentProducts, productId);

    const rad = container.querySelector(`input[name='mtype'][value='${movementType}']`);
    if (rad) rad.checked = true;

    modal.style.display = "flex";
    updateSelectedProductDetails();
  }

  async function loadInventoryData() {
    try {
      const summary = await API.getInventorySummary();
      const kpis = summary.kpis || summary || {};

      const totalVal = (kpis.total_inventory_valuation ?? summary.inventory_valuation ?? 0);
      const totalUnits = (kpis.total_stock_units ?? summary.total_units_in_stock ?? 0);
      const totalSkus = (kpis.total_products ?? summary.total_skus ?? 0);
      const lowStockCount = (kpis.low_stock_items_count ?? summary.low_stock_count ?? 0);

      container.querySelector("#inv-kpi-valuation").innerText = `₹${totalVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
      container.querySelector("#inv-kpi-units").innerText = totalUnits.toLocaleString();
      container.querySelector("#inv-kpi-skus").innerText = totalSkus.toLocaleString();
      container.querySelector("#inv-kpi-lowstock").innerText = lowStockCount.toLocaleString();

      currentProducts = summary.products || [];
      if (currentProducts.length === 0) {
        try {
          const prods = await API.listProducts();
          if (Array.isArray(prods) && prods.length > 0) {
            currentProducts = prods;
          }
        } catch (e) {}
      }

      // Auto-sync if catalog is empty and an active dataset is selected
      const activeDsId = API.getActiveDatasetId();
      if (currentProducts.length === 0 && activeDsId) {
        try {
          const syncRes = await API.syncInventoryFromDataset(activeDsId);
          if (syncRes && syncRes.products) {
            currentProducts = syncRes.products;
          }
        } catch (e) {}
      }

      const subtitle = container.querySelector("#inv-catalog-subtitle");
      if (subtitle) {
        subtitle.innerText = `Showing ${currentProducts.length} active inventory items`;
      }

      renderTable(currentProducts);
      updateProductSelectOptions(currentProducts);

      // Movements Audit Trail
      const movList = container.querySelector("#stock-movements-list");
      const movements = summary.recent_movements || [];
      if (movements.length > 0) {
        movList.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${movements.map(m => {
              const isReplenish = (m.movement_type === "IN");
              const stripeColor = isReplenish ? "#10B981" : "#E99A3A";
              const tagColor = isReplenish ? "#047857" : "#B45309";
              const tagBg = isReplenish ? "#DCFCE7" : "#FEF3C7";
              const dateStr = m.timestamp ? new Date(m.timestamp * 1000).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "Recent";

              return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: #F8FAFC; border-radius: 6px; border-left: 3px solid ${stripeColor}; border: 1px solid #E2E8F0; border-left-width: 4px;">
                  <div>
                    <span style="font-weight: 700; color: #14233D;">${m.product_name}</span>
                    <span style="font-size: 11px; color: #64748B; margin-left: 8px;">Reason: <i>${m.reason || 'Normal operation'}</i></span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="background: ${tagBg}; color: ${tagColor}; font-weight: 800; font-size: 11px; padding: 3px 8px; border-radius: 4px;">
                      ${isReplenish ? '+' : '-'}${m.quantity.toLocaleString()} units
                    </span>
                    <span style="font-size: 11px; color: #94A3B8;">${dateStr}</span>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        `;
      } else {
        movList.innerHTML = `<div style="text-align: center; padding: 16px; color: #94A3B8;">No stock movements recorded yet. Use 'Record Stock In / Out' above.</div>`;
      }
    } catch (e) {
      console.warn("Failed to load inventory:", e);
      showToast(`Notice loading inventory: ${e.message}`, "error");
    }
  }

  // Initial Load
  await loadInventoryData();

  // Search & Filter listeners
  if (searchInput) {
    searchInput.oninput = () => renderTable(currentProducts);
  }
  if (statusFilter) {
    statusFilter.onchange = () => renderTable(currentProducts);
  }

  // Modal Open/Close handlers
  if (btnOpenModal) {
    btnOpenModal.onclick = () => openMovementModal();
  }
  if (btnCloseModal) {
    btnCloseModal.onclick = () => { if (modal) modal.style.display = "none"; };
  }
  if (btnCancelModal) {
    btnCancelModal.onclick = () => { if (modal) modal.style.display = "none"; };
  }

  // Live change on product select in modal
  if (prodSelect) {
    prodSelect.onchange = updateSelectedProductDetails;
  }

  const mtypeRadios = container.querySelectorAll("input[name='mtype']");
  mtypeRadios.forEach(rad => {
    rad.onchange = updateSelectedProductDetails;
  });

  // Movement Form Submit
  if (movementForm) {
    movementForm.onsubmit = async (e) => {
      e.preventDefault();
      const pid = prodSelect.value;
      if (!pid) {
        alert("Please select a product from the list.");
        return;
      }

      const mtypeInput = container.querySelector("input[name='mtype']:checked");
      const mtype = mtypeInput ? mtypeInput.value : "IN";
      const qtyInput = container.querySelector("#movement-quantity");
      const qty = parseInt(qtyInput.value, 10);
      const reason = container.querySelector("#movement-reason").value.trim();

      if (isNaN(qty) || qty <= 0) {
        alert("Please enter a valid positive quantity.");
        return;
      }

      const prod = currentProducts.find(p => p.id === pid);
      if (mtype === "OUT" && prod && qty > prod.current_stock) {
        alert(`Cannot dispatch ${qty} units. Only ${prod.current_stock} units currently available in stock.`);
        return;
      }

      const submitBtn = container.querySelector("#btn-submit-movement");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "Recording...";
      }

      try {
        const res = await API.recordStockMovement({
          product_id: pid,
          movement_type: mtype,
          quantity: qty,
          reason: reason || (mtype === "IN" ? "Stock Replenishment" : "Stock Dispatch")
        });

        if (modal) modal.style.display = "none";
        movementForm.reset();
        showToast(res.message || `Successfully updated stock for ${prod ? prod.name : 'product'}.`, "success");
        await loadInventoryData();
      } catch (err) {
        alert(`Error: ${err.message}`);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = "Commit Movement";
        }
      }
    };
  }

  // Sync from Dataset Handler
  const syncBtn = container.querySelector("#btn-sync-inventory-dataset");
  if (syncBtn) {
    syncBtn.onclick = async () => {
      const dsId = API.getActiveDatasetId();
      if (!dsId) {
        alert("Please upload and select an active business dataset first (e.g. 'b2b_invoices').");
        return;
      }

      syncBtn.disabled = true;
      syncBtn.innerText = "Mapping Products...";

      try {
        const res = await API.syncInventoryFromDataset(dsId);
        showToast(res.message, "success");
        await loadInventoryData();
      } catch (err) {
        alert(`Sync error: ${err.message}`);
      } finally {
        syncBtn.disabled = false;
        syncBtn.innerText = "Sync from Active Dataset";
      }
    };
  }
}
