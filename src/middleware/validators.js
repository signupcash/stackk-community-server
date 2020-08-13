const BCHJS = require('@chris.troutner/bch-js')
const bchjs = new BCHJS()
const config = require('../../config')

async function ensureSignature (ctx, next) {
  try {
    const signature = ctx.request.body.signature
    const payload = ctx.request.body.payload
    if (!payload.author || payload.author === '') {
      ctx.throw(401)
    }
    const verified = await bchjs.BitcoinCash.verifyMessage(
      payload.author,
      signature,
      JSON.stringify(payload, null)
    )
    if (verified !== true) {
      ctx.throw(401)
    }
    return next()
  } catch (err) {
    ctx.throw(401)
  }
}

async function ensureModSignature (ctx, next) {
  try {
    if (!config.moderator || config.moderator === '') {
      ctx.throw(401)
    }
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
    ctx.throw(401)
  }
}

module.exports = {
  ensureSignature,
  ensureModSignature
}
