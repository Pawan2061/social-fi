import { Router } from "express";
import { updateMediaUrl } from "../controllers/media-controller";

const mediaRouter = Router();

mediaRouter.post("/transcoded", updateMediaUrl);

export default mediaRouter;
