import mongoose from "mongoose";
import { Comment } from "./comments.model.js";
import { Post } from "../posts/posts.model.js";
import { POST_AUTHOR_SELECT } from "../users/users.helpers.js";
import type { CommentType } from "./comments.types.js";

export const COMMENT_AUTHOR_POPULATE = { path: "author", select: POST_AUTHOR_SELECT } as const;

export const ACTIVE_COMMENT_FILTER = { isDeleted: false } as const;

export async function findActiveCommentById(id: string) {
    return Comment.findOne({ _id: id, isDeleted: false });
}

export async function syncPostCommentsCount(postId: string): Promise<void> {
    const count = await Comment.countDocuments({ postId, isDeleted: false });
    await Post.findByIdAndUpdate(postId, { commentsCount: count });
}

type CommentDoc = mongoose.Document & CommentType;

export function serializeComment(comment: CommentDoc, viewerId?: string): Record<string, unknown> {
    const json = comment.toJSON() as Record<string, unknown>;
    json.userId = json.author;
    delete json.author;

    if (viewerId) {
        const viewerObjectId = new mongoose.Types.ObjectId(viewerId);
        const liked = comment.likes.some((id) => id.equals(viewerObjectId));
        json.userLiked = liked;
        json.liked = liked;
    }

    return json;
}

export function serializeComments(comments: CommentDoc[], viewerId?: string): Record<string, unknown>[] {
    return comments.map((comment) => serializeComment(comment, viewerId));
}
