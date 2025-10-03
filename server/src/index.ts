import express from "express";
import dotenv from "dotenv";
import authRouter from "./routes/auth-route";
import cors from "cors";
import postRouter from "./routes/post-routes";
import passRouter from "./routes/pass-route";
import claimRouter from "./routes/claim-routes";
import voteRouter from "./routes/vote-route";
import userRouter from "./routes/user-route";

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 4000;

app.use(express.json());

app.use("/auth", authRouter);
app.use("/posts", postRouter);
app.use("/pass", passRouter);
app.use("/claim", claimRouter);
app.use("/votes", voteRouter);
app.use("/users", userRouter);

app.get("/", (req, res) => {
  res.send("🚀 API is running...");
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
