// ===== HOME PAGE: 3 FEATURED WORKS FROM THE DATABASE =====

const homeFeatured = document.getElementById("home-featured");

function homeSafe(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
 return div.innerHTML.replace(/"/g, "&quot;");
}

const homeThumbColors = ["thumb-navy", "thumb-teal", "thumb-slate", "thumb-sky"];
let homeCategories = [];
let homePhotos = {};

function homeGalleryFor(project) {
  const list = [];
  if (project.image_url) list.push(project.image_url);
  (homePhotos[project.id] || []).forEach(function (url) { list.push(url); });
  return list;
}
function homeCategoryInfo(slug) {
  const index = homeCategories.findIndex(function (c) { return c.slug === slug; });
  if (index === -1) {
    return { name: slug, color: "thumb-navy" };
  }
  return { name: homeCategories[index].name, color: homeThumbColors[index % homeThumbColors.length] };
}

function buildHomeCard(project) {
  const info = homeCategoryInfo(project.category);

  let thumb;
  if (project.image_url) {
    thumb =
      '<div class="project-thumb"><img src="' + homeSafe(project.image_url) +
      '" alt="' + homeSafe(project.title) + '" /></div>';
  } else {
    thumb = '<div class="project-thumb ' + info.color + '"><span>' + homeSafe(info.name) + "</span></div>";
  }

  let tags = "";
  if (project.tools) {
    project.tools.split(",").forEach(function (tool) {
      tags += '<span class="tag">' + homeSafe(tool.trim()) + "</span>";
    });
  }

  return (
    '<article class="project-card"' +
    ' data-gallery="' + homeSafe(JSON.stringify(homeGalleryFor(project))) + '"' +
    ' data-gallery-title="' + homeSafe(project.title) + '">' + thumb +
    '<div class="project-body">' +
    "<h3>" + homeSafe(project.title) + "</h3>" +
    "<p>" + homeSafe(project.description) + "</p>" +
    '<div class="tag-list">' + tags + "</div>" +
    "</div></article>"
  );
}

async function loadHomeFeatured() {
  const catResult = await db
    .from("categories")
    .select("name, slug")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (!catResult.error) {
    homeCategories = catResult.data;
  }

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
  const photoResult = await db
    .from("project_photos")
    .select("project_id, image_url")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  homePhotos = {};
  if (!photoResult.error) {
    photoResult.data.forEach(function (p) {
      if (!homePhotos[p.project_id]) homePhotos[p.project_id] = [];
      homePhotos[p.project_id].push(p.image_url);
    });
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