import { Router } from "express";
import { authenticate } from "../middleware/auth-middleware";
import {
  getMyProfile,
  getUserProfile,
  onboardUser,
  updateMyProfile,
} from "../controllers/user-controller";
import { signProfilePictureUpload } from "../controllers/user-profile-picture-controller";

const userRouter = Router();

userRouter.get("/me", authenticate, getMyProfile);

userRouter.put("/me", authenticate, updateMyProfile);
userRouter.post("/onboard", authenticate, onboardUser);

userRouter.post(
  "/profile-picture/sign-upload",
  authenticate,
  signProfilePictureUpload
);
userRouter.get("/:id", authenticate, getUserProfile);

export default userRouter;
