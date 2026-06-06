import { Request } from "express";
import mongoose, { Types } from "mongoose";
import type { PostType } from "../posts/posts.types.js";
import type { UserType } from "../users/users.types.js";

export type CommentType = {
    _id: Types.ObjectId;
    postId: Types.ObjectId;
    author: Types.ObjectId;
    text: string;
    images?: string[];
    likes: Types.ObjectId[];
    likesCount: number;
    repliesCount: number;
    isReply: boolean;
    hashtags: string[];
    mentions: string[];
    isDeleted: boolean;
    source: string;
    language: string;
    parentComment?: Types.ObjectId;
};

export type CommentDoc = mongoose.Document & CommentType;
export type CommentPostDoc = mongoose.Document & PostType;
export type CommentAuthorDoc = mongoose.Document & UserType;

/** Request enriquecida por middlewares de comments. */
export type CommentRequest = Request & {
    post?: CommentPostDoc;
    comment?: CommentDoc;
    commentAuthor?: CommentAuthorDoc;
};
