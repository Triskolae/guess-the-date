require('dotenv').config();

module.exports = {
  staging: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    searchPath: ['preprod'], // preprod & local
    migrations: {
      directory: './src/database/migrations'
    }
  },

  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    searchPath: ['public'], // prod
    migrations: {
      directory: './src/database/migrations'
    }
  }
};