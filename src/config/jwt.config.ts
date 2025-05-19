import { jwt } from '@elysiajs/jwt'
import config from './config'
export const jwtConfig = jwt({ name: 'jwt', secret: config.jwt.secret as string })