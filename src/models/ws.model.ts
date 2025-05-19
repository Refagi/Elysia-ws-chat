export interface ElysiaWebSocket {
  id: string;
  send: (data: string | Buffer | ArrayBuffer | Buffer[]) => void;
  close: () => void;
  data: {
    query: Record<string, string | undefined>;
    userId?: string;
    profilePic?: string;
  };
}

export interface DataBroadcast {
  query?: Record<string, string | undefined | string[]>;
  userId?: string[] | string;
  messageId?: string;
  profilePic?: string;
  username?: string;
  bio?: string;
  text?: string;
}