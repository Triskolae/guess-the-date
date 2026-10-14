/**
 * Vérifie l'authentification auprès du serveur et redirige ou ouvre la modale si nécessaire.
 */
export async function checkAuth() {
  try {
    const isAuthenticated = await window.checkAuthStatus();

    if (!isAuthenticated) {
      const isGamePage = /\/game(\.html)?\/?$/.test(window.location.pathname);

      if (!isGamePage) {
        window.location.href = "index.html?openAuth=true";
      } else {
        if (typeof window.openAuthModal === "function") {
          window.openAuthModal();
        }
      }
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "Erreur lors de la vérification de l'authentification :",
      error,
    );
    return false;
  }
}

checkAuth();
