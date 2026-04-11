import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
const SECRET = process.env.JWT_SECRET!;

const authenticateJwt = (req: Request, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: "Not Authorised" });
    const token = header.split(" ")[1]!;
    // console.log(token);
    const decoded = jwt.verify(token, SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(500).send(`Internal Server Error ${error}`);
  }
};

export default authenticateJwt;
