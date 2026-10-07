/**
 * Vérifie l'authentification auprès du serveur et redirige ou ouvre la modale si nécessaire.
 */
export async function checkAuth() {
  try {
    // 1. Appel de la fonction globale checkAuthStatus
    const isAuthenticated = await window.checkAuthStatus();

    if (!isAuthenticated) {
      const isGamePage = window.location.pathname.endsWith("game.html");

      if (!isGamePage) {
        // Redirection vers l'accueil avec le paramètre openAuth=true
        window.location.href = "index.html?openAuth=true";
      } else {
        // Si on est déjà sur la page de jeu, on ouvre la modale globale
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

// Lancement automatique au chargement
checkAuth();
