import { Router } from "express";
import { validate } from "../../middlewares/validate.middleware.js";
import * as serieController from "./serie.controller.js";
import { arcIdParamSchema, episodeIdParamSchema, sagaIdParamSchema } from "./serie.schemas.js";

export const serieRoutes = Router();

serieRoutes.get("/sagas", serieController.listSagas);
serieRoutes.get("/sagas/:sagaId/arcs", [validate(sagaIdParamSchema, "params")], serieController.listArcsBySaga);
serieRoutes.get("/arcs/:arcId/episodes", [validate(arcIdParamSchema, "params")], serieController.listEpisodesByArc);
serieRoutes.get("/episodes/:episodeId", [validate(episodeIdParamSchema, "params")], serieController.getEpisode);
