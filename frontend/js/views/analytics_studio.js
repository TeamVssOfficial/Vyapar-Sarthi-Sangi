// Vyapar Verse — Intelligent Data Visualization Studio
// Shopkeeper-friendly, category-based intelligent graph generator covering 7 core business categories.
import { API } from "../api.js";
import { ensurePlotly } from "../utils/plotly_loader.js";

export async function renderAnalyticsStudio(container) {
  let activeDatasetId = API.getActiveDatasetId();
  let datasetsList = [];
  let currentDataset = null;
  let detectedMapping = {};
  let currentCategory = "sales";
  let activeGraphDef = null;
  let activeChartType = "bar"; // "bar", "line", "pie", "area", "scatter", "table"
  let topNLimit = 10; // 5, 10, 20, "all"
  let sortOrder = "desc"; // "desc", "asc"
  let rawRowsData = [];

  // 1. Check or load datasets
  try {
    const dRes = await API.listDatasets();
    datasetsList = dRes.datasets || [];
    if (!activeDatasetId && datasetsList.length > 0) {
      activeDatasetId = datasetsList[0].id;
      API.setActiveDatasetId(activeDatasetId);
    }
  } catch (e) {
    console.error("Failed to list datasets:", e);
  }

  if (!activeDatasetId) {
    container.innerHTML = `
      <div class="vss-card" style="padding: 40px; text-align: center; max-width: 580px; margin: 40px auto; border-radius: 14px;">
        <div style="width: 54px; height: 54px; border-radius: 14px; background: rgba(233,154,58,0.15); color: #E99A3A; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 24px;">
          📊
        </div>
        <h3 style="font-size: 18px; font-weight: 800; color: var(--navy); margin-bottom: 8px;">No Business Dataset Selected</h3>
        <p style="font-size: 13px; color: var(--slate); margin-bottom: 24px; line-height: 1.6;">
          Select or upload your sales spreadsheet, store register, or cash ledger to unlock intelligent automated business visualizations.
        </p>
        <div style="display: flex; justify-content: center; gap: 12px; flex-wrap: wrap;">
          <button onclick="window.openDirectUploadModal()" class="btn btn-saffron" style="font-weight: 700;">
            Upload Excel / CSV
          </button>
          <button onclick="window.navigateTo('#excel-integration')" class="btn btn-outline" style="font-weight: 700;">
            Open Excel Studio
          </button>
        </div>
      </div>
    `;
    return;
  }

  // Render Studio Shell
  container.innerHTML = `
    <div style="max-width: 1440px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px;">
      
      <!-- STUDIO TOP HEADER BAR -->
      <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px 24px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 44px; height: 44px; border-radius: 10px; background: linear-gradient(135deg, rgba(233,154,58,0.2) 0%, rgba(217,119,6,0.25) 100%); border: 1px solid rgba(233,154,58,0.4); display: flex; align-items: center; justify-content: center; font-size: 20px;">
            📈
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h1 style="font-size: 20px; font-weight: 800; color: var(--navy); margin: 0;">Data Visualization Studio</h1>
              <span style="background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 12px;">7 Shopkeeper Categories</span>
            </div>
            <p style="font-size: 12px; color: var(--slate); margin-top: 2px;">
              Auto-mapped charts, interactive Plotly canvas, and instant business visual intelligence.
            </p>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <!-- Dataset Selector -->
          <div style="display: flex; align-items: center; gap: 6px; background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px; padding: 4px 10px;">
            <span style="font-size: 11px; font-weight: 700; color: #64748B;">Dataset:</span>
            <select id="vis-dataset-select" style="background: transparent; border: none; font-size: 12px; font-weight: 700; color: var(--navy); outline: none; cursor: pointer;">
              ${datasetsList.map(d => `<option value="${d.id}" ${d.id === activeDatasetId ? 'selected' : ''}>${d.filename || d.name || d.id}</option>`).join("")}
            </select>
          </div>

          <button id="btn-vis-open-excel" class="btn" style="background: rgba(16, 185, 129, 0.15); color: #047857; border: 1px solid rgba(16, 185, 129, 0.3); font-size: 12px; font-weight: 700; padding: 8px 14px;">
            📊 Open in Excel Studio
          </button>
        </div>
      </div>

      <!-- NATURAL LANGUAGE GRAPH QUERY BAR -->
      <div style="background: linear-gradient(135deg, #0C1729 0%, #14233D 100%); border-radius: 12px; padding: 18px 24px; color: #FFFFFF; display: flex; flex-direction: column; gap: 10px; border: 1px solid rgba(59, 130, 246, 0.3); box-shadow: 0 4px 16px rgba(12, 23, 41, 0.25);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #E99A3A; font-size: 16px;">✨</span>
            <span style="font-size: 13px; font-weight: 800; color: #FFFFFF;">Ask AI to create a graph...</span>
          </div>
          <div style="display: flex; gap: 6px; flex-wrap: wrap;">
            <button class="ai-prompt-pill" data-q="Show top 5 products by revenue" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); border-radius: 14px; padding: 3px 10px; font-size: 11px; color: #CBD5E1; cursor: pointer;">"Top 5 products by revenue"</button>
            <button class="ai-prompt-pill" data-q="Sales trend over time" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); border-radius: 14px; padding: 3px 10px; font-size: 11px; color: #CBD5E1; cursor: pointer;">"Sales trend over time"</button>
            <button class="ai-prompt-pill" data-q="Category-wise sales distribution" style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.18); border-radius: 14px; padding: 3px 10px; font-size: 11px; color: #CBD5E1; cursor: pointer;">"Sales by category"</button>
          </div>
        </div>

        <div style="display: flex; gap: 10px;">
          <input type="text" id="vis-ai-input" placeholder="Type plain English or Hindi request (e.g. 'Show sales by month' or 'Best selling items leaderboard')" style="flex: 1; padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.07); color: #FFFFFF; font-size: 13px; outline: none;" />
          <button id="btn-vis-ai-submit" class="btn btn-saffron" style="font-weight: 800; font-size: 13px; padding: 10px 20px;">Generate Graph</button>
        </div>
      </div>

      <!-- RECOMMENDED FOR MY DATASET SECTION -->
      <div id="vis-recommended-section">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="font-size: 14px; font-weight: 800; color: var(--navy); display: flex; align-items: center; gap: 6px;">
            <span>💡</span> Recommended for My Dataset
          </div>
          <span style="font-size: 11px; color: var(--slate);">Detected columns match these graphs with 100% precision</span>
        </div>
        <div id="vis-recommended-cards-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px;">
          <!-- Injected dynamically -->
        </div>
      </div>

      <!-- MAIN STUDIO: CATEGORIES & GRAPH PICKER + PLOTLY CANVAS -->
      <div style="display: grid; grid-template-columns: 340px 1fr; gap: 20px; align-items: start;">
        
        <!-- LEFT: CATEGORIES & GRAPH PICKER -->
        <div class="vss-card" style="padding: 18px; display: flex; flex-direction: column; gap: 16px;">
          <div>
            <label style="display: block; font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--slate); margin-bottom: 8px;">1. Business Category</label>
            <div style="display: flex; flex-direction: column; gap: 4px;" id="vis-category-tabs">
              <button class="vis-category-pill active" data-cat="sales">💰 Sales Analysis</button>
              <button class="vis-category-pill" data-cat="product">📦 Product Analysis</button>
              <button class="vis-category-pill" data-cat="inventory">📊 Inventory Analysis</button>
              <button class="vis-category-pill" data-cat="finance">💳 Finance & Margins</button>
              <button class="vis-category-pill" data-cat="customer">👥 Customer Analysis</button>
              <button class="vis-category-pill" data-cat="purchase">🚚 Purchase & Supplier</button>
              <button class="vis-category-pill" data-cat="regional">📍 Regional & Store</button>
            </div>
          </div>

          <div style="border-top: 1px solid #E2E8F0; padding-top: 14px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <label style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: var(--slate);">2. Available Graphs</label>
              <span id="vis-ready-count" style="font-size: 11px; font-weight: 700; color: #10B981;">Checking...</span>
            </div>
            <div id="vis-graphs-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 480px; overflow-y: auto; padding-right: 4px;">
              <!-- Graph choices injected here -->
            </div>
          </div>
        </div>

        <!-- RIGHT: INTERACTIVE PLOTLY CANVAS & CONTROLS -->
        <div class="vss-card" style="padding: 20px; display: flex; flex-direction: column; gap: 16px; min-height: 600px;">
          
          <!-- CONTROLS TOOLBAR -->
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid #E2E8F0; padding-bottom: 14px;">
            <div>
              <h2 id="vis-active-graph-title" style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 2px;">Loading Graph...</h2>
              <div id="vis-active-graph-subtitle" style="font-size: 11.5px; color: var(--slate);">Mapping columns and aggregating data</div>
            </div>

            <!-- Toolbar Switches -->
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <!-- Chart Type Selector -->
              <div style="display: flex; gap: 2px; background: #F1F5F9; padding: 2px; border-radius: 6px;" id="vis-chart-types-bar">
                <button class="chart-type-btn active" data-type="bar" style="border: none; background: transparent; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer;">Bar</button>
                <button class="chart-type-btn" data-type="line" style="border: none; background: transparent; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer;">Line</button>
                <button class="chart-type-btn" data-type="pie" style="border: none; background: transparent; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer;">Donut</button>
                <button class="chart-type-btn" data-type="area" style="border: none; background: transparent; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer;">Area</button>
                <button class="chart-type-btn" data-type="table" style="border: none; background: transparent; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer;">Table</button>
              </div>

              <!-- Top N Limit -->
              <select id="vis-top-n" style="padding: 5px 8px; border-radius: 6px; border: 1px solid #CBD5E1; font-size: 11px; font-weight: 700; color: var(--navy); background: #FFFFFF; outline: none; cursor: pointer;">
                <option value="5">Top 5</option>
                <option value="10" selected>Top 10</option>
                <option value="20">Top 20</option>
                <option value="all">Show All</option>
              </select>

              <!-- Sort Order -->
              <button id="btn-vis-sort" class="btn" style="background: #F1F5F9; color: var(--navy); border: 1px solid #CBD5E1; font-size: 11px; font-weight: 700; padding: 5px 10px;" title="Toggle Sort Ascending / Descending">
                Sort: High &rarr; Low
              </button>

              <!-- Download PNG -->
              <button id="btn-vis-download" class="btn btn-outline" style="font-size: 11px; font-weight: 700; padding: 5px 10px;" title="Download PNG Chart">
                📷 PNG
              </button>
            </div>
          </div>

          <!-- PLOTLY CANVAS CONTAINER -->
          <div id="vis-plotly-target" style="width: 100%; min-height: 440px; position: relative;">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 380px; color: var(--slate);">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--saffron)" stroke-width="2.5" style="animation: spin 1s linear infinite; margin-bottom: 8px;"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>
              <div style="font-size: 13px; font-weight: 700;">Plotting Interactive Graph...</div>
            </div>
          </div>

          <!-- SUMMARY KPI STRIP FOR ACTIVE GRAPH -->
          <div id="vis-graph-kpis" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; border-top: 1px solid #E2E8F0; padding-top: 14px;">
            <!-- Rendered dynamically -->
          </div>

        </div>

      </div>

    </div>
  `;

  // 2. Fetch dataset schema & preview
  await loadDatasetSchema();

  async function loadDatasetSchema() {
    try {
      const [mappingRes, previewRes] = await Promise.all([
        API.getColumnMapping(activeDatasetId).catch(() => ({})),
        API.getDataset(activeDatasetId, 500).catch(() => ({ rows: [], preview: [] }))
      ]);

      detectedMapping = mappingRes || {};
      rawRowsData = previewRes.preview || previewRes.rows || [];
      const cols = previewRes.columns || (rawRowsData.length > 0 ? Object.keys(rawRowsData[0]) : []);

      // Enhance detectedMapping from available columns if needed
      heuristicColumnFill(cols);

      // Render Recommendations
      renderRecommendations();

      // Render category graphs list
      renderCategoryGraphsList();

    } catch (err) {
      console.error("Error loading dataset schema:", err);
    }
  }

  function heuristicColumnFill(cols) {
    if (!cols || !Array.isArray(cols)) return;
    if (!detectedMapping.sales && !detectedMapping.revenue) {
      const numCol = cols.find(c => /sale|revenue|amount|total|price|inr|value|mrp|amt|net/i.test(c));
      if (numCol) detectedMapping.revenue = numCol;
    }
    if (!detectedMapping.product) {
      const prodCol = cols.find(c => /product|item|sku|description|title|name|particular|desc/i.test(c));
      if (prodCol) detectedMapping.product = prodCol;
    }
    if (!detectedMapping.category) {
      const catCol = cols.find(c => /category|type|dept|department|group|class|segment/i.test(c));
      if (catCol) detectedMapping.category = catCol;
    }
    if (!detectedMapping.date) {
      const dateCol = cols.find(c => /date|time|day|month|year|timestamp|dt|bill|inv/i.test(c));
      if (dateCol) detectedMapping.date = dateCol;
    }
    if (!detectedMapping.customer) {
      const custCol = cols.find(c => /customer|buyer|client|user|phone|party|vendor|account/i.test(c));
      if (custCol) detectedMapping.customer = custCol;
    }
    if (!detectedMapping.quantity) {
      const qtyCol = cols.find(c => /qty|quantity|units|count|volume|nos|pieces|pcs/i.test(c));
      if (qtyCol) detectedMapping.quantity = qtyCol;
    }
    if (!detectedMapping.cost) {
      const costCol = cols.find(c => /cost|cogs|buy|expense|wholesale|purchase/i.test(c));
      if (costCol) detectedMapping.cost = costCol;
    }
    if (!detectedMapping.region) {
      const regCol = cols.find(c => /region|city|state|store|branch|zone|location|area|place|dist/i.test(c));
      if (regCol) detectedMapping.region = regCol;
    }
  }

  // =========================================================================
  // 7 BUSINESS CATEGORIES GRAPH DEFINITIONS
  // =========================================================================
  function getCategoryDefinitions() {
    return {
      sales: [
        {
          id: "sales_trend",
          title: "Sales Run-Rate Trend",
          desc: "Chronological daily/monthly revenue trajectory",
          reqCols: ["date", "revenue"],
          defaultType: "line",
          generator: (rows) => aggregateTimeTrend(rows, detectedMapping.date, detectedMapping.revenue || detectedMapping.sales)
        },
        {
          id: "sales_by_category",
          title: "Sales Share by Category",
          desc: "Revenue breakdown across different product groups",
          reqCols: ["category", "revenue"],
          defaultType: "pie",
          generator: (rows) => aggregateCategoryShare(rows, detectedMapping.category, detectedMapping.revenue || detectedMapping.sales)
        },
        {
          id: "top_products_sales",
          title: "Top Products by Revenue",
          desc: "Best performing SKUs sorted by gross revenue",
          reqCols: ["product", "revenue"],
          defaultType: "bar",
          generator: (rows) => aggregateTopN(rows, detectedMapping.product, detectedMapping.revenue || detectedMapping.sales)
        },
        {
          id: "sales_by_region",
          title: "Sales Volume by Region / Store",
          desc: "Geographical performance across cities and branches",
          reqCols: ["region", "revenue"],
          defaultType: "bar",
          generator: (rows) => aggregateTopN(rows, detectedMapping.region, detectedMapping.revenue || detectedMapping.sales)
        }
      ],
      product: [
        {
          id: "top_products_qty",
          title: "Most Sold Items by Quantity",
          desc: "Units movement volume across catalog items",
          reqCols: ["product", "quantity"],
          defaultType: "bar",
          generator: (rows) => aggregateTopN(rows, detectedMapping.product, detectedMapping.quantity)
        },
        {
          id: "product_revenue_pie",
          title: "Product Revenue Concentration",
          desc: "Share of total turnover generated by top items",
          reqCols: ["product", "revenue"],
          defaultType: "pie",
          generator: (rows) => aggregateCategoryShare(rows, detectedMapping.product, detectedMapping.revenue || detectedMapping.sales)
        },
        {
          id: "category_sku_count",
          title: "Catalog SKU Count by Category",
          desc: "Number of unique products in each department",
          reqCols: ["category"],
          defaultType: "bar",
          generator: (rows) => aggregateFrequency(rows, detectedMapping.category)
        }
      ],
      inventory: [
        {
          id: "stock_by_sku",
          title: "Stock Levels by Product",
          desc: "Current on-hand units across product catalog",
          reqCols: ["product", "quantity"],
          defaultType: "bar",
          generator: (rows) => aggregateTopN(rows, detectedMapping.product, detectedMapping.quantity)
        },
        {
          id: "stock_value_cat",
          title: "Inventory Value by Category",
          desc: "Capital locked in stock by category",
          reqCols: ["category", "revenue"],
          defaultType: "bar",
          generator: (rows) => aggregateCategoryShare(rows, detectedMapping.category, detectedMapping.revenue || detectedMapping.cost)
        }
      ],
      finance: [
        {
          id: "revenue_vs_cost",
          title: "Revenue vs Cost of Goods (COGS)",
          desc: "Side-by-side comparison of billing turnover and product cost",
          reqCols: ["revenue", "cost"],
          defaultType: "bar",
          generator: (rows) => aggregateTwoMetrics(rows, detectedMapping.category || detectedMapping.product, detectedMapping.revenue, detectedMapping.cost)
        },
        {
          id: "profit_by_category",
          title: "Profit Contribution by Category",
          desc: "Net margins generated across departments",
          reqCols: ["category", "revenue"],
          defaultType: "bar",
          generator: (rows) => aggregateCategoryShare(rows, detectedMapping.category, detectedMapping.profit || detectedMapping.revenue)
        }
      ],
      customer: [
        {
          id: "top_customers",
          title: "Top Customers by Spend",
          desc: "Highest value patrons and repeat buyers",
          reqCols: ["customer", "revenue"],
          defaultType: "bar",
          generator: (rows) => aggregateTopN(rows, detectedMapping.customer, detectedMapping.revenue || detectedMapping.sales)
        },
        {
          id: "customer_frequency",
          title: "Customer Order Frequency",
          desc: "Count of transactions per customer",
          reqCols: ["customer"],
          defaultType: "bar",
          generator: (rows) => aggregateFrequency(rows, detectedMapping.customer)
        }
      ],
      purchase: [
        {
          id: "purchase_by_vendor",
          title: "Purchases by Supplier",
          desc: "Wholesale outlay and order distribution across vendors",
          reqCols: ["customer", "cost"],
          defaultType: "bar",
          generator: (rows) => aggregateTopN(rows, detectedMapping.customer, detectedMapping.cost || detectedMapping.revenue)
        }
      ],
      regional: [
        {
          id: "city_sales",
          title: "Sales by City / State",
          desc: "Turnover sorted across cities, states, and postal zones",
          reqCols: ["region", "revenue"],
          defaultType: "bar",
          generator: (rows) => aggregateTopN(rows, detectedMapping.region, detectedMapping.revenue || detectedMapping.sales)
        }
      ]
    };
  }

  function isGraphSupported(graphDef) {
    return graphDef.reqCols.every(rc => !!detectedMapping[rc]);
  }

  function getMissingColumnNames(graphDef) {
    return graphDef.reqCols.filter(rc => !detectedMapping[rc]).map(rc => rc.toUpperCase());
  }

  // =========================================================================
  // RENDER RECOMMENDATIONS
  // =========================================================================
  function renderRecommendations() {
    const grid = container.querySelector("#vis-recommended-cards-grid");
    if (!grid) return;

    const allCats = getCategoryDefinitions();
    const allDefs = Object.values(allCats).flat();
    const readyDefs = allDefs.filter(isGraphSupported).slice(0, 4);

    if (readyDefs.length === 0) {
      grid.innerHTML = `<div style="font-size: 12px; color: var(--slate); padding: 12px; background: #F8FAFC; border-radius: 8px;">Upload a standard retail sheet with Date, Product, and Sales columns to see automatic recommendations.</div>`;
      return;
    }

    grid.innerHTML = readyDefs.map(d => `
      <div class="vis-rec-card vss-card" data-gid="${d.id}" style="padding: 14px; border-left: 4px solid var(--saffron); cursor: pointer; transition: transform 0.15s ease;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
          <span style="font-size: 10px; font-weight: 800; color: #10B981; background: rgba(16,185,129,0.1); padding: 2px 6px; border-radius: 8px;">● 100% Match</span>
          <span style="font-size: 11px; color: var(--saffron); font-weight: 700;">View &rarr;</span>
        </div>
        <div style="font-size: 13px; font-weight: 800; color: var(--navy);">${d.title}</div>
        <div style="font-size: 11px; color: var(--slate); margin-top: 2px;">${d.desc}</div>
      </div>
    `).join("");

    grid.querySelectorAll(".vis-rec-card").forEach(card => {
      card.addEventListener("click", () => {
        const gid = card.getAttribute("data-gid");
        const found = allDefs.find(x => x.id === gid);
        if (found) {
          activeGraphDef = found;
          activeChartType = found.defaultType;
          renderCategoryGraphsList();
          plotActiveGraph();
        }
      });
    });
  }

  // =========================================================================
  // RENDER CATEGORY GRAPHS LIST
  // =========================================================================
  function renderCategoryGraphsList() {
    const listWrap = container.querySelector("#vis-graphs-list");
    const readyCountBadge = container.querySelector("#vis-ready-count");
    if (!listWrap) return;

    const allCats = getCategoryDefinitions();
    const catGraphs = allCats[currentCategory] || [];

    const readyCount = catGraphs.filter(isGraphSupported).length;
    if (readyCountBadge) {
      readyCountBadge.innerText = `${readyCount} / ${catGraphs.length} Ready`;
    }

    listWrap.innerHTML = catGraphs.map(g => {
      const supported = isGraphSupported(g);
      const isSelected = activeGraphDef && activeGraphDef.id === g.id;

      return `
        <div class="vis-graph-card ${isSelected ? 'selected' : ''} ${!supported ? 'unsupported' : ''}" data-gid="${g.id}">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px;">
            <div style="font-size: 13px; font-weight: 800; color: ${supported ? 'var(--navy)' : '#94A3B8'};">${g.title}</div>
            ${supported 
              ? `<span style="font-size: 10px; font-weight: 700; color: #10B981; background: rgba(16,185,129,0.1); padding: 2px 6px; border-radius: 8px;">● Ready</span>`
              : `<span style="font-size: 9.5px; font-weight: 700; color: #EF4444; background: rgba(239,68,68,0.1); padding: 2px 6px; border-radius: 8px;">Missing Col</span>`
            }
          </div>
          <div style="font-size: 11px; color: var(--slate); line-height: 1.4;">${g.desc}</div>
          ${!supported ? `
            <div style="font-size: 10px; color: #EF4444; font-weight: 600; margin-top: 6px;">
              ⚠ Requires: ${getMissingColumnNames(g).join(", ")}
            </div>
          ` : ''}
        </div>
      `;
    }).join("");

    // Wire clicks
    listWrap.querySelectorAll(".vis-graph-card").forEach(card => {
      card.addEventListener("click", () => {
        const gid = card.getAttribute("data-gid");
        const found = catGraphs.find(x => x.id === gid);
        if (found) {
          if (!isGraphSupported(found)) {
            alert(`This graph requires column(s): ${getMissingColumnNames(found).join(", ")}. Please map these columns or select a supported graph.`);
            return;
          }
          activeGraphDef = found;
          activeChartType = found.defaultType;
          renderCategoryGraphsList();
          plotActiveGraph();
        }
      });
    });

    // Auto select first supported if none selected
    if (!activeGraphDef || !catGraphs.find(x => x.id === activeGraphDef.id)) {
      const firstReady = catGraphs.find(isGraphSupported);
      if (firstReady) {
        activeGraphDef = firstReady;
        activeChartType = firstReady.defaultType;
        renderCategoryGraphsList();
        plotActiveGraph();
      }
    }
  }

  // =========================================================================
  // PLOT ACTIVE GRAPH (PLOTLY)
  // =========================================================================
  async function plotActiveGraph() {
    const titleEl = container.querySelector("#vis-active-graph-title");
    const subEl = container.querySelector("#vis-active-graph-subtitle");
    const targetEl = container.querySelector("#vis-plotly-target");
    const kpiWrap = container.querySelector("#vis-graph-kpis");

    if (!activeGraphDef || !targetEl) return;

    if (titleEl) titleEl.innerText = activeGraphDef.title;
    if (subEl) subEl.innerText = activeGraphDef.desc;

    // Generate aggregated data
    let dataResult = null;
    try {
      dataResult = activeGraphDef.generator(rawRowsData);
    } catch (err) {
      console.error("Aggregation error:", err);
    }

    if (!dataResult || !dataResult.labels || dataResult.labels.length === 0) {
      if (rawRowsData && rawRowsData.length > 0) {
        const firstRow = rawRowsData[0] || {};
        const keys = Object.keys(firstRow);
        if (keys.length > 0) {
          dataResult = aggregateFrequency(rawRowsData, keys[0]);
        }
      }
    }

    if (!dataResult || !dataResult.labels || dataResult.labels.length === 0) {
      targetEl.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--slate);">
          <div style="font-size: 28px; margin-bottom: 6px;">📉</div>
          <div style="font-size: 14px; font-weight: 700; color: var(--navy);">No Data to Display</div>
          <div style="font-size: 11px;">The selected dataset contains no records or empty values. Please upload or choose another dataset.</div>
        </div>
      `;
      return;
    }

    // Apply Sorting
    let combined = dataResult.labels.map((lbl, i) => ({
      label: lbl,
      value: dataResult.values[i] || 0
    }));

    if (sortOrder === "desc") {
      combined.sort((a, b) => b.value - a.value);
    } else {
      combined.sort((a, b) => a.value - b.value);
    }

    // Apply Top N limit
    if (topNLimit !== "all") {
      const n = parseInt(topNLimit, 10);
      combined = combined.slice(0, n);
    }

    const labels = combined.map(c => c.label);
    const values = combined.map(c => c.value);

    // Render Metrics Strip
    const totalSum = values.reduce((acc, v) => acc + (typeof v === 'number' ? v : 0), 0);
    const avgVal = values.length > 0 ? (totalSum / values.length).toFixed(1) : 0;
    const maxVal = Math.max(...values.map(v => typeof v === 'number' ? v : 0));

    if (kpiWrap) {
      kpiWrap.innerHTML = `
        <div style="padding: 10px 14px; background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
          <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">Items Displayed</div>
          <div style="font-size: 16px; font-weight: 800; color: var(--navy); margin-top: 2px;">${labels.length}</div>
        </div>
        <div style="padding: 10px 14px; background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
          <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">Total Plotted Value</div>
          <div style="font-size: 16px; font-weight: 800; color: var(--saffron); margin-top: 2px;">₹${totalSum.toLocaleString("en-IN")}</div>
        </div>
        <div style="padding: 10px 14px; background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
          <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">Average per Item</div>
          <div style="font-size: 16px; font-weight: 800; color: #10B981; margin-top: 2px;">₹${parseFloat(avgVal).toLocaleString("en-IN")}</div>
        </div>
        <div style="padding: 10px 14px; background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0;">
          <div style="font-size: 10px; font-weight: 700; color: #64748B; text-transform: uppercase;">Peak Value</div>
          <div style="font-size: 16px; font-weight: 800; color: #3B82F6; margin-top: 2px;">₹${maxVal.toLocaleString("en-IN")}</div>
        </div>
      `;
    }

    // Check if Table View requested
    if (activeChartType === "table") {
      targetEl.innerHTML = `
        <div style="max-height: 400px; overflow: auto; border: 1px solid #E2E8F0; border-radius: 8px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
            <thead>
              <tr style="background: #F8FAFC; border-bottom: 2px solid #E2E8F0; text-align: left;">
                <th style="padding: 10px 14px; color: #475569;">#</th>
                <th style="padding: 10px 14px; color: #475569;">Item / Dimension</th>
                <th style="padding: 10px 14px; color: #475569; text-align: right;">Metric Value</th>
              </tr>
            </thead>
            <tbody>
              ${combined.map((c, i) => `
                <tr style="border-bottom: 1px solid #F1F5F9;">
                  <td style="padding: 8px 14px; color: #94A3B8;">${i + 1}</td>
                  <td style="padding: 8px 14px; font-weight: 600; color: var(--navy);">${c.label}</td>
                  <td style="padding: 8px 14px; font-weight: 700; color: var(--saffron); text-align: right;">${typeof c.value === 'number' ? c.value.toLocaleString("en-IN") : c.value}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
      return;
    }

    // Load Plotly
    const Plotly = await ensurePlotly();
    if (!Plotly) {
      targetEl.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--slate);">Plotly library could not be loaded. Check internet connection.</div>`;
      return;
    }

    targetEl.innerHTML = "";

    let traces = [];
    let layout = {
      margin: { t: 20, r: 20, l: 50, b: 60 },
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      font: { family: "Inter, sans-serif", size: 11, color: "#475569" },
      xaxis: { gridcolor: "#F1F5F9", tickangle: labels.length > 6 ? -30 : 0 },
      yaxis: { gridcolor: "#F1F5F9" },
      hovermode: "closest"
    };

    if (activeChartType === "bar") {
      traces.push({
        x: labels,
        y: values,
        type: "bar",
        marker: {
          color: "#E99A3A",
          opacity: 0.9,
          line: { color: "#D97706", width: 1.5 }
        }
      });
    } else if (activeChartType === "line") {
      traces.push({
        x: labels,
        y: values,
        type: "scatter",
        mode: "lines+markers",
        line: { color: "#10B981", width: 3, shape: "spline" },
        marker: { size: 6, color: "#047857" }
      });
    } else if (activeChartType === "area") {
      traces.push({
        x: labels,
        y: values,
        type: "scatter",
        mode: "lines",
        fill: "tozeroy",
        fillcolor: "rgba(233, 154, 58, 0.2)",
        line: { color: "#E99A3A", width: 2.5 }
      });
    } else if (activeChartType === "pie") {
      traces.push({
        labels: labels,
        values: values,
        type: "pie",
        hole: 0.45,
        marker: {
          colors: ["#E99A3A", "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EC4899", "#06B6D4", "#6366F1", "#14B8A6"]
        }
      });
    } else if (activeChartType === "scatter") {
      traces.push({
        x: labels,
        y: values,
        type: "scatter",
        mode: "markers",
        marker: { size: 10, color: "#3B82F6", opacity: 0.8 }
      });
    }

    Plotly.newPlot(targetEl, traces, layout, { responsive: true, displayModeBar: false });
  }

  // =========================================================================
  // DATA AGGREGATION HELPERS
  // =========================================================================
  function aggregateTopN(rows, groupCol, valCol) {
    if (!rows || rows.length === 0) return { labels: [], values: [] };
    const firstRow = rows[0] || {};
    const keys = Object.keys(firstRow);
    const resolvedGroupCol = (groupCol && firstRow.hasOwnProperty(groupCol))
      ? groupCol
      : (keys.find(k => /product|item|category|name|title|particular|sku|customer|city|region/i.test(k)) || keys[0]);
    const resolvedValCol = (valCol && firstRow.hasOwnProperty(valCol))
      ? valCol
      : (keys.find(k => /sale|revenue|amount|total|price|inr|amt|net|qty/i.test(k)) || null);

    const map = {};
    rows.forEach(r => {
      const g = String(r[resolvedGroupCol] !== undefined && r[resolvedGroupCol] !== null ? r[resolvedGroupCol] : "Unknown").trim();
      if (!g) return;
      let v = 1;
      if (resolvedValCol && r[resolvedValCol] !== undefined && r[resolvedValCol] !== null) {
        const cleaned = String(r[resolvedValCol]).replace(/[₹,$\s]/g, "");
        const num = parseFloat(cleaned);
        v = isNaN(num) ? 1 : num;
      }
      map[g] = (map[g] || 0) + v;
    });

    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return {
      labels: sorted.map(x => x[0]),
      values: sorted.map(x => parseFloat(x[1].toFixed(2)))
    };
  }

  function aggregateCategoryShare(rows, groupCol, valCol) {
    return aggregateTopN(rows, groupCol, valCol);
  }

  function aggregateFrequency(rows, groupCol) {
    if (!rows || rows.length === 0) return { labels: [], values: [] };
    const firstRow = rows[0] || {};
    const keys = Object.keys(firstRow);
    const resolvedGroupCol = (groupCol && firstRow.hasOwnProperty(groupCol))
      ? groupCol
      : (keys.find(k => /product|item|category|name|type|sku|city/i.test(k)) || keys[0]);

    const map = {};
    rows.forEach(r => {
      const g = String(r[resolvedGroupCol] !== undefined && r[resolvedGroupCol] !== null ? r[resolvedGroupCol] : "Unknown").trim();
      if (!g) return;
      map[g] = (map[g] || 0) + 1;
    });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return {
      labels: sorted.map(x => x[0]),
      values: sorted.map(x => x[1])
    };
  }

  function aggregateTimeTrend(rows, dateCol, valCol) {
    if (!rows || rows.length === 0) return { labels: [], values: [] };
    const firstRow = rows[0] || {};
    const keys = Object.keys(firstRow);
    const resolvedDateCol = (dateCol && firstRow.hasOwnProperty(dateCol))
      ? dateCol
      : (keys.find(k => /date|time|day|month|year|timestamp|dt|bill/i.test(k)) || keys[0]);
    const resolvedValCol = (valCol && firstRow.hasOwnProperty(valCol))
      ? valCol
      : (keys.find(k => /sale|revenue|amount|total|price|inr|amt|net|qty/i.test(k)) || null);

    const map = {};
    rows.forEach((r, idx) => {
      let d = String(r[resolvedDateCol] !== undefined && r[resolvedDateCol] !== null ? r[resolvedDateCol] : `Entry ${idx + 1}`).trim();
      if (d.includes("T")) d = d.split("T")[0];
      else if (d.includes(" ")) d = d.split(" ")[0];
      if (!d) d = `Entry ${idx + 1}`;

      let v = 1;
      if (resolvedValCol && r[resolvedValCol] !== undefined && r[resolvedValCol] !== null) {
        const cleaned = String(r[resolvedValCol]).replace(/[₹,$\s]/g, "");
        const num = parseFloat(cleaned);
        v = isNaN(num) ? 1 : num;
      }
      map[d] = (map[d] || 0) + v;
    });

    const sortedDates = Object.keys(map).sort();
    return {
      labels: sortedDates,
      values: sortedDates.map(d => parseFloat(map[d].toFixed(2)))
    };
  }

  function aggregateTwoMetrics(rows, groupCol, met1, met2) {
    return aggregateTopN(rows, groupCol, met1);
  }

  // =========================================================================
  // WIRE EVENT LISTENERS
  // =========================================================================
  // Dataset Switcher
  const dsSelect = container.querySelector("#vis-dataset-select");
  if (dsSelect) {
    dsSelect.addEventListener("change", async (e) => {
      activeDatasetId = e.target.value;
      API.setActiveDatasetId(activeDatasetId);
      await loadDatasetSchema();
    });
  }

  // Open in Excel Studio
  const openExcelBtn = container.querySelector("#btn-vis-open-excel");
  if (openExcelBtn) {
    openExcelBtn.addEventListener("click", () => {
      window.navigateTo("#excel-integration");
    });
  }

  // Category Switchboard Tabs
  container.querySelectorAll("#vis-category-tabs .vis-category-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      container.querySelectorAll("#vis-category-tabs .vis-category-pill").forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentCategory = pill.getAttribute("data-cat");
      renderCategoryGraphsList();
    });
  });

  // Chart Type Selector
  container.querySelectorAll("#vis-chart-types-bar .chart-type-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      container.querySelectorAll("#vis-chart-types-bar .chart-type-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeChartType = btn.getAttribute("data-type");
      plotActiveGraph();
    });
  });

  // Top N Filter
  const topNSelect = container.querySelector("#vis-top-n");
  if (topNSelect) {
    topNSelect.addEventListener("change", (e) => {
      topNLimit = e.target.value;
      plotActiveGraph();
    });
  }

  // Sort Order Toggle
  const sortBtn = container.querySelector("#btn-vis-sort");
  if (sortBtn) {
    sortBtn.addEventListener("click", () => {
      sortOrder = sortOrder === "desc" ? "asc" : "desc";
      sortBtn.innerText = sortOrder === "desc" ? "Sort: High → Low" : "Sort: Low → High";
      plotActiveGraph();
    });
  }

  // Download PNG Button
  const downloadBtn = container.querySelector("#btn-vis-download");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      const targetEl = container.querySelector("#vis-plotly-target");
      if (window.Plotly && targetEl) {
        window.Plotly.downloadImage(targetEl, {
          format: "png",
          filename: `${activeGraphDef ? activeGraphDef.id : 'chart'}_vyapar_verse`
        });
      }
    });
  }

  // Natural Language AI Graph Input
  const aiInput = container.querySelector("#vis-ai-input");
  const aiSubmitBtn = container.querySelector("#btn-vis-ai-submit");

  async function handleAIQuery(query) {
    if (!query) return;
    const q = query.toLowerCase();
    const allDefs = Object.values(getCategoryDefinitions()).flat();

    let matched = null;
    if (q.includes("month") || q.includes("trend") || q.includes("time") || q.includes("day")) {
      matched = allDefs.find(x => x.id === "sales_trend");
    } else if (q.includes("category") || q.includes("department") || q.includes("pie") || q.includes("donut")) {
      matched = allDefs.find(x => x.id === "sales_by_category");
    } else if (q.includes("qty") || q.includes("unit") || q.includes("sold")) {
      matched = allDefs.find(x => x.id === "top_products_qty");
    } else if (q.includes("customer") || q.includes("buyer")) {
      matched = allDefs.find(x => x.id === "top_customers");
    } else if (q.includes("city") || q.includes("state") || q.includes("region") || q.includes("store")) {
      matched = allDefs.find(x => x.id === "city_sales");
    } else {
      matched = allDefs.find(x => x.id === "top_products_sales");
    }

    if (matched && isGraphSupported(matched)) {
      activeGraphDef = matched;
      activeChartType = matched.defaultType;
      plotActiveGraph();
    } else if (matched) {
      alert(`The requested graph (${matched.title}) requires column(s): ${getMissingColumnNames(matched).join(", ")}`);
    }
  }

  if (aiSubmitBtn && aiInput) {
    aiSubmitBtn.addEventListener("click", () => handleAIQuery(aiInput.value.trim()));
    aiInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleAIQuery(aiInput.value.trim());
    });
  }

  container.querySelectorAll(".ai-prompt-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      const q = pill.getAttribute("data-q");
      if (aiInput) aiInput.value = q;
      handleAIQuery(q);
    });
  });
}
