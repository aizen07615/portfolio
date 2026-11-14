// ===== TECH EFFECTS: typing text and fade-in on scroll =====

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ----- Typing effect -----
const typedEl = document.getElementById("typed");

if (typedEl) {
  const phrases = [
    "Google Sheets & Excel",
    "spreadsheet automation",
    "data management",
    "inventory reports",
    "administrative support",
  ];

  if (reduceMotion) {
    typedEl.textContent = phrases[0];
  } else {
    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function type() {
      const phrase = phrases[phraseIndex];
      typedEl.textContent = phrase.slice(0, charIndex);

      let delay = deleting ? 40 : 80;

      if (!deleting && charIndex === phrase.length) {
        deleting = true;
        delay = 1500; // pause when the phrase is complete
      } else if (deleting && charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        delay = 400;
      } else {
        charIndex += deleting ? -1 : 1;
      }

      setTimeout(type, delay);
    }

    type();
  }
}

// ----- Fade-in when a section scrolls into view -----
const revealTargets = document.querySelectorAll(".section .container, .tools-strip");

if (!reduceMotion && "IntersectionObserver" in window) {
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealTargets.forEach(function (el) {
    el.classList.add("reveal");
    observer.observe(el);
  });
}