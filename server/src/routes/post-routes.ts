import { Router } from "express";
import {
  createPost,
  getPost,
  getFeed,
  deletePost,
  signUpload,
} from "../controllers/post-controller";
import { authenticate } from "../middleware/auth-middleware";
import { validateData } from "../middleware/validation-middleware";
import { createPostSchema, signUploadSchema } from "../zod/post-schema";
const postRouter = Router();

postRouter.post("/", authenticate, validateData(createPostSchema), createPost);
postRouter.get("/", authenticate, getFeed);

postRouter.post(
  "/media/sign-upload",
  authenticate,
  validateData(signUploadSchema),
  signUpload
);

postRouter.get("/:id", authenticate, getPost);

postRouter.delete("/:id", authenticate, deletePost);

export default postRouter;
