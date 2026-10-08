const db = require("../database/db");

async function getPreferencesOptions(req, res) {
  try {
    const eras = await db("eras")
      .select("id", "slug", "name", "start_year", "end_year")
      .orderBy("id", "asc");

    const categories = await db("categories")
      .select("id", "slug", "name")
      .orderBy("name", "asc");

    return res.json({ eras, categories });
  } catch (error) {
    console.error("Erreur récupération options onboarding :", error);
    return res
      .status(500)
      .json({ message: "Erreur lors du chargement des options." });
  }
}

module.exports = {
  getPreferencesOptions,
};
