const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: "Token manquant." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId || decoded.id,
      email: decoded.email,
    };

    next();
  } catch (error) {
    return res.status(403).json({ message: "Token invalide." });
  }
}

module.exports = { authenticateToken };
