import { z } from "zod";

export const sagaIdParamSchema = z.object({
    sagaId: z.coerce.number().int().positive(),
});

export const arcIdParamSchema = z.object({
    arcId: z.coerce.number().int().positive(),
});

export const episodeIdParamSchema = z.object({
    episodeId: z.coerce.number().int().positive(),
});
