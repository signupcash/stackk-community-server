const mongoose = require('mongoose')

// Force test environment
// make sure environment variable is set before this file gets called.
// see test script in package.json.
// process.env.KOA_ENV = 'test'
const config = require('../../config')
const Info = require('../../src/models/info')

async function deleteInfo () {
  // Connect to the Mongo Database.
  mongoose.Promise = global.Promise
  mongoose.set('useCreateIndex', true) // Stop deprecation warning.
  await mongoose.connect(config.database, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  })

  const infos = await Info.find({})

  // Delete each info
  for (let i = 0; i < infos.length; i++) {
    const thisInfo = infos[i]
    await thisInfo.remove()
  }

  mongoose.connection.close()
}
deleteInfo()
