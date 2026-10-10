const knex = require("knex");
const knexfile = require("../../knexfile");

const currentEnv = (process.env.NODE_ENV || "").trim();

const isProd = currentEnv === "production" || process.argv.includes("production");
const environment = isProd ? "production" : "development";

console.log(`🔍 [DB Config] NODE_ENV brut: "${process.env.NODE_ENV}" | Environnement retenu: "${environment}"`);

const config = knexfile[environment];

if (!config) {
  console.error(`❌ Aucune configuration trouvée dans knexfile.js pour l'environnement "${environment}" !`);
}

const db = knex(config || knexfile.development);

module.exports = db;
