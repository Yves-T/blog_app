import { Request } from "express";

export interface AuthRequest extends Request {
  auth?: {
    userId: string;
    sessionClaims: {
      metadata: { role: string };
    };
  };
}
