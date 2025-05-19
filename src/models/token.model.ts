export interface PayloadType {
  sub: string;
  iat: number;
  exp: number;
  type: string;
  [key: string]: string | number;
}

export interface Token {
  id: string;
  userId: string,
  token: string,
  type: string,
  expires: Date,
  createdAt: Date;
}