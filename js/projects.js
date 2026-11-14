// ===== LOAD PROJECTS AND CATEGORIES FROM THE DATABASE =====

const featuredGrid = document.getElementById("featured-grid");
const allGrid = document.getElementById("all-grid");
const filterBar = document.getElementById("filter-bar");

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

// Placeholder colors, used in turn for categories without a picture.
const thumbColors = ["thumb-navy", "thumb-teal", "thumb-slate", "thumb-sky"];

let categoryList = [];

function categoryInfo(slug) {
  const index = categoryList.findIndex(function (c) { return c.slug === slug; });
  if (index === -1) {
    return { name: slug, color: "thumb-navy" };
  }
  return { name: categoryList[index].name, color: thumbColors[index % thumbColors.length] };
}

function buildCard(project, isFeatured) {
  const info = categoryInfo(project.category);

  let thumb;
  if (project.image_url) {
    thumb =
      '<div class="project-thumb"><img src="' + escapeHtml(project.image_url) +
      '" alt="' + escapeHtml(project.title) + '" /></div>';
  } else {
    thumb = '<div class="project-thumb ' + info.color + '"><span>' + escapeHtml(info.name) + "</span></div>";
  }

  let tags = "";
  if (project.tools) {
    project.tools.split(",").forEach(function (tool) {
      tags += '<span class="tag">' + escapeHtml(tool.trim()) + "</span>";
    });
  }

  const badge = isFeatured ? '<span class="project-badge">Featured</span>' : "";
  const categoryAttr = isFeatured ? "" : ' data-category="' + escapeHtml(project.category) + '"';

  return (
    '<article class="project-card"' + categoryAttr + ">" +
    thumb +
    '<div class="project-body">' + badge +
    "<h3>" + escapeHtml(project.title) + "</h3>" +
    "<p>" + escapeHtml(project.description) + "</p>" +
    '<div class="tag-list">' + tags + "</div>" +
    "</div></article>"
  );
}

async function loadProjects() {
  const catResult = await db
    .from("categories")
    .select("name, slug, sort_order")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (!catResult.error) {
    categoryList = catResult.data;
  } else {
    console.error(catResult.error);
  }

  // Build the filter buttons from the categories.
  if (filterBar) {
    filterBar.innerHTML =
      '<button class="filter-btn active" data-filter="all">All</button>' +
      categoryList.map(function (c) {
        return '<button class="filter-btn" data-filter="' + escapeHtml(c.slug) + '">' + escapeHtml(c.name) + "</button>";
      }).join("");
  }

  const result = await db
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (result.error) {
    featuredGrid.innerHTML = "<p>Sorry, projects could not be loaded right now.</p>";
    allGrid.innerHTML = "";
    console.error(result.error);
    return;
  }

  const projects = result.data;

  if (projects.length === 0) {
    featuredGrid.innerHTML = "<p>No projects yet.</p>";
    allGrid.innerHTML = "<p>No projects yet.</p>";
    return;
  }

  const featured = projects.filter(function (p) { return p.featured; });

  featuredGrid.innerHTML = featured.length
    ? featured.map(function (p) { return buildCard(p, true); }).join("")
    : "<p>No featured projects yet.</p>";

  allGrid.innerHTML = projects.map(function (p) { return buildCard(p, false); }).join("");
}

if (featuredGrid && allGrid) {
  loadProjects();
}