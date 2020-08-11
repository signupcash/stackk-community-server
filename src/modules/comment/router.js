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
    handlers: [commentController.createComment]
  },
  {
    method: 'PUT',
    route: '/comment/:commentid',
    handlers: [commentController.updateComment]
  },
  {
    method: 'DELETE',
    route: '/comment/:commentid',
    handlers: [commentController.deleteComment]
  },
  {
    method: 'POST',
    route: '/mod/comment/:commentid/delist',
    handlers: [commentController.delistComment]
  }
]
