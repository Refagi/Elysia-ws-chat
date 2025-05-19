import { db } from '../db';
import { users } from '../db/schemas/schema';
import { eq, like, ne } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { ApiError } from '../utils/ApiError';
import httpStatus from 'http-status';

export class UserService {
  static async createUser(username: string, email: string, password: string) {
    // password = bcrypt.hashSync(password, 8);
    password = await Bun.password.hash(password, {algorithm: 'bcrypt', cost: 10})
    const result = await db.insert(users).values({ username, email, password }).returning().execute();
    return result[0];
  }

  static async getUsersSideBar(userId: string) {
    const filteredUsers = await db.select({
      id: users.id,
      username: users.username,
      profilePic: users.profilePic,
      status: users.status,
      lastSeen: users.lastSeen,
    })
    .from(users)
    .where(ne(users.id, userId));
    return filteredUsers;
  }

  static async getUserByEmail(email: string) {
    const result = (await db.select().from(users).where(eq(users.email, email)));
    return result[0];
  }

  static async getUserById(userId: string) {
    const result = await db.select().from(users).where(eq(users.id, userId));
    return result[0];
  }

  static async searchUser(username: string){
    const result = await db.select({
      id: users.id,
      username: users.username,
      profilePic: users.profilePic,
      status: users.status,
      lastSeen: users.lastSeen,
    }).from(users).where(like(users.username, `${username}%`));
        console.log('Search result from DB:', result); // Tambahkan log untuk debugging
    return result
  }
}
