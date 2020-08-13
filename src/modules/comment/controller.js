const sanitizeHtml = require('sanitize-html')
const Comment = require('../../models/comment')

let _this
class CommentController {
  constructor () {
    _this = this
    this.Comment = Comment
  }

  async getTxComments (ctx) {
    try {
      const txComments = () => (_this.Comment.find({ txId: ctx.params.tx }).exec())
      const comments = await txComments()

      ctx.body = {
        comments
      }
    } catch (err) {
      if (err.status === 404 || err.name === 'CastError') {
        ctx.throw(404)
      }

      ctx.throw(422)
    }
  }

  async createComment (ctx) {
    try {
      const commentData = ctx.request.body.payload
      commentData.signature = ctx.request.body.signature
      const comment = new _this.Comment(commentData)

      // Requirements check
      if (!comment.txId || typeof comment.txId !== 'string' || comment.txId === '') {
        throw new Error("Property 'txId' must be non-empty string!")
      }
      if (!comment.replyTo || typeof comment.replyTo !== 'string' || comment.replyTo === '') {
        throw new Error("Property 'replyTo' must be non-empty string!")
      }
      if (!comment.author || typeof comment.author !== 'string' || comment.author === '') {
        throw new Error("Property 'author' must be non-empty string!")
      }
      if (!comment.text || typeof comment.text !== 'string' || comment.text === '') {
        throw new Error("Property 'text' must be non-empty string!")
      }

      comment.text = sanitizeHtml(comment.text)
      comment.timestamp = Math.floor(Date.now() / 1000)

      await comment.save()

      ctx.body = {
        _id: comment._id,
        replyTo: comment.replyTo,
        author: comment.author,
        text: comment.text,
        signature: comment.signature,
        timestamp: comment.timestamp
      }
    } catch (err) {
      if (err.status === 404 || err.name === 'CastError') {
        ctx.throw(404)
      }

      ctx.throw(422)
    }
  }

  async updateComment (ctx) {
    try {
      const commentData = ctx.request.body.payload
      commentData.signature = ctx.request.body.signature

      if (commentData.commentId !== ctx.params.commentid) {
        throw new Error("Property 'commentId' is invalid")
      }

      const modifications = {
        ...commentData,
        edited: true
      }
      await _this.Comment.findByIdAndUpdate(
        ctx.params.commentid,
        { $set: modifications },
        { new: true }
      )

      ctx.body = {
        status: 'success'
      }
    } catch (err) {
      if (err.status === 404 || err.name === 'CastError') {
        ctx.throw(404)
      }

      ctx.throw(422)
    }
  }

  async deleteComment (ctx) {
    try {
      const commentData = ctx.request.body.payload
      commentData.signature = ctx.request.body.signature

      if (commentData.commentId !== ctx.params.commentid) {
        throw new Error("Property 'commentId' is invalid")
      }

      await _this.Comment.findByIdAndDelete(ctx.params.commentid)

      ctx.status = 200
      ctx.body = {
        status: 'success'
      }
    } catch (err) {
      if (err.status === 404 || err.name === 'CastError') {
        ctx.throw(404)
      }

      ctx.throw(422)
    }
  }

  async delistComment (ctx) {
    try {
      const commentData = ctx.request.body.payload
      commentData.signature = ctx.request.body.signature

      if (commentData.commentId !== ctx.params.commentid) {
        throw new Error("Property 'commentId' is invalid")
      }

      const modifications = {
        listed: false
      }
      modifications.signature = 'new signature' // TODO: calculate signature
      await _this.Comment.findByIdAndUpdate(
        ctx.params.commentid,
        { $set: modifications },
        { new: true }
      )

      ctx.status = 200
      ctx.body = {
        status: 'success'
      }
    } catch (err) {
      if (err.status === 404 || err.name === 'CastError') {
        ctx.throw(404)
      }

      ctx.throw(422)
    }
  }
}

module.exports = CommentController
