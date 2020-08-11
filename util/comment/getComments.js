const mongoose = require('mongoose')
const config = require('../../config')
const Comment = require('../../src/models/comment')

async function getComments () {
  // Connect to the Mongo Database.
  mongoose.Promise = global.Promise
  mongoose.set('useCreateIndex', true) // Stop deprecation warning.
  await mongoose.connect(config.database, { useNewUrlParser: true, useUnifiedTopology: true })

  try {
    const comments = await Comment.find({})
    console.log(`comments: ${JSON.stringify(comments, null, 2)}`)
  } catch (err) {
    console.log(`Error in getComments: ${err}`)
  }

  mongoose.connection.close()
}
getComments()
