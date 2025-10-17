// routes/websocket.routes.ts
import { Elysia } from 'elysia';
import { WebSocketConfig } from '../../config/websocket';
import { userSocketMap, getReceiverSocket, broadcastEvent } from '../../utils/websocket.utils';
import type { ElysiaWebSocket, DataBroadcast } from '../../models/ws.model';
import { ApiError } from '../../utils/ApiError';
import httpStatus from 'http-status';
import { AuthHandler } from '../../middlewares/auth';
import { MessageController } from '../../controllers/message.controller'
import services from '../../services/index'


const authHandler = new AuthHandler();

export const websocketRoutes = new Elysia()
  .get('/ws-info', WebSocketConfig.getWebSocketInfo, {
    detail: {
      tags: ['WebSocket'],
      summary: 'Get WebSocket connection information',
      description: 'Returns WebSocket URL and message format examples',
    },
  })
  .ws('/ws', {
    async open(ws: ElysiaWebSocket) {
      try {
        const auth = await authHandler.authenticateWebsocket(ws.data.query);
        const userId = auth.id;
        ws.data.userId = userId;
        userSocketMap[userId] = ws;
        console.log(`User connected: ${userId}, Online users:`, Object.keys(userSocketMap));

        // Kirim daftar user online ke semua client
        broadcastOnlineUsers();

        // Kirim pesan tertunda (jika ada) ke user yang baru online
        await sendPendingMessages(userId, ws);
      } catch (err) {
        console.error('WebSocket authentication failed:', err);
        ws.send(JSON.stringify({ error: err instanceof ApiError ? err.message : 'Authentication failed' }));
        ws.close();
      }
    },
    close(ws: ElysiaWebSocket) {
      const userId = ws.data.userId;
      if (userId) {
        delete userSocketMap[userId];
        console.log(`User disconnected: ${userId}, Online users:`, Object.keys(userSocketMap));
        broadcastOnlineUsers();
      }
    },
    async message(ws: ElysiaWebSocket, message: unknown) {
      try {
        const data = typeof message === 'string' ? JSON.parse(message) : message;

        if (data.event === 'newMessage') {
          const { receiverId, content, image } = data.data;
          if (!receiverId || !content) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'receiverId and content are required');
          }

          const senderId = ws.data.userId;
          if (!senderId) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
          }

          // Simpan pesan ke database
          const messageData = await MessageController.sendMessage({
            body: {
              text: content, 
              image: image || undefined,
              receiverId: receiverId,
            },
            request: { headers: new Headers({ Authorization: `Bearer ${ws.data.query.token}` }) } as any,
          });

          const savedMessage = messageData.data;

          // Coba kirim pesan ke penerima jika online
          const receiverSocket = getReceiverSocket(receiverId);
          if (receiverSocket) {
            receiverSocket.send(JSON.stringify({
              event: 'newMessage',
              data: savedMessage,
            }));
            console.log(`Sent message from ${senderId} to ${receiverId}`);
          } else {
            console.log(`Receiver ${receiverId} is offline, message saved to database`);
          }

          // Kirim konfirmasi ke pengirim
          ws.send(JSON.stringify({
            event: 'messageSent',
            data: savedMessage,
          }));
        } else if (data.event === 'messageDeleted') {
          const { messageId } = data.data;
          if (!messageId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'messageId is required');
          }

          const senderId = ws.data.userId;
          if (!senderId) {
            throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
          }

          // Ambil data pesan untuk mendapatkan receiverId
          const message = await services.messageService.getMessageById(messageId);
          if (!message) {
            throw new ApiError(httpStatus.NOT_FOUND, 'Message not found');
          }
          const receiverId = message.receiverId as string;

          // Hapus pesan dari database
          const result = await services.messageService.deleteMessage(messageId, senderId);
          if (!result) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Failed to delete message');
          }

          // Kirim event messageDeleted ke pengirim
          const senderSocket = getReceiverSocket(senderId);
          if (senderSocket) {
            senderSocket.send(JSON.stringify({
              event: 'messageDeleted',
              data: {
                messageId: messageId,
                userId: senderId,
                receiverId: receiverId,
              },
            }));
            console.log(`Notified sender ${senderId} of deleted message ${messageId}`);
          }

          // Kirim event messageDeleted ke penerima
          const receiverSocket = getReceiverSocket(receiverId);
          if (receiverSocket) {
            receiverSocket.send(JSON.stringify({
              event: 'messageDeleted',
              data: {
                messageId: messageId,
                userId: senderId,
                receiverId: receiverId,
              },
            }));
            console.log(`Notified receiver ${receiverId} of deleted message ${messageId}`);
          } else {
            console.log(`Receiver ${receiverId} is offline, they will sync on next login`);
          }
        }
      } 
      catch (err) {
        console.error('Error processing WebSocket message:', err);
        ws.send(JSON.stringify({
          error: err instanceof ApiError ? err.message : 'Failed to process message',
        }));
      }
    },
  });

export function broadcastOnlineUsers() {
  const onlineUsers = Object.keys(userSocketMap);
  broadcastEvent('getOnlineUsers', {userId: onlineUsers});
}

// function broadcastOnlineUsers() {
//   const onlineUsers = Object.keys(userSocketMap);
//   Object.values(userSocketMap).forEach((ws) => {
//     try {
//       ws.send(JSON.stringify({
//         event: 'getOnlineUsers',
//         data: onlineUsers,
//       }));
//     } catch (err) {
//       console.error('Failed to broadcast to a client:', err);
//       const userId = ws.data.userId;
//       if (userId) {
//         delete userSocketMap[userId];
//       }
//     }
//   });
// }

// Fungsi untuk mengirim pesan tertunda ke user yang baru online
async function sendPendingMessages(userId: string, ws: ElysiaWebSocket) {
  try {
    // Ambil semua user lain yang pernah berkomunikasi dengan user ini
    const onlineUsers = Object.keys(userSocketMap).filter((id) => id !== userId);
    const recentMessages: any[] = [];

    // Untuk setiap user lain, ambil pesan terbaru
    for (const otherUserId of onlineUsers) {
      const messages = await MessageController.getRecentMessage({
        params: { receiverId: otherUserId },
        request: { headers: new Headers({ Authorization: `Bearer ${ws.data.query.token}` }) } as Request,
      });
      if (messages.data && messages.data.length > 0) {
        recentMessages.push(...messages.data);
      }
    }

    // Kirim pesan terbaru ke user
    for (const message of recentMessages) {
      ws.send(JSON.stringify({
        event: 'newMessage',
        data: message,
      }));
    }
    console.log(`Sent ${recentMessages.length} recent messages to user ${userId}`);
  } catch (err) {
    console.error(`Failed to send recent messages to user ${userId}:`, err);
  }
}