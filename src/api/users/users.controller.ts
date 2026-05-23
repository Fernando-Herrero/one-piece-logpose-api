import { Request, Response } from "express";
import mongoose from "mongoose";
import { User } from "./users.model.js";
import { Post } from "../posts/posts.model.js";
import { Comment } from "../comments/comments.model.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendSuccess, sendError } from "../../utils/response.utils.js";
import type { CreateUserInput, UpdateUserInput } from "./users.schemas.js";
import {
    findUserById,
    isPrivacyDenied,
    POST_AUTHOR_SELECT,
    USER_PUBLIC_SELECT,
    type PrivacyKey,
} from "./users.helpers.js";
import type { PrivacySettings } from "./users.types.js";

const getId = (req: Request): string => req.params.id as string;

async function requireUserOr404(id: string, res: Response) {
    const user = await findUserById(id);
    if (!user) {
        sendError(res, "Usuario no encontrado", 404);
        return null;
    }
    return user;
}

function requirePublicProfile(
    user: { privacy?: PrivacySettings },
    key: PrivacyKey,
    res: Response
): boolean {
    if (isPrivacyDenied(user, key)) {
        sendError(res, "Este contenido es privado", 403);
        return false;
    }
    return true;
}

export const getAllUsers = asyncHandler(async (_req: Request, res: Response) => {
    const users = await User.find();
    return sendSuccess(res, users);
});

export const getOneUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await requireUserOr404(getId(req), res);
    if (!user) return;

    return sendSuccess(res, user);
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
    // Body ya validado por createUserSchema en la ruta (campos + .strict())
    const payload = req.body as CreateUserInput;
    const newUser = await User.create(payload);
    return sendSuccess(res, newUser, "Usuario creado", 201);
});

export const editUser = asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const updates = req.body as UpdateUserInput;

    const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!user) {
        return sendError(res, "Usuario no encontrado", 404);
    }

    return sendSuccess(res, user, "Usuario actualizado");
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const user = await User.findById(id);

    if (!user) {
        return sendError(res, "Usuario no encontrado", 404);
    }

    const userPosts = await Post.find({ userId: id }).select("_id");
    const postIds = userPosts.map((p) => p._id);

    await Comment.deleteMany({ postId: { $in: postIds } });
    await Comment.deleteMany({ author: id });
    await Post.deleteMany({ userId: id });
    await User.findByIdAndDelete(id);

    return sendSuccess(res, { ok: "true", removed: user }, "Usuario eliminado");
});

export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const user = await requireUserOr404(id, res);
    if (!user) return;

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

export const getUserFollowers = asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const user = await requireUserOr404(id, res);
    if (!user) return;

    const followers = await User.find({ _id: { $in: user.followers } }).select(USER_PUBLIC_SELECT);
    return sendSuccess(res, followers);
});

export const getUserFollowing = asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const user = await requireUserOr404(id, res);
    if (!user) return;

    const following = await User.find({ _id: { $in: user.following } }).select(USER_PUBLIC_SELECT);
    return sendSuccess(res, following);
});

export const getUserPosts = asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const user = await requireUserOr404(id, res);
    if (!user) return;
    if (!requirePublicProfile(user, "showPosts", res)) return;

    const posts = await Post.find({ userId: id, visibility: "public", isDeleted: false }).populate(
        "userId",
        POST_AUTHOR_SELECT
    );
    return sendSuccess(res, posts);
});

export const getUserLikedPosts = asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const user = await requireUserOr404(id, res);
    if (!user) return;
    if (!requirePublicProfile(user, "showLikes", res)) return;

    const userObjectId = new mongoose.Types.ObjectId(id);
    const posts = await Post.find({ likes: userObjectId, isDeleted: false }).populate("userId", POST_AUTHOR_SELECT);
    return sendSuccess(res, posts);
});

export const getUserBookmarkedPosts = asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const user = await requireUserOr404(id, res);
    if (!user) return;
    if (!requirePublicProfile(user, "showBookmarked", res)) return;

    const userObjectId = new mongoose.Types.ObjectId(id);
    const posts = await Post.find({ bookmarks: userObjectId, isDeleted: false }).populate(
        "userId",
        POST_AUTHOR_SELECT
    );
    return sendSuccess(res, posts);
});

export const getUserCommentedPosts = asyncHandler(async (req: Request, res: Response) => {
    const id = getId(req);
    const user = await requireUserOr404(id, res);
    if (!user) return;
    if (!requirePublicProfile(user, "showComments", res)) return;

    const postIds = await Comment.distinct("postId", { author: id, isDeleted: false });
    const posts = await Post.find({ _id: { $in: postIds }, isDeleted: false }).populate(
        "userId",
        POST_AUTHOR_SELECT
    );
    return sendSuccess(res, posts);
});
