const mongoose = require('mongoose')

const Info = new mongoose.Schema({
  moderatorAddress: { type: String, required: true, unique: true },
  moderatorName: { type: String, required: true },
  moderatorEmail: { type: String, required: true },
  description: { type: String, default: 'API description' },
  title: { type: String, default: 'API title' }
})

module.exports = mongoose.model('info', Info)
