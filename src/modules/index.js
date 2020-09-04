const glob = require('glob')
const Router = require('koa-router')

module.exports = function initModules (app) {
  glob(`${__dirname}/*`, { ignore: '**/index.js' }, (err, matches) => {
    if (err) { throw err }

    // Loop through each sub-directory in the modules directory.
    matches.forEach((mod) => {
      const router = require(`${mod}/router`)

      const routes = router.routes
      const baseUrl = router.baseUrl
      const instance = new Router({ prefix: baseUrl })

      // Loop through each route defined in the router.js file.
      routes.forEach((config) => {
        const method = config.method || ''
        const route = config.route || ''
        const handlers = config.handlers || []

        const lastHandler = handlers.pop()

        instance[method.toLowerCase()](route, ...handlers, async function (ctx) {
          return lastHandler(ctx)
        })

        app
          .use(instance.routes())
          .use(instance.allowedMethods())
      })
    })
  })
}
