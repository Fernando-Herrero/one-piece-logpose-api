import { Types } from "mongoose";

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
