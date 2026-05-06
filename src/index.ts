import express from "express";
import cors from "cors";

import userRouter from "./routes/userRoutes.js";
import postRouter from "./routes/postRoutes.js";
import chatRouter from "./routes/chatRoutes.js";

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send(`<h1>Healthy</h2>`);
});

app.use("/api/user", userRouter);
app.use("/api/post", postRouter);
app.use("/api/chat", chatRouter);

app.listen(3000, () => {
  console.log("running 3000");
});
