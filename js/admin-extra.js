// ===== ADMIN: TESTIMONIALS AND MESSAGES =====
// Uses db, escapeText and previewUrl from admin.js (loaded just before this file).

const PHOTO_BUCKET = "testimonial-photos";

const testimonialsBody = document.getElementById("testimonials-body");
const testimonialMessage = document.getElementById("testimonial-message");
const messagesList = document.getElementById("messages-list");
const messagesStatus = document.getElementById("messages-status");

let testimonialRows = [];
let messageRows = [];

function showStatus(element, text, type) {
  element.className = "form-message " + type;
  element.textContent = text;
}

// Makes text safe inside a quoted HTML attribute.
function escapeAttr(text) {
  return escapeText(text).replace(/"/g, "&quot;");
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Finds the file name inside the testimonial-photos bucket.
function photoPath(url) {
  if (!url) return null;
  const marker = "/" + PHOTO_BUCKET + "/";
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length));
}

// ===================== TESTIMONIALS =====================

function renderTestimonials() {
  if (testimonialRows.length === 0) {
    testimonialsBody.innerHTML = '<tr><td colspan="7">No testimonials yet.</td></tr>';
    return;
  }

  testimonialsBody.innerHTML = testimonialRows.map(function (t) {
    const person =
      "<strong>" + escapeText(t.name) + "</strong><br />" +
      "<small>" + escapeText(t.company ? t.role + ", " + t.company : t.role) + "</small>" +
      (t.email ? "<br /><small>" + escapeText(t.email) + " (private)</small>" : "");

    const comment = t.comment.length > 140 ? t.comment.slice(0, 140) + "..." : t.comment;

    const photo = t.photo_url
      ? '<a href="' + escapeAttr(t.photo_url) + '" target="_blank"><img class="admin-thumb" src="' + escapeAttr(t.photo_url) + '" alt="" /></a>'
      : '<span class="admin-no-pic">None</span>';

    return (
      "<tr>" +
      "<td>" + person + "</td>" +
      "<td>" + t.rating + " / 5</td>" +
      '<td class="admin-comment">' + escapeText(comment) + "</td>" +
      "<td>" + photo + "</td>" +
      '<td><input type="checkbox" data-field="featured" data-id="' + t.id + '"' + (t.featured ? " checked" : "") + " /></td>" +
      '<td><input type="number" class="order-input" data-field="sort_order" data-id="' + t.id + '" value="' + t.sort_order + '" step="1" /></td>' +
      '<td class="admin-actions"><button class="admin-btn danger" data-action="delete-testimonial" data-id="' + t.id + '">Delete</button></td>' +
      "</tr>"
    );
  }).join("");
}

async function loadAdminTestimonials() {
  const result = await db
    .from("testimonials")
    .select("*")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: false })
    .order("created_at", { ascending: false });

  if (result.error) {
    console.error(result.error);
    testimonialsBody.innerHTML = '<tr><td colspan="7">Could not load testimonials.</td></tr>';
    return;
  }

  testimonialRows = result.data;
  renderTestimonials();
}

// Featured checkbox and order number: save when changed.
testimonialsBody.addEventListener("change", async function (event) {
  const input = event.target.closest("input[data-field]");
  if (!input) return;

  const id = Number(input.getAttribute("data-id"));
  const field = input.getAttribute("data-field");
  const update = {};

  if (field === "featured") {
    update.featured = input.checked;
  } else {
    const number = parseInt(input.value, 10);
    if (Number.isNaN(number)) {
      showStatus(testimonialMessage, "Please type a whole number for the order.", "error");
      return;
    }
    update.sort_order = number;
  }

  const result = await db.from("testimonials").update(update).eq("id", id);

  if (result.error) {
    console.error(result.error);
    showStatus(testimonialMessage, "Could not save the change.", "error");
    return;
  }

  showStatus(testimonialMessage, "Saved. The public page now uses the new order.", "info");
  loadAdminTestimonials();
});

// Delete button
testimonialsBody.addEventListener("click", async function (event) {
  const button = event.target.closest('button[data-action="delete-testimonial"]');
  if (!button) return;

  const id = Number(button.getAttribute("data-id"));
  const item = testimonialRows.find(function (t) { return t.id === id; });
  if (!item) return;

  if (!confirm('Delete the testimonial from "' + item.name + '"? This cannot be undone.')) return;

  const result = await db.from("testimonials").delete().eq("id", id);

  if (result.error) {
    console.error(result.error);
    showStatus(testimonialMessage, "Could not delete the testimonial.", "error");
    return;
  }

  // Also remove the photo file from Storage.
  const path = photoPath(item.photo_url);
  if (path) {
    await db.storage.from(PHOTO_BUCKET).remove([path]);
  }

  showStatus(testimonialMessage, "Testimonial deleted.", "info");
  loadAdminTestimonials();
});

// ===================== MESSAGES =====================

function renderMessages() {
  document.getElementById("messages-title").textContent =
    "Messages (" + messageRows.length + ")";

  if (messageRows.length === 0) {
    messagesList.innerHTML = "<p>No messages yet.</p>";
    return;
  }

  messagesList.innerHTML = messageRows.map(function (m) {
    const replySubject = encodeURIComponent("Re: " + m.subject);

    return (
      '<article class="msg-card">' +
      '<div class="msg-head">' +
      "<h3>" + escapeText(m.subject) + "</h3>" +
      '<span class="msg-date">' + formatDate(m.created_at) + "</span>" +
      "</div>" +
      '<p class="msg-from">From ' + escapeText(m.name) + " (" + escapeText(m.email) + ")</p>" +
      '<p class="msg-body">' + escapeText(m.message) + "</p>" +
      '<div class="msg-actions">' +
      '<a class="admin-btn" href="mailto:' + escapeAttr(m.email) + "?subject=" + replySubject + '">Reply by email</a>' +
      '<button class="admin-btn danger" data-action="delete-message" data-id="' + m.id + '">Delete</button>' +
      "</div></article>"
    );
  }).join("");
}

async function loadAdminMessages() {
  const result = await db
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (result.error) {
    console.error(result.error);
    messagesList.innerHTML = "<p>Could not load messages.</p>";
    return;
  }

  messageRows = result.data;
  renderMessages();
}

messagesList.addEventListener("click", async function (event) {
  const button = event.target.closest('button[data-action="delete-message"]');
  if (!button) return;

  const id = Number(button.getAttribute("data-id"));
  if (!confirm("Delete this message? This cannot be undone.")) return;

  const result = await db.from("messages").delete().eq("id", id);

  if (result.error) {
    console.error(result.error);
    showStatus(messagesStatus, "Could not delete the message.", "error");
    return;
  }

  showStatus(messagesStatus, "Message deleted.", "info");
  loadAdminMessages();
});

// ===================== START =====================
// Only load data if you are logged in (admin.js sends you to login otherwise).

db.auth.getSession().then(function (result) {
  if (result.data.session) {
    loadAdminTestimonials();
    loadAdminMessages();
  }
});