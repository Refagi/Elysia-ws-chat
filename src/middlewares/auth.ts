import { db } from '../db';
import { users } from '../db/schemas/schema';
import { eq } from 'drizzle-orm';
import { TokenService } from '../services/token.service';
import { ApiError } from '../utils/ApiError';
import httpStatus from 'http-status';
import { tokenTypes } from '../types/token';
import jwt from '@elysiajs/jwt';
import Elysia from 'elysia';
import { jwtConfig } from '../config/jwt.config';
import services from '../services';
import { json } from 'stream/consumers';


interface Request {
  headers: Headers;
  user?: any;
}

// interface SetResponse {
//   status: number;
// }

// interface NextFunction {
//   (): Promise<any>;
// }

const app = new Elysia().use(jwtConfig)
export class AuthHandler {
  public authenticate = async (request: Request) => {
    const jwt = app.decorator.jwt;
    const authHeader = request.headers.get('Authorization');

    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader
    if(!token) throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate')
    try {
      const payload = await jwt.verify(token);
      if (!payload || typeof payload !== 'object' || !payload.sub) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token payload');
      }
      const getUser = await services.UserService.getUserById(payload.sub)
      if (!getUser) {
        throw new ApiError(httpStatus.FORBIDDEN, `Forbidden`);
      }
      request.user = getUser; // attach user to request
      return getUser;
    } catch (error) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token');
    }
  };

  public authenticateWebsocket = async (query: Record<string, string | undefined>) => {
    const jwt = app.decorator.jwt;
    const token = query.token;
    if (!token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'No token provided');
    }
  
    try {
      const payload = await jwt.verify(token)
      console.log('decoded: ', payload)
      if (!payload || typeof payload !== 'object' || !payload.sub) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token payload');
      }
      const getUser = await services.UserService.getUserById(payload.sub)
      if (!getUser) {
        throw new ApiError(httpStatus.FORBIDDEN, `Forbidden`);
      }
      return getUser
    } catch (error) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token');
    }
  }
}