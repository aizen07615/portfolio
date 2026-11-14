// ===== ADMIN LOGIN =====

const loginForm = document.getElementById("login-form");
const loginMessage = document.getElementById("login-message");
const loginSubmit = document.getElementById("login-submit");

// If you are already logged in, go straight to the dashboard.
db.auth.getSession().then(function (result) {
  if (result.data.session) {
    window.location.href = "dashboard.html";
  }
});

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  loginSubmit.disabled = true;
  loginMessage.className = "form-message info";
  loginMessage.textContent = "Logging in...";

  const result = await db.auth.signInWithPassword({
    email: document.getElementById("login-email").value.trim(),
    password: document.getElementById("login-password").value,
  });

  loginSubmit.disabled = false;

  if (result.error) {
    loginMessage.className = "form-message error";
    loginMessage.textContent = "Login failed. Check your email and password.";
    return;
  }

  window.location.href = "dashboard.html";
});