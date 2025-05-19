import { db } from '../db';
import { messages, users } from '../db/schemas/schema';
import { eq, or, and, desc } from 'drizzle-orm';
import { ApiError } from '../utils/ApiError';
import httpStatus from 'http-status';
import { cloudinary } from '../config/config';

export class MessageService {
  async getRecentMessages(senderId: string, receiverId: string) {
    return await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, senderId), eq(messages.receiverId, receiverId)),
          and(eq(messages.senderId, receiverId), eq(messages.receiverId, senderId))
        )
      )
      .execute();
  }

  async getLastMessage(senderId: string, receiverId: string) {
    const message = await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, senderId), eq(messages.receiverId, receiverId)),
          and(eq(messages.senderId, receiverId), eq(messages.receiverId, senderId))
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(1)
      .execute();
    return message.length > 0 ? message[0] : null;
  }

  async sendMessage(senderId: string, receiverId: string, text?: string, image?: string) {
    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }
    const result = await db
      .insert(messages)
      .values({
        senderId: senderId,
        receiverId: receiverId,
        text: text || '',
        image: imageUrl
      })
      .returning()
      .execute();

    return { ...result[0] };
  }

  async getMessageById(messageId: string) {
    const message = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1).execute();
    if (!message || message.length === 0) {
      return null;
    }
    return message[0];
  }

  async deleteMessage(messageId: string, senderId: string) {
    const deleteMessage = await db.delete(messages).where(eq(messages.id, messageId));
    if (!deleteMessage) throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to delete message!');
    return deleteMessage;
  }
}
