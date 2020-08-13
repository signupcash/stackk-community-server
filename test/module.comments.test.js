const app = require('../bin/server')
const config = require('../config')
const testUtils = require('./utils')
const assert = require('chai').assert
const axios = require('axios').default

const Comment = require('../src/models/comment')

const context = {}

const LOCALHOST = `http://localhost:${config.port}`
const TX = '123456789'

describe('routes : comments', () => {
  before(async () => {
    await app.startServer()

    // clean the DB
    const comments = await Comment.find({})
    // Delete each comment
    for (let i = 0; i < comments.length; i++) {
      const thisComment = comments[i]
      await thisComment.remove()
    }

    const commentObj = {
      txId: TX,
      replyTo: 'reply to',
      author: 'Some Author',
      text: 'Nice comment',
      listed: true,
      edited: false
    }
    commentObj.signature = 'signed' // TODO: calculate real dignature

    const testComment = new Comment(commentObj)
    await testComment.save()
    context.comment = testComment
  })

  describe('POST /api/v1/comment', () => {
    it('should reject creation when data is incomplete', async () => {
      try {
        const payload = {
          text: 'incomplete data'
        }
        const result = await testUtils.createComment(payload)
        console.log(
          `result stringified: ${JSON.stringify(result.data, null, 2)}`
        )
        assert(false, 'Unexpected result')
      } catch (err) {
        assert(err.response.status === 422, 'Error code 422 expected.')
      }
    })
    it('should create new comment', async () => {
      const payload = {
        txId: TX,
        replyTo: context.comment.replyTo,
        author: context.comment.author,
        text: context.comment.text
      }

      const result = await testUtils.createComment(payload)
      assert(
        result.data._id !== undefined,
        '_id expected'
      )
      assert(
        result.data.replyTo === context.comment.replyTo,
        'Reply To expected'
      )
      assert(
        result.data.author === context.comment.author,
        'Author expected'
      )
      assert(
        result.data.text === context.comment.text,
        'Text expected'
      )
      assert(
        result.data.timestamp !== undefined,
        'timestamp expected'
      )
      assert(
        result.data.signature === context.comment.signature,
        'signature expected'
      )
      assert(
        result.data.txId === undefined,
        'TxId expected to be omited'
      )

      const checkCreated = () => (Comment.findOne({ _id: result.data._id }).exec())
      const created = await checkCreated()
      assert(
        created !== null,
        'Expected to be saved to the DB'
      )
    })
    it('should sanitize text', async () => {
      const payload = {
        txId: TX,
        replyTo: context.comment.replyTo,
        author: context.comment.author,
        text: "<div>text</div><script> Alert('xss!'); </scr" + 'ipt>'
      }

      const result = await testUtils.createComment(payload)
      assert(
        result.data.text === '<div>text</div>',
        'Text expected to be sanitized'
      )
    })
  })

  describe('PUT /api/v1/comment/:commentid', () => {
    let savedComment

    beforeEach(() => {
      savedComment = context.comment
    })
    afterEach(() => {
      context.comment = savedComment
    })
    it('should throw error if commentId is missing', async () => {
      try {
        const newPayload = {
          text: 'New text'
        }

        const result = await testUtils.updateComment(newPayload, savedComment._id)
        console.log(
          `result stringified: ${JSON.stringify(result.data, null, 2)}`
        )
        assert(false, 'Unexpected result')
      } catch (err) {
        assert(err.response.status === 422, 'Error code 422 expected.')
      }
    })
    it('should throw error on URI and payload comment ID mismatch', async () => {
      try {
        const newPayload = {
          commentId: 'non-valid',
          text: 'New text'
        }

        const result = await testUtils.updateComment(newPayload, savedComment._id)
        console.log(
          `result stringified: ${JSON.stringify(result.data, null, 2)}`
        )
        assert(false, 'Unexpected result')
      } catch (err) {
        assert(err.response.status === 422, 'Error code 422 expected.')
      }
    })
    it('should throw error on non-existing comment', async () => {
      try {
        const newPayload = {
          commentId: 'non-valid',
          text: 'New text'
        }

        const result = await testUtils.updateComment(newPayload)
        console.log(
          `result stringified: ${JSON.stringify(result.data, null, 2)}`
        )
        assert(false, 'Unexpected result')
      } catch (err) {
        assert(err.response.status === 404, 'Error code 404 expected.')
      }
    })
    it('should edit comment data', async () => {
      const newPayload = {
        commentId: savedComment._id,
        text: 'Edited text'
      }

      const result = await testUtils.updateComment(newPayload)
      assert(
        result.data.status === 'success',
        'success status expected'
      )
      const updatedComment = () => (Comment.findOne({ _id: savedComment._id }).exec())
      const updated = await updatedComment()
      assert(
        updated.text === 'Edited text',
        'text is expected to change'
      )
      assert(
        updated.author === savedComment.author,
        'author is expected to not change'
      )
      assert(
        updated.edited === true,
        'edited is expected to be true'
      )
      assert(
        updated.signature === 'new signature',
        'signature is expected to change'
      )
    })
  })

  describe('DELETE /api/v1/comment/:commentid', () => {
    let tmpComment

    beforeEach(async () => {
      const commentObj = {
        txId: TX,
        replyTo: context.comment.replyTo,
        author: context.comment.author,
        text: context.comment.text,
        signature: 'sign'
      }
      tmpComment = new Comment(commentObj)
      await tmpComment.save()
    })
    afterEach(async () => {
      await tmpComment.remove()
    })
    it('should throw error if commentId is missing', async () => {
      try {
        const payload = {}
        const result = await testUtils.deleteComment(payload, tmpComment._id)
        console.log(
          `result stringified: ${JSON.stringify(result.data, null, 2)}`
        )
        assert(false, 'Unexpected result')
      } catch (err) {
        assert(err.response.status === 422, 'Error code 422 expected.')
      }
    })
    it('should throw error on URI and payload comment ID mismatch', async () => {
      try {
        const payload = {
          commentId: 'non-valid'
        }

        const result = await testUtils.deleteComment(payload, tmpComment._id)
        console.log(
          `result stringified: ${JSON.stringify(result.data, null, 2)}`
        )
        assert(false, 'Unexpected result')
      } catch (err) {
        assert(err.response.status === 422, 'Error code 422 expected.')
      }
    })
    it('should not throw error if comment is missing', async () => {
      const payload = {
        commentId: 'non-existing'
      }
      const result = await testUtils.deleteComment(payload)
      assert(result.status === 200, 'Status Code 200 expected.')
      assert(result.data.status === 'success', 'success status expected')
    })
    it('should delete comment', async () => {
      const payload = {
        commentId: tmpComment._id
      }
      const result = await testUtils.deleteComment(payload)
      assert(result.status === 200, 'Status Code 200 expected.')
      const checkDeleted = () => (Comment.findOne({ _id: payload.commentId }).exec())
      const deleted = await checkDeleted()
      assert(
        deleted === null,
        'deletion expected'
      )
    })
  })

  describe('GET /api/v1/post/:tx/comments', () => {
    it('should return all comments for Tx', async () => {
      const options = {
        method: 'GET',
        url: `${LOCALHOST}/api/v1/post/${TX}/comments`,
        headers: {
          Accept: 'application/json'
        }
      }
      const result = await axios(options)
      assert(result.status === 200, 'Status Code 200 expected.')
    })
  })

  describe('POST /api/v1/mod/comment/:commentid/delist', () => {
    let savedComment

    beforeEach(() => {
      savedComment = context.comment
    })
    afterEach(() => {
      context.comment = savedComment
    })
    it('should throw error if commentId is missing', async () => {
      try {
        const payload = {}
        const result = await testUtils.delistComment(payload, savedComment._id)
        console.log(
          `result stringified: ${JSON.stringify(result.data, null, 2)}`
        )
        assert(false, 'Unexpected result')
      } catch (err) {
        assert(err.response.status === 422, 'Error code 422 expected.')
      }
    })
    it('should throw error on URI and payload comment ID mismatch', async () => {
      try {
        const payload = {
          commentId: 'non-valid'
        }

        const result = await testUtils.delistComment(payload, savedComment._id)
        console.log(
          `result stringified: ${JSON.stringify(result.data, null, 2)}`
        )
        assert(false, 'Unexpected result')
      } catch (err) {
        assert(err.response.status === 422, 'Error code 422 expected.')
      }
    })
    it('should not throw error if comment is missing', async () => {
      const payload = {
        commentId: 'non-existing'
      }
      const result = await testUtils.delistComment(payload)
      assert(result.status === 200, 'Status Code 200 expected.')
      assert(result.data.status === 'success', 'success status expected')
    })
    it('should delist a comment', async () => {
      const payload = {
        commentId: savedComment._id
      }
      const result = await testUtils.delistComment(payload)
      assert(result.status === 200, 'Status Code 200 expected.')
      const checkDelisted = () => (Comment.findOne({ _id: payload.commentId }).exec())
      const delisted = await checkDelisted()
      assert(
        delisted.listed === false,
        'commend delist expected'
      )
    })
  })
})
