import z, { string } from "zod";

export const userSignupSchema = z.object({
  username: z.string().min(2).max(100),
  password: z.string().min(4).max(100),
});
