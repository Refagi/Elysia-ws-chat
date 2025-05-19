import type { ElysiaWebSocket, DataBroadcast } from '../models/ws.model';

// export const connectedUsers = new Map<string, any>();
// export function broadcastMessage(message: any, excludeWs?: any) {
//     for (const [_, ws] of connectedUsers.entries()) {
//         if (ws && ws !== excludeWs) {
//             ws.send(message);
//         }
//     }
// }

// Fungsi untuk mengirim daftar user online ke semua client
export function broadcastEvent(event: string, data: DataBroadcast) {
    Object.values(userSocketMap).forEach((ws: ElysiaWebSocket) => {
      try {
        ws.send(JSON.stringify({
          event: event,
          data: data,
        }));
      } catch (err) {
        console.error(`Failed to broadcast ${event} to a client:`, err);
        const userId = ws.data.userId;
        if (userId) {
          delete userSocketMap[userId];
        }
      }
    });
  }

// Map untuk menyimpan hubungan antara userId dan WebSocket
export const userSocketMap: { [userId: string]: ElysiaWebSocket } = {};

// Fungsi untuk mendapatkan socket dari userId
export function getReceiverSocket(userId: string): ElysiaWebSocket | undefined {
  return userSocketMap[userId];
}