import { Router } from "express";
import {
  createPost,
  getPost,
  getFeed,
  deletePost,
  signUpload,
} from "../controllers/post-controller";
import { authenticate } from "../middleware/auth-middleware";

const postRouter = Router();

postRouter.post("/", authenticate, createPost);
postRouter.get("/", authenticate, getFeed);

postRouter.post("/media/sign-upload", authenticate, signUpload);

postRouter.get("/:id", authenticate, getPost);

postRouter.delete("/:id", authenticate, deletePost);

export default postRouter;
