document.addEventListener('DOMContentLoaded', () => {
  // --- 1. SÉLECTEURS ÉLÉMENTS DU DOM ---
  const modal = document.getElementById('auth-modal');
  const openBtn = document.getElementById('open-auth-btn');
  const closeBtn = document.querySelector('.close-btn');

  // Conteneurs des 3 formulaires
  const loginContainer = document.getElementById('login-form-container');
  const registerContainer = document.getElementById('register-form-container');
  const verifyContainer = document.getElementById('verify-form-container');

  // Boutons de bascule (switch)
  const switchToRegister = document.getElementById('switch-to-register');
  const switchToLogin = document.getElementById('switch-to-login');

  // Formulaires
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const verifyForm = document.getElementById('verify-form');

  // Variable d'état pour savoir si l'utilisateur est connecté
  let isAuthenticated = false; // À adapter selon votre système de session (ex: localStorage)

  // --- 2. GESTION DE L'OUVERTURE / FERMETURE DE LA MODALE ---
  if (openBtn) {
    openBtn.addEventListener('click', () => {
      if (modal) modal.classList.remove('hidden');
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      if (modal) modal.classList.add('hidden');
    });
  }

  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.classList.add('hidden');
    }
  });

  // --- 3. BASCULEMENT ENTRE LES FORMULAIRES ---
  if (switchToRegister) {
    switchToRegister.addEventListener('click', (e) => {
      e.preventDefault();
      loginContainer.classList.add('hidden');
      registerContainer.classList.remove('hidden');
      verifyContainer.classList.add('hidden');
    });
  }

  if (switchToLogin) {
    switchToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      registerContainer.classList.add('hidden');
      loginContainer.classList.remove('hidden');
      verifyContainer.classList.add('hidden');
    });
  }

  // --- 4. GESTION DE LA SOUMISSION DU FORMULAIRE DE CONNEXION ---
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = loginForm.querySelector('input[type="email"]').value;
      const password = loginForm.querySelector('input[type="password"]').value;

      try {
        const response = await fetch(`${window.API_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (response.ok) {
          const data = await response.json();
          
          // Stocker le jeton d'authentification (si votre API en renvoie un)
          if (data.token) {
            localStorage.setItem('userToken', data.token);
          }

          isAuthenticated = true;
          modal.classList.add('hidden');

          // Lancer directement le jeu après la connexion réussie
          window.location.href = 'game.html'; 
          // Ou : startGame(); si le jeu est sur la même page
        } else {
          alert("Identifiants incorrects.");
        }
      } catch (err) {
        console.error("Erreur lors de la connexion :", err);
      }
    });
  }

  // --- 5. GESTION DE LA SOUMISSION DE L'INSCRIPTION ---
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;

      try {
        const response = await fetch(`${window.API_URL}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        if (response.ok) {
          registerContainer.classList.add('hidden');
          verifyContainer.classList.remove('hidden');
        } else {
          alert("Erreur lors de l'inscription.");
        }
      } catch (err) {
        console.error("Erreur lors de l'inscription :", err);
      }
    });
  }

  // --- 6. GESTION DU CODE DE VÉRIFICATION ---
  if (verifyForm) {
    verifyForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const code = document.getElementById('verify-code').value;

      try {
        const response = await fetch(`${window.API_URL}/api/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });

        if (response.ok) {
          alert("Compte vérifié avec succès ! Vous pouvez maintenant vous connecter.");
          verifyContainer.classList.add('hidden');
          loginContainer.classList.remove('hidden');
        } else {
          alert("Code invalide ou expiré.");
        }
      } catch (err) {
        console.error("Erreur lors de la vérification :", err);
      }
    });
  }
});

document.addEventListener('click', (event) => {
  const btn = event.target.closest('.play-game');
  if (btn) {
    event.preventDefault();

    // Vérifier si l'utilisateur est connecté (exemple avec un jeton dans localStorage)
    const token = localStorage.getItem('userToken');

    if (token) {
      window.location.href = 'game.html';
    } else {
      // Si l'utilisateur n'est pas connecté, on ouvre la modale d'authentification
      const modal = document.querySelector('#auth-modal');
      if (modal) modal.classList.remove('hidden');
    }
  }
});