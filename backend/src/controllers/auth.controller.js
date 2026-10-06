const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { sendVerificationEmail } = require('../services/email.service');
const { generateOTP, getOTPExpiration } = require('../utils/otp.util');

// Configuration du cookie de session
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging',
  sameSite: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 jours
});

// 1. Inscription
async function register(req, res) {
  try {
    const { email, password, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail et mot de passe requis.' });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(409).json({ error: 'Un compte existe déjà avec cet e-mail.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const verification_code = generateOTP();
    const verification_expires_at = getOTPExpiration(15); // Expire dans 15 min

    await db('users').insert({
      email,
      password_hash,
      username: username || null,
      is_verified: false,
      verification_code,
      verification_expires_at
    });

    // Envoi de l'e-mail avec le code
    await sendVerificationEmail(email, verification_code);

    res.status(201).json({
      message: 'Compte créé avec succès. Un code de vérification vous a été envoyé par e-mail.'
    });
  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur lors de l\'inscription.' });
  }
}

// 2. Vérification de l'e-mail
async function verifyEmail(req, res) {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'E-mail et code requis.' });
    }

    const user = await db('users').where({ email }).first();

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    if (user.is_verified) {
      return res.status(400).json({ error: 'Ce compte est déjà vérifié.' });
    }

    if (user.verification_code !== code || new Date() > new Date(user.verification_expires_at)) {
      return res.status(400).json({ error: 'Code de vérification invalide ou expiré.' });
    }

    // Marquer l'utilisateur comme vérifié et nettoyer le code
    await db('users').where({ id: user.id }).update({
      is_verified: true,
      verification_code: null,
      verification_expires_at: null
    });

    // Générer et déposer le JWT dans un cookie HTTP-Only
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, getCookieOptions());
    res.json({ message: 'E-mail vérifié avec succès. Vous êtes connecté.', user: { id: user.id, email: user.email, username: user.username } });
  } catch (error) {
    console.error('Erreur vérification e-mail:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification.' });
  }
}

// 3. Connexion
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await db('users').where({ email }).first();
    if (!user) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ error: 'Veuillez vérifier votre adresse e-mail avant de vous connecter.' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, getCookieOptions());
    res.json({ message: 'Connexion réussie.', user: { id: user.id, email: user.email, username: user.username } });
  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion.' });
  }
}

// 4. Profil connecté (/me)
async function getMe(req, res) {
  try {
    const user = await db('users')
      .select('id', 'email', 'username', 'is_verified', 'created_at')
      .where({ id: req.user.userId })
      .first();

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Erreur récupération profil.' });
  }
}

// 5. Déconnexion
function logout(req, res) {
  res.clearCookie('token', getCookieOptions());
  res.json({ message: 'Déconnexion réussie.' });
}

module.exports = {
  register,
  verifyEmail,
  login,
  getMe,
  logout
};
