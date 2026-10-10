const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../database/db");
const { sendVerificationEmail } = require("../services/email.service");
const { generateOTP, getOTPExpiration } = require("../utils/otp.util");

const isProdOrStaging =
  process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging";

const getCookieOptions = (maxAge = 7 * 24 * 60 * 60 * 1000) => ({
  httpOnly: true,
  secure: isProdOrStaging,
  sameSite: isProdOrStaging ? "none" : "lax", // 'lax' autorise les cookies en HTTP local
  maxAge,
});

async function verifyPassword(password, hash) {
  if (!password || !hash) {
    return false;
  }
  return await bcrypt.compare(password, hash);
}

async function register(req, res) {
  try {
    const { email, password, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "E-mail et mot de passe requis." });
    }

    const existingUser = await db("users").where({ email }).first();

    if (existingUser) {
      if (existingUser.is_verified) {
        return res
          .status(409)
          .json({ error: "Un compte existe déjà avec cet e-mail." });
      }

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

    const password_hash = await bcrypt.hash(password, 10);
    const verification_code = generateOTP();
    const verification_expires_at = getOTPExpiration(15);

    await db("users").insert({
      email,
      password_hash,
      username: username || null,
      is_verified: false,
      verification_code,
      verification_expires_at,
    });

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

    await db("users").where({ id: user.id }).update({
      is_verified: true,
      verification_code: null,
      verification_expires_at: null,
    });

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

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await db("users").where({ email }).first();
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      return res.status(401).json({ message: "Identifiants invalides." });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        message: "Compte non vérifié.",
        requiresVerification: true,
        email: user.email,
      });
    }

    const hasPreferences = await db("user_eras")
      .where({ user_id: user.id })
      .first();

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "votre_secret_jwt",
      { expiresIn: "24h" },
    );

    res.cookie("token", token, getCookieOptions(24 * 60 * 60 * 1000));

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

function logout(_, res) {
  const { maxAge, ...clearOptions } = getCookieOptions();
  res.clearCookie("token", clearOptions);
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
