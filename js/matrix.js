// ===== MATRIX DIGITAL RAIN (Home hero background) =====

(function () {
  const hero = document.querySelector(".hero-dark");
  if (!hero) return;

  // Skip for visitors who prefer less motion.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.className = "matrix-canvas";
  canvas.setAttribute("aria-hidden", "true");
  hero.insertBefore(canvas, hero.firstChild);

  const ctx = canvas.getContext("2d");
  const characters = "01アイウエオカキクケコサシスセソタチツテトナニヌネノ{}[]<>=+*/#$%";

  let fontSize = 16;
  let columns = 0;
  let drops = [];
  let running = true;
  let lastTime = 0;

  function resize() {
    canvas.width = hero.clientWidth;
    canvas.height = hero.clientHeight;
    fontSize = canvas.width < 700 ? 14 : 16;
    columns = Math.floor(canvas.width / fontSize);
    drops = [];
    for (let i = 0; i < columns; i++) {
      drops.push(Math.random() * -50); // start at different heights
    }
  }

  function draw(time) {
    requestAnimationFrame(draw);

    if (!running) return;
    if (time - lastTime < 33) return; // about 30 frames per second
    lastTime = time;

    // Fade the old frame so characters leave a trail (keeps the layer transparent).
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";

    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < columns; i++) {
      const char = characters.charAt(Math.floor(Math.random() * characters.length));
      const x = i * fontSize;
      const y = drops[i] * fontSize;

      // Bright head, cyan trail
      ctx.fillStyle = Math.random() > 0.96 ? "#ffffff" : "#38bdf8";
      ctx.fillText(char, x, y);

      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i] += 1;
    }
  }

  resize();
  requestAnimationFrame(draw);

  // Keep the canvas matched to the hero size.
  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 200);
  });

  // Pause when the hero is scrolled out of view (saves battery).
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      running = entries[0].isIntersecting;
    }).observe(hero);
  }
})();