import {
    CARD_TYPES,
    findCardById,
    mergeUnlockedCards,
    type CatalogCard,
} from "../cards/catalog.js";
import { getArcsData, getEpisodeById } from "../serie/serie-data.js";
import type { UnlockedCards } from "../users/users.types.js";

export function getArcMetaForEpisode(episodeId: number) {
    const arc = getArcsData().find(
        (item) => episodeId >= item.firstEpisode && episodeId <= item.lastEpisode
    );
    if (!arc) return null;
    return { sagaId: arc.sagaId, arcId: arc.id };
}

export function getNextEpisodeId(completedEpisodes: number[]) {
    if (completedEpisodes.length === 0) return 1;
    return Math.max(...completedEpisodes) + 1;
}

export function getFrontierEpisodeId(completedEpisodes: number[]) {
    if (completedEpisodes.length === 0) return null;
    return Math.max(...completedEpisodes);
}

export function mergeAchievementsFromEpisodes(episodeIds: number[]): UnlockedCards {
    const merged: UnlockedCards = {
        characters: [],
        items: [],
        fruits: [],
        swords: [],
        boats: [],
    };

    for (const episodeId of [...episodeIds].sort((a, b) => a - b)) {
        const episode = getEpisodeById(episodeId);
        if (!episode) continue;

        for (const type of CARD_TYPES) {
            const ids = new Set(merged[type]);
            for (const cardId of episode.achievements[type]) ids.add(cardId);
            merged[type] = [...ids].sort((a, b) => a - b);
        }
    }

    return merged;
}

export function totalExperienceFromEpisodes(episodeIds: number[]) {
    return episodeIds.reduce((sum, episodeId) => sum + (getEpisodeById(episodeId)?.experience ?? 0), 0);
}

export function serieProgressFromEpisodes(episodeIds: number[]) {
    if (episodeIds.length === 0) {
        return { saga: 0, arc: 0, episode: 0 };
    }

    const lastEpisodeId = Math.max(...episodeIds);
    const meta = getArcMetaForEpisode(lastEpisodeId);

    return {
        saga: meta?.sagaId ?? 0,
        arc: meta?.arcId ?? 0,
        episode: lastEpisodeId,
    };
}

export function rebuildFromCompletedEpisodes(completedEpisodes: number[]) {
    const sorted = [...completedEpisodes].sort((a, b) => a - b);

    return {
        completedEpisodes: sorted,
        experience: totalExperienceFromEpisodes(sorted),
        unlockedCards: mergeAchievementsFromEpisodes(sorted),
        serieProgress: serieProgressFromEpisodes(sorted),
    };
}

export function rewardsFromEpisode(episodeId: number) {
    const episode = getEpisodeById(episodeId);
    if (!episode) return null;

    return {
        experienceGain: episode.experience,
        cardsToUnlock: episode.achievements,
    };
}

export function newlyUnlockedFromEpisode(current: UnlockedCards, episodeId: number) {
    const rewards = rewardsFromEpisode(episodeId);
    if (!rewards) {
        return {
            characters: [],
            items: [],
            fruits: [],
            swords: [],
            boats: [],
        } satisfies Record<(typeof CARD_TYPES)[number], CatalogCard[]>;
    }

    return mergeUnlockedCards(current, rewards.cardsToUnlock).newlyUnlocked;
}
