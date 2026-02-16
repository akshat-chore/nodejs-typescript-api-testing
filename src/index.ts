import express from 'express'
import { errorMiddleware, loggerMiddleware } from './middlewares/index.js'
import routes from './routes/index.js'
import { config } from './utils/config.js'
import { setupGraphQL } from './middlewares/graphql.js'
import { logger } from './utils/logger.js'

const port = config.port

const main = async () => {
  const app = express()

  // setup graphql
  await setupGraphQL(app)

  // middlewares
  app.use(loggerMiddleware())
  app.use(express.json())
  app.use(routes)
  app.use(errorMiddleware)

  app.listen(port, () => {
    logger.info(
      `The Task Service has started running at ${config.host}:${port} in ${config.nodeEnv} mode.`
    )
  })
}

main()
