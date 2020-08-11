const config = require('../../../config')
const Info = require('../../models/info')

let _this
class InfoController {
  constructor () {
    _this = this
    this.Info = Info
  }

  async createInfo (ctx) {
    try {
      const infoData = ctx.request.body.payload
      // TODO: check ctx.request.body.signature for config.moderator

      infoData.moderatorAddress = ctx.params.moderator
      // Requirements check
      if (!infoData.moderatorName ||
        typeof infoData.moderatorName !== 'string' ||
        infoData.moderatorName === '') {
        throw new Error("Property 'moderatorName' must be non-empty string!")
      }

      if (!infoData.moderatorEmail ||
        typeof infoData.moderatorEmail !== 'string' ||
        infoData.moderatorEmail === '') {
        throw new Error("Property 'moderatorEmail' must be non-empty string!")
      }

      if (!infoData.description ||
        typeof infoData.description !== 'string' ||
        infoData.description === '') {
        throw new Error("Property 'description' must be non-empty string!")
      }

      if (!infoData.title ||
        typeof infoData.title !== 'string' ||
        infoData.title === '') {
        throw new Error("Property 'title' must be non-empty string!")
      }

      const query = { moderatorAddress: ctx.params.moderator }
      const options = { upsert: true, new: true, setDefaultsOnInsert: true }
      await _this.Info.findOneAndUpdate(query, infoData, options)

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

  async getInfo (ctx, next) {
    try {
      const infos = () => (_this.Info.findOne({ moderatorAddress: config.moderator }).exec())
      const info = await infos()

      if (!info) {
        ctx.throw(404)
      }

      ctx.body = {
        moderator: info.moderatorAddress,
        version: config.version,
        moderatorName: info.moderatorName,
        moderatorEmail: info.moderatorEmail,
        description: info.description,
        title: info.title
      }
    } catch (err) {
      if (err.status === 404 || err.name === 'CastError') {
        ctx.throw(404)
      }

      ctx.throw(422)
    }
    if (next) {
      return next()
    }
  }
}

module.exports = InfoController
