import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { UnlockedCards } from "../users/users.types.js";

export const CARD_TYPES = ["characters", "items", "fruits", "swords", "boats"] as const;

export type CardType = (typeof CARD_TYPES)[number];

export type CatalogCard = {
    id: number;
    name: string;
    image: string;
    [key: string]: unknown;
};

type CatalogData = Record<CardType, CatalogCard[]>;

const DEFAULT_CARD_IMAGE = "/cards/placeholder.webp";

const catalogDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../../data/catalog");

let catalogCache: CatalogData | null = null;

function getApiBaseUrl(): string {
    const fromEnv = process.env.API_BASE_URL?.replace(/\/$/, "");
    if (fromEnv) return fromEnv;
    return `http://localhost:${process.env.PORT || "3000"}`;
}

export function resolveCardImageUrl(image: string): string {
    if (image.startsWith("http://") || image.startsWith("https://")) return image;
    const path = image.startsWith("/") ? image : `/${image}`;
    return `${getApiBaseUrl()}${path}`;
}

function normalizeCard(card: CatalogCard): CatalogCard {
    const imagePath = typeof card.image === "string" && card.image ? card.image : DEFAULT_CARD_IMAGE;

    return {
        ...card,
        name: typeof card.name === "string" ? card.name : "Unknown",
        image: resolveCardImageUrl(imagePath),
    };
}

function loadCatalogFile(type: CardType) {
    const filePath = path.join(catalogDir, `${type}.json`);
    const raw = JSON.parse(readFileSync(filePath, "utf8")) as CatalogCard[];
    return raw.map(normalizeCard);
}

export function getCatalogData() {
    if (!catalogCache) {
        catalogCache = {
            characters: loadCatalogFile("characters"),
            items: loadCatalogFile("items"),
            fruits: loadCatalogFile("fruits"),
            swords: loadCatalogFile("swords"),
            boats: loadCatalogFile("boats"),
        };
    }

    return catalogCache;
}

export function getCatalogTotals() {
    const catalog = getCatalogData();

    const characters = catalog.characters.length;
    const items = catalog.items.length;
    const fruits = catalog.fruits.length;
    const swords = catalog.swords.length;
    const boats = catalog.boats.length;

    return {
        characters,
        items,
        fruits,
        swords,
        boats,
        all: characters + items + fruits + swords + boats,
    };
}

export function getCatalogByType(type: CardType) {
    return getCatalogData()[type];
}

export function findCardById(type: CardType, id: number) {
    return getCatalogByType(type).find((card) => card.id === id);
}

export function resolveCardIds(type: CardType, ids: number[]) {
    const catalog = getCatalogByType(type);
    const byId = new Map(catalog.map((card) => [card.id, card]));

    return ids.map((id) => byId.get(id)).filter((card): card is CatalogCard => card !== undefined);
}

export function resolveUnlockedCards(unlockedCards: UnlockedCards) {
    return {
        characters: resolveCardIds("characters", unlockedCards.characters),
        items: resolveCardIds("items", unlockedCards.items),
        fruits: resolveCardIds("fruits", unlockedCards.fruits),
        swords: resolveCardIds("swords", unlockedCards.swords),
        boats: resolveCardIds("boats", unlockedCards.boats),
    };
}

export function buildCollectionStats(unlockedCards: UnlockedCards) {
    const totals = getCatalogTotals();
    const unlocked = resolveUnlockedCards(unlockedCards);

    const counts = {
        characters: unlocked.characters.length,
        items: unlocked.items.length,
        fruits: unlocked.fruits.length,
        swords: unlocked.swords.length,
        boats: unlocked.boats.length,
        total:
            unlocked.characters.length +
            unlocked.items.length +
            unlocked.fruits.length +
            unlocked.swords.length +
            unlocked.boats.length,
    };

    const progress = {
        characters: `${counts.characters}/${totals.characters}`,
        items: `${counts.items}/${totals.items}`,
        fruits: `${counts.fruits}/${totals.fruits}`,
        swords: `${counts.swords}/${totals.swords}`,
        boats: `${counts.boats}/${totals.boats}`,
        total: `${counts.total}/${totals.all}`,
    };

    return { unlocked, counts, progress };
}

export function mergeUnlockedCards(current: UnlockedCards, incoming: UnlockedCards) {
    const newlyUnlocked: Record<CardType, CatalogCard[]> = {
        characters: [],
        items: [],
        fruits: [],
        swords: [],
        boats: [],
    };

    const merged = { ...current };

    for (const type of CARD_TYPES) {
        const existing = new Set(current[type]);
        const next = [...current[type]];

        for (const id of incoming[type]) {
            if (!existing.has(id)) {
                existing.add(id);
                next.push(id);
                const card = findCardById(type, id);
                if (card) newlyUnlocked[type].push(card);
            }
        }

        merged[type] = next;
    }

    return { merged, newlyUnlocked };
}

export function isProgressGreater(
    current: { saga: number; arc: number; episode: number },
    next: { saga: number; arc: number; episode: number }
) {
    if (next.saga !== current.saga) return next.saga > current.saga;
    if (next.arc !== current.arc) return next.arc > current.arc;
    return next.episode > current.episode;
}

export function isValidCardType(type: string): type is CardType {
    return (CARD_TYPES as readonly string[]).includes(type);
}
