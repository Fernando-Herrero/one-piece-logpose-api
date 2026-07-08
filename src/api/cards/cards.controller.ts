import { Response } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendError, sendSuccess } from "../../utils/response.utils.js";
import { User } from "../users/users.model.js";
import type { AuthRequest } from "../auth/auth.types.js";
import {
    buildCollectionStats,
    getCatalogByType as getCatalogCardsByType,
    getCatalogData,
    getCatalogTotals,
    isValidCardType,
} from "./catalog.js";

export const getCatalog = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const catalog = getCatalogData();
    return sendSuccess(res, { ...catalog, totals: getCatalogTotals() });
});

export const getCatalogByType = asyncHandler(async (req: AuthRequest, res: Response) => {
    const type = req.params.type as string;

    if (!isValidCardType(type)) return sendError(res, "Tipo de carta no válido", 400);

    const cards = getCatalogCardsByType(type);
    return sendSuccess(res, { type, cards, total: cards.length });
});

export const getMyCollection = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, "No authorized, no user found", 401);

    return sendSuccess(res, buildCollectionStats(user.unlockedCards));
});

export const getMyCollectionByType = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const type = req.params.type as string;
    if (!isValidCardType(type)) return sendError(res, "Tipo de carta no válido", 400);

    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, "No authorized, no user found", 401);

    const { unlocked } = buildCollectionStats(user.unlockedCards);

    return sendSuccess(res, { type, cards: unlocked[type], total: unlocked[type].length });
});

export const getUserCollection = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const user = await User.findById(req.params.userId);
    if (!user) return sendError(res, "Usuario no encontrado", 404);

    return sendSuccess(res, buildCollectionStats(user.unlockedCards));
});
