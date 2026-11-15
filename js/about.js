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
       '<span class="ab-cyan">' + aboutSafe(words.slice(keep).join(" ")) + "</span>";
 
  document.getElementById("ab-subline").textContent = about.subline || "";

  // Each blank line starts a new paragraph.
  document.getElementById("ab-background").innerHTML = about.background
    .split(/\n\s*\n/)
    .map(function (part) { return "<p>" + aboutSafe(part.trim()) + "</p>"; })
    .join("");
}

// ----- Certificates -----

function isPdf(url) {
  return url && url.split("?")[0].toLowerCase().endsWith(".pdf");
}

const fileIcon =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>';

function buildCertCard(c) {
  const caption =
    "<figcaption>" + aboutSafe(c.title) +
    (c.issuer ? "<small>" + aboutSafe(c.issuer) + "</small>" : "") +
    (c.image_url && c.file_url
      ? '<a class="cert-file-link" href="' + aboutSafe(c.file_url) + '" target="_blank" rel="noopener">View file</a>'
      : "") +
    "</figcaption>";

  // Has a picture: show it (click to enlarge).
  if (c.image_url) {
    return (
      '<figure class="cert-card">' +
      '<img src="' + aboutSafe(c.image_url) + '" alt="' + aboutSafe(c.title) + '" />' +
      caption + "</figure>"
    );
  }

  // File only, PDF: show a preview of page 1 (click to open the viewer).
  if (isPdf(c.file_url)) {
    return (
      '<figure class="cert-card cert-file" data-file="' + aboutSafe(c.file_url) + '" data-title="' + aboutSafe(c.title) + '">' +
      '<div class="cert-thumb"><canvas data-pdf="' + aboutSafe(c.file_url) + '"></canvas></div>' +
      caption + "</figure>"
    );
  }

  // File only, other types (Word, etc.): file icon with an Open link.
  return (
    '<figure class="cert-card">' +
    '<div class="cert-thumb cert-icon">' + fileIcon +
    '<a class="cert-file-link" href="' + aboutSafe(c.file_url) + '" target="_blank" rel="noopener">Open file</a></div>' +
    caption + "</figure>"
  );
}

async function renderPdfThumb(canvas) {
  try {
    const pdf = await pdfjsLib.getDocument(canvas.getAttribute("data-pdf")).promise;
    const page = await pdf.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: 460 / base.width });

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport: viewport }).promise;
  } catch (error) {
    console.error(error);
    const holder = canvas.parentElement;
    holder.classList.add("cert-icon");
    holder.innerHTML = fileIcon;
  }
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

  track.innerHTML = result.data.map(buildCertCard).join("");

  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    track.querySelectorAll("canvas[data-pdf]").forEach(renderPdfThumb);
  }
}

// ----- Big PDF viewer -----
let pdfViewer = null;

function openPdfViewer(url, title) {
  if (!pdfViewer) {
    pdfViewer = document.createElement("div");
    pdfViewer.className = "pdf-viewer";
    pdfViewer.innerHTML =
      '<div class="pdf-box">' +
      '<div class="pdf-bar"><strong></strong>' +
      '<a target="_blank" rel="noopener">Open in new tab</a>' +
      '<button type="button" aria-label="Close">&times;</button></div>' +
      '<iframe title="Certificate"></iframe></div>';
    document.body.appendChild(pdfViewer);

    pdfViewer.addEventListener("click", function (event) {
      if (event.target === pdfViewer || event.target.closest("button")) {
        closePdfViewer();
      }
    });
  }

  pdfViewer.querySelector("strong").textContent = title;
  pdfViewer.querySelector("a").href = url;
  pdfViewer.querySelector("iframe").src = url;
  pdfViewer.classList.add("open");
}

function closePdfViewer() {
  if (pdfViewer) {
    pdfViewer.classList.remove("open");
    pdfViewer.querySelector("iframe").src = "about:blank";
  }
}

document.addEventListener("click", function (event) {
  if (event.target.closest("a")) return; // let normal links work

  const card = event.target.closest(".cert-file");
  if (card) {
    openPdfViewer(card.getAttribute("data-file"), card.getAttribute("data-title"));
  }
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") closePdfViewer();
});

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

// ===== SCATTER AND REASSEMBLE EFFECT FOR ALL TEXT ON THE PAGE =====

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function scatterChar(c, big) {
  const rangeX = big ? 520 : 160;
  const rangeY = big ? 320 : 110;
  c.style.transition = "none";
  c.style.transform =
    "translate(" + (Math.random() - 0.5) * rangeX + "px," + (Math.random() - 0.5) * rangeY + "px) " +
    "rotate(" + (Math.random() - 0.5) * 360 + "deg) scale(" + (0.4 + Math.random()) + ")";
  c.style.opacity = "0";
  c.style.filter = "blur(5px)";
}

function assembleChars(chars) {
  chars.forEach(function (c, i) {
    const delay = Math.min(i * 0.02, 1.0);
    c.style.transition =
      "transform 1.1s cubic-bezier(0.22, 1, 0.36, 1) " + delay + "s, " +
      "opacity 0.7s ease " + delay + "s, filter 0.7s ease " + delay + "s";
    c.style.transform = "none";
    c.style.opacity = "1";
    c.style.filter = "none";
  });
}

function scatterPage() {
  if (reduceMotion) return;

  const root = document.querySelector("main");
  if (!root) return;

  // Find every piece of text (skip buttons and icons).
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: function (node) {
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (node.parentElement.closest("script, style, button, svg")) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  const groups = new Map(); // text block -> its letters

  textNodes.forEach(function (node) {
    const parent = node.parentElement;
    const group = parent.closest("h1, h2, h3, h4, p, li, figcaption, a") || parent;
    if (!groups.has(group)) groups.set(group, []);

    const fragment = document.createDocumentFragment();

    node.nodeValue.split(/(\s+)/).forEach(function (part) {
      if (part === "") return;
      if (/^\s+$/.test(part)) {
        fragment.appendChild(document.createTextNode(part));
        return;
      }
      const word = document.createElement("span");
      word.className = "sc-word";
      Array.from(part).forEach(function (ch) {
        const letter = document.createElement("span");
        letter.className = "sc-char";
        letter.textContent = ch;
        word.appendChild(letter);
        groups.get(group).push(letter);
      });
      fragment.appendChild(word);
    });

    node.parentNode.replaceChild(fragment, node);
  });

  const headline = document.getElementById("ab-headline");
  const busy = new Map();

  function play(group, chars) {
    if (busy.get(group)) return;
    busy.set(group, true);
    const big = group === headline;
    chars.forEach(function (c) { scatterChar(c, big); });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        assembleChars(chars);
        setTimeout(function () { busy.set(group, false); }, 2400);
      });
    });
  }

  // Start every block scattered, then assemble it when it scrolls into view.
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        play(entry.target, groups.get(entry.target));
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  groups.forEach(function (chars, group) {
    chars.forEach(function (c) { scatterChar(c, group === headline); });
    observer.observe(group);
   
  });

  
}

// Run after the database text and certificates have loaded.
Promise.all([loadAboutText(), loadCertificates()]).then(scatterPage);