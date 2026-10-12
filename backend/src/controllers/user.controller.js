const db = require("../database/db");

async function savePreferences(req, res) {
  try {
    // 1. Récupération robuste de l'ID utilisateur
    const userId = req.user?.id || req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Utilisateur non authentifié." });
    }

    const { era_ids, category_ids, game_mode } = req.body;

    if (!era_ids?.length || !category_ids?.length) {
      return res.status(400).json({
        message: "Veuillez sélectionner au moins une époque et une catégorie.",
      });
    }

    // 2. Transaction Knex
    await db.transaction(async (trx) => {
      // Nettoyage des anciennes préférences
      await trx("user_eras").where({ user_id: userId }).del();
      await trx("user_categories").where({ user_id: userId }).del();

      // Insertion des époques
      const eraRows = era_ids.map((era_id) => ({
        user_id: userId,
        era_id: era_id,
      }));
      await trx("user_eras").insert(eraRows);

      // Insertion des catégories
      const categoryRows = category_ids.map((category_id) => ({
        user_id: userId,
        category_id: category_id,
      }));
      await trx("user_categories").insert(categoryRows);

      // (Optionnel) Sauvegarde du game_mode s'il existe dans la table users
      if (game_mode) {
        await trx("users").where({ id: userId }).update({ game_mode });
      }
    });

    return res.json({ message: "Préférences enregistrées avec succès." });
  } catch (error) {
    console.error("Erreur sauvegarde préférences:", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de l'enregistrement des préférences." });
  }
}

async function getPreferences(req, res) {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Non authentifié." });
    }

    const eras = await db("user_eras")
      .where({ user_id: userId })
      .count();

    const categories = await db("user_categories")
      .where({ user_id: userId })
      .count();
    const hasCompletedOnboarding = !!eras[0].count || !!categories[0].count;

    return res.status(200).json({
      hasCompletedOnboarding,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des préférences :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

module.exports = {
  savePreferences,
  getPreferences,
};
