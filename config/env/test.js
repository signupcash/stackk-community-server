/*
  These are the environment settings for the TEST environment.
  This is the environment run with `npm start` if KOA_ENV=test.
  This is the environment run by the test suite.
*/

module.exports = {
  moderator: process.env.STAKK_MODERATOR,
  database: 'mongodb://localhost:27017/stackk-community-server-test',
  env: 'test'
}
