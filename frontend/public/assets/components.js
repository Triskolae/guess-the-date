// Composant Nav
class AppHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="site-header">
        <a href="index.html" class="site-logo" aria-label="Guess the Date — Home">
          <picture>
            <source
              media="(max-width: 600px)"
              srcset="ressources-design/LOOP_GuessTheDate_DoreeBlue.png"
            />
            <img
              src="ressources-design/LOGO_GuessTheDate_DoreeBleu.png"
              alt="Guess the Date"
            />
          </picture>
        </a>

        <button type="button" class="game-menu-toggle" aria-label="Open menu" aria-controls="game-navigation" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
        <nav class="main-nav" id="game-navigation" aria-label="Main navigation">
          <ul>
          <li><a href="index.html">Home</a></li>
          <li>
            <a href="game.html" class="play-game">Play</a>
          </li>
          <li>
            <a href="about.html">About</a>
          </li>
          <li class="nav-account-item" hidden><a href="account.html">Account</a></li>
          <li class="nav-login-item"><a href="login.html">Log in</a></li>
          </ul>
        </nav>
      </header>
    `;
    // L'authentification repose sur le cookie de session HTTP-Only.
    // Attendre le chargement de auth.js (inclus après components.js).
    const updateAuthNavigation = async () => {
      if (typeof window.checkAuthStatus !== "function") return;
      const accountItem = this.querySelector(".nav-account-item");
      const loginItem = this.querySelector(".nav-login-item");
      try {
        const user = await window.checkAuthStatus();
        if (!this.isConnected) return;
        accountItem.hidden = !user;
        loginItem.hidden = Boolean(user);
      } catch (error) {
        accountItem.hidden = true;
        loginItem.hidden = false;
      }
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", updateAuthNavigation, { once: true });
    } else {
      updateAuthNavigation();
    }
    const toggle = this.querySelector(".game-menu-toggle");
    const nav = this.querySelector(".main-nav");
    toggle?.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("game-nav-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });
    document.addEventListener("click", (event) => {
      if (!this.contains(event.target) && nav.classList.contains("game-nav-open")) {
        nav.classList.remove("game-nav-open");
        toggle?.setAttribute("aria-expanded", "false");
      }
    });
  }
}
customElements.define("app-header", AppHeader);

// Écoute de l'événement global pour ouvrir la modale d'authentification
window.addEventListener("open-auth-modal", () => {
  const authModal = document.getElementById("auth-modal");
  if (authModal) {
    authModal.classList.remove("hidden");
  }
});

// Écouteur pour fermer la modale
document.addEventListener("click", (event) => {
  if (
    event.target.matches(".close-auth-modal") ||
    event.target.id === "auth-modal"
  ) {
    const authModal = document.getElementById("auth-modal");
    if (authModal) {
      authModal.classList.add("hidden");
    }
  }
});

// Composant Popup Auth
class AuthModal extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div id="auth-modal" class="modal hidden">
        <div class="modal-content">
          <span class="close-btn">&times;</span>
          
          <!-- Zone d'affichage des retours utilisateur -->
          <div id="auth-feedback" class="auth-feedback-msg hidden"></div>

          <!-- Formulaire Login -->
          <div id="login-form-container">
            <h2>Connexion</h2>
            <form id="login-form">
              <input type="email" placeholder="Email" required />
              <input type="password" placeholder="Mot de passe" required />
              <button type="submit">Se connecter</button>
            </form>
            <p>Pas encore de compte ? <button type="button" id="switch-to-register">S'inscrire</button></p>
          </div>

          <!-- Formulaire Register (Caché par défaut) -->
          <div id="register-form-container" class="hidden">
            <h2>Inscription</h2>
            <form id="register-form">
              <input type="email" id="reg-email" placeholder="Email" required />
              <input type="password" id="reg-password" placeholder="Mot de passe" required />
              <button type="submit">S'inscrire</button>
            </form>
            <p>Déjà un compte ? <button type="button" id="switch-to-login">Se connecter</button></p>
          </div>

          <!-- Formulaire Code de Vérification (Caché par défaut) -->
          <div id="verify-form-container" class="hidden">
            <h2>Vérification Email</h2>
            <p>Un code a été envoyé à votre adresse e-mail : <strong id="display-pending-email"></strong></p>
            <form id="verify-form">
              <input type="text" id="verify-code" placeholder="Code à 6 chiffres" maxlength="6" required />
              <button type="submit">Valider le code</button>
            </form>
            <p>Vous n'avez pas reçu le code ? <button type="button" id="resend-code-btn">Renvoyer le code</button></p>
          </div>

        </div>
      </div>
    `;
  }
}
customElements.define("auth-modal", AuthModal);
