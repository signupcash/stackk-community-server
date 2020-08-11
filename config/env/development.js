/*
  These are the environment settings for the DEVELOPMENT environment.
  This is the environment run by default with `npm start` if KOA_ENV is not
  specified.
*/

module.exports = {
  moderator: process.env.MODERATOR || 'bitcoincash:qp9rdq4mffms5xs64f0ek5pqm2z3zycsrqjphmyz2q',
  database: 'mongodb://localhost:27017/stackk-community-server-dev',
  env: 'dev'
}
