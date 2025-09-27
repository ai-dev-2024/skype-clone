import { Request } from 'express';
import { User, Message, Group, Call, Contact, ApiResponse, PaginationParams, PaginatedResponse } from '@skype-clone/shared';
import { IUserDocument } from '../models/User';

// Re-export shared types
export type { User, Message, Group, Call, Contact, ApiResponse, PaginationParams, PaginatedResponse };

export interface AuthRequest extends Request {
  user?: IUserDocument;
}
