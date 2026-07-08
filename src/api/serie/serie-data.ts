import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type Saga = {
    id: number;
    name: string;
    titleJa: string;
    totalEpisodes: number;
    firstArc: number;
    lastArc: number;
    arcNames: string[];
};

export type Arc = {
    id: number;
    name: string;
    description: string;
    saga: string;
    sagaId: number;
    totalEpisodes: number;
    isFiller: boolean;
    firstEpisode: number;
    lastEpisode: number;
};

export type Episode = {
    id: number;
    name: string;
    description: string;
    arc: string;
    experience: number;
    achievements: {
        characters: number[];
        items: number[];
        fruits: number[];
        swords: number[];
        boats: number[];
    };
};

const serieDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../data/serie");

let sagasCache: Saga[] | null = null;
let arcsCache: Arc[] | null = null;
let episodesCache: Episode[] | null = null;

function loadJsonFile<T>(fileName: string) {
    const filePath = path.join(serieDir, fileName);
    return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

export function getSagasData() {
    if (!sagasCache) sagasCache = loadJsonFile<Saga[]>("sagas.json");
    return sagasCache;
}

export function getArcsData() {
    if (!arcsCache) arcsCache = loadJsonFile<Arc[]>("arcs.json");
    return arcsCache;
}

export function getEpisodesData() {
    if (!episodesCache) episodesCache = loadJsonFile<Episode[]>("episodes.json");
    return episodesCache;
}

export function getSagaById(sagaId: number) {
    return getSagasData().find((saga) => saga.id === sagaId);
}

export function getArcById(arcId: number) {
    return getArcsData().find((arc) => arc.id === arcId);
}

export function getEpisodeById(episodeId: number) {
    return getEpisodesData().find((episode) => episode.id === episodeId);
}

export function getArcsBySagaId(sagaId: number) {
    return getArcsData().filter((arc) => arc.sagaId === sagaId);
}

export function getEpisodesByArcId(arcId: number) {
    const arc = getArcById(arcId);
    if (!arc) return null;

    return getEpisodesData().filter(
        (episode) => episode.id >= arc.firstEpisode && episode.id <= arc.lastEpisode
    );
}
