import express from "express";
import authenticateJwt from "../midlleware/authenticateJwt.js";
import { chatMessageSchema, chatSchema } from "../types/index.js";
import { prisma } from "../db.js";
const chatRouter = express.Router();

chatRouter.post("/conversations", authenticateJwt, async (req, res) => {
  try {
    const parsedData = chatSchema.safeParse(req.body);
    if (!parsedData.success) return res.status(400).send(`Validation error`);

    const { memberIds } = parsedData.data;
    const uniqueMembers = [...new Set([...memberIds, req.userId])];
    // memberIds.push(req.userId);

    const userIds = await prisma.user.findMany({
      where: {
        id: {
          in: uniqueMembers,
        },
      },
      select: {
        id: true,
      },
    });

    const validIds = userIds.length === uniqueMembers.length;
    if (!validIds) return res.status(403).send("Users not valid");

    const conversation = await prisma.conversation.create({
      data: {
        members: {
          create: uniqueMembers.map((id) => {
            return {
              userId: id,
            };
          }),
        },
      },
    });

    res.status(201).json({ message: "Conversation started", conversation });
  } catch (error) {
    res.status(500).send(`Internal Server error ${error}`);
  }
});

chatRouter.get("/conversations", authenticateJwt, async (req, res) => {
  try {
    // const result = await prisma.$transaction(async (tx) => {
    //   const conversations = await tx.conversation.findMany({
    //     where: {
    //       members: {
    //         some: {
    //           userId: req.userId,
    //         },
    //       },
    //     },
    //     select: {
    //       id: true,
    //       lastMessageId: true,
    //       name: true,
    //     },
    //   });

    //   if (!conversations)
    //     return res.status(403).send("Error In Making conversations");

    //   return conversations.forEach(async (conversation) => {
    //     return await tx.conversation.findMany({
    //       where: {
    //         id: conversation.id,
    //       },
    //       select: {
    //         messages: {
    //           where: {
    //             id: conversation.lastMessageId!,
    //           },
    //           select: {
    //             id: true,
    //             content: true,
    //             updatedAt: true,
    //             sender: {
    //               select: {
    //                 username: true,
    //               },
    //             },
    //           },
    //         },
    //       },
    //     });
    //   });
    // });

    const result = await prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId: req.userId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        updatedAt: true,
        members: {
          where: {
            userId: {
              not: req.userId,
            },
          },
          select: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        lastMessage: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            sender: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    res
      .status(200)
      .json({ message: "fetched convesations", conversations: result });
  } catch (error) {
    res.status(500).send(`Internal server Error ${error}`);
  }
});

chatRouter.post(
  "/conversations/:conversationId/messages",
  authenticateJwt,
  async (req, res) => {
    try {
      const parsedData = chatMessageSchema.safeParse(req.body);
      if (!parsedData.success)
        return res.status(400).json({
          message: "Validation error ",
          error: parsedData.error.flatten(),
        });

      const { content } = parsedData.data;
      const conversationId = req.params.conversationId! as string;

      const isUserChat = await prisma.chatMember.findUnique({
        where: {
          userId_conversationId: {
            userId: req.userId,
            conversationId,
          },
        },
      });

      if (!isUserChat) return res.status(403).send("Forbidden ");

      // const message = await prisma.message.create({
      //   data: {
      //     conversationId,
      //     content,
      //     userId: req.userId,
      //   },
      // });

      // const lastMessage = await prisma.conversation.update({
      //   where: {
      //     id: conversationId,
      //   },
      //   data: {
      //     lastMessageId: message.id,
      //   },
      // });

      // the above operation in dependent form with the transaction

      const result = await prisma.$transaction(async (tx) => {
        const message = await tx.message.create({
          data: {
            conversationId,
            content,
            userId: req.userId,
          },
        });

        if (!message.id) throw new Error("Error on creating message");

        await tx.conversation.update({
          where: {
            id: conversationId,
          },
          data: {
            lastMessageId: message.id,
          },
        });

        return message;
      });

      res
        .status(201)
        .json({ message: "message created succesfully", messageId: result.id });
    } catch (error) {
      res.status(500).send(`Internal Server Error ${error}`);
    }
  },
);

chatRouter.get(
  "/conversations/:conversationId/messages",
  authenticateJwt,
  async (req, res) => {
    try {
      const conversationId = req.params.conversationId! as string;
      const cursorId = req.query.cursorId! as string;

      const isUserPartOfChat = await prisma.chatMember.findUnique({
        where: {
          userId_conversationId: {
            userId: req.userId,
            conversationId,
          },
        },
      });

      if (!isUserPartOfChat) return res.status(403).send("Forbidden");

      const messages = await prisma.message.findMany({
        where: { conversationId },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        take: 20,
        orderBy: [
          {
            createdAt: "desc",
          },
          {
            id: "desc",
          },
        ],
        ...(cursorId && {
          cursor: { id: cursorId },
          skip: 1,
        }),
      });

      res.status(200).json({ message: "fetched succesfully", messages });
    } catch (error) {
      res.status(500).send(`Internal Server Error ${error}`);
    }
  },
);

// chatRouter.get("/allChats", authenticateJwt, async (req, res) => {
//   try {
//     const conversations = await prisma.conversation.findMany({
//       where: {
//         members: {
//           none: {
//             userId: req.userId,
//           },
//         },
//       },
//       select: {
//         lastMessageId: true,
//         name: true,
//       },
//     });
//     res
//       .status(200)
//       .json({ message: "Conversation fetced succefully", conversations });
//   } catch (error) {
//     res.status(500).send(`Internal Server error ${error}`);
//   }
// });

// chatRouter.get("/messagesInfo", authenticateJwt, async (req, res) => {
//   try {
//     const messagesWithInfo = await prisma.message.findMany({
//       select: {
//         sender: true,
//       },
//     });
//     res
//       .status(200)
//       .json({ message: "Conversation fetced succefully", messagesWithInfo });
//   } catch (error) {
//     res.status(500).send(`Internal Server error ${error}`);
//   }
// });

export default chatRouter;
