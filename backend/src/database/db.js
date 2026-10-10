const knex = require("knex");
const knexfile = require("../../knexfile");

const environment =
  process.env.NODE_ENV === "staging" || process.argv.includes("staging")
    ? "staging"
    : "development";

const db = knex(knexfile[environment] || knexfile.development);

module.exports = db;
