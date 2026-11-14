// ===== CONTACT FORM: SAVE MESSAGE TO THE DATABASE =====

const contactForm = document.getElementById("contact-form");

if (contactForm) {
  const contactMessage = document.getElementById("contact-message");
  const contactSubmit = document.getElementById("ct-submit");

  function showContactMessage(text, type) {
    contactMessage.className = "form-message " + type;
    contactMessage.textContent = text;
  }

  contactForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Spam trap: if the hidden field is filled, it is a robot. Pretend it worked.
    if (document.getElementById("ct-website").value !== "") {
      showContactMessage("Thank you! Your message has been sent.", "info");
      return;
    }

    // Allow only one message per minute from the same browser.
    try {
      const lastTime = Number(localStorage.getItem("lastMessageTime") || 0);
      if (Date.now() - lastTime < 60000) {
        showContactMessage("Please wait a minute before sending another message.", "error");
        return;
      }
    } catch (e) {
      // If the browser blocks storage, just continue.
    }

    contactSubmit.disabled = true;
    showContactMessage("Sending your message...", "info");

    const result = await db.from("messages").insert({
      name: document.getElementById("ct-name").value.trim(),
      email: document.getElementById("ct-email").value.trim(),
      subject: document.getElementById("ct-subject").value.trim(),
      message: document.getElementById("ct-message").value.trim(),
    });

    contactSubmit.disabled = false;

    if (result.error) {
      console.error(result.error);
      showContactMessage("Sorry, your message could not be sent. Please try again or email me directly.", "error");
      return;
    }

    try {
      localStorage.setItem("lastMessageTime", String(Date.now()));
    } catch (e) {
      // Ignore storage problems.
    }

    contactForm.reset();
    showContactMessage("Thank you! Your message has been sent. I will get back to you soon.", "info");
  });
}