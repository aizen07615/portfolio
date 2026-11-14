// ===== ADMIN: EXPERIENCE =====
// Uses db, escapeText, escapeAttr, showStatus, uploadFile, removeStoredFile
// and previewUrl from the earlier admin files.

const expBody = document.getElementById("exp-body");
const expMessage = document.getElementById("exp-message");
const expForm = document.getElementById("exp-form");

let expRows = [];
let editingExpId = null;

function renderExperience() {
  if (expRows.length === 0) {
    expBody.innerHTML = '<tr><td colspan="6">No jobs yet. Click "+ Add Job".</td></tr>';
    return;
  }

  expBody.innerHTML = expRows.map(function (j) {
    const logo = j.logo_url
      ? '<img class="admin-thumb" src="' + escapeAttr(previewUrl(j.logo_url)) + '" alt="" />'
      : '<span class="admin-no-pic">None</span>';

    return (
      "<tr>" +
      "<td>" + logo + "</td>" +
      "<td><strong>" + escapeText(j.position) + "</strong></td>" +
      "<td>" + escapeText(j.company) + "</td>" +
      "<td>" + escapeText(j.period) + "</td>" +
      '<td><input type="number" class="order-input" data-exp-id="' + j.id + '" value="' + j.sort_order + '" step="1" /></td>' +
      '<td class="admin-actions">' +
      '<button class="admin-btn" data-exp-action="edit" data-id="' + j.id + '">Edit</button>' +
      '<button class="admin-btn danger" data-exp-action="delete" data-id="' + j.id + '">Delete</button>' +
      "</td></tr>"
    );
  }).join("");
}

async function loadAdminExperience() {
  const result = await db
    .from("experiences")
    .select("*")
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false });

  if (result.error) {
    console.error(result.error);
    expBody.innerHTML = '<tr><td colspan="6">Could not load experience.</td></tr>';
    return;
  }

  expRows = result.data;
  renderExperience();
}

// ----- Open / close the form -----
function openExpForm(job) {
  editingExpId = job ? job.id : null;
  expForm.reset();

  document.getElementById("exp-form-title").textContent = job ? "Edit Job" : "Add Job";
  document.getElementById("e-position").value = job ? job.position : "";
  document.getElementById("e-company").value = job ? job.company : "";
  document.getElementById("e-period").value = job ? job.period : "";
  document.getElementById("e-type").value = job && job.job_type ? job.job_type : "";
  document.getElementById("e-location").value = job && job.location ? job.location : "";
  document.getElementById("e-details").value = job ? job.details : "";

  const nextOrder = expRows.length
    ? Math.max.apply(null, expRows.map(function (r) { return r.sort_order; })) + 1
    : 1;
  document.getElementById("e-order").value = job ? job.sort_order : nextOrder;

  document.getElementById("exp-current-logo").innerHTML = job && job.logo_url
    ? '<img class="admin-thumb" src="' + escapeAttr(previewUrl(job.logo_url)) + '" alt="" />' +
      '<label class="check-label"><input type="checkbox" id="remove-exp-logo" /> Remove current logo</label>' +
      "<small>Choose a new logo below to replace it.</small>"
    : "";

  expForm.classList.remove("hide");
  expForm.scrollIntoView();
}

function closeExpForm() {
  expForm.classList.add("hide");
  editingExpId = null;
}

document.getElementById("add-exp-btn").addEventListener("click", function () {
  showStatus(expMessage, "", "info");
  openExpForm(null);
});

document.getElementById("cancel-exp-btn").addEventListener("click", closeExpForm);

// ----- Edit and Delete buttons -----
expBody.addEventListener("click", async function (event) {
  const button = event.target.closest("button[data-exp-action]");
  if (!button) return;

  const id = Number(button.getAttribute("data-id"));
  const job = expRows.find(function (j) { return j.id === id; });
  if (!job) return;

  if (button.getAttribute("data-exp-action") === "edit") {
    showStatus(expMessage, "", "info");
    openExpForm(job);
    return;
  }

  if (!confirm('Delete "' + job.position + '" at ' + job.company + "? This cannot be undone.")) return;

  const result = await db.from("experiences").delete().eq("id", id);
  if (result.error) {
    console.error(result.error);
    showStatus(expMessage, "Could not delete the job.", "error");
    return;
  }

  await removeStoredFile(job.logo_url);
  showStatus(expMessage, "Job deleted.", "info");
  loadAdminExperience();
});

// ----- Order number -----
expBody.addEventListener("change", async function (event) {
  const input = event.target.closest("input[data-exp-id]");
  if (!input) return;

  const number = parseInt(input.value, 10);
  if (Number.isNaN(number)) {
    showStatus(expMessage, "Please type a whole number.", "error");
    return;
  }

  const result = await db
    .from("experiences")
    .update({ sort_order: number })
    .eq("id", Number(input.getAttribute("data-exp-id")));

  if (result.error) {
    console.error(result.error);
    showStatus(expMessage, "Could not save the order.", "error");
    return;
  }

  showStatus(expMessage, "Order saved.", "info");
  loadAdminExperience();
});

// ----- Save (add or edit) -----
expForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const saveButton = document.getElementById("save-exp-btn");
  const logoFile = document.getElementById("e-logo").files[0];

  if (logoFile) {
    const okTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!okTypes.includes(logoFile.type)) {
      showStatus(expMessage, "The logo must be JPG, PNG or WEBP.", "error");
      return;
    }
    if (logoFile.size > 2 * 1024 * 1024) {
      showStatus(expMessage, "The logo is over 2 MB.", "error");
      return;
    }
  }

  saveButton.disabled = true;
  showStatus(expMessage, "Saving...", "info");

  try {
    const existing = editingExpId ? expRows.find(function (j) { return j.id === editingExpId; }) : null;

    let logoUrl = existing ? existing.logo_url : null;
    const oldToDelete = [];

    const removeLogo = document.getElementById("remove-exp-logo");
    if (removeLogo && removeLogo.checked) {
      oldToDelete.push(logoUrl);
      logoUrl = null;
    }

    if (logoFile) {
      if (logoUrl) oldToDelete.push(logoUrl);
      logoUrl = await uploadFile(logoFile);
    }

    const typeValue = document.getElementById("e-type").value.trim();
    const locationValue = document.getElementById("e-location").value.trim();
    const orderValue = parseInt(document.getElementById("e-order").value, 10);

    const record = {
      position: document.getElementById("e-position").value.trim(),
      company: document.getElementById("e-company").value.trim(),
      period: document.getElementById("e-period").value.trim(),
      job_type: typeValue === "" ? null : typeValue,
      location: locationValue === "" ? null : locationValue,
      details: document.getElementById("e-details").value.trim(),
      sort_order: Number.isNaN(orderValue) ? 0 : orderValue,
      logo_url: logoUrl,
    };

    const result = editingExpId
      ? await db.from("experiences").update(record).eq("id", editingExpId)
      : await db.from("experiences").insert(record);

    if (result.error) {
      throw result.error;
    }

    for (const oldUrl of oldToDelete) {
      await removeStoredFile(oldUrl);
    }

    closeExpForm();
    showStatus(expMessage, "Job saved. It is now live on your Experience page.", "info");
    loadAdminExperience();
  } catch (error) {
    console.error(error);
    showStatus(expMessage, "Could not save the job. Press F12 and check the Console for details.", "error");
  }

  saveButton.disabled = false;
});

// Start (only when logged in)
db.auth.getSession().then(function (result) {
  if (result.data.session) {
    loadAdminExperience();
  }
});