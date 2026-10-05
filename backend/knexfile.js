const path = require('path');

const envFile = process.env.NODE_ENV === 'staging' || process.argv.includes('staging') 
  ? '.env_preprod' 
  : '.env';

require('dotenv').config({ path: path.resolve(__dirname, envFile) });
require('dotenv').config({ path: path.resolve(__dirname, '..', envFile) });

const getDbConfig = () => {
  const password = process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD;

  if (!password) {
    console.error(`❌ ERREUR: DB_PASSWORD est introuvable. Variables chargées: DB_HOST=${process.env.DB_HOST}`);
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
  development: {
    client: 'pg',
    connection: getDbConfig(),
    searchPath: ['preprod'],
    migrations: {
      directory: './src/database/migrations'
    }
  },
  staging: {
    client: 'pg',
    connection: getDbConfig(),
    searchPath: ['preprod'],
    migrations: {
      directory: './src/database/migrations'
    }
  },

  production: {
    client: 'pg',
    connection: getDbConfig(),
    searchPath: ['public'],
    migrations: {
      directory: './src/database/migrations'
    }
  }
};