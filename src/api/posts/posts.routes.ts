import { Router } from "express";
import * as postsController from "./posts.controller.js";
import {
    loadPost,
    loadPostByShareToken,
    validateCreatePostAuthor,
    validateUpdatePostText,
} from "./posts.middlewares.js";
import {
    createPostSchema,
    postActionUserSchema,
    postIdParamSchema,
    shareTokenParamSchema,
    updatePostSchema,
    viewerQuerySchema,
} from "./posts.schemas.js";
import { validate } from "../../middlewares/validate.middleware.js";

export const postRoutes: Router = Router();

const withPostId = validate(postIdParamSchema, "params");
const withViewer = validate(viewerQuerySchema, "query");
const withShareToken = validate(shareTokenParamSchema, "params");
const withCreatePost = validate(createPostSchema);
const withUpdatePost = validate(updatePostSchema);
const withActionUser = validate(postActionUserSchema);

postRoutes.get("/", [withViewer], postsController.getAllPosts);

postRoutes.get(
    "/share/:shareToken",
    [withShareToken, withViewer, loadPostByShareToken],
    postsController.getPostByShareToken
);

postRoutes.get("/:id", [withPostId, withViewer, loadPost], postsController.getOnePost);

postRoutes.post("/", [withCreatePost, validateCreatePostAuthor], postsController.createPost);

postRoutes.patch(
    "/:id",
    [withPostId, withUpdatePost, loadPost, validateUpdatePostText],
    postsController.editPost
);

postRoutes.delete("/:id", [withPostId, loadPost], postsController.deletePost);

postRoutes.post("/:id/like", [withPostId, withActionUser, loadPost], postsController.toggleLikePost);

postRoutes.post(
    "/:id/bookmark",
    [withPostId, withActionUser, loadPost],
    postsController.toggleBookmarkPost
);
