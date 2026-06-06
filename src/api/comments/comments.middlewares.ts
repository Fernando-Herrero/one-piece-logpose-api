import { NextFunction, Response } from "express";
import { User } from "../users/users.model.js";
import { findActivePostById } from "../posts/posts.helpers.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendError } from "../../utils/response.utils.js";
import { findActiveCommentById } from "./comments.helpers.js";
import type { CreateCommentInput } from "./comments.schemas.js";
import type { CommentRequest } from "./comments.types.js";

export const loadPostFromParams = asyncHandler(
    async (req: CommentRequest, res: Response, next: NextFunction) => {
        const post = await findActivePostById(req.params.postId as string);

        if (!post) {
            return sendError(res, "Post no encontrado", 404);
        }

        req.post = post;
        next();
    }
);

export const loadPostFromBody = asyncHandler(async (req: CommentRequest, res: Response, next: NextFunction) => {
    const payload = req.body as CreateCommentInput;
    const post = await findActivePostById(payload.postId);

    if (!post) {
        return sendError(res, "Post no encontrado", 404);
    }

    req.post = post;
    next();
});

export const loadAuthorFromBody = asyncHandler(
    async (req: CommentRequest, res: Response, next: NextFunction) => {
        const payload = req.body as CreateCommentInput;
        const author = await User.findById(payload.author);

        if (!author) {
            return sendError(res, "Usuario no encontrado", 404);
        }

        req.commentAuthor = author;
        next();
    }
);

export const validateParentComment = asyncHandler(
    async (req: CommentRequest, res: Response, next: NextFunction) => {
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
    }
);

export const loadComment = asyncHandler(async (req: CommentRequest, res: Response, next: NextFunction) => {
    const comment = await findActiveCommentById(req.params.id as string);

    if (!comment) {
        return sendError(res, "Comentario no encontrado", 404);
    }

    req.comment = comment;
    next();
});
