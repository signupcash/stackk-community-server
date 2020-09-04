const validator = require('../../middleware/validators')
const CommentController = require('./controller')
const commentController = new CommentController()

module.exports.baseUrl = '/api/v1'

module.exports.routes = [
  {
    method: 'GET',
    route: '/post/:tx/comments',
    handlers: [commentController.getTxComments]
  },
  {
    method: 'POST',
    route: '/comment',
    handlers: [validator.ensureSignature, commentController.createComment]
  },
  {
    method: 'PUT',
    route: '/comment/:commentid',
    handlers: [validator.ensureSignature, commentController.updateComment]
  },
  {
    method: 'DELETE',
    route: '/comment/:commentid',
    handlers: [validator.ensureSignature, commentController.deleteComment]
  },
  {
    method: 'POST',
    route: '/mod/comment/:commentid/delist',
    handlers: [validator.ensureModSignature, commentController.delistComment]
  }
]
