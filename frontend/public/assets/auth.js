document.addEventListener('DOMContentLoaded', () => {
  // --- 1. SÉLECTEURS ÉLÉMENTS DU DOM ---
  const modal = document.getElementById('auth-modal');
  const openBtn = document.getElementById('open-auth-btn');
  const closeBtn = document.querySelector('.close-btn');

  // Conteneurs des 3 formulaires
  const loginContainer = document.getElementById('login-form-container');
  const registerContainer = document.getElementById('register-form-container');
  const verifyContainer = document.getElementById('verify-form-container');

  // Boutons de bascule (switch) et renvoi de code
  const switchToRegister = document.getElementById('switch-to-register');
  const switchToLogin = document.getElementById('switch-to-login');
  const resendCodeBtn = document.getElementById('resend-code-btn');

  // Zone de message d'information / d'erreur
  const feedbackBox = document.getElementById('auth-feedback');
  const displayEmailSpan = document.getElementById('display-pending-email');

  // Formulaires
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const verifyForm = document.getElementById('verify-form');

  // Variable locale pour retenir l'email pendant le processus de vérification
  let pendingEmail = '';

  // Fonction utilitaire pour afficher des messages dans la modale
  function showFeedback(message, isError = false) {
    if (!feedbackBox) return;
    feedbackBox.textContent = message;
    feedbackBox.className = `auth-feedback-msg ${isError ? 'error-msg' : 'success-msg'}`;
  }

  function clearFeedback() {
    if (!feedbackBox) return;
    feedbackBox.textContent = '';
    feedbackBox.className = 'auth-feedback-msg hidden';
  }

  // Fonction pour afficher la section de vérification
  function openVerificationStep(email, message) {
    pendingEmail = email;
    if (displayEmailSpan) displayEmailSpan.textContent = email;

    loginContainer.classList.add('hidden');
    registerContainer.classList.add('hidden');
    verifyContainer.classList.remove('hidden');

    if (modal) modal.classList.remove('hidden');
    showFeedback(message || "Un code de vérification vous a été envoyé.", false);
  }

  // --- 2. GESTION DE L'OUVERTURE / FERMETURE DE LA MODALE ---
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      clearFeedback();
      if (modal) modal.classList.remove('hidden');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      clearFeedback();
      if (modal) modal.classList.add('hidden');
    });
  }

  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      clearFeedback();
      modal.classList.add('hidden');
    }
  });

  // --- 3. BASCULEMENT ENTRE LES FORMULAIRES ---
  if (switchToRegister) {
    switchToRegister.addEventListener('click', (e) => {
      e.preventDefault();
      clearFeedback();
      loginContainer.classList.add('hidden');
      registerContainer.classList.remove('hidden');
      verifyContainer.classList.add('hidden');
    });
  }

  if (switchToLogin) {
    switchToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      clearFeedback();
      registerContainer.classList.add('hidden');
      loginContainer.classList.remove('hidden');
      verifyContainer.classList.add('hidden');
    });
  }

  // --- 4. GESTION DE LA SOUMISSION DU FORMULAIRE DE CONNEXION ---
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFeedback();

      const email = loginForm.querySelector('input[type="email"]').value;
      const password = loginForm.querySelector('input[type="password"]').value;

      try {
        const response = await fetch(`${window.API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
          modal.classList.add('hidden');
          window.location.href = 'game.html';
        } else if (response.status === 403) {
          // Si le compte n'est pas vérifié
          openVerificationStep(email, data.error || "Veuillez valider votre e-mail avant de vous connecter.");
        } else {
          showFeedback(data.error || "Identifiants incorrects.", true);
        }
      } catch (err) {
        console.error("Erreur lors de la connexion :", err);
        showFeedback("Erreur de connexion au serveur.", true);
      }
    });
  }

  // --- 5. GESTION DE LA SOUMISSION DE L'INSCRIPTION ---
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFeedback();

      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;

      try {
        const response = await fetch(`${window.API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password })
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

  // --- 6. GESTION DU CODE DE VÉRIFICATION ---
  if (verifyForm) {
    verifyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearFeedback();

      const code = document.getElementById('verify-code').value;

      try {
        const response = await fetch(`${window.API_URL}/api/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: pendingEmail, code })
        });

        const data = await response.json();

        if (response.ok) {
          modal.classList.add('hidden');
          window.location.href = 'game.html';
        } else {
          showFeedback(data.error || "Code invalide ou expiré.", true);
        }
      } catch (err) {
        console.error("Erreur lors de la vérification :", err);
        showFeedback("Erreur de connexion au serveur.", true);
      }
    });
  }

  // --- 7. RENVOYER LE CODE DE VÉRIFICATION ---
  if (resendCodeBtn) {
    resendCodeBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      clearFeedback();

      if (!pendingEmail) {
        showFeedback("Adresse email introuvable. Veuillez retenter votre inscription.", true);
        return;
      }

      try {
        const response = await fetch(`${window.API_URL}/api/auth/resend-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: pendingEmail })
        });

        const data = await response.json();

        if (response.ok) {
          showFeedback(data.message || "Nouveau code envoyé !", false);
        } else {
          showFeedback(data.error || "Impossible d'envoyer un nouveau code.", true);
        }
      } catch (err) {
        console.error("Erreur lors du renvoi de code :", err);
        showFeedback("Erreur de connexion au serveur.", true);
      }
    });
  }
});

// Fonction pour vérifier si l'utilisateur est authentifié via le cookie
async function checkAuth() {
  try {
    const response = await fetch(`${window.API_URL}/api/auth/me`, {
      method: 'GET',
      credentials: 'include' // OBLIGATOIRE : transmet le cookie HttpOnly au serveur
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.user; // L'utilisateur est connecté
    }
  } catch (err) {
    console.error("Erreur de vérification de session :", err);
  }
  return null; // Non connecté
}

// Interception des clics sur "Play"
document.addEventListener('click', async (event) => {
  const btn = event.target.closest('.play-game');
  if (btn) {
    event.preventDefault();

    const user = await checkAuth();

    if (user) {
      window.location.href = 'game.html';
    } else {
      const modal = document.querySelector('#auth-modal');
      if (modal) modal.classList.remove('hidden');
    }
  }
});

// --- GESTION DE LA DÉCONNEXION ---
document.addEventListener('click', async (event) => {
  const logoutBtn = event.target.closest('.logout-button');
  
  if (logoutBtn) {
    event.preventDefault();

    try {
      const response = await fetch(`${window.API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // Indispensable pour supprimer le cookie HTTP-Only côté serveur
      });

      if (response.ok) {
        // Redirection vers l'accueil ou rechargement de la page après déconnexion
        window.location.href = 'index.html'; 
      } else {
        console.error('Erreur lors de la déconnexion');
      }
    } catch (err) {
      console.error('Erreur réseau lors de la déconnexion :', err);
    }
  }
});