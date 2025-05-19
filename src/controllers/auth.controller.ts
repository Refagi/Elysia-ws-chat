import services from '../services/index';
import type { CreateUser } from '../models/user.model';
import type { LoginUser, UpdatePic, Logout } from '../models/auth.model';
import { ApiError } from '../utils/ApiError';
import httpStatus from 'http-status';
import { CatchAllError } from '../utils/catchError';
import { tokenTypes } from '../types/token';
import { db } from '../db';
import { tokens, users } from '../db/schemas/schema';
import { and, eq, inArray, type Query } from 'drizzle-orm';
import { AuthHandler } from '../middlewares/auth';
import validations from '../validations/index';
import { broadcastEvent } from '../utils/websocket.utils';
import { broadcastOnlineUsers } from '../routes/v1/websocket.routes';

const authHandler = new AuthHandler();
@CatchAllError
export class AuthController {
  static async checkVerification(token: string) {
    const verifyTokenDoc = await services.TokenService.verifyToken(token, tokenTypes.REFRESH);
    const userId = verifyTokenDoc.userId;

    const user = await db.select().from(users).where(eq(users.id, userId));
    const result = user[0];

    if (!result) {
      throw new Error('User not found');
    }

    return !!result.isEmailVerified;
  }

  static async register({ body }: { body: CreateUser }) {
    const validation = validations.register.parse(body);
    const exitingEmail = await services.UserService.getUserByEmail(validation.email);
    if (exitingEmail) throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken!');

    const users = await services.UserService.createUser(validation.username, validation.email, validation.password);
    const tokens = await services.TokenService.generateAuthTokens(users.id);
    return { message: 'Register is successfully', status: httpStatus.CREATED, data: users, token: tokens };
  }

  static async login({ body }: { body: LoginUser }) {
    const validation = validations.login.parse(body);

    const exitingEmail = await services.UserService.getUserByEmail(validation.email);
    if (!exitingEmail) throw new ApiError(httpStatus.BAD_REQUEST, 'You dont have an account yet, please register!');

    const user = await services.AuthService.login(validation.email, validation.password);

    const existingLoginUser = await services.TokenService.existingTokenRefresh(user.id, tokenTypes.REFRESH);
    if (existingLoginUser.length > 0) {
      await db
        .delete(tokens)
        .where(and(eq(tokens.userId, existingLoginUser[0].userId), eq(tokens.type, tokenTypes.REFRESH)));
    }
    const token = await services.TokenService.generateAuthTokens(user.id);
    return { message: 'Login is successfully', status: httpStatus.OK, data: user, token: token };
  }

  static async logout({ body }: { body: Logout }) {
    const validation = validations.logout.body.parse(body);
    await services.AuthService.logout(validation.token);
    return { status: httpStatus.OK, message: 'Logout is successfully' };
  }

  static async sendVerifyEmail({ request }: { request: Request }) {
    const auth = await authHandler.authenticate(request);
    const verifyTokenDoc = await services.TokenService.generateVerifyToken(auth.id);
    const getUser = await services.UserService.getUserByEmail(auth.email);
    if (!getUser) throw new ApiError(httpStatus.NOT_FOUND, 'Email is not found');
    await services.EmailService.sendVerificationEmail(getUser.email, verifyTokenDoc);
    return {
      status: httpStatus.OK,
      message: `Verify email link has been sent to ${getUser.email}`,
      token: verifyTokenDoc
    };
  }

  static async verifyEmail(token: string) {
    const validation = validations.verifyEmail.parse({ token });
    await services.AuthService.verifyEmail(validation.token);
    return { status: httpStatus.OK, message: 'Email has been verification!' };
  }

  static async updatePic({ body, request }: { body: UpdatePic; request: Request }) {
    const auth = await authHandler.authenticate(request);
    if (!auth) throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication Error');
    if (!auth.id) throw new ApiError(httpStatus.NOT_FOUND, 'User Id Not Found');
    const getUser = await services.UserService.getUserById(auth.id);
    const username = body.username || getUser.username;
    const updateProfile = await services.AuthService.updateProfile(auth.id, body.bio, body.profilePic, username);
    if (!updateProfile || updateProfile.length === 0) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Update profile failded');
    }
    broadcastEvent('profileUpdated', {
      userId: auth.id,
      username: username,
      profilePic: body.profilePic,
      bio: body.bio
    });
    broadcastOnlineUsers();

    return { status: httpStatus.OK, message: 'Profile is updated', data: updateProfile };
  }

  static async deleteProfilePic({ request }: { request: Request }) {
    const auth = await authHandler.authenticate(request);
    const deleteProfile = await services.AuthService.deleteProfilePic(auth.id);
    if (!deleteProfile) throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to delete profile pic!');
    broadcastEvent('profilePicDeleted', {
      userId: auth.id,
      profilePic: ''
    });
    broadcastOnlineUsers();
    return { status: httpStatus.OK, message: 'Profile picture deleted', data: deleteProfile };
  }
}
