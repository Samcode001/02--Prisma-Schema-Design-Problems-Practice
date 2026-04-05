import express from "express";
import { prisma } from "../db.js";
const userRouter = express.Router();
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { userSignupSchema } from "../types/index.js";
import authenticateJwt from "../midlleware/authenticateJwt.js";
const SECRET = process.env.JWT_SECRET!;

userRouter.post("/signup", async (req, res) => {
  try {
    const parsedData = userSignupSchema.safeParse(req.body);
    if (!parsedData.success)
      return res.status(401).send(parsedData.error.format());

    const { username, password } = req.body;

    const userExist = await prisma.user.findUnique({
      where: {
        username,
      },
    });
    if (userExist)
      return res.status(401).json({ message: "User Already Exist" });
    let hashedPassword = await bcrypt.hash(password, 10);
    //   hashedPassword = data;
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });
    const token = jwt.sign(user.id, SECRET);
    res.status(201).json({ message: "User Created", token });
  } catch (error) {
    res.status(500).send(`Internal Server Error ${error}`);
  }
});

userRouter.post("/signin", async (req, res) => {
  try {
    const parsedData = userSignupSchema.safeParse(req.body);
    if (!parsedData.success)
      return res.status(401).send(parsedData.error.flatten());

    const { username, password } = req.body;
    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!user) return res.status(404).json({ message: "Invalid Credentails" });
    // let validUser = false;
    const validUser = await bcrypt.compare(password, user.password);

    if (!validUser) res.status(401).json({ message: "Invalid Credentials" });
    const token = jwt.sign(user.id, SECRET);
    res.status(200).json({ messgae: "Logged In", token });
  } catch (error) {
    res.status(500).send(`Internal Server Error ${error}`);
  }
});

userRouter.post("/follow", authenticateJwt, async (req, res) => {
  try {
    const { followId } = req.body;
    const userId = req.headers.user as string;
    const followSuccess = await prisma.follow.create({
      data: {
        followerId: userId,
        followingId: followId,
      },
    });
    res.status(201).json({ message: "Follow Done", followSuccess });
  } catch (error) {
    res.status(500).send(`Internal Server Error`);
  }
});

export default userRouter;
