export interface GetMessage {
  receiverId: string;
}

export interface SendMessage {
  text?: string;
  image?: string;
  receiverId: string;
}

export interface DeleteMessage {
  messageId: string
  senderId: string;
}