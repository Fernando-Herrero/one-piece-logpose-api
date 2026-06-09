import { NextFunction, Response } from "express";
import { User } from "../users/users.model.js";
import { findActivePostById } from "../posts/posts.helpers.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendError } from "../../utils/response.utils.js";
import { findActiveCommentById } from "./comments.helpers.js";
import type { CreateCommentInput } from "./comments.schemas.js";
import type { CommentRequest } from "./comments.types.js";

export const loadPostFromParams = asyncHandler(async (req: CommentRequest, res: Response, next: NextFunction) => {
    const post = await findActivePostById(req.params.postId as string);

    if (!post) {
        return sendError(res, "Post no encontrado", 404);
    }

    req.post = post;
    next();
});

export const loadPostFromBody = asyncHandler(async (req: CommentRequest, res: Response, next: NextFunction) => {
    const payload = req.body as CreateCommentInput;
    const post = await findActivePostById(payload.postId);

    if (!post) {
        return sendError(res, "Post no encontrado", 404);
    }

    req.post = post;
    next();
});

export const loadAuthorFromBody = asyncHandler(async (req: CommentRequest, res: Response, next: NextFunction) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const author = await User.findById(req.user.id);

    if (!author) {
        return sendError(res, "User not found", 404);
    }

    req.commentAuthor = author;
    next();
});

export const validateParentComment = asyncHandler(async (req: CommentRequest, res: Response, next: NextFunction) => {
    const payload = req.body as CreateCommentInput;

    if (!payload.parentComment) {
        return next();
    }

    const parent = await findActiveCommentById(payload.parentComment);

    if (!parent) {
        return sendError(res, "Comentario padre no encontrado", 404);
    }

    if (parent.postId.toString() !== payload.postId) {
        return sendError(res, "El comentario padre no pertenece a este post", 400);
    }

    next();
});

export const loadComment = asyncHandler(async (req: CommentRequest, res: Response, next: NextFunction) => {
    const comment = await findActiveCommentById(req.params.id as string);

    if (!comment) {
        return sendError(res, "Comentario no encontrado", 404);
    }

    req.comment = comment;
    next();
});

export const assertCommentOwner = asyncHandler(async (req: CommentRequest, res: Response, next: NextFunction) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const comment = req.comment!;
    if (!comment) return sendError(res, "Comment not found", 404);

    const isOwner = comment.author.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) return sendError(res, "Forbidden, you are not authorized to access this resource", 403);

    next();
});
