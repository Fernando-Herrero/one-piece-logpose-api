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

    return sendSuccess(res, { user, token }, "Login successful", 200);
});

export const me = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
        return sendError(res, "No autenticado", 401);
    }

    const user = await User.findById(req.user.id);

    if (!user) {
        return sendError(res, "Usuario no encontrado", 404);
    }

    return sendSuccess(res, user, "Perfil obtenido");
});
