import { Request, Response } from "express";
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { Post } from "./posts.model.js";
import { User } from "../users/users.model.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendSuccess, sendError } from "../../utils/response.utils.js";
import type { CreatePostInput, PostActionUserInput, UpdatePostInput } from "./posts.schemas.js";
import {
    assertTextLength,
    findActivePostById,
    POST_AUTHOR_POPULATE,
    PUBLIC_POST_FILTER,
    serializePost,
    serializePosts,
} from "./posts.helpers.js";

const getId = (req: Request): string => req.params.id as string;

const getViewerId = (req: Request): string | undefined =>
    (req.query as { viewerId?: string }).viewerId;

async function requireActivePostOr404(id: string, res: Response) {
    const post = await findActivePostById(id);
    if (!post) {
        sendError(res, "Post no encontrado", 404);
        return null;
    }
    return post;
}

export const getAllPosts = asyncHandler(async (req: Request, res: Response) => {
    const viewerId = getViewerId(req);
    const posts = await Post.find(PUBLIC_POST_FILTER)
        .sort({ createdAt: -1 })
        .populate(POST_AUTHOR_POPULATE);

    return sendSuccess(res, serializePosts(posts, viewerId));
});

export const getOnePost = asyncHandler(async (req: Request, res: Response) => {
    const post = await Post.findOne({ _id: getId(req), isDeleted: false }).populate(POST_AUTHOR_POPULATE);

    if (!post) {
        return sendError(res, "Post no encontrado", 404);
    }

    return sendSuccess(res, serializePost(post, getViewerId(req)));
});

export const getPostByShareToken = asyncHandler(async (req: Request, res: Response) => {
    const { shareToken } = req.params;
    const post = await Post.findOne({ shareToken, isDeleted: false }).populate(POST_AUTHOR_POPULATE);

    if (!post) {
        return sendError(res, "Post no encontrado", 404);
    }

    return sendSuccess(res, serializePost(post, getViewerId(req)));
});

export const createPost = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body as CreatePostInput;
    const author = await User.findById(payload.userId);

    if (!author) {
        return sendError(res, "Usuario no encontrado", 404);
    }

    const textError = assertTextLength(payload.text, author.verified);
    if (textError) {
        return sendError(res, textError, 400);
    }

    const newPost = await Post.create({
        text: payload.text,
        userId: payload.userId,
        images: payload.images,
        visibility: payload.visibility,
        shareToken: randomUUID(),
    });

    await newPost.populate(POST_AUTHOR_POPULATE);
    return sendSuccess(res, serializePost(newPost), "Post creado", 201);
});

export const editPost = asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const updates = req.body as UpdatePostInput;

    if (updates.text) {
        const post = await findActivePostById(id);
        if (!post) {
            return sendError(res, "Post no encontrado", 404);
        }

        const author = await User.findById(post.userId);
        const textError = assertTextLength(updates.text, author?.verified ?? false);
        if (textError) {
            return sendError(res, textError, 400);
        }
    }

    const post = await Post.findOneAndUpdate({ _id: id, isDeleted: false }, updates, {
        new: true,
        runValidators: true,
    }).populate(POST_AUTHOR_POPULATE);

    if (!post) {
        return sendError(res, "Post no encontrado", 404);
    }

    return sendSuccess(res, serializePost(post), "Post actualizado");
});

export const deletePost = asyncHandler(async (req: Request, res: Response) => {
    const post = await Post.findOneAndUpdate(
        { _id: getId(req), isDeleted: false },
        { isDeleted: true },
        { new: true }
    ).populate(POST_AUTHOR_POPULATE);

    if (!post) {
        return sendError(res, "Post no encontrado", 404);
    }

    return sendSuccess(res, post, "Post eliminado");
});

export const toggleLikePost = asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const { userId } = req.body as PostActionUserInput;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const post = await requireActivePostOr404(id, res);
    if (!post) return;

    const alreadyLiked = post.likes.some((likeId) => likeId.equals(userObjectId));

    const updated = await Post.findByIdAndUpdate(
        id,
        alreadyLiked
            ? { $pull: { likes: userObjectId }, $inc: { likesCount: -1 } }
            : { $addToSet: { likes: userObjectId }, $inc: { likesCount: 1 } },
        { new: true }
    );

    if (!updated) {
        return sendError(res, "Post no encontrado", 404);
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

export const toggleBookmarkPost = asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const { userId } = req.body as PostActionUserInput;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const post = await requireActivePostOr404(id, res);
    if (!post) return;

    const alreadyBookmarked = post.bookmarks.some((bookmarkId) => bookmarkId.equals(userObjectId));

    const updated = await Post.findByIdAndUpdate(
        id,
        alreadyBookmarked
            ? { $pull: { bookmarks: userObjectId }, $inc: { bookmarksCount: -1 } }
            : { $addToSet: { bookmarks: userObjectId }, $inc: { bookmarksCount: 1 } },
        { new: true }
    );

    if (!updated) {
        return sendError(res, "Post no encontrado", 404);
    }

    if (updated.bookmarksCount < 0) {
        updated.bookmarksCount = updated.bookmarks.length;
        await updated.save();
    }

    const bookmarked = !alreadyBookmarked;

    return sendSuccess(res, {
        bookmarked,
        bookmarksCount: Math.max(0, updated.bookmarksCount),
        userBookmarked: bookmarked,
    });
});
