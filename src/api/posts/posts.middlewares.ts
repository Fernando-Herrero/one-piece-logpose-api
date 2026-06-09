import { NextFunction, Response } from "express";
import { Post } from "./posts.model.js";
import { User } from "../users/users.model.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendError } from "../../utils/response.utils.js";
import { assertTextLength, POST_AUTHOR_POPULATE } from "./posts.helpers.js";
import type { CreatePostInput, UpdatePostInput } from "./posts.schemas.js";
import type { PostRequest } from "./posts.types.js";

export const loadPost = asyncHandler(async (req: PostRequest, res: Response, next: NextFunction) => {
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false }).populate(POST_AUTHOR_POPULATE);

    if (!post) {
        return sendError(res, "Post no encontrado", 404);
    }

    req.post = post;
    next();
});

export const loadPostByShareToken = asyncHandler(async (req: PostRequest, res: Response, next: NextFunction) => {
    const post = await Post.findOne({ shareToken: req.params.shareToken, isDeleted: false }).populate(
        POST_AUTHOR_POPULATE
    );

    if (!post) {
        return sendError(res, "Post no encontrado", 404);
    }

    req.post = post;
    next();
});

export const validateCreatePostAuthor = asyncHandler(async (req: PostRequest, res: Response, next: NextFunction) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const payload = req.body as CreatePostInput;
    const author = await User.findById(req.user.id);

    if (!author) return sendError(res, "User not found", 404);

    const textError = assertTextLength(payload.text, author.verified);
    if (textError) {
        return sendError(res, textError, 400);
    }

    req.postAuthor = author;
    next();
});

export const validateUpdatePostText = asyncHandler(async (req: PostRequest, res: Response, next: NextFunction) => {
    const updates = req.body as UpdatePostInput;

    if (!updates.text) {
        return next();
    }

    const post = req.post;
    if (!post) {
        return sendError(res, "Post no encontrado", 404);
    }

    const author = await User.findById(post.userId);
    const textError = assertTextLength(updates.text, author?.verified ?? false);

    if (textError) {
        return sendError(res, textError, 400);
    }

    next();
});

export const assertPostOwner = asyncHandler(async (req: PostRequest, res: Response, next: NextFunction) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const post = req.post;
    if (!post) return sendError(res, "Post not found", 404);

    const isOwner = post.userId.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) return sendError(res, "Unauthorized, you are not the owner of this post", 403);

    next();
});
