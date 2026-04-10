import "express";
// this file makes the req.userId viable to the core of express types ,which will be later used in routers request
declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}
