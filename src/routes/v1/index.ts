import { Elysia } from 'elysia';
import { authRoutes } from './auth.routes'
import { userRoutes } from './user.routes'
import { messageRoutes } from './message.routes'
import { websocketRoutes } from './websocket.routes'

export const router = new Elysia({prefix: '/v1'});

router.use(authRoutes)
router.use(userRoutes)
router.use(messageRoutes)
router.use(websocketRoutes)
