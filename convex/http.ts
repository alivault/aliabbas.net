import { authComponent, createAuth } from './auth'
import { httpRouter } from 'convex/server'

const http = httpRouter()

authComponent.registerRoutes(http, createAuth, {
  cors: {
    allowedOrigins: [process.env.SITE_URL!].filter(Boolean),
  },
})

export default http
