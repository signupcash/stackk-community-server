const config = require('../../config')
const BCHJS = require('@chris.troutner/bch-js')
const bchjs = new BCHJS()

async function ensureSignature (ctx, next) {
  console.log('check request signature')
  return next()
}

async function ensureModSignature (ctx, next) {
  try {
    const signature = ctx.request.body.signature
    const payload = ctx.request.body.payload
    const verified = await bchjs.BitcoinCash.verifyMessage(
      config.moderator,
      signature,
      JSON.stringify(payload, null)
    )
    if (verified !== true) {
      ctx.throw(401)
    }
    return next()
  } catch (err) {
    // console.log(`error in ensureModSignature(): ${err}`)
    ctx.throw(401)
  }
}

module.exports = {
  ensureSignature,
  ensureModSignature
}
