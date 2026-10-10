const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../database/db");
const { sendVerificationEmail } = require("../services/email.service");
const { generateOTP, getOTPExpiration } = require("../utils/otp.util");

// Configuration du cookie de session
const getCookieOptions = () => ({
  httpOnly: true,
  secure:
    process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging",
  sameSite:
    process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging"
      ? "none"
      : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
});

/**
 * Compare un mot de passe en texte clair avec son hash stocké en base de données.
 * @param {string} password - Le mot de passe saisi par l'utilisateur.
 * @param {string} hash - Le mot de passe haché stocké en BDD.
 * @returns {Promise<boolean>} - `true` si le mot de passe correspond, sinon `false`.
 */
async function verifyPassword(password, hash) {
  if (!password || !hash) {
    return false;
  }
  return await bcrypt.compare(password, hash);
}

// 1. Inscription
async function register(req, res) {
  try {
    const { email, password, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "E-mail et mot de passe requis." });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db("users").where({ email }).first();

    if (existingUser) {
      // Cas 1 : Utilisateur déjà vérifié -> Erreur
      if (existingUser.is_verified) {
        return res
          .status(409)
          .json({ error: "Un compte existe déjà avec cet e-mail." });
      }

      // Cas 2 : Utilisateur existant MAIS non vérifié -> Régénération et renvoi de code
      const newCode = generateOTP();
      const newExpiration = getOTPExpiration(15);

      await db("users").where({ id: existingUser.id }).update({
        verification_code: newCode,
        verification_expires_at: newExpiration,
      });

      await sendVerificationEmail(email, newCode);

      return res.status(200).json({
        requiresVerification: true,
        email,
        message:
          "Un compte non vérifié existe déjà. Un nouveau code de vérification vous a été envoyé.",
      });
    }

    // Cas 3 : Nouvel utilisateur
    const password_hash = await bcrypt.hash(password, 10);
    const verification_code = generateOTP();
    const verification_expires_at = getOTPExpiration(15); // Expire dans 15 min

    await db("users").insert({
      email,
      password_hash,
      username: username || null,
      is_verified: false,
      verification_code,
      verification_expires_at,
    });

    // Envoi de l'e-mail avec le code
    await sendVerificationEmail(email, verification_code);

    res.status(201).json({
      requiresVerification: true,
      email,
      message:
        "Compte créé avec succès. Un code de vérification vous a été envoyé par e-mail.",
    });
  } catch (error) {
    console.error("Erreur inscription:", error);
    res.status(500).json({ error: "Erreur lors de l'inscription." });
  }
}

// 2. Renvoi de code de vérification
async function resendCode(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Adresse e-mail requise." });
    }

    const user = await db("users").where({ email }).first();

    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }

    if (user.is_verified) {
      return res.status(400).json({ error: "Ce compte est déjà vérifié." });
    }

    const newCode = generateOTP();
    const newExpiration = getOTPExpiration(15);

    await db("users").where({ id: user.id }).update({
      verification_code: newCode,
      verification_expires_at: newExpiration,
    });

    await sendVerificationEmail(email, newCode);

    res.json({ message: "Un nouveau code vous a été envoyé par e-mail." });
  } catch (error) {
    console.error("Erreur renvoi de code:", error);
    res.status(500).json({ error: "Erreur lors du renvoi du code." });
  }
}

// 3. Vérification de l'e-mail
async function verifyEmail(req, res) {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: "E-mail et code requis." });
    }

    const user = await db("users").where({ email }).first();

    if (!user) {
      return res.status(404).json({ error: "Utilisateur introuvable." });
    }

    if (user.is_verified) {
      return res.status(400).json({ error: "Ce compte est déjà vérifié." });
    }

    if (
      user.verification_code !== code ||
      new Date() > new Date(user.verification_expires_at)
    ) {
      return res
        .status(400)
        .json({ error: "Code de vérification invalide ou expiré." });
    }

    // Marquer l'utilisateur comme vérifié et nettoyer le code
    await db("users").where({ id: user.id }).update({
      is_verified: true,
      verification_code: null,
      verification_expires_at: null,
    });

    // Générer et déposer le JWT dans un cookie HTTP-Only
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.cookie("token", token, getCookieOptions());
    res.json({
      message: "E-mail vérifié avec succès. Vous êtes connecté.",
      user: { id: user.id, email: user.email, username: user.username },
    });
  } catch (error) {
    console.error("Erreur vérification e-mail:", error);
    res.status(500).json({ error: "Erreur lors de la vérification." });
  }
}

// 4. Connexion
async function login(req, res) {
  try {
    const { email, password } = req.body;

    // 1. Recherche de l'utilisateur
    const user = await db("users").where({ email }).first();
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    // 2. Vérification du statut d'activation du compte
    if (!user.is_verified) {
      return res.status(403).json({
        message: "Compte non vérifié.",
        requiresVerification: true,
        email: user.email,
      });
    }

    // 3. Vérification de l'onboarding via la table user_eras
    const hasPreferences = await db("user_eras")
      .where({ user_id: user.id })
      .first();

    // 4. Génération du token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "votre_secret_jwt",
      { expiresIn: "24h" },
    );

    // 5. Envoi du cookie HTTP-only
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // 6. Réponse JSON
    return res.json({
      message: "Connexion réussie",
      hasCompletedOnboarding: !!hasPreferences,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Erreur login :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur lors de la connexion." });
  }
}

// 5. Profil connecté (/me)
async function getMe(req, res) {
  try {
    const user = await db("users")
      .select("id", "email", "username", "is_verified", "created_at")
      .where({ id: req.user.userId })
      .first();

    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: "Erreur récupération profil." });
  }
}

// 6. Déconnexion
function logout(req, res) {
  res.clearCookie("token", getCookieOptions());
  res.json({ message: "Déconnexion réussie." });
}

module.exports = {
  register,
  resendCode,
  verifyEmail,
  login,
  getMe,
  logout,
};
