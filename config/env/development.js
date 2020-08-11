/*
  These are the environment settings for the DEVELOPMENT environment.
  This is the environment run by default with `npm start` if KOA_ENV is not
  specified.
*/

module.exports = {
  moderator: process.env.MODERATOR || 'bitcoincash:CHANGE_THIS',
  database: 'mongodb://localhost:27017/stackk-community-server-dev',
  env: 'dev'
}
