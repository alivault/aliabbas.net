import { authComponent, createAuth, getTrustedOrigins } from './auth'
import { httpRouter } from 'convex/server'

const http = httpRouter()

authComponent.registerRoutes(http, createAuth, {
  cors: {
    allowedOrigins: getTrustedOrigins(),
  },
})

export default http
