class AppHeader extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
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
          <li class="nav-logout-item" hidden><a href="index.html" class="logout-button">Log out</a></li>
          </ul>
        </nav>
      </header>
    `;

    // Authentication relies on the HTTP-only session cookie.
    // Wait for auth.js to load (included after components.js).
    const updateAuthNavigation = async () => {
      if (typeof window.checkAuthStatus !== "function") return;

      const accountItem = this.querySelector(".nav-account-item");
      const loginItem = this.querySelector(".nav-login-item");
      const logoutItem = this.querySelector(".nav-logout-item");

      try {
        const user = await window.checkAuthStatus();
        if (!this.isConnected) return;

        accountItem.hidden = !user;
        loginItem.hidden = Boolean(user);
        logoutItem.hidden = !user;
      } catch (error) {
        accountItem.hidden = true;
        loginItem.hidden = false;
        logoutItem.hidden = true;
      }
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", updateAuthNavigation, { once: true });
    } else {
      updateAuthNavigation();
    }

    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    this.querySelectorAll(".main-nav a").forEach(link => {
      const targetPage = ["account.html", "badges.html", "settings.html"].includes(currentPage)
        ? "account.html"
        : currentPage;
      if (link.getAttribute("href") === targetPage && !link.classList.contains("logout-button")) {
        link.setAttribute("aria-current", "page");
      }
    });

    const toggle = this.querySelector(".game-menu-toggle");
    const nav = this.querySelector(".main-nav");

    const closeMenu = () => {
      nav.classList.remove("game-nav-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
    };

    toggle?.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("game-nav-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });

    document.addEventListener("click", (event) => {
      if (!this.contains(event.target) && nav.classList.contains("game-nav-open")) {
        closeMenu();
      }
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeMenu();
    });
    nav.addEventListener("click", event => {
      if (event.target.closest("a")) closeMenu();
    });
  }
}

customElements.define("app-header", AppHeader);

// Listen for the global event that opens the authentication modal.
window.addEventListener("open-auth-modal", () => {
  const authModal = document.getElementById("auth-modal");
  if (authModal) {
    authModal.classList.remove("hidden");
  }
});

// Close the authentication modal.
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

// Authentication modal component.
class AuthModal extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div id="auth-modal" class="modal hidden">
        <div class="modal-content">
          <span class="close-btn">&times;</span>

          <!-- User feedback area -->
          <div id="auth-feedback" class="auth-feedback-msg hidden"></div>

          <!-- Login form -->
          <div id="login-form-container">
            <h2>Log in</h2>
            <form id="login-form">
              <input type="email" placeholder="Email" required />
              <input type="password" placeholder="Password" required />
              <button type="submit">LOG IN</button>
            </form>
            <p>Don't have an account yet? <button type="button" id="switch-to-register">Sign up</button></p>
          </div>

          <!-- Registration form (hidden by default) -->
          <div id="register-form-container" class="hidden">
            <h2>Create an account</h2>
            <form id="register-form">
              <input type="email" id="reg-email" placeholder="Email" required />
              <input type="password" id="reg-password" placeholder="Password" required />
              <button type="submit">CREATE ACCOUNT</button>
            </form>
            <p>Already have an account? <button type="button" id="switch-to-login">Log in</button></p>
          </div>

          <!-- Email verification form (hidden by default) -->
          <div id="verify-form-container" class="hidden">
            <h2>Verify your email</h2>
            <p>A verification code has been sent to your email address: <strong id="display-pending-email"></strong></p>
            <form id="verify-form">
              <input type="text" id="verify-code" placeholder="6-digit code" maxlength="6" required />
              <button type="submit">VERIFY CODE</button>
            </form>
            <p>Didn't receive the code? <button type="button" id="resend-code-btn">Resend code</button></p>
          </div>

        </div>
      </div>
    `;
  }
}

customElements.define("auth-modal", AuthModal);
