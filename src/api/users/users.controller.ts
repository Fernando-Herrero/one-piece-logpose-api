import { Response } from "express";
import mongoose from "mongoose";
import { User } from "./users.model.js";
import { Post } from "../posts/posts.model.js";
import { Comment } from "../comments/comments.model.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendSuccess, sendError } from "../../utils/response.utils.js";
import type { UpdateUserInput } from "./users.schemas.js";
import type { UserRequest } from "./users.types.js";
import { POST_AUTHOR_SELECT, USER_PUBLIC_SELECT } from "./users.helpers.js";

export const getAllUsers = asyncHandler(async (_req: UserRequest, res: Response) => {
    const users = await User.find();
    return sendSuccess(res, users);
});

export const getOneUser = asyncHandler(async (req: UserRequest, res: Response) => {
    return sendSuccess(res, req.targetUser!);
});

export const editUser = asyncHandler(async (req: UserRequest, res: Response) => {
    const updates = req.body as UpdateUserInput;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });

    if (!user) {
        return sendError(res, "Usuario no encontrado", 404);
    }

    return sendSuccess(res, user, "Usuario actualizado");
});

export const deleteUser = asyncHandler(async (req: UserRequest, res: Response) => {
    const user = req.targetUser!;
    const id = user._id.toString();

    const userPosts = await Post.find({ userId: id }).select("_id");
    const postIds = userPosts.map((p) => p._id);

    await Comment.deleteMany({ postId: { $in: postIds } });
    await Comment.deleteMany({ author: id });
    await Post.deleteMany({ userId: id });
    await User.findByIdAndDelete(id);

    return sendSuccess(res, { ok: true, removed: user }, "Usuario eliminado");
});

export const getUserStats = asyncHandler(async (req: UserRequest, res: Response) => {
    const id = req.params.id as string;
    const userObjectId = new mongoose.Types.ObjectId(id);

    const [myPosts, likedPosts, bookmarkedPosts, commentedPostIds, totalComments] = await Promise.all([
        Post.countDocuments({ userId: id, isDeleted: false }),
        Post.countDocuments({ likes: userObjectId, isDeleted: false }),
        Post.countDocuments({ bookmarks: userObjectId, isDeleted: false }),
        Comment.distinct("postId", { author: id, isDeleted: false }),
        Comment.countDocuments({ author: id, isDeleted: false }),
    ]);

    return sendSuccess(res, {
        myPosts,
        likedPosts,
        bookmarkedPosts,
        commentedPosts: commentedPostIds.length,
        totalComments,
    });
});

export const getUserFollowers = asyncHandler(async (req: UserRequest, res: Response) => {
    const followers = await User.find({ _id: { $in: req.targetUser!.followers } }).select(USER_PUBLIC_SELECT);
    return sendSuccess(res, followers);
});

export const getUserFollowing = asyncHandler(async (req: UserRequest, res: Response) => {
    const following = await User.find({ _id: { $in: req.targetUser!.following } }).select(USER_PUBLIC_SELECT);
    return sendSuccess(res, following);
});

export const getUserPosts = asyncHandler(async (req: UserRequest, res: Response) => {
    const id = req.params.id as string;
    const posts = await Post.find({ userId: id, visibility: "public", isDeleted: false }).populate(
        "userId",
        POST_AUTHOR_SELECT
    );
    return sendSuccess(res, posts);
});

export const getUserLikedPosts = asyncHandler(async (req: UserRequest, res: Response) => {
    const id = req.params.id as string;
    const userObjectId = new mongoose.Types.ObjectId(id);
    const posts = await Post.find({ likes: userObjectId, isDeleted: false }).populate("userId", POST_AUTHOR_SELECT);
    return sendSuccess(res, posts);
});

export const getUserBookmarkedPosts = asyncHandler(async (req: UserRequest, res: Response) => {
    const id = req.params.id as string;
    const userObjectId = new mongoose.Types.ObjectId(id);
    const posts = await Post.find({ bookmarks: userObjectId, isDeleted: false }).populate("userId", POST_AUTHOR_SELECT);
    return sendSuccess(res, posts);
});

export const getUserCommentedPosts = asyncHandler(async (req: UserRequest, res: Response) => {
    const id = req.params.id as string;
    const postIds = await Comment.distinct("postId", { author: id, isDeleted: false });
    const posts = await Post.find({ _id: { $in: postIds }, isDeleted: false }).populate("userId", POST_AUTHOR_SELECT);
    return sendSuccess(res, posts);
});

export const updateAvatar = asyncHandler(async (req: UserRequest, res: Response) => {
    if (!req.file) return sendError(res, "No se ha enviado ninguna imagen", 400);

    const user = await User.findByIdAndUpdate(
        req.params.id,
        { avatar: req.file.path },
        { new: true, runValidators: true }
    );

    if (!user) return sendError(res, "Usuario no encontrado", 404);
    return sendSuccess(res, user, "Avatar actualizado");
});
