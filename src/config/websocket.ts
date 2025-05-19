export class WebSocketConfig {
  static getWebSocketInfo() {
    return {
      websocketUrl: 'ws://localhost:3000/ws',
      messageFormats: {
        join: { type: 'join', username: 'string'},
        message: { type: 'message', username: 'string', content: 'string' },
        leave: { type: 'leave', username: 'string' }
      }
    };
  }
}
