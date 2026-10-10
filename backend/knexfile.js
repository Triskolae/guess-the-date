const path = require('path');
const dns = require('dns');

// Force l'IPv4 pour éviter les erreurs de résolution ENETUNREACH avec Supabase
dns.setDefaultResultOrder('ipv4first');

// Charge le fichier .env unique (local) s'il existe
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const getDbConfig = () => {
  const password = process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD;

  if (!password) {
    console.error(`❌ ERREUR: DB_PASSWORD introuvable pour DB_HOST=${process.env.DB_HOST}`);
  }

  if (process.env.DB_HOST) {
    return {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: String(password),
      database: process.env.DB_NAME || 'postgres',
      ssl: { rejectUnauthorized: false }
    };
  }

  return {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  };
};

module.exports = {
  // Développement local (pointe vers le schéma "preprod" via backend/.env)
  development: {
    client: 'pg',
    connection: getDbConfig(),
    searchPath: ['preprod'],
    migrations: {
      directory: './src/database/migrations'
    }
  },

  // Environnement de Staging/Preprod
  staging: {
    client: 'pg',
    connection: getDbConfig(),
    searchPath: ['preprod'],
    migrations: {
      directory: './src/database/migrations'
    }
  },

  // Production (sur Northflank : lira les variables de Prod du Cloud & ciblera "public")
  production: {
    client: 'pg',
    connection: getDbConfig(),
    searchPath: ['public'],
    migrations: {
      directory: './src/database/migrations'
    }
  }
};