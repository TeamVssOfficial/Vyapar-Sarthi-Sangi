import { API } from "../api.js";

export async function renderDatasets(container) {
  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(37,99,235,0.18); color: #2563EB; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(37,99,235,0.15);">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.2"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path><circle cx="12" cy="12" r="1.5" fill="#2563EB"></circle></svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-[#14233D] brand-font" style="margin: 0;">Datasets Management Hub</h1>
            <p class="text-sm text-slate-500" style="margin-top: 2px;">Upload, manage, and inspect raw business data files across your enterprise workspace.</p>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <button onclick="window.navigateTo('#overview')" class="btn btn-outline" style="font-size: 12px; padding: 6px 14px; display: inline-flex; align-items: center; gap: 6px;">
            <span>&larr;</span> Back to Business OS
          </button>
          <button id="btn-show-upload" class="bg-[#14233D] hover:bg-[#0C1729] text-white px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition shadow">
            <i data-lucide="upload" class="w-4 h-4 text-[#E99A3A]"></i> Upload New Dataset
          </button>
        </div>
      </div>

      <!-- Upload Modal (hidden by default) -->
      <div id="upload-modal" class="hidden fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-bold text-[#14233D] brand-font">Upload CSV / Excel Dataset</h3>
            <button id="btn-close-modal" class="text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
          
          <form id="upload-form" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Dataset Name (Optional)</label>
              <input type="text" id="dataset-name-input" placeholder="e.g., Q3 Enterprise Sales Report" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#E99A3A]" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 uppercase mb-1">Select File (.csv, .xlsx, .xls)</label>
              <div id="drop-zone" class="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-[#E99A3A] transition cursor-pointer bg-slate-50">
                <i data-lucide="file-up" class="w-10 h-10 text-[#E99A3A] mx-auto mb-2"></i>
                <div class="text-sm font-medium text-[#14233D] mb-1" id="file-chosen-text">Click to browse or drop file here</div>
                <p class="text-xs text-slate-400">Supported formats: CSV, TSV, XLSX, XLS, JSON (Up to 10 GB)</p>
                <input type="file" id="file-input" accept=".csv,.tsv,.xlsx,.xls,.json" class="hidden" />
              </div>
            </div>

            <div id="upload-progress-container" class="hidden space-y-1">
              <div class="flex justify-between text-xs text-slate-500">
                <span>Reading and analyzing your spreadsheet...</span>
                <span id="upload-progress-text">Processing</span>
              </div>
              <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div id="upload-progress-bar" class="bg-[#E99A3A] h-full w-0 transition-all duration-300"></div>
              </div>
            </div>

            <div id="upload-error" class="hidden text-xs text-red-600 bg-red-50 p-3 rounded-lg border border-red-200"></div>

            <div class="flex justify-end gap-2 pt-2">
              <button type="button" id="btn-cancel-upload" class="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
              <button type="submit" id="btn-submit-upload" class="bg-[#E99A3A] hover:bg-[#D97706] text-[#0C1729] font-bold px-5 py-2 rounded-lg text-sm transition">Upload & Ingest</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Dataset List Container -->
      <div id="datasets-loading" class="text-center py-12 text-slate-500">
        <i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto mb-2 text-[#E99A3A]"></i>
        Retrieving registered business datasets...
      </div>

      <div id="datasets-table-container" class="hidden"></div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Setup modal and dropzone
  const modal = document.getElementById("upload-modal");
  const showBtn = document.getElementById("btn-show-upload");
  const closeBtn = document.getElementById("btn-close-modal");
  const cancelBtn = document.getElementById("btn-cancel-upload");
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");
  const fileChosenText = document.getElementById("file-chosen-text");
  const uploadForm = document.getElementById("upload-form");

  const openModal = () => modal.classList.remove("hidden");
  const closeModal = () => {
    modal.classList.add("hidden");
    uploadForm.reset();
    fileChosenText.innerText = "Click to browse or drop file here";
    document.getElementById("upload-progress-container").classList.add("hidden");
    document.getElementById("upload-error").classList.add("hidden");
  };

  showBtn?.addEventListener("click", openModal);
  closeBtn?.addEventListener("click", closeModal);
  cancelBtn?.addEventListener("click", closeModal);

  dropZone?.addEventListener("click", () => fileInput.click());
  fileInput?.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      fileChosenText.innerText = `Selected: ${e.target.files[0].name} (${(e.target.files[0].size / 1024 / 1024).toFixed(2)} MB)`;
    }
  });

  dropZone?.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("border-[#E99A3A]", "bg-[#E99A3A]/5");
  });
  dropZone?.addEventListener("dragleave", () => {
    dropZone.classList.remove("border-[#E99A3A]", "bg-[#E99A3A]/5");
  });
  dropZone?.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("border-[#E99A3A]", "bg-[#E99A3A]/5");
    if (e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;
      fileChosenText.innerText = `Selected: ${e.dataTransfer.files[0].name} (${(e.dataTransfer.files[0].size / 1024 / 1024).toFixed(2)} MB)`;
    }
  });

  // Handle Form Submission
  uploadForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!fileInput.files || fileInput.files.length === 0) {
      alert("Please select a CSV or Excel file to upload.");
      return;
    }

    const file = fileInput.files[0];
    const name = document.getElementById("dataset-name-input").value;
    const progressContainer = document.getElementById("upload-progress-container");
    const progressBar = document.getElementById("upload-progress-bar");
    const errBox = document.getElementById("upload-error");
    const submitBtn = document.getElementById("btn-submit-upload");

    errBox.classList.add("hidden");
    progressContainer.classList.remove("hidden");
    progressBar.style.width = "5%";
    submitBtn.disabled = true;

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (name.trim()) formData.append("name", name.trim());

      const res = await API.uploadDataset(formData, (pct) => {
        progressBar.style.width = `${pct}%`;
      });
      progressBar.style.width = "100%";

      API.setActiveDatasetId(res.dataset_id);
      closeModal();
      await loadDatasetList();
    } catch (err) {
      errBox.innerText = err.message || "Failed to upload file.";
      errBox.classList.remove("hidden");
    } finally {
      submitBtn.disabled = false;
    }
  });

  await loadDatasetList();
}

async function loadDatasetList() {
  const loadingEl = document.getElementById("datasets-loading");
  const tableContainer = document.getElementById("datasets-table-container");

  if (!API.getToken()) {
    if (loadingEl) loadingEl.classList.add("hidden");
    if (tableContainer) {
      tableContainer.classList.remove("hidden");
      tableContainer.innerHTML = `
        <div class="vss-card" style="padding: 40px; text-align: center; max-width: 500px; margin: 20px auto;">
          <h3 style="font-size: 16px; font-weight: 800; color: var(--navy); margin-bottom: 8px;">Workspace Authentication Required</h3>
          <p style="font-size: 13px; color: var(--slate); margin-bottom: 20px;">Please sign in to your enterprise account to manage and inspect business datasets.</p>
          <button onclick="window.openDirectAuthModal()" class="btn btn-saffron" style="padding: 8px 18px;">Sign In to Workspace</button>
        </div>
      `;
    }
    return;
  }

  try {
    const datasets = await API.listDatasets();
    if (loadingEl) loadingEl.classList.add("hidden");
    if (tableContainer) tableContainer.classList.remove("hidden");

    if (datasets.length === 0) {
      if (tableContainer) {
        tableContainer.innerHTML = `
          <div class="vss-card p-12 text-center max-w-lg mx-auto">
            <div class="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <i data-lucide="file-question" class="w-8 h-8"></i>
            </div>
            <h3 class="font-bold text-[#14233D] mb-1">No Datasets Uploaded Yet</h3>
            <p class="text-sm text-slate-500 mb-4">Click 'Upload New Dataset' above to ingest CSV or Excel files into this business workspace.</p>
          </div>
        `;
      }
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const activeId = API.getActiveDatasetId();

    if (tableContainer) {
      tableContainer.innerHTML = `
      <div class="vss-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-slate-50 text-slate-600 uppercase text-xs border-b">
              <tr>
                <th class="px-6 py-3.5">Dataset Name</th>
                <th class="px-6 py-3.5">Rows</th>
                <th class="px-6 py-3.5">Columns</th>
                <th class="px-6 py-3.5">File Size</th>
                <th class="px-6 py-3.5">Status</th>
                <th class="px-6 py-3.5">Uploaded</th>
                <th class="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${datasets.map(d => {
                const isActive = d.id === activeId;
                const sizeMb = (d.file_size_bytes / 1024 / 1024).toFixed(2);
                const dateStr = new Date(d.created_at).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
                return `
                  <tr class="hover:bg-slate-50/80 transition ${isActive ? 'bg-[#E99A3A]/5 font-medium' : ''}">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        <i data-lucide="file-spreadsheet" class="w-4 h-4 text-[#E99A3A]"></i>
                        <div>
                          <div class="text-[#14233D] font-semibold">${d.name}</div>
                          <div class="text-xs text-slate-400">${d.filename}</div>
                        </div>
                        ${isActive ? '<span class="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-[#E99A3A] text-white uppercase">Active</span>' : ''}
                      </div>
                    </td>
                    <td class="px-6 py-4 text-slate-600">${d.row_count.toLocaleString()}</td>
                    <td class="px-6 py-4 text-slate-600">${d.col_count}</td>
                    <td class="px-6 py-4 text-slate-600">${sizeMb} MB</td>
                    <td class="px-6 py-4">
                      <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold badge-green">${d.status}</span>
                    </td>
                    <td class="px-6 py-4 text-slate-500 text-xs">${dateStr}</td>
                    <td class="px-6 py-4 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button onclick="window.setAsActiveDataset('${d.id}')" title="Set as Active Analysis Target" class="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition">
                          <i data-lucide="check-circle-2" class="w-4 h-4 ${isActive ? 'text-[#31856C]' : ''}"></i>
                        </button>
                        <button onclick="window.openInStudio('${d.id}')" title="Inspect in Data Studio" class="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition">
                          <i data-lucide="external-link" class="w-4 h-4"></i>
                        </button>
                        <button onclick="window.deleteDataset('${d.id}')" title="Delete Dataset" class="p-1.5 rounded hover:bg-red-50 text-red-500 transition">
                          <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    }

    if (window.lucide) window.lucide.createIcons();

    // Attach global helper methods for inline action buttons
    window.setAsActiveDataset = (id) => {
      API.setActiveDatasetId(id);
      loadDatasetList();
      window.dispatchEvent(new CustomEvent("vss:dataset-changed", { detail: { id } }));
    };

    window.openInStudio = (id) => {
      API.setActiveDatasetId(id);
      window.navigateTo("#bi-dashboard");
    };

    window.deleteDataset = async (id) => {
      if (confirm("Are you sure you want to delete this dataset? This will remove all associated analyses and models.")) {
        try {
          await API.deleteDataset(id);
          if (API.getActiveDatasetId() === id) {
            API.setActiveDatasetId(null);
          }
          await loadDatasetList();
        } catch (e) {
          alert("Error deleting dataset: " + e.message);
        }
      }
    };

  } catch (err) {
    console.error("Error loading datasets:", err);
    if (tableContainer) {
      tableContainer.innerHTML = `<div class="p-6 text-red-600 text-center">Failed to load datasets: ${err.message}</div>`;
    }
  }
}
