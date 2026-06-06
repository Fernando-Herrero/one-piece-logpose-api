import { NextFunction, Response } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendError } from "../../utils/response.utils.js";
import { findUserById, isPrivacyDenied, type PrivacyKey } from "./users.helpers.js";
import type { UserRequest } from "./users.types.js";

export const loadUser = asyncHandler(async (req: UserRequest, res: Response, next: NextFunction) => {
    const user = await findUserById(req.params.id as string);

    if (!user) {
        return sendError(res, "Usuario no encontrado", 404);
    }

    req.targetUser = user;
    next();
});

export const assertPrivacy = (key: PrivacyKey) => {
    return (req: UserRequest, res: Response, next: NextFunction) => {
        const user = req.targetUser;

        if (!user) {
            return sendError(res, "Usuario no encontrado", 404);
        }

        if (isPrivacyDenied(user, key)) {
            return sendError(res, "Este contenido es privado", 403);
        }

        return next();
    };
};
