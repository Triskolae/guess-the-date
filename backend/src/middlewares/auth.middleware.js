const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  // Lecture du token depuis le cookie HTTP-Only
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Accès non autorisé : aucun jeton fourni.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Injecte les infos utilisateur ({ userId, email })
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Jeton invalide ou expiré.' });
  }
}

module.exports = { authenticateToken };
