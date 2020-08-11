const mongoose = require('mongoose')
const config = require('../../config')
const Info = require('../../src/models/info')

const MOD_NAME = 'test moderator'
const MOD_EMAIL = 'test@test.com'
const API_DESC = 'API description'
const API_TITLE = 'API title'

async function addInfo () {
  // Connect to the Mongo Database.
  mongoose.Promise = global.Promise
  mongoose.set('useCreateIndex', true) // Stop deprecation warning.
  await mongoose.connect(config.database, { useNewUrlParser: true, useUnifiedTopology: true })

  const infoData = {
    moderatorAddress: config.moderator,
    moderatorName: MOD_NAME,
    moderatorEmail: MOD_EMAIL,
    description: API_DESC,
    title: API_TITLE
  }

  const info = new Info(infoData)

  await info.save()

  await mongoose.connection.close()

  console.log(`Info for ${API_TITLE} created.`)
}
addInfo()

module.exports = {
  addInfo
}
