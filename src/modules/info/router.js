const validator = require('../../middleware/validators')
const InfoController = require('./controller')
const infoController = new InfoController()

module.exports.baseUrl = '/api/v1/info'

module.exports.routes = [
  {
    method: 'PUT',
    route: '/:moderator',
    handlers: [
      validator.ensureModSignature,
      infoController.createInfo
    ]
  },
  {
    method: 'GET',
    route: '/',
    handlers: [infoController.getInfo]
  }
]
