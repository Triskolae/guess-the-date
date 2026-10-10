document.addEventListener("DOMContentLoaded", () => {
  // --- ÉLÉMENTS DOM ---
  const menuToggle = document.querySelector(".auth-menu-toggle");
  const navigation = document.querySelector(".auth-navigation");
  const loginTab = document.querySelector("#login-tab");
  const registerTab = document.querySelector("#register-tab");
  const loginPanel = document.querySelector("#login-panel");
  const registerPanel = document.querySelector("#register-panel");
  const loginForm = document.querySelector("#page-login-form");
  const registerForm = document.querySelector("#page-register-form");
  const verifyForm = document.querySelector("#verify-form");
  const authFeedback = document.querySelector("#page-auth-feedback");

  // --- UTILS ---
  function showAuthFeedback(message, type = "error") {
    if (!authFeedback) return;
    authFeedback.textContent = message;
    authFeedback.classList.remove("hidden");
    authFeedback.dataset.type = type;
  }

  function clearAuthFeedback() {
    if (!authFeedback) return;
    authFeedback.textContent = "";
    authFeedback.classList.add("hidden");
    delete authFeedback.dataset.type;
  }

  function showAuthPanel(activeTab, activePanel, inactiveTab, inactivePanel) {
    activeTab.classList.add("active");
    activeTab.setAttribute("aria-selected", "true");
    activePanel.classList.remove("hidden");

    inactiveTab.classList.remove("active");
    inactiveTab.setAttribute("aria-selected", "false");
    inactivePanel.classList.add("hidden");
  }

  async function handleLogin(email, password) {
    clearAuthFeedback();

    try {
      const response = await fetch(`${window.API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Cas où le compte n'est pas encore vérifié
        if (data.requiresVerification) {
          // Remplir l'email affiché dans le formulaire de vérification
          const displayEmail = document.getElementById("display-pending-email");
          if (displayEmail) displayEmail.textContent = data.email;

          // Masquer le formulaire de connexion et afficher celui du code
          document.getElementById("page-login-form")?.classList.add("hidden");
          const verifyContainer = document.getElementById(
            "verify-form-container",
          );
          if (verifyContainer) verifyContainer.classList.remove("hidden");

          showAuthFeedback(
            "Veuillez valider votre compte avec le code reçu par email.",
            "warning",
          );
          return false;
        }

        showAuthFeedback(data.message || "Unable to log in.");
        return false;
      }

      // Redirection si la connexion réussit
      if (data.hasCompletedOnboarding) {
        window.location.href = "game.html";
      } else {
        window.location.href = "onboarding.html";
      }
      return true;
    } catch (error) {
      console.error("Login error:", error);
      showAuthFeedback("Unable to connect to the server.");
      return false;
    }
  }

  // --- NAVIGATION & ONGLETS ---
  if (menuToggle && navigation) {
    menuToggle.addEventListener("click", () => {
      const isOpen = navigation.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", isOpen);
      menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation",
      );
    });
  }

  if (loginTab && registerTab) {
    loginTab.addEventListener("click", () =>
      showAuthPanel(loginTab, loginPanel, registerTab, registerPanel),
    );
    registerTab.addEventListener("click", () =>
      showAuthPanel(registerTab, registerPanel, loginTab, loginPanel),
    );

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("tab") === "register") {
      showAuthPanel(registerTab, registerPanel, loginTab, loginPanel);
    }
  }

  // --- ANIMATION SPARKLES ---
  document.querySelectorAll(".logo-sparkle").forEach((sparkle) => {
    function triggerSparkle() {
      sparkle.classList.add("sparkle-active");
      setTimeout(() => {
        sparkle.classList.remove("sparkle-active");
        setTimeout(triggerSparkle, 1500 + Math.random() * 4500);
      }, 700);
    }
    setTimeout(triggerSparkle, Math.random() * 3000);
  });

  // --- SOUMISSION CONNEXION ---
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.querySelector("#login-email").value.trim();
      const password = document.querySelector("#login-password").value;
      await handleLogin(email, password);
    });
  }

  // --- SOUMISSION INSCRIPTION ---
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAuthFeedback();

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
          const displayEmail = document.getElementById("display-pending-email");
          if (displayEmail) displayEmail.textContent = email;

          registerForm.classList.add("hidden");
          const verifyContainer = document.getElementById(
            "verify-form-container",
          );
          if (verifyContainer) verifyContainer.classList.remove("hidden");
        } else {
          showAuthFeedback(data.message || "Unable to sign up.");
        }
      } catch (error) {
        console.error("Erreur lors de l'inscription :", error);
        showAuthFeedback("Unable to sign up.");
      }
    });
  }

  // --- SOUMISSION CODE DE VÉRIFICATION ---
  if (verifyForm) {
    verifyForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearAuthFeedback();

      const email = document.getElementById(
        "display-pending-email",
      ).textContent;
      const code = document.getElementById("verify-code").value.trim();

      try {
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

        // Connexion automatique avec la fonction factorisée
        const password = document.getElementById("register-password").value;
        const loggedIn = await handleLogin(email, password);

        if (!loggedIn) {
          alert("Compte vérifié ! Veuillez vous connecter manuellement.");
          showAuthPanel(loginTab, loginPanel, registerTab, registerPanel);
        }
      } catch (error) {
        console.error("Erreur de vérification :", error);
        showAuthFeedback("Erreur lors de la vérification du code.");
      }
    });
  }
});
