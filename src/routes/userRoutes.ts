import express from "express";
import { prisma } from "../db.js";
const userRouter = express.Router();
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { followSchema, userSignupSchema } from "../types/index.js";
import authenticateJwt from "../midlleware/authenticateJwt.js";
const SECRET = process.env.JWT_SECRET!;

userRouter.post("/signup", async (req, res) => {
  try {
    const parsedData = userSignupSchema.safeParse(req.body);
    if (!parsedData.success)
      return res.status(400).send(parsedData.error.format());

    const { username, password } = parsedData.data;

    const userExist = await prisma.user.findUnique({
      where: {
        username,
      },
    });
    if (userExist)
      return res.status(403).json({ message: "User Already Exist" });
    let hashedPassword = await bcrypt.hash(password, 10);
    //   hashedPassword = data;
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });
    const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: "7d" }); //signa lways in object form with key
    res.status(201).json({ message: "User Created", token });
  } catch (error) {
    res.status(500).send(`Internal Server Error ${error}`);
  }
});

userRouter.post("/signin", async (req, res) => {
  try {
    const parsedData = userSignupSchema.safeParse(req.body);
    if (!parsedData.success)
      return res.status(400).send(parsedData.error.flatten());

    const { username, password } = parsedData.data;
    const user = await prisma.user.findUnique({
      where: {
        username,
      },
    });

    if (!user) return res.status(404).json({ message: "Invalid Credentails" });
    // let validUser = false;
    const validUser = await bcrypt.compare(password, user.password);

    if (!validUser)
      return res.status(403).json({ message: "Invalid Credentials" });
    const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: "7d" }); // should be given as object value with  key
    res.status(200).json({ messgae: "Logged In", token });
  } catch (error) {
    res.status(500).send(`Internal Server Error ${error}`);
  }
});

userRouter.post("/follow", authenticateJwt, async (req, res) => {
  try {
    const parsedData = followSchema.safeParse(req.body);
    if (!parsedData.success)
      return res.status(400).send("Plase provide valid Id");
    const { followId } = parsedData.data;
    const userId = req.userId;
    if (followId === userId)
      return res.status(403).send(" User cant follow itself");
    console.log(userId);
    const alreadyFollowed = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: followId,
        },
      },
    });
    if (alreadyFollowed) {
      const unfollowSuccess = await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: followId,
          },
        },
      });

      return res
        .status(201)
        .json({ message: "User Unfollowed", unfollowSuccess });
    }
    const followSuccess = await prisma.follow.create({
      data: {
        followerId: userId,
        followingId: followId,
      },
    });
    res.status(201).json({ message: "Follow Done", followSuccess });
  } catch (error) {
    res.status(500).send(`Internal Server Error ${error}`);
  }
});

userRouter.get("/profile", authenticateJwt, async (req, res) => {
  try {
    // const posts = await prisma.post.findMany({  // can provide only single seprate values
    //   where: {
    //     userId: req.userId,
    //   },
    // });

    // const followParameters = await prisma.user.findMany({  // this is wrong its gets all the users data ther follower and following
    //   select: {
    //     follower: true,
    //     following: true,
    //   },
    // });

    // const followings = await prisma.user.findUnique({ // this will provide the data
    //   where: {
    //     id: req.userId,
    //   },
    //   include: {
    //     posts: true,
    //     follower: true,
    //     following: true,
    //   },
    // });

    // this will proivde the data as well only counts for true values
    const followings = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        posts: true,
        _count: {
          select: {
            follower: true,
            following: true,
          },
        },
      },
    });
    res.status(200).json({ message: "fetched Successfully", followings });
  } catch (error) {
    console.log(error);
    res.status(500).send(`Internal Server Error`);
  }
});

export default userRouter;
