import { z } from "zod";

/**
 * Fuente única de verdad para campos de usuario en POST/PATCH.
 * El middleware validate() parsea el body; el controller usa CreateUserInput / UpdateUserInput.
 *
 * TODO (auth + rutas dedicadas — NO añadir aquí):
 * - verified      → POST /users/me/premium
 * - experience, unlockedCards, serieProgress → /api/progress
 * - followers, following → POST /users/:id/follow | unfollow
 * - password (update) → POST /auth/change-password
 * - role          → solo admin
 * - email (update) → ruta con verificación
 */
const privacySchema = z.object({
    showPosts: z.boolean(),
    showLikes: z.boolean(),
    showBookmarked: z.boolean(),
    showComments: z.boolean(),
});

const profileFieldsSchema = z.object({
    username: z.string().trim().min(3, "El username debe tener al menos 3 caracteres"),
    firstName: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
    lastName: z.string().trim().min(2, "El apellido debe tener al menos 2 caracteres"),
    displayName: z.string().trim().optional(),
    bio: z.string().max(2000, "La bio no puede superar 2000 caracteres").optional(),
    avatar: z.string().optional(),
    coverImage: z.string().optional(),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
    privacy: privacySchema.optional(),
});

export const createUserSchema = profileFieldsSchema
    .extend({
        email: z.email("Email no válido"),
        password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    })
    .strict();

export const updateUserSchema = profileFieldsSchema
    .partial()
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: "Debes enviar al menos un campo para actualizar",
    });

export const userIdParamSchema = z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID de usuario no válido"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
