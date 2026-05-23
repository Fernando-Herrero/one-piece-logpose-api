import { Request, Response } from "express";
import { User } from "./users.model.js";
import { Post } from "../posts/posts.model.js";
import { Comment } from "../comments/comments.model.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendSuccess, sendError } from "../../utils/response.utils.js";
import { pickFields } from "../../utils/pick-fields.js";

/**
 * Campos editables vía PATCH /users/:id (solo perfil).
 *
 * TODO (auth + rutas dedicadas):
 * - verified      → POST /users/me/premium (token + comprobar pago)
 * - experience, unlockedCards, serieProgress → /api/progress
 * - followers, following → POST /users/:id/follow | unfollow
 * - password      → POST /auth/change-password
 * - role          → solo admin
 * - email         → ruta con verificación
 *
 * Esos campos no se añaden aquí: cada uno tendrá su endpoint con sus comprobaciones.
 */
const PROFILE_FIELDS = [
    "username",
    "firstName",
    "lastName",
    "displayName",
    "bio",
    "avatar",
    "coverImage",
    "phoneNumber",
    "address",
    "privacy",
] as const;

const REGISTER_FIELDS = [...PROFILE_FIELDS, "email", "password"] as const;

// Cada export usa asyncHandler: sin try/catch; errores técnicos → errorHandler global.
export const getAllUsers = asyncHandler(async (_req: Request, res: Response) => {
    const users = await User.find();
    return sendSuccess(res, users);
});

export const getOneUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await User.findById(id);

    // Respuesta de negocio: lo manejamos aquí, no es una excepción.
    if (!user) {
        return sendError(res, "Usuario no encontrado", 404);
    }

    return sendSuccess(res, user);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
    const payload = pickFields(req.body as Record<string, unknown>, REGISTER_FIELDS);
    const newUser = await User.create(payload);
    return sendSuccess(res, newUser, "Usuario creado", 201);
});

export const editUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = pickFields(req.body as Record<string, unknown>, PROFILE_FIELDS);

    const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!user) {
        return sendError(res, "Usuario no encontrado", 404);
    }

    return sendSuccess(res, user, "Usuario actualizado");
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
        return sendError(res, "Usuario no encontrado", 404);
    }

    const userPosts = await Post.find({ userId: id }).select("_id");
    const postIds = userPosts.map((p) => p._id);

    await Comment.deleteMany({ postId: { $in: postIds } });
    await Post.deleteMany({ userId: id });
    await Comment.deleteMany({ author: id });

    return sendSuccess(res, user, "Usuario eliminado");
});
