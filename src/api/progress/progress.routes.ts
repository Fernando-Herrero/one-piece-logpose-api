import { Router } from "express";
import { checkAuth } from "../auth/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as progressController from "./progress.controller.js";
import { completeEpisodeParamSchema } from "./progress.schemas.js";

export const progressRoutes = Router();

const withEpisodeId = validate(completeEpisodeParamSchema, "params");

progressRoutes.get("/me", [checkAuth], progressController.getMe);
progressRoutes.delete("/me", [checkAuth], progressController.resetMe);
progressRoutes.post(
    "/me/episodes/:episodeId/complete",
    [checkAuth, withEpisodeId],
    progressController.completeEpisode
);
progressRoutes.delete(
    "/me/episodes/:episodeId/complete",
    [checkAuth, withEpisodeId],
    progressController.uncompleteEpisode
);
