const db = require("../database/db");

async function getRandomObject(req, res) {
  try {
    const previousObjectId = Number(req.query.exclude);

    let query = db("objects")
      .select(
        "id",
        "title",
        "year_start",
        "year_end",
        "image_url",
        "source_url",
      );

    if (Number.isInteger(previousObjectId)) {
      query = query.whereNot(
        "id",
        previousObjectId,
      );
    }

    const object = await query
      .orderByRaw("RANDOM()")
      .first();

    if (!object) {
      return res.status(404).json({
        error: "Aucun objet disponible.",
      });
    }

    const year = Math.round(
      (object.year_start +
        object.year_end) /
        2,
    );

    return res.json({
      id: object.id,
      name: object.title,
      year,
      image: object.image_url,
      rarity: null,
      themes: [],
      sourceUrl: object.source_url,
    });
  } catch (error) {
    console.error(
      "Erreur récupération objet aléatoire :",
      error,
    );

    return res.status(500).json({
      error:
        "Impossible de récupérer un objet.",
    });
  }
}

module.exports = {
  getRandomObject,
};