import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendError } from "../../utils/response.utils.js";
import { AuthPayload, AuthRequest, UserRole } from "./auth.types.js";

export const checkAuth = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return sendError(res, "Denied access, no token provided", 401);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
        req.user = decoded;
        next();
    } catch {
        return sendError(res, "Invalid or expired token", 401);
    }
});

export const checkRole = (roles: UserRole[]) =>
    asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) return sendError(res, "Unauthorized, no user found", 401);
        const allowed = Array.isArray(roles) ? roles : [roles];
        if (!allowed.includes(req.user.role))
            return sendError(res, "Forbidden, you are not authorized to access this resource", 403);
        next();
    });
