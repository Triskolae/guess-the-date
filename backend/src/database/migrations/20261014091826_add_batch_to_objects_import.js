exports.up = async function (knex) {
  await knex.schema.alterTable("objects", (table) => {
    table.string("batch_name", 50).nullable();
    table.index(["source", "batch_name"], "objects_source_batch_name_index");
  });
};

exports.down = async function (knex) {
  await knex.schema.alterTable("objects", (table) => {
    table.dropIndex(
      ["source", "batch_name"],
      "objects_source_batch_name_index",
    );
    table.dropColumn("batch_name");
  });
};
