/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. Insertion des époques
  await knex("eras").insert([
    {
      slug: "prehistory",
      name: "Prehistory",
      start_year: null, // avant -3000
      end_year: -3001,
    },
    {
      slug: "antiquity",
      name: "Antiquity",
      start_year: -3000,
      end_year: 476,
    },
    {
      slug: "middle_ages",
      name: "Middle Ages",
      start_year: 477,
      end_year: 1492,
    },
    {
      slug: "modern_era",
      name: "Modern Era",
      start_year: 1493,
      end_year: 1789,
    },
    {
      slug: "contemporary_era",
      name: "Contemporary Era",
      start_year: 1790,
      end_year: null, // jusqu'à aujourd'hui
    },
  ]);

  // 2. Insertion des catégories
  await knex("categories").insert([
    { slug: "everyday_life", name: "Everyday Life" },
    { slug: "science", name: "Science" },
    { slug: "technology", name: "Technology" },
    { slug: "transport", name: "Transport" },
    { slug: "art_culture", name: "Art & Culture" },
    { slug: "medicine", name: "Medicine" },
    { slug: "military", name: "Military" },
    { slug: "sport_leisure", name: "Sport & Leisure" },
    { slug: "industry_engineering", name: "Industry & Engineering" },
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  // Nettoyage en cas de rollback
  await knex("categories").del();
  await knex("eras").del();
};
