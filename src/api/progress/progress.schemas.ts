import { z } from "zod";

const serieProgressSchema = z.object({
    saga: z.number().int().nonnegative(),
    arc: z.number().int().nonnegative(),
    episode: z.number().int().nonnegative(),
});

const unlockedCardsSchema = z.object({
    characters: z.array(z.number().int()),
    items: z.array(z.number().int()),
    fruits: z.array(z.number().int()),
    swords: z.array(z.number().int()),
    boats: z.array(z.number().int()),
});

export const updateProgressSchema = z
    .object({
        serieProgress: serieProgressSchema.partial().optional(),
        experience: z.number().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: "Debes enviar al menos un campo para actualizar",
    });

export const completeEpisodeParamSchema = z.object({
    episodeId: z.coerce.number().int().positive(),
});

export const completeEpisodeSchema = z
    .object({
        sagaId: z.number().int().nonnegative(),
        arcId: z.number().int().nonnegative(),
        experienceGain: z.number().int().nonnegative(),
        cardsToUnlock: unlockedCardsSchema,
    })
    .strict();

export type UpdateProgressInput = z.infer<typeof updateProgressSchema>;
export type CompleteEpisodeInput = z.infer<typeof completeEpisodeSchema>;
