// ===== PROJECT FILTER =====
// Works with cards that are added to the page after it loads.

document.addEventListener("click", function (event) {
  const button = event.target.closest(".filter-btn");
  if (!button) {
    return;
  }

  const selected = button.getAttribute("data-filter");

  document.querySelectorAll(".filter-btn").forEach(function (btn) {
    btn.classList.remove("active");
  });
  button.classList.add("active");

  document.querySelectorAll("[data-category]").forEach(function (card) {
    const category = card.getAttribute("data-category");

    if (selected === "all" || category === selected) {
      card.classList.remove("hide");
    } else {
      card.classList.add("hide");
    }
  });
});

// ===== CLICK A PROJECT PICTURE TO ENLARGE IT =====

let lightbox = null;
let lightboxImage = null;

function closeLightbox() {
  if (lightbox) {
    lightbox.classList.remove("open");
  }
}

document.addEventListener("click", function (event) {
  const img = event.target.closest(".project-thumb img");
  if (!img) {
    return;
  }

  // Build the dark overlay the first time it is needed.
  if (!lightbox) {
    lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.innerHTML = '<span class="lightbox-close">&times;</span><img src="" alt="" />';
    document.body.appendChild(lightbox);
    lightboxImage = lightbox.querySelector("img");
    lightbox.addEventListener("click", closeLightbox);
  }

  lightboxImage.src = img.src;
  lightboxImage.alt = img.alt;
  lightbox.classList.add("open");
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeLightbox();
  }
});

// ===== AVERAGE RATING (Home page) =====
// For now the list is empty, because no ratings are saved yet.
// We will connect this to the database soon.

const ratings = [];

function showAverageRating(list) {
  const starsFill = document.getElementById("avg-stars");
  const ratingText = document.getElementById("rating-text");

  if (!starsFill || !ratingText) {
    return;
  }

  if (list.length === 0) {
    starsFill.style.width = "0%";
    ratingText.textContent = "No ratings yet";
    return;
  }

  let total = 0;
  list.forEach(function (value) {
    total = total + value;
  });
  const average = total / list.length;

  starsFill.style.width = (average / 5) * 100 + "%";

  const word = list.length === 1 ? "rating" : "ratings";
  ratingText.textContent = average.toFixed(1) + " / 5 (" + list.length + " " + word + ")";
}



// ===== MOBILE MENU (hamburger button) =====

const navContainer = document.querySelector(".nav-container");
const navMenu = document.querySelector(".nav-links");

if (navContainer && navMenu) {
  const menuButton = document.createElement("button");
  menuButton.className = "menu-toggle";
  menuButton.setAttribute("aria-label", "Open menu");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.innerHTML = "<span></span><span></span><span></span>";
  navContainer.appendChild(menuButton);

  menuButton.addEventListener("click", function () {
    const isOpen = navMenu.classList.toggle("open");
    menuButton.classList.toggle("open", isOpen);
    menuButton.setAttribute("aria-expanded", isOpen);
  });
}// ===== Turn on the dark blue theme for public pages =====
document.body.classList.add("theme-dark");