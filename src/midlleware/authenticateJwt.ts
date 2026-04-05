import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
const SECRET = process.env.JWT_SECRET!;

const authenticateJwt = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]!;
    const success = jwt.verify(token, SECRET, (err, user) => {
      if (err) return res.status(401).send("Unauthorised");
      req.headers.user = user as string;
      next();
    });
  } catch (error) {
    res.status(500).send(`Internal Server Error`);
  }
};

export default authenticateJwt;
