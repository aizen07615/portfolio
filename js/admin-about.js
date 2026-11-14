// ===== ADMIN: ABOUT TEXT AND CERTIFICATES =====
// Uses db, escapeText, escapeAttr, showStatus, uploadFile, removeStoredFile
// and previewUrl from the earlier admin files.

// ---------- ABOUT TEXT ----------
const aboutForm = document.getElementById("about-form");
const aboutMessage = document.getElementById("about-message");

async function loadAdminAbout() {
  const result = await db.from("about").select("*").eq("id", 1).single();

  if (result.error) {
    console.error(result.error);
    showStatus(aboutMessage, "Could not load the About text.", "error");
    return;
  }

  document.getElementById("a-headline").value = result.data.headline;
  document.getElementById("a-subline").value = result.data.subline || "";
  document.getElementById("a-background").value = result.data.background;
}

aboutForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const saveButton = document.getElementById("save-about-btn");
  saveButton.disabled = true;
  showStatus(aboutMessage, "Saving...", "info");

  const sublineValue = document.getElementById("a-subline").value.trim();

  const result = await db
    .from("about")
    .update({
      headline: document.getElementById("a-headline").value.trim(),
      subline: sublineValue === "" ? null : sublineValue,
      background: document.getElementById("a-background").value.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  saveButton.disabled = false;

  if (result.error) {
    console.error(result.error);
    showStatus(aboutMessage, "Could not save. Press F12 and check the Console.", "error");
    return;
  }

  showStatus(aboutMessage, "Saved. Your About page is updated.", "info");
});

// ---------- CERTIFICATES ----------
const certBody = document.getElementById("cert-body");
const certMessage = document.getElementById("cert-message");
const certForm = document.getElementById("cert-form");

let certRows = [];
let editingCertId = null;

function renderCertificates() {
  if (certRows.length === 0) {
    certBody.innerHTML = '<tr><td colspan="5">No certificates yet. Click "+ Add Certificate".</td></tr>';
    return;
  }

  certBody.innerHTML = certRows.map(function (c) {
    let preview;
    if (c.image_url) {
      preview = '<img class="admin-thumb" src="' + escapeAttr(previewUrl(c.image_url)) + '" alt="" />';
    } else if (c.file_url) {
      preview = '<a href="' + escapeAttr(previewUrl(c.file_url)) + '" target="_blank">File only</a>';
    } else {
      preview = '<span class="admin-no-pic">None</span>';
    }

    return (
      "<tr>" +
      "<td>" + preview + "</td>" +
      "<td><strong>" + escapeText(c.title) + "</strong></td>" +
      "<td>" + escapeText(c.issuer || "") + "</td>" +
      '<td><input type="number" class="order-input" data-cert-id="' + c.id + '" value="' + c.sort_order + '" step="1" /></td>' +
      '<td class="admin-actions">' +
      '<button class="admin-btn" data-cert-action="edit" data-id="' + c.id + '">Edit</button>' +
      '<button class="admin-btn danger" data-cert-action="delete" data-id="' + c.id + '">Delete</button>' +
      "</td></tr>"
    );
  }).join("");
}

async function loadAdminCertificates() {
  const result = await db
    .from("certificates")
    .select("*")
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false });

  if (result.error) {
    console.error(result.error);
    certBody.innerHTML = '<tr><td colspan="5">Could not load certificates.</td></tr>';
    return;
  }

  certRows = result.data;
  renderCertificates();
}

function openCertForm(cert) {
  editingCertId = cert ? cert.id : null;
  certForm.reset();

  document.getElementById("cert-form-title").textContent = cert ? "Edit Certificate" : "Add Certificate";
  document.getElementById("c-title").value = cert ? cert.title : "";
  document.getElementById("c-issuer").value = cert && cert.issuer ? cert.issuer : "";

  const nextOrder = certRows.length
    ? Math.max.apply(null, certRows.map(function (r) { return r.sort_order; })) + 1
    : 1;
  document.getElementById("c-order").value = cert ? cert.sort_order : nextOrder;

  document.getElementById("cert-current-image").innerHTML = cert && cert.image_url
    ? '<img class="admin-thumb" src="' + escapeAttr(previewUrl(cert.image_url)) + '" alt="" />' +
      '<label class="check-label"><input type="checkbox" id="remove-cert-image" /> Remove current picture</label>' +
      "<small>Choose a new picture below to replace it.</small>"
    : "";

  document.getElementById("cert-current-file").innerHTML = cert && cert.file_url
    ? '<a href="' + escapeAttr(previewUrl(cert.file_url)) + '" target="_blank">Current file</a>' +
      '<label class="check-label"><input type="checkbox" id="remove-cert-file" /> Remove current file</label>' +
      "<small>Choose a new file below to replace it.</small>"
    : "";

  certForm.classList.remove("hide");
  certForm.scrollIntoView();
}

function closeCertForm() {
  certForm.classList.add("hide");
  editingCertId = null;
}

document.getElementById("add-cert-btn").addEventListener("click", function () {
  showStatus(certMessage, "", "info");
  openCertForm(null);
});

document.getElementById("cancel-cert-btn").addEventListener("click", closeCertForm);

// Edit and Delete
certBody.addEventListener("click", async function (event) {
  const button = event.target.closest("button[data-cert-action]");
  if (!button) return;

  const id = Number(button.getAttribute("data-id"));
  const cert = certRows.find(function (c) { return c.id === id; });
  if (!cert) return;

  if (button.getAttribute("data-cert-action") === "edit") {
    showStatus(certMessage, "", "info");
    openCertForm(cert);
    return;
  }

  if (!confirm('Delete the certificate "' + cert.title + '"? This cannot be undone.')) return;

  const result = await db.from("certificates").delete().eq("id", id);
  if (result.error) {
    console.error(result.error);
    showStatus(certMessage, "Could not delete the certificate.", "error");
    return;
  }

  await removeStoredFile(cert.image_url);
  await removeStoredFile(cert.file_url);
  showStatus(certMessage, "Certificate deleted.", "info");
  loadAdminCertificates();
});

// Order number
certBody.addEventListener("change", async function (event) {
  const input = event.target.closest("input[data-cert-id]");
  if (!input) return;

  const number = parseInt(input.value, 10);
  if (Number.isNaN(number)) {
    showStatus(certMessage, "Please type a whole number.", "error");
    return;
  }

  const result = await db
    .from("certificates")
    .update({ sort_order: number })
    .eq("id", Number(input.getAttribute("data-cert-id")));

  if (result.error) {
    console.error(result.error);
    showStatus(certMessage, "Could not save the order.", "error");
    return;
  }

  showStatus(certMessage, "Order saved.", "info");
  loadAdminCertificates();
});

// Save (add or edit)
certForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const saveButton = document.getElementById("save-cert-btn");
  const imageFile = document.getElementById("c-image").files[0];
  const otherFile = document.getElementById("c-file").files[0];
  const existing = editingCertId ? certRows.find(function (c) { return c.id === editingCertId; }) : null;

  const removeImage = document.getElementById("remove-cert-image");
  const removeFile = document.getElementById("remove-cert-file");

  // At least one of picture or file must remain.
  const keepsImage = existing && existing.image_url && !(removeImage && removeImage.checked);
  const keepsFile = existing && existing.file_url && !(removeFile && removeFile.checked);

  if (!imageFile && !otherFile && !keepsImage && !keepsFile) {
    showStatus(certMessage, "Please upload a picture or a file (or both).", "error");
    return;
  }

  if (imageFile) {
    const okTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!okTypes.includes(imageFile.type)) {
      showStatus(certMessage, "The picture must be JPG, PNG or WEBP.", "error");
      return;
    }
    if (imageFile.size > 5 * 1024 * 1024) {
      showStatus(certMessage, "The picture is over 5 MB.", "error");
      return;
    }
  }

  if (otherFile && otherFile.size > 10 * 1024 * 1024) {
    showStatus(certMessage, "The file is over 10 MB.", "error");
    return;
  }

  saveButton.disabled = true;
  showStatus(certMessage, "Saving...", "info");

  try {
    let imageUrl = existing ? existing.image_url : null;
    let fileUrl = existing ? existing.file_url : null;
    const oldToDelete = [];

    if (removeImage && removeImage.checked) {
      oldToDelete.push(imageUrl);
      imageUrl = null;
    }
    if (removeFile && removeFile.checked) {
      oldToDelete.push(fileUrl);
      fileUrl = null;
    }

    if (imageFile) {
      if (imageUrl) oldToDelete.push(imageUrl);
      imageUrl = await uploadFile(imageFile);
    }
    if (otherFile) {
      if (fileUrl) oldToDelete.push(fileUrl);
      fileUrl = await uploadFile(otherFile);
    }

    const issuerValue = document.getElementById("c-issuer").value.trim();
    const orderValue = parseInt(document.getElementById("c-order").value, 10);

    const record = {
      title: document.getElementById("c-title").value.trim(),
      issuer: issuerValue === "" ? null : issuerValue,
      sort_order: Number.isNaN(orderValue) ? 0 : orderValue,
      image_url: imageUrl,
      file_url: fileUrl,
    };

    const result = editingCertId
      ? await db.from("certificates").update(record).eq("id", editingCertId)
      : await db.from("certificates").insert(record);

    if (result.error) {
      throw result.error;
    }

    for (const oldUrl of oldToDelete) {
      await removeStoredFile(oldUrl);
    }

    closeCertForm();
    showStatus(certMessage, "Certificate saved. It is now on your About page.", "info");
    loadAdminCertificates();
  } catch (error) {
    console.error(error);
    showStatus(certMessage, "Could not save the certificate. Press F12 and check the Console.", "error");
  }

  saveButton.disabled = false;
});

// Start (only when logged in)
db.auth.getSession().then(function (result) {
  if (result.data.session) {
    loadAdminAbout();
    loadAdminCertificates();
  }
});