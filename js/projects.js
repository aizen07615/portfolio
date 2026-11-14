// ===== LOAD PROJECTS FROM THE DATABASE =====

const featuredGrid = document.getElementById("featured-grid");
const allGrid = document.getElementById("all-grid");

// Makes text safe before putting it into the page.
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

// Each category has a placeholder color and label.
const categoryStyles = {
  monitoring: { color: "thumb-navy", label: "Monitoring" },
  calculators: { color: "thumb-teal", label: "Calculator" },
  inventory: { color: "thumb-slate", label: "Inventory" },
  design: { color: "thumb-sky", label: "Design" },
};

// Builds the HTML for one project card.
function buildCard(project, isFeatured) {
  const style = categoryStyles[project.category] || { color: "thumb-navy", label: project.category };

  let thumb;
  if (project.image_url) {
    thumb =
      '<div class="project-thumb"><img src="' + escapeHtml(project.image_url) +
      '" alt="' + escapeHtml(project.title) + '" /></div>';
  } else {
    thumb =
      '<div class="project-thumb ' + style.color + '"><span>' + escapeHtml(style.label) + "</span></div>";
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