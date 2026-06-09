import { Request } from "express";
import mongoose, { Types } from "mongoose";
import { UserRole } from "../auth/auth.types.js";
import { AuthPayload } from "../auth/auth.types.js";

export type SerieProgress = {
    saga: number;
    arc: number;
    episode: number;
};

export type UnlockedCards = {
    characters: number[];
    items: number[];
    fruits: number[];
    swords: number[];
    boats: number[];
};

export type PrivacySettings = {
    showPosts: boolean;
    showLikes: boolean;
    showBookmarked: boolean;
    showComments: boolean;
};

export type UserType = {
    _id: Types.ObjectId;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    displayName?: string;
    bio?: string;
    phoneNumber?: string;
    avatar?: string;
    coverImage?: string;
    address?: string;
    role: UserRole;
    verified: boolean;
    isActive: boolean;
    experience: number;
    serieProgress: SerieProgress;
    unlockedCards: UnlockedCards;
    privacy: PrivacySettings;
    followers: Types.ObjectId[];
    following: Types.ObjectId[];
    orders?: Types.ObjectId[];
    bookings?: Types.ObjectId[];
    fullName?: string;
};

export type UserDoc = mongoose.Document & UserType;

/**
 * Request enriquecida por middlewares de users.
 * targetUser = perfil accedido vía :id (no confundir con req.user de auth JWT).
 */
export type UserRequest = Request & {
    targetUser?: UserDoc;
    user?: AuthPayload;
};
