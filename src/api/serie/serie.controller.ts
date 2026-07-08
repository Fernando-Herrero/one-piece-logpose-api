import { Response } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendError, sendSuccess } from "../../utils/response.utils.js";
import {
    getArcById,
    getArcsBySagaId,
    getEpisodeById,
    getEpisodesByArcId,
    getSagaById,
    getSagasData,
} from "./serie-data.js";

export const listSagas = asyncHandler(async (_req, res: Response) => {
    const sagas = getSagasData();
    return sendSuccess(res, { sagas, total: sagas.length });
});

export const listArcsBySaga = asyncHandler(async (req, res: Response) => {
    const sagaId = Number(req.params.sagaId);
    const saga = getSagaById(sagaId);

    if (!saga) return sendError(res, "Saga not found", 404);

    const arcs = getArcsBySagaId(sagaId);
    return sendSuccess(res, { sagaId, arcs, total: arcs.length });
});

export const listEpisodesByArc = asyncHandler(async (req, res: Response) => {
    const arcId = Number(req.params.arcId);
    const arc = getArcById(arcId);

    if (!arc) return sendError(res, "Arc not found", 404);

    const episodes = getEpisodesByArcId(arcId) ?? [];
    return sendSuccess(res, { arcId, episodes, total: episodes.length });
});

export const getEpisode = asyncHandler(async (req, res: Response) => {
    const episode = getEpisodeById(Number(req.params.episodeId));

    if (!episode) return sendError(res, "Episode not found", 404);

    return sendSuccess(res, episode);
});
