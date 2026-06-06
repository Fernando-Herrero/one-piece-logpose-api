import { Router } from "express";
import * as usersController from "./users.controller.js";
import { assertPrivacy, loadUser } from "./users.middlewares.js";
import { createUserSchema, updateUserSchema, userIdParamSchema } from "./users.schemas.js";
import { validate } from "../../middlewares/validate.middleware.js";

export const userRoutes: Router = Router();

const withId = validate(userIdParamSchema, "params");
const withCreateUser = validate(createUserSchema);
const withUpdateUser = validate(updateUserSchema);

userRoutes.get("/", usersController.getAllUsers);

userRoutes.get("/:id/stats", [withId, loadUser], usersController.getUserStats);
userRoutes.get("/:id/followers", [withId, loadUser], usersController.getUserFollowers);
userRoutes.get("/:id/following", [withId, loadUser], usersController.getUserFollowing);
userRoutes.get(
    "/:id/posts",
    [withId, loadUser, assertPrivacy("showPosts")],
    usersController.getUserPosts
);
userRoutes.get(
    "/:id/liked-posts",
    [withId, loadUser, assertPrivacy("showLikes")],
    usersController.getUserLikedPosts
);
userRoutes.get(
    "/:id/bookmarked-posts",
    [withId, loadUser, assertPrivacy("showBookmarked")],
    usersController.getUserBookmarkedPosts
);
userRoutes.get(
    "/:id/commented-posts",
    [withId, loadUser, assertPrivacy("showComments")],
    usersController.getUserCommentedPosts
);

userRoutes.get("/:id", [withId, loadUser], usersController.getOneUser);

userRoutes.post("/", [withCreateUser], usersController.createUser);

userRoutes.patch("/:id", [withId, withUpdateUser, loadUser], usersController.editUser);

userRoutes.delete("/:id", [withId, loadUser], usersController.deleteUser);
