import z, { string } from "zod";

export const userSignupSchema = z.object({
  username: z.string().min(2).max(100),
  password: z.string().min(4).max(100),
});

export const postSchema = z.object({
  image: z.string().min(2),
  caption: z.string(),
});

export const postCommentSchema = z.object({
  content: z.string().min(1).max(200),
  parentId: z.string(),
  postId: z.string().min(1),
});

export const followSchema = z.object({
  followId: z.string().min(2),
});

export const likeSchema = z.object({
  postId: z.string().min(2),
});
