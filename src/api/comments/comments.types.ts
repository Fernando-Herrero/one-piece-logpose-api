import { Types } from "mongoose";

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
