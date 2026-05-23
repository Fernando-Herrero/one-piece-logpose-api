import mongoose, { Schema } from "mongoose";
import { CommentType } from "./comments.types.js";

const commentSchema: Schema<CommentType> = new Schema(
    {
        postId: {
            type: Schema.Types.ObjectId,
            ref: "posts",
            required: [true, "El comentario debe pertenecer a un post"],
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: "users",
            required: [true, "El comentario debe tener un autor"],
        },
        text: { type: String, required: [true, "El texto del comentario es obligatorio"] },
        images: { type: [String], default: [] },
        likes: { type: [{ type: Schema.Types.ObjectId, ref: "users" }], default: [] },
        likesCount: { type: Number, default: 0 },
        repliesCount: { type: Number, default: 0 },
        isReply: { type: Boolean, default: false },
        hashtags: { type: [String], default: [] },
        mentions: { type: [String], default: [] },
        isDeleted: { type: Boolean, default: false },
        source: { type: String, default: "web" },
        language: { type: String, default: "es" },
        parentComment: {
            type: Schema.Types.ObjectId,
            ref: "comments",
        },
    },
    { timestamps: true }
);

export const Comment = mongoose.model<CommentType>("comments", commentSchema);
