import { pgTable, uuid, text, timestamp, integer, varchar, boolean, date } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username').notNull().unique(),
  email: varchar('email').notNull().unique(),
  password: varchar('password').notNull(),
  profilePic: varchar('profilePic').default(''),
  isEmailVerified: boolean('isEmailVerified').default(false),
  lastSeen: timestamp('lastSeen'),
  status: varchar('status').default('offline'),
  bio: text('bio').default(''),
  updatedAt: timestamp('updatedAt').defaultNow(),
  createdAt: timestamp('createdAt').defaultNow()
});

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  text: text('text').notNull(),
  image: varchar('image').default(''),
  senderId: uuid('senderId').references(() => users.id),
  receiverId: uuid('receiverId').references(() => users.id),
  readBy: varchar('readBy').references(() => users.username),
  createdAt: timestamp('createdAt').defaultNow()
});


export const tokens = pgTable('tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('userId')
    .references(() => users.id)
    .notNull(),
  token: varchar('token').notNull().notNull(),
  type: varchar('type').notNull().notNull(),
  expires: timestamp('expires', { withTimezone: true }),
  createdAt: timestamp('createdAt').defaultNow()
});
