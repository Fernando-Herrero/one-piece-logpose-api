import { Request, Response } from "express";
import mongoose from "mongoose";
import { Comment } from "./comments.model.js";
import { Post } from "../posts/posts.model.js";
import { User } from "../users/users.model.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendSuccess, sendError } from "../../utils/response.utils.js";
import { findActivePostById } from "../posts/posts.helpers.js";
import type { CommentActionUserInput, CreateCommentInput } from "./comments.schemas.js";
import {
    ACTIVE_COMMENT_FILTER,
    COMMENT_AUTHOR_POPULATE,
    findActiveCommentById,
    serializeComment,
    serializeComments,
    syncPostCommentsCount,
} from "./comments.helpers.js";

const getId = (req: Request): string => req.params.id as string;

const getViewerId = (req: Request): string | undefined =>
    (req.query as { viewerId?: string }).viewerId;

async function populateComment(id: mongoose.Types.ObjectId) {
    return Comment.findById(id).populate(COMMENT_AUTHOR_POPULATE);
}

export const createComment = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as CreateCommentInput;

    const [post, author] = await Promise.all([
        findActivePostById(payload.postId),
        User.findById(payload.author),
    ]);

    if (!post) {
        return sendError(res, "Post no encontrado", 404);
    }

    if (!author) {
        return sendError(res, "Usuario no encontrado", 404);
    }

    if (payload.parentComment) {
        const parent = await findActiveCommentById(payload.parentComment);
        if (!parent) {
            return sendError(res, "Comentario padre no encontrado", 404);
        }
        if (parent.postId.toString() !== payload.postId) {
            return sendError(res, "El comentario padre no pertenece a este post", 400);
        }
    }

    const newComment = await Comment.create({
        postId: payload.postId,
        author: payload.author,
        text: payload.text,
        images: payload.images,
        parentComment: payload.parentComment,
        isReply: Boolean(payload.parentComment),
    });

    await Post.findByIdAndUpdate(payload.postId, { $inc: { commentsCount: 1 } });

    if (payload.parentComment) {
        await Comment.findByIdAndUpdate(payload.parentComment, { $inc: { repliesCount: 1 } });
    }

    const populated = await populateComment(newComment._id);
    return sendSuccess(res, serializeComment(populated!), "Comentario creado", 201);
});

export const getCommentsByPost = asyncHandler(async (req: Request, res: Response) => {
    const postId = req.params.postId as string;

    const post = await findActivePostById(postId);
    if (!post) {
        return sendError(res, "Post no encontrado", 404);
    }

    const comments = await Comment.find({ postId, ...ACTIVE_COMMENT_FILTER })
        .sort({ createdAt: 1 })
        .populate(COMMENT_AUTHOR_POPULATE);

    return sendSuccess(res, serializeComments(comments, getViewerId(req)));
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const comment = await findActiveCommentById(id);

    if (!comment) {
        return sendError(res, "Comentario no encontrado", 404);
    }

    const postId = comment.postId.toString();

    await Comment.updateMany(
        { $or: [{ _id: id }, { parentComment: id }] },
        { isDeleted: true }
    );

    await syncPostCommentsCount(postId);

    if (comment.parentComment) {
        await Comment.findByIdAndUpdate(comment.parentComment, { $inc: { repliesCount: -1 } });
    }

    await comment.populate(COMMENT_AUTHOR_POPULATE);
    return sendSuccess(res, serializeComment(comment), "Comentario eliminado");
});

export const toggleLikeComment = asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const { userId } = req.body as CommentActionUserInput;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const comment = await findActiveCommentById(id);
    if (!comment) {
        return sendError(res, "Comentario no encontrado", 404);
    }

    const alreadyLiked = comment.likes.some((likeId) => likeId.equals(userObjectId));

    const updated = await Comment.findByIdAndUpdate(
        id,
        alreadyLiked
            ? { $pull: { likes: userObjectId }, $inc: { likesCount: -1 } }
            : { $addToSet: { likes: userObjectId }, $inc: { likesCount: 1 } },
        { new: true }
    );

    if (!updated) {
        return sendError(res, "Comentario no encontrado", 404);
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
