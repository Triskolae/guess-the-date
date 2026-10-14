
exports.up = async function (knex) {
  await knex.schema.createTable("objects", (table) => {
    table.increments("id").primary();

    // Provenance
    table.string("source", 50).notNullable().defaultTo("met");
    table.string("source_object_id", 100).notNullable();

    // Informations descriptives
    table.string("title", 500).notNullable();
    table.text("description").nullable();
    table.string("creator", 500).nullable();

    // Relations avec les tables existantes
    table
      .integer("category_id")
      .notNullable()
      .references("id")
      .inTable("categories")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");

    table
      .integer("era_id")
      .notNullable()
      .references("id")
      .inTable("eras")
      .onDelete("RESTRICT")
      .onUpdate("CASCADE");

    // Dates de création documentées
    table.integer("year_start").notNullable();
    table.integer("year_end").notNullable();
    table.text("date_display").nullable();

    // Image copiée sur R2
    table.text("image_url").notNullable();
    table.text("image_source_url").notNullable();
    table.string("image_rights", 50).notNullable();

    // Source et métadonnées originales
    table.text("source_url").notNullable();
    table.json("source_metadata").nullable();

    table.timestamps(true, true);

    table.unique(
      ["source", "source_object_id"],
      "objects_source_object_id_unique"
    );

    table.index("category_id");
    table.index("era_id");
    table.index(["year_start", "year_end"]);
  });
};

exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("objects");
};
