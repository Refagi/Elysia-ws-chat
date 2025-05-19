import type { InferSelectModel } from 'drizzle-orm';
import { tokens, users } from '../db/schemas/schema';

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  isEmailVerified: boolean;
  status: string;
  lastSeen: Date;
}

export interface LoginUser {
  email: string;
  password: string;
}

export interface Logout {
  token: string;
}

export interface Verify {
  token: string;
}

export interface SendVerifyEmail {
  users: InferSelectModel<typeof users>;
  tokens: InferSelectModel<typeof tokens>;
  link: string;
}

export interface UpdatePic {
  username: string;
  bio: string;
  profilePic: string;
}