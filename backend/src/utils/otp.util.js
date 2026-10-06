/**
 * Génère un code numérique aléatoire à 6 chiffres
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Calcule l'expiration (ex: +15 minutes à partir de maintenant)
 */
function getOTPExpiration(minutes = 15) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

module.exports = {
  generateOTP,
  getOTPExpiration,
};
