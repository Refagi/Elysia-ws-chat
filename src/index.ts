import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { staticPlugin } from '@elysiajs/static';
import { swaggerConfig } from './config/swagger.config';
import { jwt } from '@elysiajs/jwt';
import { LoggerHandler } from '../src/config/loggerHandler';
import { router } from '../src/routes/v1/index';
import config from './config/config';

const logger = new LoggerHandler();
export const app = new Elysia()

.use(logger.handleLogging())
.use(cors())
.use(swaggerConfig)
.use(router)

// Add this to your Elysia app configuration
// .use(staticPlugin())
// .get('/auth', () => Bun.file('./public/auth.html'))
// .get('/chat', () => Bun.file('./public/ws.html'))
.use(
  staticPlugin({
    assets: './public',        // ini pastikan sesuai
    prefix: '/',               // akses langsung lewat root (/css, /js)
  })
)
.get('/auth', () => Bun.file('./public/auth.html'))
.get('/chats', () => Bun.file('./public/index.html'))

.get('/v1', () => 'Hello Elysia');