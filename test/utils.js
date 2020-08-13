const mongoose = require('mongoose')
const config = require('../config')
const axios = require('axios').default

const LOCALHOST = `http://localhost:${config.port}`

// Remove all collections from the DB.
async function cleanDb () {
  for (const collection in mongoose.connection.collections) {
    const collections = mongoose.connection.collections
    if (collections.collection) {
      // const thisCollection = mongoose.connection.collections[collection]
      // console.log(`thisCollection: ${JSON.stringify(thisCollection, null, 2)}`)

      await collection.deleteMany()
    }
  }
}

// This function is used to create new comments
// payload = {
//   txId,
//   replyTo,
//   author,
//   text
// }
async function createComment (payload, signature) {
  const options = {
    method: 'POST',
    url: `${LOCALHOST}/api/v1/comment`,
    headers: {
      Accept: 'application/json'
    },
    data: {
      payload,
      signature
    }
  }

  const result = await axios(options)
  return result
}

// This function is used to update comments
// payload = {
//   author,
//   commentId,
//   text
// }
async function updateComment (payload, signature, id = null) {
  const commentId = payload.commentId
  const options = {
    method: 'PUT',
    url: `${LOCALHOST}/api/v1/comment/${id || commentId}`,
    headers: {
      Accept: 'application/json'
    },
    data: {
      payload,
      signature
    }
  }

  const result = await axios(options)
  return result
}

// This function is used to delete comments
// payload = {
//   author,
//   commentId,
//   delete: true
// }
async function deleteComment (payload, signature, id = null) {
  const commentId = payload.commentId
  const options = {
    method: 'DELETE',
    url: `${LOCALHOST}/api/v1/comment/${id || commentId}`,
    headers: {
      Accept: 'application/json'
    },
    data: {
      payload,
      signature
    }
  }

  const result = await axios(options)
  return result
}

async function delistComment (payload, signature, id = null) {
  const commentId = payload.commentId
  const options = {
    method: 'POST',
    url: `${LOCALHOST}/api/v1/mod/comment/${id || commentId}/delist`,
    headers: {
      Accept: 'application/json'
    },
    data: {
      payload,
      signature
    }
  }

  const result = await axios(options)
  return result
}

// This function is used to update info
// payload = {
//   moderatorName,
//   moderatorEmail,
//   description,
//   title
// }
async function updateInfo (moderator, payload, signature) {
  const options = {
    method: 'PUT',
    url: `${LOCALHOST}/api/v1/info/${moderator}`,
    headers: {
      Accept: 'application/json'
    },
    data: {
      payload,
      signature
    }
  }

  const result = await axios(options)
  return result
}

module.exports = {
  cleanDb,
  createComment,
  updateComment,
  deleteComment,
  delistComment,
  updateInfo
}
