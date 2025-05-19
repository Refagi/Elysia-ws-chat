import services from '../services/index';
import type { GetMessage, SendMessage, DeleteMessage } from '../models/message.model';
import { ApiError } from '../utils/ApiError';
import httpStatus from 'http-status';
import { AuthHandler } from '../middlewares/auth';
import { CatchAllError } from '../utils/catchError';
import validations from '../validations';
import { broadcastEvent, getReceiverSocket } from '../utils/websocket.utils';
import { broadcastOnlineUsers } from '../routes/v1/websocket.routes';

const authHandler = new AuthHandler();
@CatchAllError
export class MessageController {
  static async getRecentMessage({ params, request }: { params: GetMessage; request: Request }) {
    const auth = await authHandler.authenticate(request);
    const receiverId = params.receiverId;
    const valid = validations.getMessages.parse({ receiverId });
    const senderId = auth.id;
    const recentMessage = await services.messageService.getRecentMessages(senderId, valid.receiverId);
    return { status: httpStatus.OK, message: 'get recent message successfully', data: recentMessage };
  }

  static async getLastMessage({ params, request }: { params: GetMessage; request: Request }) {
    const auth = await authHandler.authenticate(request);
    const receiverId = params.receiverId;
    const valid = validations.getMessages.parse({ receiverId });
    const senderId = auth.id;
    const lastMessage = await services.messageService.getLastMessage(senderId, valid.receiverId);
    return { status: httpStatus.OK, message: 'get last message successfully', data: lastMessage };
  }

  static async sendMessage({ body, request }: { body: SendMessage; request: Request }) {
    const auth = await authHandler.authenticate(request);
    const valid = validations.sendMessage.parse(body);
    const message = await services.messageService.sendMessage(auth.id, valid.receiverId, valid.text, valid.image);
    if (!message) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to save message');
    }

    return { status: httpStatus.OK, message: 'send messages is successfully', data: message };
  }

  static async deleteMessage({ params, request }: { params: DeleteMessage; request: Request }) {
    const auth = await authHandler.authenticate(request);
    const messageId = params.messageId;
    const senderId = auth.id;
    const valid = validations.deleteMessage.parse({ messageId, senderId });
    const message = await services.messageService.getMessageById(valid.messageId);
    if(!message) throw new ApiError(httpStatus.NOT_FOUND, 'Message is not found')
    const receiverId = message.receiverId as string;
    const result = await services.messageService.deleteMessage(valid.messageId, valid.senderId);
    if (!result) throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to delete message');

    // Kirim event messageDeleted ke pengirim (sender)
    const senderSocket = getReceiverSocket(senderId);
    if (senderSocket) {
      senderSocket.send(
        JSON.stringify({
          event: 'messageDeleted',
          data: {
            messageId: valid.messageId,
            userId: senderId,
            receiverId: receiverId,
          },
        })
      );
      console.log(`Notified sender ${senderId} of deleted message ${valid.messageId}`);
    }

    // Kirim event messageDeleted ke penerima (receiver)
    const receiverSocket = getReceiverSocket(receiverId);
    if (receiverSocket) {
      receiverSocket.send(
        JSON.stringify({
          event: 'messageDeleted',
          data: {
            messageId: valid.messageId,
            userId: senderId,
            receiverId: receiverId,
          },
        })
      );
      console.log(`Notified receiver ${receiverId} of deleted message ${valid.messageId}`);
    } else {
      console.log(`Receiver ${receiverId} is offline, they will sync on next login`);
    }

    return { status: httpStatus.OK, message: 'delete message is successfully', data: null };
  }
}
