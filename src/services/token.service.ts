import { jwt } from '@elysiajs/jwt';
import moment from 'moment';
import type { Moment } from 'moment';
import config from '../config/config.js';
import { tokenTypes } from '../types/token.js';
import { db } from '../db';
import { tokens, users } from '../db/schemas/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { PayloadType } from '../models/token.model.js';
import { ApiError } from '../utils/ApiError.js';
import httpStatus from 'http-status';
import { Elysia } from 'elysia';
import services from './index.js';
import { UserService } from './user.service.js';
import { jwtConfig } from '../config/jwt.config.js';
import type { SendVerifyEmail, User } from '../models/auth.model.js';

const app = new Elysia().use(jwtConfig)
export class TokenService {
  private static secret = config.jwt.secret as string;;
  private static jwt = app.decorator.jwt;

  static async generateToken(userId: string, expires: Moment, type: string) {
    const payload: PayloadType = {
      sub: userId,
      iat: moment().unix(),
      exp: expires.unix(),
      type,
    };
    return this.jwt.sign(payload);
  }

  static async saveToken(token: string, userId: string, expires: Moment, type: string) {
    await db.insert(tokens).values({
      token,
      userId,
      expires: expires.toDate(),
      type,
    });
  }

  static async verifyToken(token: string, type: string) {
    try {
      const payload = await this.jwt.verify(token);
      console.log('Decoded JWT payload:', payload);
      if (!payload || typeof payload !== 'object' || !payload.sub) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token payload');
      }

      if (payload.exp && moment().unix() > payload.exp) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Token expired');
      }

      const userId = String(payload.sub);
      const tokenDoc = await db
        .select()
        .from(tokens)
        .where(
          and(
            eq(tokens.token, token),
            eq(tokens.type, type),
            eq(tokens.userId, userId)
          )
        );

      if (!tokenDoc.length) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Token not found');
      }

      return tokenDoc[0];
    } catch (error) {
      console.error('Error verifying token:', error);
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token');
    }
  }

  static async generateAuthTokens(userId: string) {
    const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = await this.generateToken(userId, accessTokenExpires, tokenTypes.ACCESS);

    const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
    const refreshToken = await this.generateToken(userId, refreshTokenExpires, tokenTypes.REFRESH);
    await this.saveToken(refreshToken, userId, refreshTokenExpires, tokenTypes.REFRESH);

    return {
      access: { token: accessToken, expires: accessTokenExpires.toDate() },
      refresh: { token: refreshToken, expires: refreshTokenExpires.toDate() },
    };
  }

 static async generateRefreshToken(userId: string) {
    const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
    const accessToken = await this.generateToken(userId, accessTokenExpires, tokenTypes.ACCESS);

    return {
      access: {
        token: accessToken,
        expires: accessTokenExpires.toDate()
      }
    };
  }

  static async existingTokenRefresh(userId: string, type: string) {
    return await db.select().from(tokens).where(and(eq(tokens.userId, userId), eq(tokens.type, type)))
    .orderBy(desc(tokens.createdAt))
    .limit(1);
  }

  static async getPayloadVerifyToken (token: string) {
    const payload = await this.jwt.verify(token) ;
    return payload;
  }

  static async generateVerifyToken(userId: string) {
    await db.delete(tokens).where(and(eq(tokens.userId, userId), eq(tokens.type, tokenTypes.VERIFY_EMAIL)));
    const expires = moment().add(config.jwt.verifyEmailExpirationMinutes, 'minutes');
    const verifyEmailToken = await this.generateToken(userId, expires, tokenTypes.VERIFY_EMAIL);
    await this.saveToken(verifyEmailToken, userId, expires, tokenTypes.VERIFY_EMAIL);
    return verifyEmailToken;
  }
}