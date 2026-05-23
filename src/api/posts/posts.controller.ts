import { Request, Response } from "express";
import { Post } from "./posts.model.js";
import { randomUUID } from "crypto";
import { Comment } from "../comments/comments.model.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendSuccess, sendError } from "../../utils/response.utils.js";

const USER_SUMMARY = "username firstName lastName avatar displayName";

export const getAllPosts = asyncHandler(async (_req: Request, res: Response) => {
    const posts = await Post.find({ visibility: "public", isDeleted: false }).populate("userId", USER_SUMMARY);
    return sendSuccess(res, posts);
});

export const getPostsByUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const posts = await Post.find({ userId, visibility: "public", isDeleted: false }).populate("userId", USER_SUMMARY);
    return sendSuccess(res, posts);
});

export const getMyPosts = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const posts = await Post.find({ userId, isDeleted: false }).populate("userId", USER_SUMMARY);
    return sendSuccess(res, posts);
});

export const getOnePost = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const post = await Post.findOne({ _id: id, isDeleted: false }).populate("userId", USER_SUMMARY);

    if (!post) {
        return sendError(res, "Post no encontrado", 404);
    }

    return sendSuccess(res, post);
});

export const getPostByShareToken = asyncHandler(async (req: Request, res: Response) => {
    const { shareToken } = req.params;
    const post = await Post.findOne({ shareToken, isDeleted: false }).populate("userId", USER_SUMMARY);

    if (!post) {
        return sendError(res, "Post no encontrado", 404);
    }

    return sendSuccess(res, post);
});

export const createPost = asyncHandler(async (req: Request, res: Response) => {
    const postData = { ...req.body, shareToken: randomUUID() };
    const newPost = await Post.create(postData);
    return sendSuccess(res, newPost, "Post creado", 201);
});

export const editPost = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const post = await Post.findByIdAndUpdate(id, req.body, { new: true });

    if (!post) {
        return sendError(res, "Post no encontrado", 404);
    }

    return sendSuccess(res, post, "Post actualizado");
});

export const deletePost = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const post = await Post.findByIdAndDelete(id);

    if (!post) {
        return sendError(res, "Post no encontrado", 404);
    }

    await Comment.deleteMany({ postId: id });

    return sendSuccess(res, post, "Post eliminado");
});
