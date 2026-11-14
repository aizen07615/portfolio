// ===== ADMIN DASHBOARD =====

const BUCKET = "project-files";
let projects = [];
let editingId = null;

const adminMessage = document.getElementById("admin-message");
const projectForm = document.getElementById("project-form");
const projectsBody = document.getElementById("projects-body");

function escapeText(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

function showAdminMessage(text, type) {
  adminMessage.className = "form-message " + type;
  adminMessage.textContent = text;
}

// Older pictures may be saved as "images/projects/x.jpg". From the admin
// folder we need "../" in front of them.
function previewUrl(url) {
  if (!url) return "";
  return url.startsWith("http") ? url : "../" + url;
}

// Finds the file name inside the bucket from its public address.
function storagePath(url) {
  if (!url) return null;
  const marker = "/" + BUCKET + "/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}

async function removeStoredFile(url) {
  const path = storagePath(url);
  if (path) {
    await db.storage.from(BUCKET).remove([path]);
  }
}

async function uploadFile(file) {
  const parts = file.name.split(".");
  const extension = parts.length > 1 ? parts.pop().toLowerCase().replace(/[^a-z0-9]/g, "") : "bin";
  const fileName = Date.now() + "-" + Math.random().toString(36).slice(2, 10) + "." + extension;

  const upload = await db.storage.from(BUCKET).upload(fileName, file, { contentType: file.type || undefined });
  if (upload.error) {
    throw upload.error;
  }
  return db.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
}

// ----- Login check -----
async function checkLogin() {
  const result = await db.auth.getSession();
  if (!result.data.session) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

document.getElementById("logout-btn").addEventListener("click", async function () {
  await db.auth.signOut();
  window.location.href = "login.html";
});

// ----- Tabs -----
document.querySelectorAll(".admin-tab").forEach(function (tab) {
  tab.addEventListener("click", function () {
    document.querySelectorAll(".admin-tab").forEach(function (t) { t.classList.remove("active"); });
    tab.classList.add("active");

    document.querySelectorAll(".admin-panel").forEach(function (panel) { panel.classList.add("hide"); });
    document.getElementById("panel-" + tab.getAttribute("data-tab")).classList.remove("hide");
  });
});

// ----- Project list -----
function renderProjects() {
  if (projects.length === 0) {
    projectsBody.innerHTML = '<tr><td colspan="5">No projects yet. Click "+ Add Project".</td></tr>';
    return;
  }

  projectsBody.innerHTML = projects.map(function (p) {
    const thumb = p.image_url
      ? '<img class="admin-thumb" src="' + escapeText(previewUrl(p.image_url)) + '" alt="" />'
      : '<span class="admin-no-pic">None</span>';

    return (
      "<tr>" +
      "<td>" + thumb + "</td>" +
      "<td>" + escapeText(p.title) + "</td>" +
      "<td>" + escapeText(p.category) + "</td>" +
      "<td>" + (p.featured ? "Yes" : "No") + "</td>" +
      '<td class="admin-actions">' +
      '<button class="admin-btn" data-action="edit" data-id="' + p.id + '">Edit</button>' +
      '<button class="admin-btn danger" data-action="delete" data-id="' + p.id + '">Delete</button>' +
      "</td></tr>"
    );
  }).join("");
}

async function loadProjects() {
  const result = await db.from("projects").select("*").order("created_at", { ascending: false });

  if (result.error) {
    console.error(result.error);
    projectsBody.innerHTML = '<tr><td colspan="5">Could not load projects.</td></tr>';
    return;
  }

  projects = result.data;
  renderProjects();
}

// ----- Form open / close -----
function openForm(project) {
  editingId = project ? project.id : null;
  projectForm.reset();

  document.getElementById("form-title").textContent = project ? "Edit Project" : "Add Project";

  document.getElementById("p-title").value = project ? project.title : "";
  document.getElementById("p-description").value = project ? project.description : "";
  document.getElementById("p-category").value = project ? project.category : "monitoring";
  document.getElementById("p-tools").value = project && project.tools ? project.tools : "";
  document.getElementById("p-featured").checked = project ? project.featured : false;

  const currentImage = document.getElementById("current-image");
  const currentFile = document.getElementById("current-file");

  currentImage.innerHTML = project && project.image_url
    ? '<img class="admin-thumb" src="' + escapeText(previewUrl(project.image_url)) + '" alt="" />' +
      '<label class="check-label"><input type="checkbox" id="remove-image" /> Remove current picture</label>' +
      "<small>Choose a new picture below to replace it.</small>"
    : "";

  currentFile.innerHTML = project && project.file_url
    ? '<a href="' + escapeText(previewUrl(project.file_url)) + '" target="_blank">Current file</a>' +
      '<label class="check-label"><input type="checkbox" id="remove-file" /> Remove current file</label>' +
      "<small>Choose a new file below to replace it.</small>"
    : "";

  projectForm.classList.remove("hide");
  projectForm.scrollIntoView();
}

function closeForm() {
  projectForm.classList.add("hide");
  editingId = null;
}

document.getElementById("add-project-btn").addEventListener("click", function () {
  showAdminMessage("", "info");
  openForm(null);
});

document.getElementById("cancel-project-btn").addEventListener("click", closeForm);

// ----- Edit and Delete buttons -----
projectsBody.addEventListener("click", async function (event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = Number(button.getAttribute("data-id"));
  const project = projects.find(function (p) { return p.id === id; });
  if (!project) return;

  if (button.getAttribute("data-action") === "edit") {
    showAdminMessage("", "info");
    openForm(project);
    return;
  }

  // Delete
  if (!confirm('Delete "' + project.title + '"? This cannot be undone.')) return;

  const result = await db.from("projects").delete().eq("id", id);
  if (result.error) {
    console.error(result.error);
    showAdminMessage("Could not delete the project.", "error");
    return;
  }

  await removeStoredFile(project.image_url);
  await removeStoredFile(project.file_url);

  showAdminMessage("Project deleted.", "info");
  loadProjects();
});

// ----- Save (add or edit) -----
projectForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const saveButton = document.getElementById("save-project-btn");
  const imageFile = document.getElementById("p-image").files[0];
  const otherFile = document.getElementById("p-file").files[0];

  // Check files
  if (imageFile) {
    const okTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!okTypes.includes(imageFile.type)) {
      showAdminMessage("The picture must be JPG, PNG or WEBP.", "error");
      return;
    }
    if (imageFile.size > 5 * 1024 * 1024) {
      showAdminMessage("The picture is over 5 MB.", "error");
      return;
    }
  }
  if (otherFile && otherFile.size > 10 * 1024 * 1024) {
    showAdminMessage("The supporting file is over 10 MB.", "error");
    return;
  }

  saveButton.disabled = true;
  showAdminMessage("Saving...", "info");

  try {
    const existing = editingId ? projects.find(function (p) { return p.id === editingId; }) : null;

    let imageUrl = existing ? existing.image_url : null;
    let fileUrl = existing ? existing.file_url : null;
    const oldFilesToDelete = [];

    // Remove checkboxes
    const removeImage = document.getElementById("remove-image");
    const removeFile = document.getElementById("remove-file");
    if (removeImage && removeImage.checked) {
      oldFilesToDelete.push(imageUrl);
      imageUrl = null;
    }
    if (removeFile && removeFile.checked) {
      oldFilesToDelete.push(fileUrl);
      fileUrl = null;
    }

    // Upload replacements
    if (imageFile) {
      if (imageUrl) oldFilesToDelete.push(imageUrl);
      imageUrl = await uploadFile(imageFile);
    }
    if (otherFile) {
      if (fileUrl) oldFilesToDelete.push(fileUrl);
      fileUrl = await uploadFile(otherFile);
    }

    const toolsValue = document.getElementById("p-tools").value.trim();

    const record = {
      title: document.getElementById("p-title").value.trim(),
      description: document.getElementById("p-description").value.trim(),
      category: document.getElementById("p-category").value,
      tools: toolsValue === "" ? null : toolsValue,
      featured: document.getElementById("p-featured").checked,
      image_url: imageUrl,
      file_url: fileUrl,
    };

    const result = editingId
      ? await db.from("projects").update(record).eq("id", editingId)
      : await db.from("projects").insert(record);

    if (result.error) {
      throw result.error;
    }

    // Clean up old files only after the save worked.
    for (const oldUrl of oldFilesToDelete) {
      await removeStoredFile(oldUrl);
    }

    closeForm();
    showAdminMessage("Project saved. It is now live on your website.", "info");
    loadProjects();
  } catch (error) {
    console.error(error);
    showAdminMessage("Could not save the project. Press F12 and check the Console for details.", "error");
  }

  saveButton.disabled = false;
});

// ----- Start -----
checkLogin().then(function (loggedIn) {
  if (loggedIn) {
    loadProjects();
  }
});