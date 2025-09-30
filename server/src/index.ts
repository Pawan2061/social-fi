import express from "express";
import dotenv from "dotenv";
import authRouter from "./routes/auth-route";
import cors from "cors";
import postRouter from "./routes/post-routes";

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 4000;

app.use(express.json());

app.use("/auth", authRouter);
app.use("/posts", postRouter);

app.get("/", (req, res) => {
  res.send("🚀 API is running...");
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
