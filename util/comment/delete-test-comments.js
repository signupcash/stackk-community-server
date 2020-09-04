const mongoose = require('mongoose')

// Force test environment
// make sure environment variable is set before this file gets called.
// see test script in package.json.
// process.env.KOA_ENV = 'test'
const config = require('../../config')
const Comment = require('../../src/models/comment')

async function deleteComments () {
  // Connect to the Mongo Database.
  mongoose.Promise = global.Promise
  mongoose.set('useCreateIndex', true) // Stop deprecation warning.
  await mongoose.connect(config.database, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  })

  const comments = await Comment.find({})

  // Delete each info
  for (let i = 0; i < comments.length; i++) {
    const thisComment = comments[i]
    await thisComment.remove()
  }

  mongoose.connection.close()
}
deleteComments()
