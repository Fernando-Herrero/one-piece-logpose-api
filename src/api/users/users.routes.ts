import { Router } from "express";
import * as usersController from "./users.controller.js";
import { assertPrivacy, assertSelf, loadUser } from "./users.middlewares.js";
import { updateUserSchema, userIdParamSchema } from "./users.schemas.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { checkAuth, optionalAuth } from "../auth/auth.middleware.js";
import { uploadAvatar } from "../../config/cloudinary.js";

export const userRoutes: Router = Router();

const withId = validate(userIdParamSchema, "params");
const withUpdateUser = validate(updateUserSchema);

userRoutes.get("/", usersController.getAllUsers);

userRoutes.get("/:id/stats", [withId, loadUser], usersController.getUserStats);
userRoutes.get("/:id/followers", [withId, loadUser], usersController.getUserFollowers);
userRoutes.get("/:id/following", [withId, loadUser], usersController.getUserFollowing);
userRoutes.get(
    "/:id/posts",
    [optionalAuth, withId, loadUser, assertPrivacy("showPosts")],
    usersController.getUserPosts
);
userRoutes.get(
    "/:id/liked-posts",
    [optionalAuth, withId, loadUser, assertPrivacy("showLikes")],
    usersController.getUserLikedPosts
);
userRoutes.get(
    "/:id/bookmarked-posts",
    [optionalAuth, withId, loadUser, assertPrivacy("showBookmarked")],
    usersController.getUserBookmarkedPosts
);
userRoutes.get(
    "/:id/commented-posts",
    [optionalAuth, withId, loadUser, assertPrivacy("showComments")],
    usersController.getUserCommentedPosts
);

userRoutes.get("/:id", [withId, loadUser], usersController.getOneUser);

userRoutes.patch("/:id", [checkAuth, withId, withUpdateUser, assertSelf, loadUser], usersController.editUser);

userRoutes.delete("/:id", [checkAuth, withId, assertSelf, loadUser], usersController.deleteUser);

userRoutes.patch(
    "/:id/avatar",
    [checkAuth, withId, assertSelf, uploadAvatar.single("avatar")],
    usersController.updateAvatar
);
