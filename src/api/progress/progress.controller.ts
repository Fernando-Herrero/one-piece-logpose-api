import { Response } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendError, sendSuccess } from "../../utils/response.utils.js";
import type { AuthRequest } from "../auth/auth.types.js";
import { User } from "../users/users.model.js";
import { getEpisodeById } from "../serie/serie-data.js";
import {
    getFrontierEpisodeId,
    getNextEpisodeId,
    newlyUnlockedFromEpisode,
    rebuildFromCompletedEpisodes,
} from "./progress.helpers.js";

async function loadAuthUser(userId: string) {
    const user = await User.findById(userId);
    if (!user) return null;
    return user;
}

function progressPayload(user: NonNullable<Awaited<ReturnType<typeof loadAuthUser>>>) {
    return {
        serieProgress: user.serieProgress,
        experience: user.experience,
        completedEpisodes: user.completedEpisodes,
        nextEpisodeId: getNextEpisodeId(user.completedEpisodes),
        frontierEpisodeId: getFrontierEpisodeId(user.completedEpisodes),
        unlockedCards: user.unlockedCards,
    };
}

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const user = await loadAuthUser(req.user.id);
    if (!user) return sendError(res, "No authorized, no user found", 401);

    return sendSuccess(res, progressPayload(user));
});

export const completeEpisode = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const user = await loadAuthUser(req.user.id);
    if (!user) return sendError(res, "No authorized, no user found", 401);

    const episodeId = Number(req.params.episodeId);
    const episode = getEpisodeById(episodeId);

    if (!episode) return sendError(res, "Episodio no encontrado", 404);

    if (user.completedEpisodes.includes(episodeId)) {
        return sendSuccess(res, {
            ...progressPayload(user),
            newlyUnlocked: {
                characters: [],
                items: [],
                fruits: [],
                swords: [],
                boats: [],
            },
            rewards: {
                experienceGain: 0,
                cardsToUnlock: episode.achievements,
            },
        });
    }

    const nextEpisodeId = getNextEpisodeId(user.completedEpisodes);
    if (episodeId !== nextEpisodeId) {
        return sendError(
            res,
            `Debes completar el episodio ${nextEpisodeId} antes de marcar el ${episodeId}.`,
            400
        );
    }

    const previousCards = { ...user.unlockedCards };
    const newlyUnlocked = newlyUnlockedFromEpisode(previousCards, episodeId);

    const rebuilt = rebuildFromCompletedEpisodes([...user.completedEpisodes, episodeId]);
    user.completedEpisodes = rebuilt.completedEpisodes;
    user.experience = rebuilt.experience;
    user.unlockedCards = rebuilt.unlockedCards;
    user.serieProgress = rebuilt.serieProgress;

    await user.save();

    return sendSuccess(res, {
        ...progressPayload(user),
        newlyUnlocked,
        rewards: {
            experienceGain: episode.experience,
            cardsToUnlock: episode.achievements,
        },
    });
});

export const uncompleteEpisode = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const user = await loadAuthUser(req.user.id);
    if (!user) return sendError(res, "No authorized, no user found", 401);

    const episodeId = Number(req.params.episodeId);

    if (!user.completedEpisodes.includes(episodeId)) {
        return sendError(res, "Este episodio no está marcado como visto", 400);
    }

    const frontierEpisodeId = getFrontierEpisodeId(user.completedEpisodes);
    if (episodeId !== frontierEpisodeId) {
        return sendError(
            res,
            `Solo puedes desmarcar el último episodio visto (episodio ${frontierEpisodeId}).`,
            400
        );
    }

    const rebuilt = rebuildFromCompletedEpisodes(
        user.completedEpisodes.filter((id) => id !== episodeId)
    );

    user.completedEpisodes = rebuilt.completedEpisodes;
    user.experience = rebuilt.experience;
    user.unlockedCards = rebuilt.unlockedCards;
    user.serieProgress = rebuilt.serieProgress;

    await user.save();

    return sendSuccess(res, progressPayload(user), "Episodio desmarcado");
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
        completedEpisodes: user.completedEpisodes,
        nextEpisodeId: 1,
        frontierEpisodeId: null,
    });
});
