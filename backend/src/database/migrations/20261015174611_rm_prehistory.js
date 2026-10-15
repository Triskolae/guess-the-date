/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const prehistoryEra = await knex("eras")
    .where({ slug: "prehistory" })
    .first();

  if (prehistoryEra) {
    // 1. Supprimer les objets rattachés à cette époque
    await knex("objects").where({ era_id: prehistoryEra.id }).del();

    // 2. Supprimer les préférences utilisateurs associées
    await knex("user_eras").where({ era_id: prehistoryEra.id }).del();

    // 3. Supprimer l'époque prehistory
    await knex("eras").where({ id: prehistoryEra.id }).del();
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex("eras").insert([
    {
      slug: "prehistory",
      name: "Prehistory",
      start_year: null,
      end_year: -3001,
    },
  ]);
};
