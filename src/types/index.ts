import { Request } from "express";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  color: string;
}

export interface Document {
  id: string;
  title: string;
  roomId: string;
  createdBy: string;
  collaborators: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
