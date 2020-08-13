/*
  This file is used to store unsecure, application-specific data common to all
  environments.
*/

const { version } = require('../../package.json')

module.exports = {
  port: process.env.STAKK_PORT || 5000,
  version: version || '1.1.1'
}
