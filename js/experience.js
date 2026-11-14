// ===== EXPERIENCE PAGE: LOAD JOBS FROM THE DATABASE =====

const expList = document.getElementById("exp-list");

function expSafe(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

function buildExpCard(job) {
  // Logo: a picture if uploaded, otherwise the first letter of the company.
  const logo = job.logo_url
    ? '<img src="' + expSafe(job.logo_url) + '" alt="' + expSafe(job.company) + ' logo" />'
    : '<span class="exp-logo-letter">' + expSafe(job.company.charAt(0).toUpperCase()) + "</span>";

  const typeBadge = job.job_type
    ? '<span class="exp-type"><i></i>' + expSafe(job.job_type) + "</span>"
    : "";

  const locationHtml = job.location
    ? '<span class="exp-divider"></span>' +
      '<span class="exp-meta-item">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>' +
      expSafe(job.location) + "</span>"
    : "";

  // Each line of "details" becomes one bullet.
  const bullets = job.details
    .split("\n")
    .map(function (line) { return line.trim(); })
    .filter(function (line) { return line !== ""; })
    .map(function (line) { return "<li>" + expSafe(line) + "</li>"; })
    .join("");

  return (
    '<article class="exp-item">' +
    '<div class="exp-dot"></div>' +
    '<div class="exp-logo">' + logo + "</div>" +
    '<div class="exp-card">' +
    '<div class="exp-head">' +
    "<h3>" + expSafe(job.position) + "</h3>" + typeBadge +
    "</div>" +
    '<p class="exp-company">' + expSafe(job.company) + "</p>" +
    '<div class="exp-meta">' +
    '<span class="exp-meta-item">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>' +
    expSafe(job.period) + "</span>" +
    locationHtml +
    "</div>" +
    '<ul class="exp-bullets">' + bullets + "</ul>" +
    "</div></article>"
  );
}

async function loadExperience() {
  const result = await db
    .from("experiences")
    .select("*")
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false });

  if (result.error) {
    console.error(result.error);
    expList.innerHTML = "<p class='exp-loading'>Sorry, experience could not be loaded right now.</p>";
    return;
  }

  if (result.data.length === 0) {
    expList.innerHTML = "<p class='exp-loading'>No experience added yet.</p>";
    return;
  }

  expList.innerHTML = result.data.map(buildExpCard).join("");
}

if (expList) {
  loadExperience();
}