import { NextFunction, Response } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendError } from "../../utils/response.utils.js";
import { findUserById, isPrivacyDenied, type PrivacyKey } from "./users.helpers.js";
import type { UserRequest } from "./users.types.js";

export const loadUser = asyncHandler(async (req: UserRequest, res: Response, next: NextFunction) => {
    const user = await findUserById(req.params.id as string);

    if (!user) {
        return sendError(res, "User not found", 404);
    }

    req.targetUser = user;
    next();
});

export const assertPrivacy = (key: PrivacyKey) => {
    return (req: UserRequest, res: Response, next: NextFunction) => {
        const user = req.targetUser;

        if (!user) {
            return sendError(res, "User not found", 404);
        }

        const isSelf = req.user?.id === req.params.id;
        const isAdmin = req.user?.role === "admin";

        if (isSelf || isAdmin) return next();

        if (isPrivacyDenied(user, key)) {
            return sendError(res, "This content is private", 403);
        }

        return next();
    };
};

export const assertSelf = asyncHandler(async (req: UserRequest, res: Response, next: NextFunction) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const isSelf = req.params.id === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isSelf && !isAdmin) return sendError(res, "Forbidden, you are not authorized to access this resource", 403);

    next();
});
