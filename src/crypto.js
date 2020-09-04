const Message = require('bitcore-message')
const bchaddr = require('bchaddrjs')

async function verify (obj, signature, address) {
  const legacyAddress = await bchaddr.toLegacyAddress(address)
  const message = new Message(JSON.stringify(obj))
  return await message.verify(legacyAddress, signature)
}

module.exports = {
  verify
}
