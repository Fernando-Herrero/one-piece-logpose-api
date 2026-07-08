import { Response } from "express";
import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { Post } from "./posts.model.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendSuccess, sendError } from "../../utils/response.utils.js";
import type { CreatePostInput, UpdatePostInput } from "./posts.schemas.js";
import type { CreatePostRequest, MulterFile, PostRequest } from "./posts.types.js";
import {
    POST_AUTHOR_POPULATE,
    PUBLIC_POST_FILTER,
    serializePost,
    serializePosts,
    toggleField,
} from "./posts.helpers.js";
import { deleteFromCloudinary } from "../../config/cloudinary.js";
import { createNotification } from "../notifications/notifications.model.js";
import type { PostAuthorDoc } from "./posts.types.js";

const getPostOwnerId = (post: PostRequest["post"]) => {
    if (!post) return undefined;
    return post.populated("userId")
        ? (post.userId as unknown as PostAuthorDoc)._id.toString()
        : post.userId.toString();
};

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

export const createPost = asyncHandler(async (req: CreatePostRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const payload = req.body as CreatePostInput;

    const uploadedImages = req.files?.images?.map((file) => file.path) ?? [];
    const images = [...(payload.images ?? []), ...uploadedImages];

    const newPost = await Post.create({
        text: payload.text,
        userId: req.user.id,
        images,
        visibility: payload.visibility,
        pdf: req.files?.pdf?.[0]?.path,
        shareToken: randomUUID(),
    });

    await newPost.populate(POST_AUTHOR_POPULATE);
    return sendSuccess(res, serializePost(newPost), "Post creado", 201);
});

export const editPost = asyncHandler(async (req: PostRequest, res: Response) => {
    const updates = req.body as UpdatePostInput;

    if (updates.images !== undefined) {
        const previousImages = req.post?.images ?? [];
        const removedImages = previousImages.filter((url) => !updates.images!.includes(url));
        await Promise.all(removedImages.map((url) => deleteFromCloudinary(url)));
    }

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

    if (added) {
        const ownerId = getPostOwnerId(req.post);
        if (ownerId) {
            await createNotification({
                type: "like",
                to: ownerId,
                from: req.user.id,
                postId: req.params.id as string,
            });
        }
    }

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

    if (added) {
        const ownerId = getPostOwnerId(req.post);
        if (ownerId) {
            await createNotification({
                type: "bookmark",
                to: ownerId,
                from: req.user.id,
                postId: req.params.id as string,
            });
        }
    }

    return sendSuccess(res, {
        bookmarksCount: Math.max(0, result.updated.bookmarksCount),
        userBookmarked: added,
    });
});

export const updatePostPdf = asyncHandler(async (req: PostRequest, res: Response) => {
    if (!req.file) return sendError(res, "No se ha enviado ningún PDF", 400);

    await deleteFromCloudinary(req.post?.pdf);

    const post = await Post.findOneAndUpdate(
        { _id: req.params.id, isDeleted: false },
        { pdf: req.file.path },
        { new: true, runValidators: true }
    ).populate(POST_AUTHOR_POPULATE);

    if (!post) return sendError(res, "Post no encontrado", 404);
    return sendSuccess(res, serializePost(post), "PDF actualizado");
});

export const addPostImages = asyncHandler(async (req: PostRequest, res: Response) => {
    const files = (req as PostRequest & { files?: MulterFile[] }).files;
    if (!files?.length) return sendError(res, "No se enviaron imágenes", 400);

    const currentImages = req.post?.images ?? [];
    if (currentImages.length + files.length > 4) {
        return sendError(res, "Máximo 4 imágenes por post", 400);
    }

    const uploadedImages = files.map((file) => file.path);
    const post = await Post.findOneAndUpdate(
        { _id: req.params.id, isDeleted: false },
        { $push: { images: { $each: uploadedImages } } },
        { new: true, runValidators: true }
    ).populate(POST_AUTHOR_POPULATE);

    if (!post) return sendError(res, "Post no encontrado", 404);
    return sendSuccess(res, serializePost(post, getViewerId(req)), "Imágenes añadidas");
});

export const removePostImage = asyncHandler(async (req: PostRequest, res: Response) => {
    const { url } = req.body as { url: string };
    const currentImages = req.post?.images ?? [];

    if (!currentImages.includes(url)) {
        return sendError(res, "La imagen no pertenece a este post", 404);
    }

    await deleteFromCloudinary(url);

    const post = await Post.findOneAndUpdate(
        { _id: req.params.id, isDeleted: false },
        { $pull: { images: url } },
        { new: true, runValidators: true }
    ).populate(POST_AUTHOR_POPULATE);

    if (!post) return sendError(res, "Post no encontrado", 404);
    return sendSuccess(res, serializePost(post, getViewerId(req)), "Imagen eliminada");
});
