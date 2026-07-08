import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "ID no válido");

export const notificationIdParamSchema = z.object({
    id: objectIdSchema,
});
