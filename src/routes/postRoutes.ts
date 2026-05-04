import express from "express";
import { likeSchema, postCommentSchema, postSchema } from "../types/index.js";
import authenticateJwt from "../midlleware/authenticateJwt.js";
import { prisma } from "../db.js";
const postRouter = express.Router();

postRouter.post("/create", authenticateJwt, async (req, res) => {
  try {
    const parsedData = postSchema.safeParse(req.body);
    if (!parsedData.success)
      return res.status(400).send(parsedData.error.flatten());
    const { image, caption } = parsedData.data;
    const userId = req.userId;
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

postRouter.get("/feed", authenticateJwt, async (req, res) => {
  try {
    const feeds = await prisma.post.findMany({
      where: {
        user: {
          follower: {
            // follwingId:req.userId
            some: {
              followerId: req.userId,
            },
          },
        },
      },
      include: {
        user: true,
        likes: true,
        comments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return res.status(200).json({ message: "Feeds success", feeds });
  } catch (error) {
    res.status(500).json({ message: `Internal Server error ${error}` });
  }
});

postRouter.post("/like", authenticateJwt, async (req, res) => {
  try {
    const parsedData = likeSchema.safeParse(req.body);
    if (!parsedData.success) return res.status(400).send("Validation Error");
    const { postId } = parsedData.data;
    const userId = req.userId;
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
      return res.status(200).json({ message: "Like Removed" });
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
    const userId = req.userId;
    const succes = await prisma.post.deleteMany({
      //Prisma .delete() only accepts unique fields
      where: {
        id: postId,
        userId, // only the user can delte its post
      },
    });
    res.status(200).json({ message: "Post Delted", succes });
  } catch (error) {
    res.status(500).send(`Internla Server Error ${error}`);
  }
});

postRouter.post("/comment", authenticateJwt, async (req, res) => {
  try {
    const parsedData = postCommentSchema.safeParse(req.body);
    if (!parsedData.success)
      return res.status(400).json({
        message: `Please provid valid length comment ${parsedData.error.flatten()}`,
      });
    const { content, parentId, postId } = parsedData.data;
    console.log(content, parentId, req.userId, postId);
    const comment = await prisma.comment.create({
      data: {
        content,
        parentId: parentId || null, // the "" string is not valid for no realtion in databsae so null is the option if its a first comment
        userId: req.userId,
        postId,
      },
    });
    res.status(201).json({ message: "Comment Added" });
  } catch (error) {
    console.log(error);
    res.status(500).send(`Internal Server Error ${error}`);
  }
});

export default postRouter;
