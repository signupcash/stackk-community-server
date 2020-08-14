/*
  These are the environment settings for the TEST environment.
  This is the environment run with `npm start` if KOA_ENV=test.
  This is the environment run by the test suite.
*/

module.exports = {
  moderator: 'bitcoincash:qpkegw6mfh73vmx9f58yxdnv22mcg3l9jqks2s3dta',
  database: 'mongodb://localhost:27017/stackk-community-server-test',
  env: 'test'
}
