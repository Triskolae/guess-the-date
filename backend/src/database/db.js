const knex = require("knex");
const knexfile = require("../../knexfile");

const environment =
  process.env.NODE_ENV === "production" || process.argv.includes("production")
    ? "production"
    : "development";

const db = knex(knexfile[environment] || knexfile.development);

module.exports = db;
