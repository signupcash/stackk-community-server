const mongoose = require('mongoose')
const config = require('../../config')
const Comment = require('../../src/models/comment')

const TX_ID = '123456789'
const REPLY_TO = 'reply to'
const AUTHOR = 'Some Author'
const TEXT = 'Nice comment'

async function addComment () {
  // Connect to the Mongo Database.
  mongoose.Promise = global.Promise
  mongoose.set('useCreateIndex', true) // Stop deprecation warning.
  await mongoose.connect(config.database, { useNewUrlParser: true, useUnifiedTopology: true })

  const commentData = {
    txId: TX_ID,
    replyTo: REPLY_TO,
    author: AUTHOR,
    text: TEXT,
    signature: 'not signed yet'
  }

  const comment = new Comment(commentData)

  await comment.save()

  await mongoose.connection.close()

  console.log(`Comment for in reply to '${REPLY_TO}' created.`)
}
addComment()

module.exports = {
  addComment
}
