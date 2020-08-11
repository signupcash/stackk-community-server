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
// commentObj = {
//   txId,
//   replyTo,
//   author,
//   text
// }
async function createComment (commentObj) {
  const payload = {
    txId: commentObj.txId,
    replyTo: commentObj.replyTo,
    author: commentObj.author,
    text: commentObj.text
  }
  const signature = 'signed' // TODO: calculate real signature
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
// commentObj = {
//   txId,
//   replyTo,
//   author,
//   text
// }
async function updateComment (commentObj, id = null) {
  const commentId = commentObj.commentId
  const payload = {
    commentId,
    txId: commentObj.txId,
    replyTo: commentObj.replyTo,
    author: commentObj.author,
    text: commentObj.text
  }
  const signature = 'signed' // TODO: calculate real signature
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

async function deleteComment (commentObj, id = null) {
  const commentId = commentObj.commentId
  const payload = {
    commentId,
    delete: true
  }
  const signature = 'signed' // TODO: calculate real signature
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

async function delistComment (commentObj, id = null) {
  const commentId = commentObj.commentId
  const payload = {
    commentId
  }
  const signature = 'signed' // TODO: calculate real signature
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
async function updateInfo (payload, moderator) {
  const signature = 'signed' // TODO: calculate real signature
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
