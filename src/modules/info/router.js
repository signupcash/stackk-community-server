const InfoController = require('./controller')
const infoController = new InfoController()

module.exports.baseUrl = '/api/v1/info'

module.exports.routes = [
  {
    method: 'PUT',
    route: '/:moderator',
    handlers: [infoController.createInfo]
  },
  {
    method: 'GET',
    route: '/',
    handlers: [infoController.getInfo]
  }
]
