const mongoose = require('mongoose')
const config = require('../../config')
const Info = require('../../src/models/info')

async function getInfo () {
  // Connect to the Mongo Database.
  mongoose.Promise = global.Promise
  mongoose.set('useCreateIndex', true) // Stop deprecation warning.
  await mongoose.connect(config.database, { useNewUrlParser: true })

  try {
    const info = await Info.find({})
    console.log(`info: ${JSON.stringify(info, null, 2)}`)
  } catch (err) {
    console.log(`Error in getInfo: ${err}`)
  }

  mongoose.connection.close()
}
getInfo()
