// ===== PHOTO GALLERY (lightbox) =====
// Opens when a card with data-gallery is clicked. Shows only that card's photos.

(function () {
  let photos = [];
  let index = 0;
  let overlay = null;
  let imgEl, counterEl, titleEl, prevBtn, nextBtn;
  let touchStartX = 0;

  function build() {
    overlay = document.createElement("div");
    overlay.className = "gal";
    overlay.innerHTML =
      '<div class="gal-top"><span class="gal-title"></span><span class="gal-count"></span>' +
      '<button type="button" class="gal-close" aria-label="Close">&times;</button></div>' +
      '<button type="button" class="gal-nav gal-prev" aria-label="Previous photo">&lsaquo;</button>' +
      '<div class="gal-stage"><img alt="" /></div>' +
      '<button type="button" class="gal-nav gal-next" aria-label="Next photo">&rsaquo;</button>';
    document.body.appendChild(overlay);

    imgEl = overlay.querySelector("img");
    counterEl = overlay.querySelector(".gal-count");
    titleEl = overlay.querySelector(".gal-title");
    prevBtn = overlay.querySelector(".gal-prev");
    nextBtn = overlay.querySelector(".gal-next");

    overlay.querySelector(".gal-close").addEventListener("click", close);
    prevBtn.addEventListener("click", function () { go(-1); });
    nextBtn.addEventListener("click", function () { go(1); });

    // Click the dark area to close.
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay || e.target.classList.contains("gal-stage")) close();
    });

    // Swipe on phones.
    overlay.addEventListener("touchstart", function (e) {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    overlay.addEventListener("touchend", function (e) {
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  function show() {
    imgEl.classList.add("fading");
    setTimeout(function () {
      imgEl.src = photos[index];
      imgEl.onload = function () { imgEl.classList.remove("fading"); };
      imgEl.onerror = function () { imgEl.classList.remove("fading"); };
    }, 150);

    counterEl.textContent = photos.length > 1 ? (index + 1) + " / " + photos.length : "";
    const many = photos.length > 1;
    prevBtn.style.display = many ? "" : "none";
    nextBtn.style.display = many ? "" : "none";
  }

  function go(step) {
    if (photos.length < 2) return;
    index = (index + step + photos.length) % photos.length;
    show();
  }

  function open(list, title, start) {
    if (!overlay) build();
    photos = list;
    index = start || 0;
    titleEl.textContent = title || "";
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    imgEl.src = "";
    show();
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove("open");
    document.body.style.overflow = "";
  }

  document.addEventListener("keydown", function (e) {
    if (!overlay || !overlay.classList.contains("open")) return;
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
    if (e.key === "Escape") close();
  });

  // Open when a card is clicked (capture phase, so it runs before the old single-photo enlarge).
  document.addEventListener("click", function (e) {
    const card = e.target.closest("[data-gallery]");
    if (!card) return;
    if (e.target.closest("a, button")) return;

    let list = [];
    try { list = JSON.parse(card.getAttribute("data-gallery")); } catch (err) { list = []; }
    if (list.length === 0) return;

    e.stopPropagation();
    e.preventDefault();
    open(list, card.getAttribute("data-gallery-title"), 0);
  }, true);
})();