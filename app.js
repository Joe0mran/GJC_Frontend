// app.js

// ==========================
// CONFIG
// ==========================
const API_BASE_URL = "https://gjc.somee.com";
const API_CUSTOMERS = `${API_BASE_URL}/api/customer`;

// ==========================
// DOM
// ==========================
const tbody = document.getElementById("tbody");
const detailsBody = document.getElementById("detailsBody");
const searchInput = document.getElementById("searchInput");
const emptyState = document.getElementById("emptyState");
const errorState = document.getElementById("errorState");
const selectedBadge = document.getElementById("selectedBadge");
const countBadge = document.getElementById("countBadge");

const btnClear = document.getElementById("btnClear");
const btnDelete = document.getElementById("btnDelete");
const btnPrint = document.getElementById("btnPrint");
const btnEdit = document.getElementById("btnEdit");
const btnAdd = document.getElementById("btnAdd");

// Edit modal DOM
const editModal = document.getElementById("editModal");
const btnCloseEdit = document.getElementById("btnCloseEdit");
const btnCancelEdit = document.getElementById("btnCancelEdit");
const editForm = document.getElementById("editForm");

const editFirstName = document.getElementById("editFirstName");
const editLastName = document.getElementById("editLastName");
const editPhoneNumber = document.getElementById("editPhoneNumber");
const editIgAccount = document.getElementById("editIgAccount");
const editCountry = document.getElementById("editCountry");
const editCity = document.getElementById("editCity");
const editAddressLine = document.getElementById("editAddressLine");
const editAddressNotes = document.getElementById("editAddressNotes");
const editNotes = document.getElementById("editNotes");
const editSubTitle = document.getElementById("editSubTitle");
const editEmail = document.getElementById("editEmail");


// ==========================
// STATE
// ==========================
let customers = [];
let selectedId = null;         // customerId
let selectedCustomer = null;

// ==========================
// HELPERS
// ==========================
function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[c]));
}

function showError(msg) {
  errorState.style.display = "block";
  errorState.textContent = msg;
}

function clearError() {
  errorState.style.display = "none";
  errorState.textContent = "";
}

function showEmpty(show) {
  emptyState.style.display = show ? "block" : "none";
}

function fullName(c) {
  const f = String(c?.firstName ?? "").trim();
  const l = String(c?.lastName ?? "").trim();
  const combined = `${f} ${l}`.trim();
  return combined || "(No name)";
}

// ==========================
// API
// ==========================
async function apiGetAllCustomers() {
  const res = await fetch(API_CUSTOMERS);
  if (!res.ok) throw new Error(`GET /api/customer failed: ${res.status}`);
  return await res.json();
}

async function apiGetCustomerById(id) {
  const res = await fetch(`${API_CUSTOMERS}/${id}`);
  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`GET /api/customer/${id} failed: ${res.status}`);
  }
  return await res.json();
}

async function apiSearchCustomers(q) {
  const url = `${API_CUSTOMERS}/search?q=${encodeURIComponent(q)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET /api/customer/search failed: ${res.status}`);
  return await res.json();
}

async function apiUpdateCustomer(id, payload) {
  const res = await fetch(`${API_CUSTOMERS}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let msg = `PUT /api/customer/${id} failed: ${res.status}`;
    try { msg += "\n" + await res.text(); } catch {}
    throw new Error(msg);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function apiDeleteCustomer(id) {
  const res = await fetch(`${API_CUSTOMERS}/${id}`, { method: "DELETE" });

  if (!res.ok) {
    let msg = `DELETE /api/customer/${id} failed: ${res.status}`;
    try { msg += "\n" + await res.text(); } catch {}
    throw new Error(msg);
  }
}

// ==========================
// RENDER
// ==========================
function renderTable(list) {
  tbody.innerHTML = "";
  countBadge.textContent = String(list.length);

  if (!list || list.length === 0) {
    showEmpty(true);
    return;
  }

  showEmpty(false);

  for (const c of list) {
    const tr = document.createElement("tr");
    tr.dataset.id = c.customerId;

    if (c.customerId === selectedId) tr.classList.add("active");

    const name = fullName(c);
    const phone = String(c.phoneNumber ?? "");
    const city = String(c.city ?? "");

    tr.innerHTML = `
      <td>
        <div style="font-weight:800">${escapeHtml(name)}</div>
        <div class="muted">ID: ${escapeHtml(c.customerId)}</div>
      </td>
      <td>${escapeHtml(phone)}</td>
      <td>${escapeHtml(city)}</td>
      <td>
        <div class="table-actions">
          <div class="icon-btn" title="View details" data-action="view">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
          <div class="icon-btn" title="Print" data-action="print">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9V2h12v7"/>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <path d="M6 14h12v8H6z"/>
            </svg>
          </div>
        </div>
      </td>
    `;

    tr.addEventListener("click", async (e) => {
      const action = e.target.closest("[data-action]")?.dataset.action;

      if (action === "print") {
        await selectCustomer(c.customerId);
        printSelectedCustomer();
        e.stopPropagation();
        return;
      }

      await selectCustomer(c.customerId);
    });

    tbody.appendChild(tr);
  }
}

function renderDetails(c) {
  if (!c) {
    selectedBadge.textContent = "None";
    detailsBody.innerHTML = `<div class="empty">Select a customer from the list to view details here.</div>`;
    return;
  }

  selectedBadge.textContent = String(c.customerId);

  const rows = [
    ["Name", fullName(c)],
    ["Phone", c.phoneNumber ?? ""],
    ["Email", c.email ?? ""],
    ["Instagram", c.igAccount ?? ""],
    ["Country", c.country ?? ""],
    ["City", c.city ?? ""],
    ["Address", c.addressLine ?? ""],
    ["Address Notes", c.addressNotes ?? ""],
    ["Notes", c.notes ?? ""],
  ];


  detailsBody.innerHTML = rows.map(([k, v]) => `
    <div class="kv">
      <div class="k">${escapeHtml(k)}</div>
      <div class="v">${escapeHtml(v)}</div>
    </div>
  `).join("");
}

// ==========================
// ACTIONS
// ==========================
async function selectCustomer(id) {
  selectedId = id;

  const c = await apiGetCustomerById(id);
  selectedCustomer = c;

  renderTable(customers);
  renderDetails(c);
}

function printSelectedCustomer() {
  if (!selectedCustomer) {
    alert("Select a customer first.");
    return;
  }

  const printableRows = [
    ["Name", fullName(selectedCustomer)],
    ["Phone", selectedCustomer.phoneNumber ?? ""],
    ["Country", selectedCustomer.country ?? ""],
    ["City", selectedCustomer.city ?? ""],
    ["Address", selectedCustomer.addressLine ?? ""],
    ["Address Notes", selectedCustomer.addressNotes ?? ""],
    ["Notes", selectedCustomer.notes ?? ""],
  ];

  const rowsHtml = printableRows.map(([k, v]) => {
    return '<div class="row"><span class="k">' + escapeHtml(k) + '</span> ' + escapeHtml(v) + '</div>';
  }).join("");

  const html =
  '<html><head><title>Print Customer</title>' +
  '<style>' +
  'body{font-family:Inter,Arial,sans-serif;padding:28px;font-size:16px;}' +
  'h1{margin:0 0 18px;font-size:26px;}' +
  '.row{margin:10px 0;font-size:18px;}' +
  '.k{color:#555;font-weight:800;display:inline-block;width:160px;font-size:18px;}' +
  '</style></head><body>' +
    '<h1>Customer Details</h1>' +
    rowsHtml +
    '<script>window.print();<\/script>' +
    '</body></html>';

  const w = window.open("", "_blank", "width=640,height=720");
  w.document.open();
  w.document.write(html);
  w.document.close();
}

// ----- Edit Modal -----
function openEditModal(customer) {
  if (!customer) return;

  editSubTitle.textContent = `Editing: ${fullName(customer)} (ID: ${customer.customerId})`;

  editFirstName.value = customer.firstName ?? "";
  editLastName.value = customer.lastName ?? "";
  editEmail.value = customer.email ?? "";
  editPhoneNumber.value = customer.phoneNumber ?? "";
  editIgAccount.value = customer.igAccount ?? "";
  editCountry.value = customer.country ?? "";
  editCity.value = customer.city ?? "";
  editAddressLine.value = customer.addressLine ?? "";
  editAddressNotes.value = customer.addressNotes ?? "";
  editNotes.value = customer.notes ?? "";

  editModal.style.display = "block";
}

function closeEditModal() {
  editModal.style.display = "none";
}

function buildEditPayload() {
  const payload = {
    firstName: editFirstName.value.trim(),
    lastName: editLastName.value.trim(),
    email: editEmail.value.trim(),
    phoneNumber: editPhoneNumber.value.trim(),
    igAccount: editIgAccount.value.trim(),
    notes: editNotes.value.trim(),
    country: editCountry.value.trim(),
    city: editCity.value.trim(),
    addressLine: editAddressLine.value.trim(),
    addressNotes: editAddressNotes.value.trim(),
  };

  if (!payload.firstName) {
    throw new Error("First name is required.");
  }

  if (!payload.lastName) {
    throw new Error("Last name is required.");
  }

  if (!payload.phoneNumber) {
    throw new Error("Phone number is required.");
  }

  console.log("PUT payload:", payload);

  return payload;
}

// ==========================
// SEARCH / LOAD
// ==========================
let searchTimer = null;

async function runSearchOrLoadAll() {
  const q = searchInput.value.trim();

  try {
    clearError();

    customers = !q ? await apiGetAllCustomers() : await apiSearchCustomers(q);

    if (selectedId != null && !customers.some(x => x.customerId === selectedId)) {
      selectedId = null;
      selectedCustomer = null;
      renderDetails(null);
    }

    renderTable(customers);
  } catch (err) {
    showError("API error. Make sure backend is running.\n\n" + String(err));
  }
}

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(runSearchOrLoadAll, 300);
});

btnClear.addEventListener("click", async () => {
  searchInput.value = "";
  await runSearchOrLoadAll();
});

// ==========================
// BUTTONS
// ==========================
btnPrint.addEventListener("click", () => {
  printSelectedCustomer();
});

btnEdit.addEventListener("click", () => {
  if (!selectedCustomer || selectedId == null) {
    alert("Select a customer first.");
    return;
  }
  openEditModal(selectedCustomer);
});

btnAdd.addEventListener("click", () => {
  window.location.href = "./index.html";
});

btnDelete.addEventListener("click", async () => {
  if (selectedId == null) return alert("Select a customer first.");

  const ok = confirm("Are you sure you want to delete this customer?");
  if (!ok) return;

  try {
    clearError();

    await apiDeleteCustomer(selectedId);

    closeEditModal();

    selectedId = null;
    selectedCustomer = null;
    renderDetails(null);

    await runSearchOrLoadAll();
  } catch (err) {
    showError("Delete failed.\n\n" + String(err));
  }
});

btnCloseEdit.addEventListener("click", closeEditModal);
btnCancelEdit.addEventListener("click", closeEditModal);

editModal.addEventListener("click", (e) => {
  if (e.target?.dataset?.close === "true") closeEditModal();
});

editForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (selectedId == null) return;

  try {
    clearError();

    const payload = buildEditPayload();
    await apiUpdateCustomer(selectedId, payload);

    await runSearchOrLoadAll();

    const c = await apiGetCustomerById(selectedId);
    selectedCustomer = c;

    renderDetails(c);
    renderTable(customers);

    closeEditModal();
  } catch (err) {
    showError("Update failed.\n\n" + String(err));
  }
});

// ==========================
// INIT
// ==========================
(async function init() {
  await runSearchOrLoadAll();

  if (customers.length > 0) {
    await selectCustomer(customers[0].customerId);
  }
})();
