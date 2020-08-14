const BCHJS = require('@chris.troutner/bch-js')
const bchjs = new BCHJS()

async function sign (obj, privateKey) {
  return await bchjs.BitcoinCash.signMessageWithPrivKey(
    privateKey,
    JSON.stringify(obj, null)
  )
}

async function verify (obj, signature, address) {
  return await bchjs.BitcoinCash.verifyMessage(
    address,
    signature,
    JSON.stringify(obj, null)
  )
}

module.exports = {
  sign,
  verify
}
