import { Response } from "express";
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { Post } from "./posts.model.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendSuccess, sendError } from "../../utils/response.utils.js";
import type { CreatePostInput, UpdatePostInput } from "./posts.schemas.js";
import type { PostRequest } from "./posts.types.js";
import {
    POST_AUTHOR_POPULATE,
    PUBLIC_POST_FILTER,
    serializePost,
    serializePosts,
    toggleField,
} from "./posts.helpers.js";

const getViewerId = (req: PostRequest): string | undefined => req.user?.id;

export const getAllPosts = asyncHandler(async (req: PostRequest, res: Response) => {
    const posts = await Post.find(PUBLIC_POST_FILTER).sort({ createdAt: -1 }).populate(POST_AUTHOR_POPULATE);

    return sendSuccess(res, serializePosts(posts, getViewerId(req)));
});

export const getOnePost = asyncHandler(async (req: PostRequest, res: Response) => {
    return sendSuccess(res, serializePost(req.post!, getViewerId(req)));
});

export const getPostByShareToken = asyncHandler(async (req: PostRequest, res: Response) => {
    return sendSuccess(res, serializePost(req.post!, getViewerId(req)));
});

export const createPost = asyncHandler(async (req: PostRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const payload = req.body as CreatePostInput;

    const newPost = await Post.create({
        text: payload.text,
        userId: req.user.id,
        images: payload.images,
        visibility: payload.visibility,
        shareToken: randomUUID(),
    });

    await newPost.populate(POST_AUTHOR_POPULATE);
    return sendSuccess(res, serializePost(newPost), "Post creado", 201);
});

export const editPost = asyncHandler(async (req: PostRequest, res: Response) => {
    const updates = req.body as UpdatePostInput;

    const post = await Post.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, updates, {
        new: true,
        runValidators: true,
    }).populate(POST_AUTHOR_POPULATE);

    if (!post) {
        return sendError(res, "Post no encontrado", 404);
    }

    return sendSuccess(res, serializePost(post), "Post actualizado");
});

export const deletePost = asyncHandler(async (req: PostRequest, res: Response) => {
    const post = await Post.findOneAndUpdate(
        { _id: req.params.id, isDeleted: false },
        { isDeleted: true },
        { new: true }
    ).populate(POST_AUTHOR_POPULATE);

    if (!post) {
        return sendError(res, "Post no encontrado", 404);
    }

    return sendSuccess(res, post, "Post eliminado");
});

export const toggleLikePost = asyncHandler(async (req: PostRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    const result = await toggleField(req.params.id as string, userObjectId, "likes");

    if (!result?.updated) return sendError(res, "Post no encontrado", 404);

    const added = !result.alreadyHad;
    return sendSuccess(res, {
        liked: added,
        likesCount: Math.max(0, result.updated.likesCount),
        userLiked: added,
    });
});

export const toggleBookmarkPost = asyncHandler(async (req: PostRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const userObjectId = new mongoose.Types.ObjectId(req.user.id);
    const result = await toggleField(req.params.id as string, userObjectId, "bookmarks");

    if (!result?.updated) return sendError(res, "Post no encontrado", 404);

    const added = !result.alreadyHad;
    return sendSuccess(res, {
        bookmarked: added,
        bookmarksCount: Math.max(0, result.updated.bookmarksCount),
        userBookmarked: added,
    });
});
