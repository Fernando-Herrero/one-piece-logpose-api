import mongoose, { Schema } from "mongoose";
import { USER_PUBLIC_SELECT } from "../users/users.helpers.js";
import { NotificationType } from "./notifications.types.js";

const notificationSchema = new Schema(
    {
        type: {
            type: String,
            enum: ["like", "bookmark", "comment", "follow"],
            required: true,
        },
        to: { type: Schema.Types.ObjectId, ref: "users", required: true, index: true },
        from: { type: Schema.Types.ObjectId, ref: "users", required: true },
        postId: { type: Schema.Types.ObjectId, ref: "posts" },
        commentId: { type: Schema.Types.ObjectId, ref: "comments" },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export const Notification = mongoose.model("notifications", notificationSchema);

export const NOTIFICATION_FROM_POPULATE = {
    path: "from",
    select: USER_PUBLIC_SELECT,
} as const;

export async function createNotification(data: {
    type: NotificationType;
    to: string;
    from: string;
    postId?: string;
    commentId?: string;
}) {
    if (data.to === data.from) return null;

    return Notification.create({
        type: data.type,
        to: data.to,
        from: data.from,
        postId: data.postId,
        commentId: data.commentId,
    });
}
