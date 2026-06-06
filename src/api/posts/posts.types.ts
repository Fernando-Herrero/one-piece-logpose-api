import { Request } from "express";
import mongoose, { Types } from "mongoose";
import type { UserType } from "../users/users.types.js";

export type PostType = {
    _id: Types.ObjectId;
    text: string;
    userId: Types.ObjectId;
    images?: string[];
    visibility: "public" | "private" | "followers";
    isDeleted: boolean;
    shareToken?: string;
    isRetweet: boolean;
    isReply: boolean;
    isPinned: boolean;
    language: string;
    likes: Types.ObjectId[];
    bookmarks: Types.ObjectId[];
    likesCount: number;
    bookmarksCount: number;
    commentsCount: number;
    retweetsCount: number;
    hashtags: string[];
    mentions: string[];
    retweets: Types.ObjectId[];
};

export type PostDoc = mongoose.Document & PostType;
export type PostAuthorDoc = mongoose.Document & UserType;

/** Request enriquecida por middlewares de posts (loadPost, validateCreatePostAuthor, etc.). */
export type PostRequest = Request & {
    post?: PostDoc;
    postAuthor?: PostAuthorDoc;
};
