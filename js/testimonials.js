// ===== TESTIMONIALS: LOAD, DISPLAY, AND SAVE =====

const testimonialGrid = document.getElementById("testimonial-grid");

// Makes text safe before putting it into the page.
function escapeText(text) {
  const div = document.createElement("div");
  div.textContent = text || "";
  return div.innerHTML;
}

// Builds the HTML for one testimonial card.
function buildTestimonialCard(item) {
  const filled = "&#9733;".repeat(item.rating);
  const empty = "&#9733;".repeat(5 - item.rating);

  const badge = item.featured ? '<span class="featured-badge">Featured</span>' : "";
  const cardClass = item.featured ? "testimonial-card is-featured" : "testimonial-card";

  const photo = item.photo_url
    ? '<img class="testimonial-photo" src="' + escapeText(item.photo_url) + '" alt="Photo shared by ' + escapeText(item.name) + '" />'
    : "";

  const roleLine = item.company ? item.role + ", " + item.company : item.role;
  const initial = item.name.trim().charAt(0).toUpperCase();

  return (
    '<article class="' + cardClass + '">' +
    badge +
    '<div class="stars" aria-label="' + item.rating + ' out of 5 stars">' +
    filled + '<span class="stars-empty">' + empty + "</span></div>" +
        '<p class="testimonial-text">' + escapeText(item.comment) + "</p>" +
    (item.comment.length > 160
      ? '<button type="button" class="read-more">Read more</button>'
      : "") +
    photo +
    '<div class="testimonial-author">' +
    '<div class="author-avatar">' + escapeText(initial) + "</div>" +
    "<div>" +
    '<p class="author-name">' + escapeText(item.name) + "</p>" +
    '<p class="author-role">' + escapeText(roleLine) + "</p>" +
    "</div></div></article>"
  );
}

async function loadTestimonials() {
  // Ask only for the allowed columns. Email is never requested.
  const result = await db
    .from("testimonials")
    .select("id, name, role, company, rating, comment, photo_url, featured, sort_order, created_at")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false });

  if (result.error) {
    testimonialGrid.innerHTML = "<p>Sorry, testimonials could not be loaded right now.</p>";
    console.error(result.error);
    return;
  }

  if (result.data.length === 0) {
    testimonialGrid.innerHTML = "<p>No testimonials yet. Be the first to share your feedback below.</p>";
    return;
  }

  testimonialGrid.innerHTML = result.data.map(buildTestimonialCard).join("");
}

if (testimonialGrid) {
  loadTestimonials();
}

// ===== FEEDBACK FORM: SAVE TO THE DATABASE =====

const feedbackForm = document.getElementById("feedback-form");

if (feedbackForm) {
  const formMessage = document.getElementById("form-message");
  const submitButton = document.getElementById("fb-submit");
  const photoInput = document.getElementById("fb-photo");
  const maxPhotoSize = 2 * 1024 * 1024; // 2 MB in bytes

  function showMessage(text, type) {
    formMessage.className = "form-message " + type;
    formMessage.textContent = text;
  }

  feedbackForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Spam trap: if the hidden field is filled, it is a robot. Pretend it worked.
    if (document.getElementById("fb-website").value !== "") {
      showMessage("Thank you for your feedback!", "info");
      return;
    }

    // Allow only one submission per minute from the same browser.
    try {
      const lastTime = Number(localStorage.getItem("lastFeedbackTime") || 0);
      if (Date.now() - lastTime < 60000) {
        showMessage("Please wait a minute before sending another testimonial.", "error");
        return;
      }
    } catch (e) {
      // If the browser blocks storage, just continue.
    }

    // Check the star rating.
    const chosenRating = feedbackForm.querySelector('input[name="rating"]:checked');
    if (!chosenRating) {
      showMessage("Please choose a star rating from 1 to 5.", "error");
      return;
    }

    // Check the photo (if one was chosen).
    const photo = photoInput.files[0];
    if (photo) {
      if (photo.type !== "image/jpeg" && photo.type !== "image/png") {
        showMessage("Please choose a JPG or PNG photo.", "error");
        return;
      }
      if (photo.size > maxPhotoSize) {
        showMessage("The photo is too large. Please choose one under 2 MB.", "error");
        return;
      }
    }

    submitButton.disabled = true;
    showMessage("Sending your feedback...", "info");

    // Step 1: upload the photo (if any) and get its public address.
    let photoUrl = null;
    if (photo) {
      const extension = photo.type === "image/png" ? "png" : "jpg";
      const fileName = Date.now() + "-" + Math.random().toString(36).slice(2, 10) + "." + extension;

      const upload = await db.storage
        .from("testimonial-photos")
        .upload(fileName, photo, { contentType: photo.type });

      if (upload.error) {
        console.error(upload.error);
        showMessage("The photo could not be uploaded. Please try again.", "error");
        submitButton.disabled = false;
        return;
      }

      photoUrl = db.storage.from("testimonial-photos").getPublicUrl(fileName).data.publicUrl;
    }

    // Step 2: save the testimonial.
    const emailValue = document.getElementById("fb-email").value.trim();
    const companyValue = document.getElementById("fb-company").value.trim();

    const save = await db.from("testimonials").insert({
      name: document.getElementById("fb-name").value.trim(),
      role: document.getElementById("fb-role").value,
      company: companyValue === "" ? null : companyValue,
      email: emailValue === "" ? null : emailValue,
      rating: Number(chosenRating.value),
      comment: document.getElementById("fb-comment").value.trim(),
      photo_url: photoUrl,
    });

    submitButton.disabled = false;

    if (save.error) {
      console.error(save.error);
      showMessage("Sorry, your feedback could not be saved. Please try again.", "error");
      return;
    }

    try {
      localStorage.setItem("lastFeedbackTime", String(Date.now()));
    } catch (e) {
      // Ignore storage problems.
    }

    feedbackForm.reset();
    showMessage("Thank you! Your testimonial is now on the page.", "info");
    loadTestimonials();
  });
}// ===== LONG COMMENTS: clip first, show everything on "Read more" =====

function clipLongComments() {
  document.querySelectorAll(".testimonial-text").forEach(function (text) {
    const button = text.nextElementSibling;
    if (button && button.classList.contains("read-more")) {
      text.classList.add("clipped");
    }
  });
}

if (testimonialGrid) {
  // Run after the cards are built.
  const clipObserver = new MutationObserver(clipLongComments);
  clipObserver.observe(testimonialGrid, { childList: true });
}

document.addEventListener("click", function (event) {
  const button = event.target.closest(".read-more");
  if (!button) return;

  const text = button.previousElementSibling;
  const isClipped = text.classList.toggle("clipped");
  button.textContent = isClipped ? "Read more" : "Show less";
});