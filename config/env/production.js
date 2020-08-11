/*
  These are the environment settings for the PRODUCTION environment.
  This is the environment run with `npm start` if KOA_ENV=production.
  This is the environment run inside the Docker container.

  It is assumed the MonogDB Docker container is accessed by port 5555
  so as not to conflict with the default host port of 27017 for MongoDB.
*/

module.exports = {
  moderator: process.env.MODERATOR || 'bitcoincash:qp9rdq4mffms5xs64f0ek5pqm2z3zycsrqjphmyz2q',
  database: 'mongodb://localhost:27017/stackk-community-server',
  env: 'prod'
}
