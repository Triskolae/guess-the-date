// Détection automatique de l'environnement
const isLocalhost =
  window.location.hostname ===
  ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);

const PRODUCTION_API_URL = "p02--guess-the-date-backend--nb2xkmhmvcg6.code.run";

window.API_URL = isLocalhost ? "http://localhost:3001" : PRODUCTION_API_URL;
