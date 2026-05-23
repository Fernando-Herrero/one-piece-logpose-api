import { z } from "zod";

/**
 * Fuente única de verdad para comentarios.
 * Modelo MongoDB: author — respuesta API: userId (via serializeComment).
 *
 * TODO (auth): author en create y userId en like → req.user.id; DELETE solo autor o admin.
 */
const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "ID no válido");

export const createCommentSchema = z
    .object({
        postId: objectIdSchema,
        author: objectIdSchema,
        text: z.string().trim().min(1, "El texto es obligatorio"),
        images: z.array(z.string()).optional(),
        parentComment: objectIdSchema.optional(),
    })
    .strict();

export const commentIdParamSchema = z.object({
    id: objectIdSchema,
});

export const postIdParamSchema = z.object({
    postId: objectIdSchema,
});

export const commentActionUserSchema = z
    .object({
        userId: objectIdSchema,
    })
    .strict();

export const viewerQuerySchema = z
    .object({
        viewerId: objectIdSchema.optional(),
    })
    .strict();

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CommentActionUserInput = z.infer<typeof commentActionUserSchema>;
