// ===== HOME PAGE: 3 FEATURED WORKS FROM THE DATABASE =====

const homeFeatured = document.getElementById("home-featured");

function homeSafe(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

const homeCategoryStyles = {
  monitoring: { color: "thumb-navy", label: "Monitoring" },
  calculators: { color: "thumb-teal", label: "Calculator" },
  inventory: { color: "thumb-slate", label: "Inventory" },
  design: { color: "thumb-sky", label: "Design" },
};

function buildHomeCard(project) {
  const style = homeCategoryStyles[project.category] || { color: "thumb-navy", label: project.category };

  let thumb;
  if (project.image_url) {
    thumb =
      '<div class="project-thumb"><img src="' + homeSafe(project.image_url) +
      '" alt="' + homeSafe(project.title) + '" /></div>';
  } else {
    thumb = '<div class="project-thumb ' + style.color + '"><span>' + homeSafe(style.label) + "</span></div>";
  }

  let tags = "";
  if (project.tools) {
    project.tools.split(",").forEach(function (tool) {
      tags += '<span class="tag">' + homeSafe(tool.trim()) + "</span>";
    });
  }

  return (
    '<article class="project-card">' + thumb +
    '<div class="project-body">' +
    "<h3>" + homeSafe(project.title) + "</h3>" +
    "<p>" + homeSafe(project.description) + "</p>" +
    '<div class="tag-list">' + tags + "</div>" +
    "</div></article>"
  );
}

async function loadHomeFeatured() {
  const result = await db
    .from("projects")
    .select("*")
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(3);

  if (result.error) {
    console.error(result.error);
    homeFeatured.innerHTML = "<p>Sorry, projects could not be loaded right now.</p>";
    return;
  }

  if (result.data.length === 0) {
    homeFeatured.innerHTML = "<p>No featured works yet.</p>";
    return;
  }

  homeFeatured.innerHTML = result.data.map(buildHomeCard).join("");
}

if (homeFeatured) {
  loadHomeFeatured();
}