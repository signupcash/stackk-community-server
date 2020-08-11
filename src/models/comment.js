const mongoose = require('mongoose')

const Comment = new mongoose.Schema({
  txId: { type: String, required: true },
  replyTo: { type: String, required: true },
  author: { type: String, required: true },
  text: { type: String, required: true },
  listed: { type: Boolean, default: true },
  signature: { type: String, required: true }
})

module.exports = mongoose.model('comment', Comment)
