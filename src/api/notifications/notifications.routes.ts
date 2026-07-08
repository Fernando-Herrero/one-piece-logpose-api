import { Router } from "express";
import { checkAuth } from "../auth/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as notificationsController from "./notifications.controller.js";
import { notificationIdParamSchema } from "./notifications.schemas.js";

export const notificationRoutes = Router();

const withNotificationId = validate(notificationIdParamSchema, "params");

notificationRoutes.get("/", [checkAuth], notificationsController.listNotifications);
notificationRoutes.get("/unread-count", [checkAuth], notificationsController.getUnreadCount);
notificationRoutes.put("/mark-all-read", [checkAuth], notificationsController.markAllRead);
notificationRoutes.put("/:id/read", [checkAuth, withNotificationId], notificationsController.markRead);
notificationRoutes.delete("/", [checkAuth], notificationsController.deleteAllNotifications);
notificationRoutes.delete("/:id", [checkAuth, withNotificationId], notificationsController.deleteNotification);
