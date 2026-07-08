import { z } from "zod";

/**
 * Fuente única de verdad para POST/PATCH de posts.
 *
 * TODO (auth — NO añadir campos sensibles aquí):
 * - userId en create/like/bookmark → req.user.id vía JWT
 * - DELETE/PATCH → solo autor del post
 * - likes, bookmarks, likesCount → solo vía POST /:id/like|bookmark
 */
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "ID no válido");

const visibilitySchema = z.enum(["public", "private", "followers"]);

const postFieldsSchema = z.object({
    text: z.string().trim().min(1, "El texto es obligatorio"),
    images: z.array(z.string()).max(4, "Máximo 4 imágenes").optional(),
    visibility: visibilitySchema.optional(),
    isPinned: z.boolean().optional(),
});

export const createPostSchema = postFieldsSchema.strict();

export const updatePostSchema = postFieldsSchema
    .partial()
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: "Debes enviar al menos un campo para actualizar",
    });

export const postIdParamSchema = z.object({
    id: objectIdSchema,
});

export const shareTokenParamSchema = z.object({
    shareToken: z.uuid("Token de compartir no válido"),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
