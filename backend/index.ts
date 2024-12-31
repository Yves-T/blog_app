import express, { Express, NextFunction, Response, Request } from "express";
import userRouter from "@routes/user.route";
import postRouter from "@routes/post.route";
import commentRouter from "@routes/comment.route";
import webHookRouter from "@routes/webhook.route";
import dbConnect from "@lib/conntectDb";
import { clerkMiddleware } from "@clerk/express";
import { AuthRequest } from "@interface/auth.interface";
import cors from "cors";

const app: Express = express();
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(
  clerkMiddleware({
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  }),
);
app.use("/webhooks", webHookRouter);
app.use(express.json());

app.use(function (req: Request, res: Response, next: NextFunction) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  next();
});

const port = process.env.PORT || 3000;

app.get("/protect", (req: AuthRequest, res: Response) => {
  const { userId } = req.auth!;
  if (!userId) {
    return res.status(401).json("Not authenticated");
  }
  res.status(200).json("content");
  return;
});

app.use("/users", userRouter);
app.use("/posts", postRouter);
app.use("/comments", commentRouter);

const errorRequestHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  res.status(error.status || 500);
  res.json({
    message: error.message,
    status: error.status,
    stack: error.stack,
  });
};

app.use(errorRequestHandler);

app.listen(port, () => {
  dbConnect();

  console.log(`[server]: Server is running at http://localhost:${port}`);
});
