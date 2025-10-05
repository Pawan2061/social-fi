import express from "express";
import dotenv from "dotenv";
import authRouter from "./routes/auth-route";
import cors from "cors";
import postRouter from "./routes/post-routes";
import passRouter from "./routes/pass-route";
import claimRouter from "./routes/claim-routes";
import voteRouter from "./routes/vote-route";
import userRouter from "./routes/user-route";
import mediaRouter from "./routes/media-route";

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 4000;

app.use(express.json());

const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/posts", postRouter);
apiRouter.use("/pass", passRouter);
apiRouter.use("/claim", claimRouter);
apiRouter.use("/votes", voteRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/media", mediaRouter);

app.use("/api", apiRouter);

app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
