import mongoose, { Schema } from "mongoose";
import { UserType } from "./users.types.js";

const userSchema: Schema<UserType> = new Schema(
    {
        username: {
            type: String,
            required: [true, "El nombre de usuario es obligatorio"],
            unique: true,
            index: true,
            trim: true,
        },
        firstName: { type: String, required: [true, "El nombre es obligatorio"] },
        lastName: { type: String, required: [true, "El apellido es obligatorio"] },
        email: {
            type: String,
            required: [true, "El email es obligatorio"],
            unique: true,
            lowercase: true,
            immutable: true,
        },
        password: {
            type: String,
            required: [true, "La contraseña es obligatoria"],
            select: false,
        },
        displayName: { type: String },
        bio: { type: String, maxLength: 2000 },
        phoneNumber: { type: String },
        avatar: { type: String, default: "/pictures/user/default-avatar.png" },
        coverImage: { type: String },
        address: { type: String },
        role: { type: String, enum: ["user", "admin"], default: "user" },
        verified: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        experience: { type: Number, default: 0 },
        serieProgress: {
            saga: { type: Number, default: 0 },
            arc: { type: Number, default: 0 },
            episode: { type: Number, default: 0 },
        },
        unlockedCards: {
            characters: { type: [Number], default: [] },
            items: { type: [Number], default: [] },
            fruits: { type: [Number], default: [] },
            swords: { type: [Number], default: [] },
            boats: { type: [Number], default: [] },
        },
        privacy: {
            showPosts: { type: Boolean, default: true },
            showLikes: { type: Boolean, default: true },
            showBookmarked: { type: Boolean, default: true },
            showComments: { type: Boolean, default: true },
        },
        followers: [{ type: Schema.Types.ObjectId, ref: "users", default: [] }],
        following: [{ type: Schema.Types.ObjectId, ref: "users", default: [] }],
        orders: [{ type: Schema.Types.ObjectId, default: [] }],
        bookings: [{ type: Schema.Types.ObjectId, default: [] }],
    },
    {
        timestamps: true,
    }
);

userSchema.virtual("fullName").get(function () {
    if (this.firstName && this.lastName) return `${this.firstName} ${this.lastName}`;
    return this.displayName || this.username;
});

export const User = mongoose.model<UserType>("users", userSchema);
