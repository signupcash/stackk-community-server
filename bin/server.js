const Koa = require('koa')
const bodyParser = require('koa-bodyparser')
const mongoose = require('mongoose')
const cors = require('kcors')

const config = require('../config') // always this first.
const errorMiddleware = require('../src/middleware')

async function startServer () {
  const app = new Koa()

  // Connect to the Mongo Database.
  mongoose.Promise = global.Promise
  mongoose.set('useCreateIndex', true) // Stop deprecation warning.
  await mongoose.connect(config.database, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false
  })

  app.use(bodyParser())
  app.use(errorMiddleware())

  // Custom Middleware Modules
  const modules = require('../src/modules')
  modules(app)

  // Enable CORS for testing
  // THIS IS A SECURITY RISK. COMMENT OUT FOR PRODUCTION
  app.use(cors({ origin: '*' }))

  console.log(`Running server in environment: ${config.env}`)
  await app.listen(config.port)
  console.log(`Server started on ${config.port}`)

  return app
}

module.exports = {
  startServer
}
