// Détection automatique de l'environnement
const isLocalhost =
  window.location.hostname ===
  ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

// Remplace cette URL par l'URL finale que Northflank te fournira
const PRODUCTION_API_URL = "https://ton-app.code.run";

// Expose une variable globale accessible partout dans l'application
window.API_URL = isLocalhost ? "http://localhost:3001" : PRODUCTION_API_URL;
