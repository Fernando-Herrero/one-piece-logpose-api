import { Router } from "express";
import { checkAuth } from "../auth/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as progressController from "./progress.controller.js";
import {
    completeEpisodeParamSchema,
    completeEpisodeSchema,
    updateProgressSchema,
} from "./progress.schemas.js";

export const progressRoutes = Router();

const withCompleteEpisode = validate(completeEpisodeSchema);
const withEpisodeId = validate(completeEpisodeParamSchema, "params");
const withUpdateProgress = validate(updateProgressSchema);

progressRoutes.get("/me", [checkAuth], progressController.getMe);
progressRoutes.patch("/me", [checkAuth, withUpdateProgress], progressController.updateMe);
progressRoutes.delete("/me", [checkAuth], progressController.resetMe);
progressRoutes.post(
    "/me/episodes/:episodeId/complete",
    [checkAuth, withEpisodeId, withCompleteEpisode],
    progressController.completeEpisode
);
