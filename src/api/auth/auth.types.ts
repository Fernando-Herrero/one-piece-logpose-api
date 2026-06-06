import { Request } from "express";

export type UserRole = "user" | "admin";

export type AuthPayload = {
    id: string;
    email: string;
    role: UserRole;
};
// req.user = quien tiene la sesión (JWT)
export type AuthRequest = Request & {
    user?: AuthPayload;
};
