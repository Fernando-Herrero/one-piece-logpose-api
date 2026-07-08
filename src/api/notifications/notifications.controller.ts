import { Response } from "express";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendError, sendSuccess } from "../../utils/response.utils.js";
import type { NotificationRequest } from "./notifications.types.js";
import { Notification, NOTIFICATION_FROM_POPULATE } from "./notifications.model.js";
import { serializeNotification } from "./notifications.helpers.js";

export const listNotifications = asyncHandler(async (req: NotificationRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const notifications = await Notification.find({ to: req.user.id })
        .sort({ createdAt: -1 })
        .populate(NOTIFICATION_FROM_POPULATE);

    return sendSuccess(res, notifications.map((n) => serializeNotification(n)));
});

export const getUnreadCount = asyncHandler(async (req: NotificationRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const count = await Notification.countDocuments({ to: req.user.id, read: false });
    return sendSuccess(res, { count });
});

export const markRead = asyncHandler(async (req: NotificationRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const notification = await Notification.findOne({ _id: req.params.id, to: req.user.id }).populate(
        NOTIFICATION_FROM_POPULATE
    );

    if (!notification) return sendError(res, "Notificación no encontrada", 404);

    notification.read = true;
    await notification.save();

    return sendSuccess(res, serializeNotification(notification));
});

export const markAllRead = asyncHandler(async (req: NotificationRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const result = await Notification.updateMany({ to: req.user.id, read: false }, { read: true });

    return sendSuccess(res, {
        message: "Notificaciones marcadas como leídas",
        modifiedCount: result.modifiedCount,
    });
});

export const deleteNotification = asyncHandler(async (req: NotificationRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const notification = await Notification.findOne({ _id: req.params.id, to: req.user.id }).populate(
        NOTIFICATION_FROM_POPULATE
    );

    if (!notification) return sendError(res, "Notificación no encontrada", 404);

    await notification.deleteOne();
    return sendSuccess(res, serializeNotification(notification));
});

export const deleteAllNotifications = asyncHandler(async (req: NotificationRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const result = await Notification.deleteMany({ to: req.user.id });

    return sendSuccess(res, {
        ok: true,
        message: "Notificaciones eliminadas",
        deletedCount: result.deletedCount,
    });
});
