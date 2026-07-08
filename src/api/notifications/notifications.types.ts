import { Request } from "express";
import { AuthPayload } from "../auth/auth.types.js";

export type NotificationType = "like" | "bookmark" | "comment" | "follow";

export type NotificationRequest = Request & {
    user?: AuthPayload;
};
