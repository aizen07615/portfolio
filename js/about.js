// ===== ABOUT PAGE: LOAD TEXT AND CERTIFICATES FROM THE DATABASE =====

function aboutSafe(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

async function loadAboutText() {
  const headlineEl = document.getElementById("ab-headline");
  if (!headlineEl) return;

  const result = await db.from("about").select("*").eq("id", 1).single();

  if (result.error) {
    console.error(result.error);
    headlineEl.textContent = "About Me";
    return;
  }

  const about = result.data;

  // The last two words of the headline are shown in cyan.
  const words = about.headline.trim().split(/\s+/);
  const keep = words.length > 2 ? words.length - 2 : 0;
  headlineEl.innerHTML =
    aboutSafe(words.slice(0, keep).join(" ")) +
    (keep > 0 ? " " : "") +
    "<span>" + aboutSafe(words.slice(keep).join(" ")) + "</span>";

  document.getElementById("ab-subline").textContent = about.subline || "";

  // Each blank line starts a new paragraph.
  document.getElementById("ab-background").innerHTML = about.background
    .split(/\n\s*\n/)
    .map(function (part) { return "<p>" + aboutSafe(part.trim()) + "</p>"; })
    .join("");
}

async function loadCertificates() {
  const track = document.getElementById("cert-track");
  if (!track) return;

  const result = await db
    .from("certificates")
    .select("*")
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false });

  if (result.error) {
    console.error(result.error);
    track.innerHTML = "<p class='exp-loading'>Sorry, certificates could not be loaded right now.</p>";
    return;
  }

  if (result.data.length === 0) {
    track.innerHTML = "<p class='exp-loading'>No certificates added yet.</p>";
    return;
  }

  track.innerHTML = result.data.map(function (c) {
    return (
      '<figure class="cert-card">' +
      '<img src="' + aboutSafe(c.image_url) + '" alt="' + aboutSafe(c.title) + '" />' +
      "<figcaption>" + aboutSafe(c.title) +
      (c.issuer ? "<small>" + aboutSafe(c.issuer) + "</small>" : "") +
      "</figcaption></figure>"
    );
  }).join("");
}

// Arrow buttons scroll the certificates left and right.
const certTrack = document.getElementById("cert-track");

if (certTrack) {
  document.getElementById("cert-prev").addEventListener("click", function () {
    certTrack.scrollBy({ left: -300, behavior: "smooth" });
  });
  document.getElementById("cert-next").addEventListener("click", function () {
    certTrack.scrollBy({ left: 300, behavior: "smooth" });
  });
}

loadAboutText();
loadCertificates();