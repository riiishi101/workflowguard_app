import { Request } from 'express';

export interface JwtPayload {
  sub?: string;
  id?: string;
  userId?: string;
  email: string;
}

export interface RequestWithUser extends Request {
  user: JwtPayload;
}
