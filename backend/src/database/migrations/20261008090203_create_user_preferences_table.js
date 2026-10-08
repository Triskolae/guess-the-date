/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // 1. Table ERAS
  await knex.schema.createTable("eras", (table) => {
    table.increments("id").primary();
    table.string("slug").notNullable().unique();
    table.string("name").notNullable();
    table.integer("start_year").nullable();
    table.integer("end_year").nullable();
  });

  // 2. Table CATEGORIES
  await knex.schema.createTable("categories", (table) => {
    table.increments("id").primary();
    table.string("slug").notNullable().unique();
    table.string("name").notNullable();
  });

  // 3. Table USER_ERAS (Relation N-N avec UUID pour user_id)
  await knex.schema.createTable("user_eras", (table) => {
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    table
      .integer("era_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("eras")
      .onDelete("CASCADE");

    table.primary(["user_id", "era_id"]);
  });

  // 4. Table USER_CATEGORIES (Relation N-N avec UUID pour user_id)
  await knex.schema.createTable("user_categories", (table) => {
    table
      .uuid("user_id")
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    table
      .integer("category_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("categories")
      .onDelete("CASCADE");

    table.primary(["user_id", "category_id"]);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists("user_categories");
  await knex.schema.dropTableIfExists("user_eras");
  await knex.schema.dropTableIfExists("categories");
  await knex.schema.dropTableIfExists("eras");
};
