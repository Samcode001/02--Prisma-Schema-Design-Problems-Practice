import express from "express";
import { postSchema } from "../types/index.js";
import authenticateJwt from "../midlleware/authenticateJwt.js";
import { prisma } from "../db.js";
const postRouter = express.Router();

postRouter.post("/create", authenticateJwt, async (req, res) => {
  try {
    const parsedData = postSchema.safeParse(req.body);
    if (!parsedData.success)
      return res.status(401).send(parsedData.error.flatten());
    const { image, caption } = req.body;
    const userId = req.headers.user! as string;
    const post = await prisma.post.create({
      data: {
        Image: image,
        caption,
        userId,
      },
    });

    res.status(201).json({ message: "Post Created", postId: post.id });
  } catch (error) {
    res.status(500).send(`Internal Server Error ${error}`);
  }
});

postRouter.post("/like", authenticateJwt, async (req, res) => {
  try {
    const { postId } = req.body;
    const userId = req.headers.user as string;
    const alreadyLiked = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (alreadyLiked) {
      const likeRemoved = await prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
      return res.status(201).json({ message: "Like Removed" });
    }
    const postLiked = await prisma.like.create({
      data: {
        postId,
        userId,
      },
    });

    res.status(201).json({ message: "PostLiked" });
  } catch (error) {
    res.status(500).send(`Internal Server Error  ${error}`);
  }
});

postRouter.delete("/delete", authenticateJwt, async (req, res) => {
  try {
    const { postId } = req.body;
    const succes = await prisma.post.delete({
      where: {
        id: postId,
      },
    });
    res.status(201).json({ message: "Post Delted", succes });
  } catch (error) {
    res.status(500).send(`Internla Server Error ${error}`);
  }
});

export default postRouter;
