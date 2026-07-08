import { Response } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendError, sendSuccess } from "../../utils/response.utils.js";
import type { AuthRequest } from "../auth/auth.types.js";
import { User } from "../users/users.model.js";
import { isProgressGreater, mergeUnlockedCards } from "../cards/catalog.js";
import type { CompleteEpisodeInput, UpdateProgressInput } from "./progress.schemas.js";

async function loadAuthUser(userId: string) {
    const user = await User.findById(userId);
    if (!user) return null;
    return user;
}

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const user = await loadAuthUser(req.user.id);
    if (!user) return sendError(res, "No authorized, no user found", 401);

    return sendSuccess(res, {
        serieProgress: user.serieProgress,
        experience: user.experience,
    });
});

export const updateMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const user = await loadAuthUser(req.user.id);
    if (!user) return sendError(res, "No authorized, no user found", 401);

    const payload = req.body as UpdateProgressInput;

    if (payload.serieProgress) {
        user.serieProgress = { ...user.serieProgress, ...payload.serieProgress };
    }

    if (payload.experience !== undefined) {
        user.experience = payload.experience;
    }

    await user.save();

    return sendSuccess(res, {
        serieProgress: user.serieProgress,
        experience: user.experience,
    });
});

export const completeEpisode = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const user = await loadAuthUser(req.user.id);
    if (!user) return sendError(res, "No authorized, no user found", 401);

    const episodeId = Number(req.params.episodeId);
    const payload = req.body as CompleteEpisodeInput;

    if (user.completedEpisodes.includes(episodeId)) {
        return sendSuccess(res, {
            serieProgress: user.serieProgress,
            experience: user.experience,
            newlyUnlocked: {
                characters: [],
                items: [],
                fruits: [],
                swords: [],
                boats: [],
            },
        });
    }

    const nextProgress = {
        saga: payload.sagaId,
        arc: payload.arcId,
        episode: episodeId,
    };

    if (isProgressGreater(user.serieProgress, nextProgress)) {
        user.serieProgress = nextProgress;
    }

    user.experience += payload.experienceGain;
    user.completedEpisodes.push(episodeId);

    const { merged, newlyUnlocked } = mergeUnlockedCards(user.unlockedCards, payload.cardsToUnlock);
    user.unlockedCards = merged;

    await user.save();

    return sendSuccess(res, {
        serieProgress: user.serieProgress,
        experience: user.experience,
        newlyUnlocked,
    });
});

export const resetMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const user = await loadAuthUser(req.user.id);
    if (!user) return sendError(res, "No authorized, no user found", 401);

    user.serieProgress = { saga: 0, arc: 0, episode: 0 };
    user.experience = 0;
    user.completedEpisodes = [];
    user.unlockedCards = {
        characters: [],
        items: [],
        fruits: [],
        swords: [],
        boats: [],
    };

    await user.save();

    return sendSuccess(res, {
        serieProgress: user.serieProgress,
        experience: user.experience,
        unlockedCards: user.unlockedCards,
    });
});
