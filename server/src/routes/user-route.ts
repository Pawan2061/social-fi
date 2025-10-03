import { Router } from "express";
import { authenticate } from "../middleware/auth-middleware";
import {
  getMyProfile,
  getUserProfile,
  onboardUser,
  updateMyProfile,
} from "../controllers/user-controller";
import { signProfilePictureUpload } from "../controllers/user-profile-picture-controller";
import { validateData } from "../middleware/validation-middleware";
import { updateMyProfileSchema, onboardUserSchema } from "../zod/user-schema";

const userRouter = Router();

userRouter.get("/me", authenticate, getMyProfile);

userRouter.put(
  "/me",
  authenticate,
  validateData(updateMyProfileSchema),
  updateMyProfile
);

userRouter.post(
  "/onboard",
  authenticate,
  validateData(onboardUserSchema),
  onboardUser
);

userRouter.post(
  "/profile-picture/sign-upload",
  authenticate,
  signProfilePictureUpload
);
userRouter.get("/:id", authenticate, getUserProfile);

export default userRouter;
