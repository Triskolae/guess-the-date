// --- 1. FONCTIONS GLOBALES D'AUTHENTIFICATION ---

// Déclenche l'événement personnalisé pour ouvrir la modale d'authentification
window.openAuthModal = function () {
  window.dispatchEvent(new CustomEvent("open-auth-modal"));
};

// Vérifie si l'utilisateur est authentifié via le cookie HTTP-Only
window.checkAuthStatus = async function () {
  try {
    const response = await fetch(`${window.API_URL}/api/auth/me`, {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      return data.user;
    }
  } catch (err) {
    console.error("Erreur de vérification de session :", err);
  }
  return null;
};

// Enrobe une action nécessitant d'être connecté
window.handleProtectedAction = async function (actionCallback) {
  const user = await window.checkAuthStatus();
  if (!user) {
    window.openAuthModal();
    return;
  }
  actionCallback(user);
};

// Écouteur global pour l'ouverture de la modale d'authentification
window.addEventListener("open-auth-modal", () => {
  const modal = document.getElementById("auth-modal");
  if (modal) {
    modal.classList.remove("hidden");
  }
});

// --- 2. GESTION DU DOM ET DES FORMULAIRES ---

document.addEventListener("DOMContentLoaded", () => {
  // Sélecteurs d'éléments du DOM
  const modal = document.getElementById("auth-modal");
  const openBtn = document.getElementById("open-auth-btn");
  const closeBtn = document.querySelector(".close-btn");

  // Conteneurs des 3 formulaires
  const loginContainer = document.getElementById("login-form-container");
  const registerContainer = document.getElementById("register-form-container");
  const verifyContainer = document.getElementById("verify-form-container");

  // Boutons de bascule (switch) et renvoi de code
  const switchToRegister = document.getElementById("switch-to-register");
  const switchToLogin = document.getElementById("switch-to-login");
  const resendCodeBtn = document.getElementById("resend-code-btn");

  // Zone de messages
  const feedbackBox = document.getElementById("auth-feedback");
  const displayEmailSpan = document.getElementById("display-pending-email");

  // Formulaires
  const loginForm = document.getElementById("login-form");
  const registerForm = document.getElementById("register-form");
  const verifyForm = document.getElementById("verify-form");

  let pendingEmail = "";

  // Helpers de feedback
  function showFeedback(message, isError = false) {
    if (!feedbackBox) return;
    feedbackBox.textContent = message;
    feedbackBox.className = `auth-feedback-msg ${isError ? "error-msg" : "success-msg"}`;
  }

  function clearFeedback() {
    if (!feedbackBox) return;
    feedbackBox.textContent = "";
    feedbackBox.className = "auth-feedback-msg hidden";
  }

  function openVerificationStep(email, message) {
    pendingEmail = email;
    if (displayEmailSpan) displayEmailSpan.textContent = email;

    loginContainer?.classList.add("hidden");
    registerContainer?.classList.add("hidden");
    verifyContainer?.classList.remove("hidden");

    window.openAuthModal();
    showFeedback(
      message || "Un code de vérification vous a été envoyé.",
      false,
    );
  }

  // Ouverture / Fermeture de la modale
  if (openBtn) {
    openBtn.addEventListener("click", () => {
      clearFeedback();
      window.openAuthModal();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      clearFeedback();
      if (modal) modal.classList.add("hidden");
    });
  }

  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      clearFeedback();
      modal.classList.add("hidden");
    }
  });

  // Bascule entre formulaires
  if (switchToRegister) {
    switchToRegister.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "login.html?tab=register";
    });
  }

  if (switchToLogin) {
    switchToLogin.addEventListener("click", (e) => {
      e.preventDefault();
      clearFeedback();
      registerContainer?.classList.add("hidden");
      loginContainer?.classList.remove("hidden");
      verifyContainer?.classList.add("hidden");
    });
  }

  // Submission : Connexion
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearFeedback();

      const email = loginForm.querySelector('input[type="email"]').value;
      const password = loginForm.querySelector('input[type="password"]').value;

      try {
        const response = await fetch(`${window.API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          modal?.classList.add("hidden");
          window.location.href = "game.html";
        } else if (response.status === 403) {
          openVerificationStep(
            email,
            data.error ||
              "Veuillez valider votre e-mail avant de vous connecter.",
          );
        } else {
          showFeedback(data.error || "Identifiants incorrects.", true);
        }
      } catch (err) {
        console.error("Erreur lors de la connexion :", err);
        showFeedback("Erreur de connexion au serveur.", true);
      }
    });
  }

  // Submission : Inscription
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearFeedback();

      const email = document.getElementById("reg-email").value;
      const password = document.getElementById("reg-password").value;

      try {
        const response = await fetch(`${window.API_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok && data.requiresVerification) {
          openVerificationStep(data.email, data.message);
        } else {
          showFeedback(data.error || "Erreur lors de l'inscription.", true);
        }
      } catch (err) {
        console.error("Erreur lors de l'inscription :", err);
        showFeedback("Erreur de connexion au serveur.", true);
      }
    });
  }

  // Submission : Code de vérification
  if (verifyForm) {
    verifyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearFeedback();

      const code = document.getElementById("verify-code").value;

      try {
        const response = await fetch(
          `${window.API_URL}/api/auth/verify-email`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email: pendingEmail, code }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          modal?.classList.add("hidden");
          window.location.href = "game.html";
        } else {
          showFeedback(data.error || "Code invalide ou expiré.", true);
        }
      } catch (err) {
        console.error("Erreur lors de la vérification :", err);
        showFeedback("Erreur de connexion au serveur.", true);
      }
    });
  }

  // Renvoi du code
  if (resendCodeBtn) {
    resendCodeBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      clearFeedback();

      if (!pendingEmail) {
        showFeedback(
          "Adresse email introuvable. Veuillez retenter votre inscription.",
          true,
        );
        return;
      }

      try {
        const response = await fetch(`${window.API_URL}/api/auth/resend-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: pendingEmail }),
        });

        const data = await response.json();

        if (response.ok) {
          showFeedback(data.message || "Nouveau code envoyé !", false);
        } else {
          showFeedback(
            data.error || "Impossible d'envoyer un nouveau code.",
            true,
          );
        }
      } catch (err) {
        console.error("Erreur lors du renvoi de code :", err);
        showFeedback("Erreur de connexion au serveur.", true);
      }
    });
  }
});

// --- 3. DÉLÉGATION D'ÉVÉNEMENTS GLOBAUX ---
// Interception des clics sur les boutons "Play"
document.addEventListener("click", async (event) => {
  const btn = event.target.closest(".play-game");
  if (btn) {
    window.location.href = "game.html";
  }
});

// Clics sur les boutons de déconnexion
document.addEventListener("click", async (event) => {
  const logoutBtn = event.target.closest(".logout-button");
  if (logoutBtn) {
    event.preventDefault();

    try {
      const response = await fetch(`${window.API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        window.location.href = "index.html";
      }
    } catch (err) {
      console.error("Erreur réseau lors de la déconnexion :", err);
    }
  }
});
