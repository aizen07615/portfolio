// ===== IN-CARD PHOTO ARROWS =====
// Adds arrows to any card with 2 or more photos (data-gallery).

(function () {
  const CARD_SELECTOR = ".project-card[data-gallery], .testimonial-card[data-gallery]";

  function setup(card) {
    if (card.dataset.sliderReady) return;

    let list = [];
    try { list = JSON.parse(card.getAttribute("data-gallery")); } catch (e) { list = []; }
    if (list.length < 2) return; // one photo: no arrows, no dots

    let holder;
    let img;

    if (card.classList.contains("project-card")) {
      holder = card.querySelector(".project-thumb");
      if (!holder) return;
      img = holder.querySelector("img");
      if (!img) {
        // Card had a color placeholder: show its first photo instead.
        holder.className = "project-thumb";
        holder.innerHTML = "";
        img = document.createElement("img");
        img.src = list[0];
        img.alt = card.getAttribute("data-gallery-title") || "";
        holder.appendChild(img);
      }
    } else {
      img = card.querySelector(".testimonial-photo");
      if (!img) return;
      holder = document.createElement("div");
      holder.className = "slider-wrap";
      img.parentNode.insertBefore(holder, img);
      holder.appendChild(img);
    }

    holder.classList.add("has-slider");

    let index = list.indexOf(img.getAttribute("src"));
    if (index < 0) index = 0;

    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "slide-arrow slide-prev";
    prev.setAttribute("aria-label", "Previous photo");
    prev.innerHTML = "&lsaquo;";

    const next = document.createElement("button");
    next.type = "button";
    next.className = "slide-arrow slide-next";
    next.setAttribute("aria-label", "Next photo");
    next.innerHTML = "&rsaquo;";

    const dots = document.createElement("div");
    dots.className = "slide-dots";
    dots.innerHTML = list.map(function () { return "<i></i>"; }).join("");

    holder.appendChild(prev);
    holder.appendChild(next);
    holder.appendChild(dots);

    function update() {
      img.classList.add("slide-fading");
      setTimeout(function () {
        img.src = list[index];
        img.classList.remove("slide-fading");
      }, 120);
      Array.from(dots.children).forEach(function (d, i) {
        d.classList.toggle("on", i === index);
      });
    }

    function step(amount, event) {
      event.preventDefault();
      event.stopPropagation();
      index = (index + amount + list.length) % list.length;
      update();
    }

    prev.addEventListener("click", function (e) { step(-1, e); });
    next.addEventListener("click", function (e) { step(1, e); });

    Array.from(dots.children).forEach(function (d, i) {
      d.classList.toggle("on", i === index);
    });

    card.dataset.sliderReady = "1";
  }

  function scan() {
    document.querySelectorAll(CARD_SELECTOR).forEach(setup);
  }

  scan();

  // Cards are added after the database answers, so watch for them.
  let timer;
  new MutationObserver(function () {
    clearTimeout(timer);
    timer = setTimeout(scan, 50);
  }).observe(document.body, { childList: true, subtree: true });
})();