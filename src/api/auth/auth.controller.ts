import { asyncHandler } from "../../utils/async-handler.js";
import { Response } from "express";
import { AuthRequest } from "./auth.types.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendError, sendSuccess } from "../../utils/response.utils.js";
import { User } from "../users/users.model.js";

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const payload = req.body;

    const hashedPassword = await bcrypt.hash(payload.password, 10);

    const newUser = await User.create({
        username: payload.username,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        password: hashedPassword,
        avatar: payload.avatar,
    });

    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, process.env.JWT_SECRET!, {
        expiresIn: "1h",
    });

    return sendSuccess(res, { user: newUser, token }, "User registered successfully", 201);
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    const valid = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !valid) return sendError(res, "Invalid email or password", 401);

    if (!user.isActive) return sendError(res, "Account is not active", 403);

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET!, {
        expiresIn: "1h",
    });

    const userObj = user.toObject() as Record<string, unknown>;
    delete userObj.password;

    return sendSuccess(res, { user: userObj, token }, "Login successful", 200);
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        return sendError(res, "No authorized, no user found", 401);
    }

    const user = await User.findById(req.user.id);

    if (!user) {
        return sendError(res, "User not found", 404);
    }

    return sendSuccess(res, user, "Profile obtained");
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const { currentPassword, newPassword } = req.body as {
        currentPassword: string;
        newPassword: string;
    };

    const user = await User.findById(req.user.id).select("+password");

    if (!user) return sendError(res, "User not found", 404);

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);

    if (!isCurrentValid) return sendError(res, "Invalid current password", 401);

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return sendSuccess(res, null, "Password changed successfully");
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    return sendSuccess(res, null, "Logout successful");
});
