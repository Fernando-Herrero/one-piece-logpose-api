import { Response } from "express";
import mongoose from "mongoose";
import { Comment } from "./comments.model.js";
import { Post } from "../posts/posts.model.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendSuccess, sendError } from "../../utils/response.utils.js";
import type { CreateCommentInput } from "./comments.schemas.js";
import type { CommentRequest } from "./comments.types.js";
import {
    ACTIVE_COMMENT_FILTER,
    COMMENT_AUTHOR_POPULATE,
    serializeComment,
    serializeComments,
    syncPostCommentsCount,
} from "./comments.helpers.js";
import { createNotification } from "../notifications/notifications.model.js";

const getViewerId = (req: CommentRequest): string | undefined => req.user?.id;

export const createComment = asyncHandler(async (req: CommentRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const payload = req.body as CreateCommentInput;

    const newComment = await Comment.create({
        postId: payload.postId,
        author: req.user.id,
        text: payload.text,
        images: payload.images,
        parentComment: payload.parentComment,
        isReply: Boolean(payload.parentComment),
    });

    await Post.findByIdAndUpdate(payload.postId, { $inc: { commentsCount: 1 } });

    if (payload.parentComment) {
        await Comment.findByIdAndUpdate(payload.parentComment, { $inc: { repliesCount: 1 } });
    }

    const populated = await Comment.findById(newComment._id).populate(COMMENT_AUTHOR_POPULATE);

    const postOwnerId = req.post?.userId?.toString();
    if (postOwnerId) {
        await createNotification({
            type: "comment",
            to: postOwnerId,
            from: req.user.id,
            postId: payload.postId,
            commentId: newComment._id.toString(),
        });
    }

    return sendSuccess(res, serializeComment(populated!), "Comment created", 201);
});

export const getCommentsByPost = asyncHandler(async (req: CommentRequest, res: Response) => {
    const postId = req.params.postId as string;

    const comments = await Comment.find({ postId, ...ACTIVE_COMMENT_FILTER })
        .sort({ createdAt: 1 })
        .populate(COMMENT_AUTHOR_POPULATE);

    return sendSuccess(res, serializeComments(comments, getViewerId(req)));
});

export const deleteComment = asyncHandler(async (req: CommentRequest, res: Response) => {
    const comment = req.comment!;
    const id = comment._id.toString();
    const postId = comment.postId.toString();

    await Comment.updateMany({ $or: [{ _id: id }, { parentComment: id }] }, { isDeleted: true });

    await syncPostCommentsCount(postId);

    if (comment.parentComment) {
        await Comment.findByIdAndUpdate(comment.parentComment, { $inc: { repliesCount: -1 } });
    }

    await comment.populate(COMMENT_AUTHOR_POPULATE);
    return sendSuccess(res, serializeComment(comment), "Comment deleted");
});

export const toggleLikeComment = asyncHandler(async (req: CommentRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const comment = req.comment!;
    const id = comment._id.toString();
    const userObjectId = new mongoose.Types.ObjectId(req.user.id);

    const alreadyLiked = comment.likes.some((likeId) => likeId.equals(userObjectId));

    const updated = await Comment.findByIdAndUpdate(
        id,
        alreadyLiked
            ? { $pull: { likes: userObjectId }, $inc: { likesCount: -1 } }
            : { $addToSet: { likes: userObjectId }, $inc: { likesCount: 1 } },
        { new: true }
    );

    if (!updated) {
        return sendError(res, "Comment not found", 404);
    }

    if (updated.likesCount < 0) {
        updated.likesCount = updated.likes.length;
        await updated.save();
    }

    const liked = !alreadyLiked;

    return sendSuccess(res, {
        liked,
        likesCount: Math.max(0, updated.likesCount),
        userLiked: liked,
    });
});
