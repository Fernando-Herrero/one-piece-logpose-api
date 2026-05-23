import { Router } from "express";
import * as usersController from "./users.controller.js";
import { createUserSchema, updateUserSchema, userIdParamSchema } from "./users.schemas.js";
import { validate } from "../../utils/validate.middleware.js";

export const userRoutes: Router = Router();

const withId = validate(userIdParamSchema, "params");

userRoutes.get("/", usersController.getAllUsers);

userRoutes.get("/:id/stats", withId, usersController.getUserStats);
userRoutes.get("/:id/followers", withId, usersController.getUserFollowers);
userRoutes.get("/:id/following", withId, usersController.getUserFollowing);
userRoutes.get("/:id/posts", withId, usersController.getUserPosts);
userRoutes.get("/:id/liked-posts", withId, usersController.getUserLikedPosts);
userRoutes.get("/:id/bookmarked-posts", withId, usersController.getUserBookmarkedPosts);
userRoutes.get("/:id/commented-posts", withId, usersController.getUserCommentedPosts);

userRoutes.get("/:id", withId, usersController.getOneUser);

userRoutes.post("/", validate(createUserSchema), usersController.createUser);

userRoutes.patch("/:id", withId, validate(updateUserSchema), usersController.editUser);

userRoutes.delete("/:id", withId, usersController.deleteUser);
