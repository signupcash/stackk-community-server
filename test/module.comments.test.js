const BCHJS = require('@chris.troutner/bch-js')
const bchjs = new BCHJS()
const app = require('../bin/server')
const config = require('../config')
const testUtils = require('./utils')
const assert = require('chai').assert
const axios = require('axios').default

const Comment = require('../src/models/comment')

const context = {}
let moderatorWallet = {}
let userWallet = {}
let otherWallet = {}
try {
  const walletInfo = require('../wallet.json')
  moderatorWallet = walletInfo.addresses['0']
  userWallet = walletInfo.addresses['1']
  otherWallet = walletInfo.addresses['2']
} catch (err) {
  console.log(
    'Could not open wallet.json. Generate a wallet with "yarn test:wallet".'
  )
  process.exit(0)
}

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
      author: userWallet.cashAddress,
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
    it('should reject creation when author is missing', async () => {
      try {
        const payload = {
          text: 'incomplete data'
        }
        const signature = bchjs.BitcoinCash.signMessageWithPrivKey(
          userWallet.WIF,
          JSON.stringify(payload, null)
        )
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
        const signature = bchjs.BitcoinCash.signMessageWithPrivKey(
          userWallet.WIF,
          JSON.stringify(payload, null)
        )
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
        const signature = bchjs.BitcoinCash.signMessageWithPrivKey(
          otherWallet.WIF,
          JSON.stringify(payload, null)
        )
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
      const signature = bchjs.BitcoinCash.signMessageWithPrivKey(
        userWallet.WIF,
        JSON.stringify(payload, null)
      )
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
      const signature = bchjs.BitcoinCash.signMessageWithPrivKey(
        userWallet.WIF,
        JSON.stringify(payload, null)
      )
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
          author: userWallet.cashAddress,
          text: 'New text'
        }
        const signature = bchjs.BitcoinCash.signMessageWithPrivKey(
          userWallet.WIF,
          JSON.stringify(newPayload, null)
        )
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
          author: userWallet.cashAddress,
          commentId: 'non-valid',
          text: 'New text'
        }
        const signature = bchjs.BitcoinCash.signMessageWithPrivKey(
          userWallet.WIF,
          JSON.stringify(newPayload, null)
        )
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
          author: userWallet.cashAddress,
          commentId: 'non-valid',
          text: 'New text'
        }
        const signature = bchjs.BitcoinCash.signMessageWithPrivKey(
          userWallet.WIF,
          JSON.stringify(newPayload, null)
        )
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
        const signature = bchjs.BitcoinCash.signMessageWithPrivKey(
          userWallet.WIF,
          JSON.stringify(newPayload, null)
        )
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
          author: userWallet.cashAddress,
          commentId: savedComment._id,
          text: 'Edited text'
        }
        const signature = bchjs.BitcoinCash.signMessageWithPrivKey(
          otherWallet.WIF,
          JSON.stringify(newPayload, null)
        )
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
        author: userWallet.cashAddress,
        commentId: savedComment._id,
        text: 'Edited text'
      }
      const signature = bchjs.BitcoinCash.signMessageWithPrivKey(
        userWallet.WIF,
        JSON.stringify(newPayload, null)
      )
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
    it('should reject delete when author is missing', async () => {
      try {
        const payload = {}
        const signature = bchjs.BitcoinCash.signMessageWithPrivKey(
          userWallet.WIF,
          JSON.stringify(payload, null)
        )
        const result = await testUtils.deleteComment(payload, signature, tmpComment._id)
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
          author: userWallet.cashAddress,
          delete: true
        }
        const signature = bchjs.BitcoinCash.signMessageWithPrivKey(
          userWallet.WIF,
          JSON.stringify(payload, null)
        )
        const result = await testUtils.deleteComment(payload, signature, tmpComment._id)
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
          author: userWallet.cashAddress,
          commentId: 'non-valid',
          delete: true
        }
        const signature = bchjs.BitcoinCash.signMessageWithPrivKey(
          userWallet.WIF,
          JSON.stringify(payload, null)
        )
        const result = await testUtils.deleteComment(payload, signature, tmpComment._id)
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
        author: userWallet.cashAddress,
        commentId: 'non-existing',
        delete: true
      }
      const signature = bchjs.BitcoinCash.signMessageWithPrivKey(
        userWallet.WIF,
        JSON.stringify(payload, null)
      )
      const result = await testUtils.deleteComment(payload, signature)
      assert(result.status === 200, 'Status Code 200 expected.')
      assert(result.data.status === 'success', 'success status expected')
    })
    it('should reject deletion when signature is invalid', async () => {
      try {
        const payload = {
          author: userWallet.cashAddress,
          commentId: tmpComment._id,
          delete: true
        }
        const signature = bchjs.BitcoinCash.signMessageWithPrivKey(
          otherWallet.WIF,
          JSON.stringify(payload, null)
        )
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
        author: userWallet.cashAddress,
        commentId: tmpComment._id,
        delete: true
      }
      const signature = bchjs.BitcoinCash.signMessageWithPrivKey(
        userWallet.WIF,
        JSON.stringify(payload, null)
      )
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
        const signature = bchjs.BitcoinCash.signMessageWithPrivKey(
          moderatorWallet.WIF,
          JSON.stringify(payload, null)
        )
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
        const signature = bchjs.BitcoinCash.signMessageWithPrivKey(
          moderatorWallet.WIF,
          JSON.stringify(payload, null)
        )
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
      const signature = bchjs.BitcoinCash.signMessageWithPrivKey(
        moderatorWallet.WIF,
        JSON.stringify(payload, null)
      )
      const result = await testUtils.delistComment(payload, signature)
      assert(result.status === 200, 'Status Code 200 expected.')
      assert(result.data.status === 'success', 'success status expected')
    })
    it('should reject delisting when signature is invalid', async () => {
      try {
        const payload = {
          commentId: savedComment._id
        }
        const signature = bchjs.BitcoinCash.signMessageWithPrivKey(
          userWallet.WIF,
          JSON.stringify(payload, null)
        )
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
      const signature = bchjs.BitcoinCash.signMessageWithPrivKey(
        moderatorWallet.WIF,
        JSON.stringify(payload, null)
      )
      const result = await testUtils.delistComment(payload, signature)
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
