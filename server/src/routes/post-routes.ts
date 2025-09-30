import { Router } from "express";
import {
  createPost,
  getPost,
  getFeed,
  deletePost,
  signUpload,
  finishUpload,
} from "../controllers/post-controller";
import { authenticate } from "../middleware/auth-middleware";

const postRouter = Router();

postRouter.post("/", authenticate, createPost);

postRouter.get("/:id", authenticate, getPost);

postRouter.get("/", authenticate, getFeed);

postRouter.delete("/:id", authenticate, deletePost);

postRouter.post("/media/sign-upload", authenticate, signUpload);
postRouter.post("/media/finish-upload", authenticate, finishUpload);

export default postRouter;
