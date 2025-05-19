import { Elysia, t } from "elysia";
import { MessageController } from "../../controllers/message.controller";

export const messageRoutes = new Elysia({prefix: '/messages'})
  .get("/recentMessages/:receiverId", MessageController.getRecentMessage, {
    detail: {
      tags: ["Messages"],
      summary: "Get recent messages",
      description: "Retrieve recent chat messages from the database",
    },
  })
  .get("/lastMessage/:receiverId", MessageController.getLastMessage, {
    detail: {
      tags: ["Messages"],
      summary: "Get last messages",
      description: "Retrieve last chat messages from the database",
    },
  })
  .post("/sendMessage/:userId", MessageController.sendMessage, {
    detail: {
      tags: ["Messages"],
      summary: "Send a new message",
      description:
        "Send a message through REST API (will be broadcast to WebSocket clients)",
    },
  })
  .delete("/deleteMessage/:messageId", MessageController.deleteMessage, {
    detail: {
      tags: ["Messages"],
      summary: "delete message",
      description:
        "Delete message through REST API (will be broadcast to WebSocket clients)",
    },
  })
