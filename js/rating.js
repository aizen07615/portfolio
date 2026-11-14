// ===== AVERAGE RATING ON THE HOME PAGE (from the database) =====

async function loadAverageRating() {
  const starsFill = document.getElementById("avg-stars");
  const ratingText = document.getElementById("rating-text");

  // Stop if this page has no rating display.
  if (!starsFill || !ratingText) {
    return;
  }

  // Ask the database for only the rating column.
  const result = await db.from("testimonials").select("rating");

  if (result.error) {
    console.error(result.error);
    starsFill.style.width = "0%";
    ratingText.textContent = "Ratings unavailable";
    return;
  }

  const list = result.data.map(function (row) {
    return row.rating;
  });

  // Reuse the function from main.js (it handles the empty list too).
  showAverageRating(list);
}

loadAverageRating();