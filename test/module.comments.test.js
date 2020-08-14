const app = require('../bin/server')
const config = require('../config')
const testUtils = require('./utils')
const assert = require('chai').assert
const sinon = require('sinon')
const MockMongooseModel = require('mock-mongoose-model')
const axios = require('axios').default

const Comment = require('../src/models/comment')

// safety first
if (config.env !== 'test') {
  console.log(
    `Current environment: ${config.env} . Tests run only with test environment - KOA_ENV=test`
  )
  process.exit(0)
}

const context = {}
const userAddr = 'bitcoincash:qr4nj7j6fe92sa5lp5jfavffu3g50r9wxc76j5a5gm'

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

    const testComment = {
      listed: true,
      edited: false,
      _id: '5f36a2b885f14576646c1baa',
      txId: '123456789',
      replyTo: 'reply to',
      author: userAddr,
      text: 'Nice comment',
      signature: 'signed',
      __v: 0
    }
    await new Comment(testComment).save()

    const deleteComment = {
      listed: true,
      edited: false,
      _id: '5f36a2b885f14576646c1bab',
      txId: '123456789',
      replyTo: 'reply to',
      author: userAddr,
      text: 'Nice comment',
      signature: 'signed',
      __v: 0
    }
    await new Comment(deleteComment).save()

    context.comment = testComment
    context.delete = deleteComment
    sinon.stub(MockMongooseModel, 'findByIdAndRemove').yields(null, deleteComment)
    sinon.stub(MockMongooseModel, 'findByIdAndUpdate').yields(null, testComment)
    sinon.stub(MockMongooseModel, 'findOne').yields(null, testComment)
    sinon.stub(MockMongooseModel, 'exec').yields(null, testComment)
    sinon.stub(MockMongooseModel, 'find').yields(null, [testComment])
  })

  describe('POST /api/v1/comment', () => {
    it('should reject creation when author is missing', async () => {
      try {
        const payload = {
          text: 'incomplete data'
        }
        const signature = 'H2xGkXY9ZFQ8+YVZPHvg6peKEqunqUggrAbFhfYrbiM5O78giofZySNGekZd9fsYzbz3/U03h/xdCjVuVVs29bI='
        const result = await testUtils.createComment(payload, signature)
        console.log(
          `result stringified: ${JSON.stringify(result.data, null, 2)}`
        )
        assert(false, 'Unexpected result')
      } catch (err) {
        assert(err.response.status === 401, 'Error code 401 expected.')
      }
    })
    it('should reject creation when data is incomplete', async () => {
      try {
        const payload = {
          author: context.comment.author,
          text: 'incomplete data'
        }
        const signature = 'IGNJ1BWlaUcL6JQpCLEMx8ZbaMNzd2UHWd2BxV0NPR5bHQroMUt3kze2bBpQl1AkygnEmV53hH9Q9+scoQf3G4M='
        const result = await testUtils.createComment(payload, signature)
        console.log(
          `result stringified: ${JSON.stringify(result.data, null, 2)}`
        )
        assert(false, 'Unexpected result')
      } catch (err) {
        assert(err.response.status === 422, 'Error code 422 expected.')
      }
    })
    it('should reject creation when signature is invalid', async () => {
      try {
        const payload = {
          txId: TX,
          replyTo: context.comment.replyTo,
          author: context.comment.author,
          text: context.comment.text
        }
        const signature = 'H3uAQR5MxJHOIFumXpZk56dlVojEb4QWV5AlTZhOvO+eG5+rKZXRITsvqpA+FM5o79wBetUgS+b6n/87WE4VznM='
        const result = await testUtils.createComment(payload, signature)
        console.log(
          `result stringified: ${JSON.stringify(result.data, null, 2)}`
        )
        assert(false, 'Unexpected result')
      } catch (err) {
        assert(err.response.status === 401, 'Error code 401 expected.')
      }
    })
    it('should create new comment', async () => {
      const payload = {
        txId: TX,
        replyTo: context.comment.replyTo,
        author: context.comment.author,
        text: context.comment.text
      }
      const signature = 'ICiRlC0F8ZCv1jz76wn2VvKF4FIUs1WXIqXTCpEn04J0Md6+RQjIpE5RlxxyQloKg3EaB14WSVAYjZVMWFs1yVA='
      const result = await testUtils.createComment(payload, signature)
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
        result.data.signature === signature,
        'Signature expected'
      )
      assert(
        result.data.timestamp !== undefined,
        'timestamp expected'
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
      assert(
        created.signature === signature,
        'Expected signature to be saved to the DB'
      )
    })
    it('should sanitize text', async () => {
      const payload = {
        txId: TX,
        replyTo: context.comment.replyTo,
        author: context.comment.author,
        text: "<div>text</div><script> Alert('xss!'); </scr" + 'ipt>'
      }
      const signature = 'IAbZSgAeI/N76KmVp7UHmjatvKHSVzu3z4MpYxYXd5+fGw73PaZfadLqz+PGxUR/cps82wr8tnQzD3mN67JNVk0='
      const result = await testUtils.createComment(payload, signature)
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
          author: userAddr,
          text: 'New text'
        }
        const signature = 'H8ZNZS2nOxK6K+KCK/dgSzfSG8fgGhaMJkscaIHE4CEAGD80RdcclJfIav0Pbs2QCh0OWf7yH2GhMQZ3K03DxR8='
        const result = await testUtils.updateComment(newPayload, signature, savedComment._id)
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
          author: userAddr,
          commentId: 'non-valid',
          text: 'New text'
        }
        const signature = 'IDR272QzMLY+0LVKTHuvJcn5OZ0O62fR3fA9l7JSqoKcaxloWtbZmVuO0qsNLyf2epfJR21yvAJ5j1EZYxmxwvM='
        const result = await testUtils.updateComment(newPayload, signature, savedComment._id)
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
          author: userAddr,
          commentId: 'non-valid',
          text: 'New text'
        }
        const signature = 'IDR272QzMLY+0LVKTHuvJcn5OZ0O62fR3fA9l7JSqoKcaxloWtbZmVuO0qsNLyf2epfJR21yvAJ5j1EZYxmxwvM='
        const result = await testUtils.updateComment(newPayload, signature)
        console.log(
          `result stringified: ${JSON.stringify(result.data, null, 2)}`
        )
        assert(false, 'Unexpected result')
      } catch (err) {
        assert(err.response.status === 404, 'Error code 404 expected.')
      }
    })
    it('should reject update when author is missing', async () => {
      try {
        const newPayload = {
          commentId: savedComment._id,
          text: 'Edited text'
        }
        const signature = 'IM27SjG1e/iXEIWYJ5Kkvc3EFXpa70b5CnDXgaSYUaLgNEfG2lDSBWuRr7mjxpoRQgOTO1nrxcrc5McESesUxIE='
        const result = await testUtils.updateComment(newPayload, signature)
        console.log(
          `result stringified: ${JSON.stringify(result.data, null, 2)}`
        )
        assert(false, 'Unexpected result')
      } catch (err) {
        assert(err.response.status === 401, 'Error code 401 expected.')
      }
    })
    it('should reject update when signature is invalid', async () => {
      try {
        const newPayload = {
          author: userAddr,
          commentId: savedComment._id,
          text: 'Edited text'
        }
        const signature = 'H1/8MtPSvcToRr2YRjWaNOD5xKLPsTCC4ataa4glOuIQI9RSxPjRX6Yd1bFbYNwn2xmudfb33A+inBHWtGaZEr8='
        const result = await testUtils.updateComment(newPayload, signature)
        console.log(
          `result stringified: ${JSON.stringify(result.data, null, 2)}`
        )
        assert(false, 'Unexpected result')
      } catch (err) {
        assert(err.response.status === 401, 'Error code 401 expected.')
      }
    })
    it('should edit comment data', async () => {
      const newPayload = {
        author: userAddr,
        commentId: savedComment._id,
        text: 'Edited text'
      }
      const signature = 'IL0J7JW42sQTiJuLBGlG+GZpbyInvRv3iM/muXVyxR6mWbdnvxVsKUDBsLVxul6/QdachnkWT+UH5BIMNjf78k0='
      const result = await testUtils.updateComment(newPayload, signature)
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
        updated.signature === signature,
        'signature is expected to change'
      )
    })
  })

  describe('DELETE /api/v1/comment/:commentid', () => {
    it('should reject delete when author is missing', async () => {
      try {
        const payload = {}
        const signature = 'IKdHXYCR36D1er9eDS30wKVt382cP/7OYF68Xaxy8NLjUyFB+GqzNzwMQGixyHCWeEThNcqEqBL7o11AhJ0l14w='
        const result = await testUtils.deleteComment(payload, signature, context.delete._id)
        console.log(
          `result stringified: ${JSON.stringify(result.data, null, 2)}`
        )
        assert(false, 'Unexpected result')
      } catch (err) {
        assert(err.response.status === 401, 'Error code 401 expected.')
      }
    })
    it('should throw error if commentId is missing', async () => {
      try {
        const payload = {
          author: userAddr,
          delete: true
        }
        const signature = 'H+sTxLR3qYjEtPnndg03lEcdvsu6wMlGRV8VjtVSR4m4R46NUP/iyOl7Jwo0RT9pizvJdfLnJvc5u2uVdZUvAsg='
        const result = await testUtils.deleteComment(payload, signature, context.delete._id)
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
          author: 'bitcoincash:qr4nj7j6fe92sa5lp5jfavffu3g50r9wxc76j5a5gm',
          commentId: 'non-valid',
          delete: true
        }
        const signature = 'IFuG5JRuujbSosOrlDLnDNg+F6comVhVG8rI5Fr1CMAJQdA+AZ4DoopULRCNdBwP1g6lnEtDqJzyNnellbsRvJs='
        const result = await testUtils.deleteComment(payload, signature, context.delete._id)
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
        author: userAddr,
        commentId: 'non-existing',
        delete: true
      }
      const signature = 'Hzov2zCXvsfIBMQtOuJkBYQIFFNsqTE8ZHfhNSiwnvz0Ta9lLSwonmyEI5OqiBGgKOq1jT+GjGyGPD12nsp/ox8='
      const result = await testUtils.deleteComment(payload, signature)
      assert(result.status === 200, 'Status Code 200 expected.')
      assert(result.data.status === 'success', 'success status expected')
    })
    it('should reject deletion when signature is invalid', async () => {
      try {
        const payload = {
          author: userAddr,
          commentId: context.delete._id,
          delete: true
        }
        const signature = 'IIvqJ7U54MnJ+kNJRFnrqO6fwqXKg8HZrbqwuOE2Y0rhSFfzEAG9LE5K1AgHV1UX824PMayfbTW4EIPpFNZ3tLE='
        const result = await testUtils.deleteComment(payload, signature)
        console.log(
          `result stringified: ${JSON.stringify(result.data, null, 2)}`
        )
        assert(false, 'Unexpected result')
      } catch (err) {
        assert(err.response.status === 401, 'Error code 401 expected.')
      }
    })
    it('should delete comment', async () => {
      const payload = {
        author: userAddr,
        commentId: context.delete._id,
        delete: true
      }
      const signature = 'IEzhDln47hPwdFnJESP6MX7XNSCUosjvrCONK0akWPSEFie2l+7ZBArt1tH2gHp7gkDdfpFP9FXbLcp5BaJx1Jo='
      const result = await testUtils.deleteComment(payload, signature)
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
        const signature = 'IDOesebaxnpgatynMhtYxVVF+TWd2axeRoBFG9L8JEaLb2FjJZOnh2Anpp18Nu7DELIkQWvO1ULovTESbdruz1Q='
        const result = await testUtils.delistComment(payload, signature, savedComment._id)
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
        const signature = 'H3thgJBc++kob4d3foaLR2jIj8C+dFBklccil0FtxKkcEBalJZ9lWN5JYI4Q2OdWtHPaxa7P0i8CD5XIaSrJUGs='
        const result = await testUtils.delistComment(payload, signature, savedComment._id)
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
      const signature = 'H4j6/LLVDvrjvmFK1+tSqvrZcP9ZFUwmZ7bwvqGMQodcHkXWqBhSzCEkQjM5M4BqDIVfy0PDwF7ur91NiV5Z/2Q='
      const result = await testUtils.delistComment(payload, signature)
      assert(result.status === 200, 'Status Code 200 expected.')
      assert(result.data.status === 'success', 'success status expected')
    })
    it('should reject delisting when signature is invalid', async () => {
      try {
        const payload = {
          commentId: savedComment._id
        }
        const signature = 'H3m1BL57yPuMmkx0TQ3D6N8i5r1PwUfPfi9kCGmBB0fdN0b+F4EarohiYQB69ztC63VwJ+QsIM43W1S/O1oauHM='
        const result = await testUtils.delistComment(payload, signature)
        console.log(
          `result stringified: ${JSON.stringify(result.data, null, 2)}`
        )
        assert(false, 'Unexpected result')
      } catch (err) {
        assert(err.response.status === 401, 'Error code 401 expected.')
      }
    })
    it('should delist a comment', async () => {
      const payload = {
        commentId: savedComment._id
      }
      const signature = 'H+pJ7lkNQE5sR9jx/t/UgLbKMvadAfzS67h2EbietlxwDrhHTNyQvflOF+0aGzW09PXctXmVC22uxEU5xdeCpDg='
      const result = await testUtils.delistComment(payload, signature)
      assert(result.status === 200, 'Status Code 200 expected.')
      const checkDelisted = () => (Comment.findOne({ _id: payload.commentId }).exec())
      const delisted = await checkDelisted()
      assert(
        delisted.listed === false,
        'comment delist expected'
      )
    })
  })
})
