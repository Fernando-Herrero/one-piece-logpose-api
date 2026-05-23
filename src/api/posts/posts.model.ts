import mongoose, { Schema } from "mongoose";
import { PostType } from "./posts.types.js";

const postSchema: Schema<PostType> = new Schema(
    {
        text: { type: String, required: [true, "El texto es obligatorio"] },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "users",
            required: [true, "El post debe tener un autor"],
        },
        images: [{ type: String }],
        isDeleted: {
            type: Boolean,
            default: false,
        },
        visibility: {
            type: String,
            enum: ["public", "private", "followers"],
            default: "public",
        },
        shareToken: { type: String },
        isRetweet: { type: Boolean, default: false },
        isReply: { type: Boolean, default: false },
        isPinned: { type: Boolean, default: false },
        language: { type: String, default: "es" },
        likes: { type: [{ type: Schema.Types.ObjectId, ref: "users" }], default: [] },
        bookmarks: { type: [{ type: Schema.Types.ObjectId, ref: "users" }], default: [] },
        likesCount: { type: Number, default: 0 },
        bookmarksCount: { type: Number, default: 0 },
        commentsCount: { type: Number, default: 0 },
        retweetsCount: { type: Number, default: 0 },
        hashtags: { type: [String], default: [] },
        mentions: { type: [String], default: [] },
        retweets: { type: [{ type: Schema.Types.ObjectId, ref: "posts" }], default: [] },
    },
    {
        timestamps: true,
    }
);

postSchema.virtual("isPublic").get(function () {
    return this.visibility === "public";
});

export const Post = mongoose.model<PostType>("posts", postSchema);
