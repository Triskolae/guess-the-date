// Détection automatique de l'environnement
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '[::1]'
);

const PRODUCTION_API_URL = "p02--guess-the-date-backend--nb2xkmhmvcg6.code.run";

window.API_URL = isLocalhost ? "http://localhost:3001" : PRODUCTION_API_URL;
