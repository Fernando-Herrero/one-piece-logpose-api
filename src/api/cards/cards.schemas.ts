import { z } from "zod";
import { CARD_TYPES } from "./catalog.js";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "ID no válido");

export const cardTypeParamSchema = z.object({
    type: z.enum(CARD_TYPES),
});

export const cardUserIdParamSchema = z.object({
    userId: objectIdSchema,
});
