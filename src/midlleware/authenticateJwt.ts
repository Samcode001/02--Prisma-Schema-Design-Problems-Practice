import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
const SECRET = process.env.JWT_SECRET!;

const authenticateJwt = (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: "Not Authorised" });
    const token = header.split(" ")[1]!;
    const decoded = jwt.verify(token, SECRET) as string;
    console.log(decoded);
    req.userId = decoded;
    next();
  } catch (error) {
    res.status(500).send(`Internal Server Error`);
  }
};

export default authenticateJwt;
