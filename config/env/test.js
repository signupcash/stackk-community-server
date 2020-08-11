/*
  These are the environment settings for the TEST environment.
  This is the environment run with `npm start` if KOA_ENV=test.
  This is the environment run by the test suite.
*/

module.exports = {
  moderator: process.env.MODERATOR || 'bitcoincash:qp9rdq4mffms5xs64f0ek5pqm2z3zycsrqjphmyz2q',
  database: 'mongodb://localhost:27017/stackk-community-server-test',
  env: 'test'
}
