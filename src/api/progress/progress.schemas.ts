import { z } from "zod";

export const completeEpisodeParamSchema = z.object({
    episodeId: z.coerce.number().int().positive(),
});

export type CompleteEpisodeParams = z.infer<typeof completeEpisodeParamSchema>;
