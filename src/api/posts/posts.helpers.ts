import mongoose from "mongoose";
import { Post } from "./posts.model.js";
import { POST_AUTHOR_SELECT } from "../users/users.helpers.js";
import type { PostType } from "./posts.types.js";

export const POST_AUTHOR_POPULATE = { path: "userId", select: POST_AUTHOR_SELECT } as const;

export const PUBLIC_POST_FILTER = {
    visibility: "public" as const,
    isDeleted: false,
};

export async function findActivePostById(id: string) {
    return Post.findOne({ _id: id, isDeleted: false });
}

export function getTextMaxLength(verified: boolean): number {
    return verified ? 600 : 280;
}

export function assertTextLength(text: string, verified: boolean): string | null {
    const max = getTextMaxLength(verified);
    if (text.length > max) {
        return `El texto no puede superar ${max} caracteres`;
    }
    return null;
}

export async function toggleField(postId: string, userId: mongoose.Types.ObjectId, field: "likes" | "bookmarks") {
    const post = await findActivePostById(postId);
    if (!post) return null;

    const countField = `${field}Count` as "likesCount" | "bookmarksCount";
    const alreadyHad = post[field].some((id) => id.equals(userId));

    const updated = await Post.findByIdAndUpdate(
        postId,
        alreadyHad
            ? { $pull: { [field]: userId }, $inc: { [countField]: -1 } }
            : { $addToSet: { [field]: userId }, $inc: { [countField]: 1 } },
        { new: true }
    );

    return { updated, alreadyHad };
}

type PostDoc = mongoose.Document & PostType;

export function serializePost(post: PostDoc, viewerId?: string): Record<string, unknown> {
    const json = post.toJSON() as Record<string, unknown>;

    if (viewerId) {
        const viewerObjectId = new mongoose.Types.ObjectId(viewerId);
        json.userLiked = post.likes.some((id) => id.equals(viewerObjectId));
        json.userBookmarked = post.bookmarks.some((id) => id.equals(viewerObjectId));
    }

    return json;
}

export function serializePosts(posts: PostDoc[], viewerId?: string): Record<string, unknown>[] {
    return posts.map((post) => serializePost(post, viewerId));
}
