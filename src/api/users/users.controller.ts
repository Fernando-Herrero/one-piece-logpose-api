import { Response } from "express";
import mongoose from "mongoose";
import { User } from "./users.model.js";
import { Post } from "../posts/posts.model.js";
import { Comment } from "../comments/comments.model.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendSuccess, sendError } from "../../utils/response.utils.js";
import type { UpdateUserInput } from "./users.schemas.js";
import type { UserRequest } from "./users.types.js";
import { serializeUserSummary, USER_PUBLIC_SELECT } from "./users.helpers.js";
import { deleteFromCloudinary } from "../../config/cloudinary.js";
import { POST_AUTHOR_POPULATE, serializePosts } from "../posts/posts.helpers.js";
import { createNotification } from "../notifications/notifications.model.js";

const RANKING_LIMIT = 20;

const getViewerId = (req: UserRequest) => req.user?.id;

export const getAllUsers = asyncHandler(async (_req: UserRequest, res: Response) => {
    const users = await User.find().select(USER_PUBLIC_SELECT);
    return sendSuccess(
        res,
        users.map((user) => serializeUserSummary(user))
    );
});

export const getRanking = asyncHandler(async (req: UserRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const users = await User.find().sort({ experience: -1 }).limit(RANKING_LIMIT).select(USER_PUBLIC_SELECT);

    return sendSuccess(
        res,
        users.map((user) => serializeUserSummary(user))
    );
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
    return sendSuccess(
        res,
        followers.map((user) => serializeUserSummary(user))
    );
});

export const getUserFollowing = asyncHandler(async (req: UserRequest, res: Response) => {
    const following = await User.find({ _id: { $in: req.targetUser!.following } }).select(USER_PUBLIC_SELECT);
    return sendSuccess(
        res,
        following.map((user) => serializeUserSummary(user))
    );
});

export const getUserPosts = asyncHandler(async (req: UserRequest, res: Response) => {
    const id = req.params.id as string;
    const posts = await Post.find({ userId: id, visibility: "public", isDeleted: false })
        .populate(POST_AUTHOR_POPULATE)
        .sort({ createdAt: -1 });

    return sendSuccess(res, serializePosts(posts, getViewerId(req)));
});

export const getUserLikedPosts = asyncHandler(async (req: UserRequest, res: Response) => {
    const id = req.params.id as string;
    const userObjectId = new mongoose.Types.ObjectId(id);
    const posts = await Post.find({ likes: userObjectId, isDeleted: false })
        .populate(POST_AUTHOR_POPULATE)
        .sort({ createdAt: -1 });

    return sendSuccess(res, serializePosts(posts, getViewerId(req)));
});

export const getUserBookmarkedPosts = asyncHandler(async (req: UserRequest, res: Response) => {
    const id = req.params.id as string;
    const userObjectId = new mongoose.Types.ObjectId(id);
    const posts = await Post.find({ bookmarks: userObjectId, isDeleted: false })
        .populate(POST_AUTHOR_POPULATE)
        .sort({ createdAt: -1 });

    return sendSuccess(res, serializePosts(posts, getViewerId(req)));
});

export const getUserCommentedPosts = asyncHandler(async (req: UserRequest, res: Response) => {
    const id = req.params.id as string;
    const postIds = await Comment.distinct("postId", { author: id, isDeleted: false });
    const posts = await Post.find({ _id: { $in: postIds }, isDeleted: false })
        .populate(POST_AUTHOR_POPULATE)
        .sort({ createdAt: -1 });

    return sendSuccess(res, serializePosts(posts, getViewerId(req)));
});

export const followUser = asyncHandler(async (req: UserRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const viewerId = req.user.id;
    const targetId = req.params.id as string;

    if (targetId === viewerId) return sendError(res, "No puedes seguirte a ti mismo", 400);

    const target = await User.findById(targetId);
    if (!target) return sendError(res, "Usuario no encontrado", 404);

    const viewer = await User.findById(viewerId);
    if (!viewer) return sendError(res, "No authorized, no user found", 401);

    const targetObjectId = new mongoose.Types.ObjectId(targetId);
    const viewerObjectId = new mongoose.Types.ObjectId(viewerId);

    if (viewer.following.some((id) => id.equals(targetObjectId))) {
        return sendError(res, "Ya sigues a este usuario", 400);
    }

    await User.findByIdAndUpdate(viewerId, { $addToSet: { following: targetObjectId } });
    await User.findByIdAndUpdate(targetId, { $addToSet: { followers: viewerObjectId } });

    const updatedViewer = await User.findById(viewerId);
    const updatedTarget = await User.findById(targetId);

    await createNotification({ type: "follow", to: targetId, from: viewerId });

    return sendSuccess(res, {
        message: `Ahora sigues a @${target.username}`,
        following: true,
        followersCount: updatedTarget?.followers.length ?? 0,
        followingCount: updatedViewer?.following.length ?? 0,
    });
});

export const unfollowUser = asyncHandler(async (req: UserRequest, res: Response) => {
    if (!req.user) return sendError(res, "No authorized, no user found", 401);

    const viewerId = req.user.id;
    const targetId = req.params.id as string;

    if (targetId === viewerId) return sendError(res, "No puedes seguirte a ti mismo", 400);

    const target = await User.findById(targetId);
    if (!target) return sendError(res, "Usuario no encontrado", 404);

    const viewer = await User.findById(viewerId);
    if (!viewer) return sendError(res, "No authorized, no user found", 401);

    const targetObjectId = new mongoose.Types.ObjectId(targetId);
    const viewerObjectId = new mongoose.Types.ObjectId(viewerId);

    if (!viewer.following.some((id) => id.equals(targetObjectId))) {
        return sendError(res, "No sigues a este usuario", 400);
    }

    await User.findByIdAndUpdate(viewerId, { $pull: { following: targetObjectId } });
    await User.findByIdAndUpdate(targetId, { $pull: { followers: viewerObjectId } });

    const updatedViewer = await User.findById(viewerId);
    const updatedTarget = await User.findById(targetId);

    return sendSuccess(res, {
        message: `Ya no sigues a @${target.username}`,
        following: false,
        followersCount: updatedTarget?.followers.length ?? 0,
        followingCount: updatedViewer?.following.length ?? 0,
    });
});

export const updateAvatar = asyncHandler(async (req: UserRequest, res: Response) => {
    if (!req.file) return sendError(res, "No se ha enviado ninguna imagen", 400);

    const user = await User.findById(req.params.id);
    if (!user) return sendError(res, "Usuario no encontrado", 404);

    await deleteFromCloudinary(user.avatar);

    user.avatar = req.file.path;
    await user.save();

    return sendSuccess(res, user, "Avatar actualizado");
});
