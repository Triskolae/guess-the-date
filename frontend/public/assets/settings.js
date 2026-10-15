document.addEventListener("DOMContentLoaded", () => {
  const profileForm = document.getElementById("profile-settings-form");
  const passwordForm = document.getElementById("password-settings-form");
  const verificationForm = document.getElementById("email-verification-form");
  const profileFeedback = document.getElementById("profile-settings-feedback");
  const passwordFeedback = document.getElementById("password-settings-feedback");
  const verificationFeedback = document.getElementById("email-verification-feedback");
  const usernameInput = document.getElementById("settings-username");
  const emailInput = document.getElementById("settings-email");

  function showFeedback(element, message, isError = false) {
    element.textContent = message;
    element.classList.toggle("error", isError);
  }

  async function request(path, options = {}) {
    const response = await fetch(`${window.API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Une erreur est survenue. Réessayez.");
    }
    return data;
  }

  async function setSubmitting(form, isSubmitting) {
    form.querySelector('button[type="submit"]').disabled = isSubmitting;
  }

  request("/api/auth/me")
    .then(({ user }) => {
      usernameInput.value = user.username || "";
      emailInput.value = user.email || "";
    })
    .catch((error) => showFeedback(profileFeedback, error.message, true));

  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showFeedback(profileFeedback, "");
    await setSubmitting(profileForm, true);

    try {
      const data = await request("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({
          username: usernameInput.value,
          email: emailInput.value,
        }),
      });

      showFeedback(profileFeedback, data.message);
      if (data.requiresVerification) {
        verificationForm.classList.remove("hidden");
        document.getElementById("settings-verification-code").focus();
      }
    } catch (error) {
      showFeedback(profileFeedback, error.message, true);
    } finally {
      await setSubmitting(profileForm, false);
    }
  });

  verificationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showFeedback(verificationFeedback, "");
    await setSubmitting(verificationForm, true);

    try {
      const data = await request("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({
          email: emailInput.value,
          code: document.getElementById("settings-verification-code").value,
        }),
      });

      showFeedback(verificationFeedback, data.message);
      verificationForm.classList.add("hidden");
    } catch (error) {
      showFeedback(verificationFeedback, error.message, true);
    } finally {
      await setSubmitting(verificationForm, false);
    }
  });

  passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    showFeedback(passwordFeedback, "");

    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-new-password").value;

    if (newPassword !== confirmPassword) {
      showFeedback(passwordFeedback, "Les nouveaux mots de passe ne correspondent pas.", true);
      return;
    }

    await setSubmitting(passwordForm, true);
    try {
      const data = await request("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      passwordForm.reset();
      showFeedback(passwordFeedback, data.message);
    } catch (error) {
      showFeedback(passwordFeedback, error.message, true);
    } finally {
      await setSubmitting(passwordForm, false);
    }
  });
});
