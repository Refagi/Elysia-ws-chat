import { db } from '../db';
import { tokens, users } from '../db/schemas/schema';
import { and, eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { ApiError } from '../utils/ApiError';
import httpStatus from 'http-status';
import services from '.';
import { tokenTypes } from '../types/token';
import { cloudinary } from '../config/config';

export class AuthService {
  static async login (email: string, password: string) {
    const user = await services.UserService.getUserByEmail(email);

    if(!user) throw new ApiError(httpStatus.NOT_FOUND, 'Email not registered');

    if(user.isEmailVerified === false) throw new ApiError(httpStatus.UNAUTHORIZED, 'Email not verified, Please verify your email!');

    const validPassword = await Bun.password.verify(password, user.password, 'bcrypt');

    if(!validPassword)  throw new ApiError(httpStatus.BAD_REQUEST, 'Wrong email or password');
    await db.update(users).set({status: 'online'}).where(eq(users.email, email ));
    
    return user
  }

  static async logout (refreshToken: string) {
    const refreshTokenDoc = await db.select().from(tokens).where(and(eq(tokens.token, refreshToken), eq(tokens.type, tokenTypes.REFRESH)));
    if(!refreshTokenDoc) throw new ApiError(httpStatus.NOT_FOUND, 'Refresh token not found!');
    await db.update(users).set({status: 'offline'}).where(eq(users.id, refreshTokenDoc[0].userId ));
    await db.delete(tokens).where(eq(tokens.id, refreshTokenDoc[0].id))
  }

  static async verifyEmail (token: string) {
    const verifyTokenDoc = await services.TokenService.verifyToken(token, tokenTypes.VERIFY_EMAIL);
    const getUser = await services.UserService.getUserById(verifyTokenDoc.userId);
    if(!getUser) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    await db.delete(tokens).where(and(eq(tokens.userId, getUser.id), eq(tokens.type, tokenTypes.VERIFY_EMAIL)));
    await db.update(users).set({isEmailVerified: true, updatedAt: new Date()}).where(eq(users.id, getUser.id));
  }

  static async updateProfile ( userId: string,  bio: string, profilePic?: string, username?: string,) {
    let profilePicUrl: string | null = null;

  if (profilePic && profilePic.trim() !== '' && profilePic.startsWith('data:image/')) {
    const uploadProfile = await cloudinary.uploader.upload(profilePic);
    profilePicUrl = uploadProfile.secure_url;
  }
  const updateData: Partial<typeof users.$inferInsert> = {
    bio: bio,
    username: username,
  };

  // Hanya set profilePic jika ada URL baru dari Cloudinary
  if (profilePicUrl) {
    updateData.profilePic = profilePicUrl;
  }
    const updateUser = await db.update(users).set(updateData).where(eq(users.id, userId)).returning().execute();
    return updateUser;
  }

  static async deleteProfilePic (userId: string) {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .execute();

    if (user.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    const currentProfilePic = user[0].profilePic;

    // Jika ada URL gambar, hapus dari Cloudinary
    if (currentProfilePic) {
      // Ekstrak public_id dari URL
      // Contoh URL: https://res.cloudinary.com/your_cloud_name/image/upload/v1234567890/public_id.jpg
      const urlParts = currentProfilePic.split('/');
      const publicIdWithExtension = urlParts[urlParts.length - 1];
      const publicId = publicIdWithExtension.split('.')[0];

      await cloudinary.uploader.destroy(publicId);
      console.log(`Deleted image from Cloudinary: ${publicId}`);
    }

    // Perbarui database: set profilePic menjadi null
    const updatedUser = await db
      .update(users)
      .set({ profilePic: '' })
      .where(eq(users.id, userId))
      .returning()
      .execute();

    if (updatedUser.length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, "User not found");
    }

    return updatedUser[0]
  }
}