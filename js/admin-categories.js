// ===== ADMIN: CATEGORIES =====
// Uses db, escapeText, escapeAttr and showStatus from the earlier admin files.

const categoriesBody = document.getElementById("categories-body");
const categoryMessage = document.getElementById("category-message");
const categoryForm = document.getElementById("category-form");
const projectCategorySelect = document.getElementById("p-category");

let categoryRows = [];

// Turns "Data Reports!" into "data-reports"
function makeSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// Fills the dropdown in the project form.
function fillCategorySelect() {
  const current = projectCategorySelect.value;
  projectCategorySelect.innerHTML = categoryRows.map(function (c) {
    return '<option value="' + escapeAttr(c.slug) + '">' + escapeText(c.name) + "</option>";
  }).join("");
  if (current) {
    projectCategorySelect.value = current;
  }
}

function renderCategories() {
  if (categoryRows.length === 0) {
    categoriesBody.innerHTML = '<tr><td colspan="3">No categories yet. Add one above.</td></tr>';
    return;
  }

  categoriesBody.innerHTML = categoryRows.map(function (c) {
    return (
      "<tr>" +
      "<td><strong>" + escapeText(c.name) + "</strong><br /><small>" + escapeText(c.slug) + "</small></td>" +
      '<td><input type="number" class="order-input" data-cat-id="' + c.id + '" value="' + c.sort_order + '" step="1" /></td>' +
      '<td class="admin-actions">' +
      '<button class="admin-btn" data-cat-action="rename" data-id="' + c.id + '">Rename</button>' +
      '<button class="admin-btn danger" data-cat-action="delete" data-id="' + c.id + '">Delete</button>' +
      "</td></tr>"
    );
  }).join("");
}

async function loadCategories() {
  const result = await db
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (result.error) {
    console.error(result.error);
    categoriesBody.innerHTML = '<tr><td colspan="3">Could not load categories.</td></tr>';
    return;
  }

  categoryRows = result.data;
  renderCategories();
  fillCategorySelect();
}

// Add
categoryForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const nameInput = document.getElementById("category-name");
  const name = nameInput.value.trim();
  const slug = makeSlug(name);

  if (!slug) {
    showStatus(categoryMessage, "Please use letters or numbers in the name.", "error");
    return;
  }

  if (categoryRows.some(function (c) { return c.slug === slug; })) {
    showStatus(categoryMessage, "That category already exists.", "error");
    return;
  }

  const nextOrder = categoryRows.length
    ? Math.max.apply(null, categoryRows.map(function (c) { return c.sort_order; })) + 1
    : 1;

  const result = await db.from("categories").insert({ name: name, slug: slug, sort_order: nextOrder });

  if (result.error) {
    console.error(result.error);
    showStatus(categoryMessage, "Could not add the category.", "error");
    return;
  }

  nameInput.value = "";
  showStatus(categoryMessage, "Category added. It now appears on your Projects page.", "info");
  loadCategories();
});

// Order number
categoriesBody.addEventListener("change", async function (event) {
  const input = event.target.closest("input[data-cat-id]");
  if (!input) return;

  const number = parseInt(input.value, 10);
  if (Number.isNaN(number)) {
    showStatus(categoryMessage, "Please type a whole number.", "error");
    return;
  }

  const result = await db
    .from("categories")
    .update({ sort_order: number })
    .eq("id", Number(input.getAttribute("data-cat-id")));

  if (result.error) {
    console.error(result.error);
    showStatus(categoryMessage, "Could not save the order.", "error");
    return;
  }

  showStatus(categoryMessage, "Order saved.", "info");
  loadCategories();
});

// Rename and Delete
categoriesBody.addEventListener("click", async function (event) {
  const button = event.target.closest("button[data-cat-action]");
  if (!button) return;

  const id = Number(button.getAttribute("data-id"));
  const category = categoryRows.find(function (c) { return c.id === id; });
  if (!category) return;

  if (button.getAttribute("data-cat-action") === "rename") {
    const newName = prompt("New name for this category:", category.name);
    if (newName === null) return;

    const trimmed = newName.trim();
    if (!trimmed || trimmed.length > 40) {
      showStatus(categoryMessage, "The name must be 1 to 40 characters.", "error");
      return;
    }

    const result = await db.from("categories").update({ name: trimmed }).eq("id", id);
    if (result.error) {
      console.error(result.error);
      showStatus(categoryMessage, "Could not rename the category.", "error");
      return;
    }

    showStatus(categoryMessage, "Category renamed.", "info");
    loadCategories();
    return;
  }

  // Delete: refuse if any project still uses it.
  const used = await db
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("category", category.slug);

  if (used.error) {
    console.error(used.error);
    showStatus(categoryMessage, "Could not check the projects. Try again.", "error");
    return;
  }

  if (used.count > 0) {
    showStatus(
      categoryMessage,
      '"' + category.name + '" is used by ' + used.count + " project(s). Move them to another category first.",
      "error"
    );
    return;
  }

  if (!confirm('Delete the category "' + category.name + '"?')) return;

  const result = await db.from("categories").delete().eq("id", id);
  if (result.error) {
    console.error(result.error);
    showStatus(categoryMessage, "Could not delete the category.", "error");
    return;
  }

  showStatus(categoryMessage, "Category deleted.", "info");
  loadCategories();
});

// Start (only when logged in)
db.auth.getSession().then(function (result) {
  if (result.data.session) {
    loadCategories();
  }
});