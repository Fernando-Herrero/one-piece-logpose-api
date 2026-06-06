import { z } from "zod";
import { createUserSchema } from "../users/users.schemas.js";

export const registerSchema = createUserSchema;

export const loginSchema = z
    .object({
        email: z.email("Email no válido"),
        password: z.string().min(1, "La contraseña es obligatoria"),
    })
    .strict();

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8),
        repeatNewPassword: z.string().min(8),
    })
    .strict();

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
