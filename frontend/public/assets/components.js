// Composant Nav
class AppHeader extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="site-header">
        <a href="index.html" class="site-logo">Guess the Date</a>

        <nav class="main-nav" aria-label="Main navigation">
            <ul>
            <li>
                <a href="game.html" class="play-game">Play</a>
            </li>
            <li>
                <a href="about.html">About</a>
            </li>
            <li>
                <a href="login.html">Log in</a>
            </li>
            </ul>
        </nav>
      </header>
    `;
  }
}
customElements.define("app-header", AppHeader);

// Composant Popup Auth
class AuthModal extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div id="auth-modal" class="modal hidden">
        <div class="modal-content">
          <span class="close-btn">&times;</span>
          
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
            <p>Un code a été envoyé à votre adresse e-mail.</p>
            <form id="verify-form">
              <input type="text" id="verify-code" placeholder="Code à 6 chiffres" maxlength="6" required />
              <button type="submit">Valider le code</button>
            </form>
          </div>

        </div>
      </div>
    `;
  }
}
customElements.define("auth-modal", AuthModal);
