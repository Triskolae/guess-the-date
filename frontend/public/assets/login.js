const menuToggle = document.querySelector(".auth-menu-toggle");
const navigation = document.querySelector(".auth-navigation");

const loginTab = document.querySelector("#login-tab");
const registerTab = document.querySelector("#register-tab");

const loginPanel = document.querySelector("#login-panel");
const registerPanel = document.querySelector("#register-panel");

menuToggle.addEventListener("click", () => {
  const isOpen = navigation.classList.toggle("open");

  menuToggle.setAttribute("aria-expanded", isOpen);
  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation" : "Open navigation",
  );
});

function showAuthPanel(activeTab, activePanel, inactiveTab, inactivePanel) {
  activeTab.classList.add("active");
  activeTab.setAttribute("aria-selected", "true");
  activePanel.classList.remove("hidden");

  inactiveTab.classList.remove("active");
  inactiveTab.setAttribute("aria-selected", "false");
  inactivePanel.classList.add("hidden");
}

loginTab.addEventListener("click", () => {
  showAuthPanel(loginTab, loginPanel, registerTab, registerPanel);
});

registerTab.addEventListener("click", () => {
  showAuthPanel(registerTab, registerPanel, loginTab, loginPanel);
});

const urlParams = new URLSearchParams(window.location.search);

if (urlParams.get("tab") === "register") {
  showAuthPanel(registerTab, registerPanel, loginTab, loginPanel);
}

document.querySelectorAll(".logo-sparkle").forEach((sparkle) => {
  function triggerSparkle() {
    sparkle.classList.add("sparkle-active");

    setTimeout(() => {
      sparkle.classList.remove("sparkle-active");

      const delay = 1500 + Math.random() * 4500;
      setTimeout(triggerSparkle, delay);
    }, 700);
  }

  const initialDelay = Math.random() * 3000;
  setTimeout(triggerSparkle, initialDelay);
});

const loginForm = document.querySelector("#page-login-form");
const authFeedback = document.querySelector("#page-auth-feedback");

function showAuthFeedback(message, type = "error") {
  authFeedback.textContent = message;
  authFeedback.classList.remove("hidden");
  authFeedback.dataset.type = type;
}

function clearAuthFeedback() {
  authFeedback.textContent = "";
  authFeedback.classList.add("hidden");
  delete authFeedback.dataset.type;
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearAuthFeedback();

  const email = document.querySelector("#login-email").value.trim();
  const password = document.querySelector("#login-password").value;

  try {
    const response = await fetch(`${window.API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      showAuthFeedback(data.message || "Unable to log in.");
      return;
    }

    window.location.href = "game.html";
  } catch (error) {
    console.error("Login error:", error);
    showAuthFeedback("Unable to connect to the server.");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // 1. Gestion des onglets Connexion / Inscription
  const tabBtns = document.querySelectorAll(".tab-btn");
  const forms = document.querySelectorAll(".auth-form");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabBtns.forEach((b) => b.classList.remove("active"));
      forms.forEach((f) => f.classList.remove("active"));

      btn.classList.add("active");
      const targetForm = document.getElementById(btn.dataset.tab + "-form");
      if (targetForm) {
        targetForm.classList.add("active");
      }
    });
  });

  // 2. Gestion de la soumission du formulaire de Connexion
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      try {
        const response = await fetch(`${window.API_URL}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email,
            password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          showAuthFeedback(data.message || "Unable to log in.");
          return;
        }

        window.location.href = "game.html";
      } catch (error) {
        console.error("Erreur lors de la connexion :", error);
        showAuthFeedback("Unable to log in.");
      }
    });
  }
  // 3. Gestion de la soumission du formulaire d'Inscription
  const registerForm = document.getElementById("page-register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("register-email").value.trim();
      const password = document.getElementById("register-password").value;

      if (!email || !password) {
        showAuthFeedback("Veuillez remplir tous les champs.");
        return;
      }

      try {
        const response = await fetch(`${window.API_URL}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          // Afficher l'email dans la section de vérification
          const displayEmail = document.getElementById("display-pending-email");
          if (displayEmail) displayEmail.textContent = email;

          // Masquer le formulaire d'inscription et afficher le formulaire de vérification
          registerForm.classList.add("hidden");
          const verifyContainer = document.getElementById(
            "verify-form-container",
          );
          if (verifyContainer) verifyContainer.classList.remove("hidden");

          clearAuthFeedback();
        } else {
          showAuthFeedback(data.message || "Unable to sign up.");
        }
      } catch (error) {
        console.error("Erreur lors de l'inscription :", error);
        showAuthFeedback("Unable to sign up.");
      }
    });
  }
  // 4. Gestion de la soumission du code de vérification
  const verifyForm = document.getElementById("verify-form");
  if (verifyForm) {
    verifyForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById(
        "display-pending-email",
      ).textContent;
      const code = document.getElementById("verify-code").value.trim();

      try {
        // Step 1: Validation du code de vérification
        const verifyResponse = await fetch(
          `${window.API_URL}/api/auth/verify-email`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, code }),
          },
        );

        const verifyData = await verifyResponse.json();

        if (!verifyResponse.ok) {
          showAuthFeedback(verifyData.message || "Code invalide.");
          return;
        }

        // Step 2: Récupération du mot de passe saisi à l'inscription pour la connexion automatique
        const password = document.getElementById("register-password").value;

        const loginResponse = await fetch(`${window.API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });

        if (loginResponse.ok) {
          // Redirection vers la page d'onboarding
          window.location.href = "onboarding.html";
        } else {
          // En cas d'échec de la connexion auto, redirection vers l'onglet login
          alert("Compte vérifié ! Veuillez vous connecter.");
          showAuthPanel(loginTab, loginPanel, registerTab, registerPanel);
        }
      } catch (error) {
        console.error("Erreur de vérification/connexion :", error);
        showAuthFeedback("Erreur lors de la vérification du code.");
      }
    });
  }
});
