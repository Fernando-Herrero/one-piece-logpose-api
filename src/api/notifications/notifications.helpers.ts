import mongoose from "mongoose";
import { serializeUserSummary } from "../users/users.helpers.js";

type NotificationDoc = mongoose.Document & {
    type: string;
    to: mongoose.Types.ObjectId;
    from: mongoose.Types.ObjectId | mongoose.Document;
    postId?: mongoose.Types.ObjectId | null;
    commentId?: mongoose.Types.ObjectId | null;
    read: boolean;
    createdAt?: Date;
    updatedAt?: Date;
};

export function serializeNotification(notification: NotificationDoc) {
    const json = notification.toJSON() as Record<string, unknown>;
    const fromUser =
        typeof notification.from === "object" && "username" in notification.from
            ? serializeUserSummary(notification.from as mongoose.Document)
            : { id: (notification.from as mongoose.Types.ObjectId).toString() };

    return {
        ...json,
        from: fromUser,
        to: json.to,
        postId: notification.postId?.toString(),
        commentId: notification.commentId?.toString(),
    };
}
