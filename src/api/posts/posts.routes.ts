import { Router } from "express";
import * as postsController from "./posts.controller.js";
import {
    createPostSchema,
    postActionUserSchema,
    postIdParamSchema,
    shareTokenParamSchema,
    updatePostSchema,
    viewerQuerySchema,
} from "./posts.schemas.js";
import { validate } from "../../utils/validate.middleware.js";

export const postRoutes: Router = Router();

const withPostId = validate(postIdParamSchema, "params");
const withViewer = validate(viewerQuerySchema, "query");

postRoutes.get("/", withViewer, postsController.getAllPosts);

postRoutes.get("/share/:shareToken", validate(shareTokenParamSchema, "params"), withViewer, postsController.getPostByShareToken);

postRoutes.get("/:id", withPostId, withViewer, postsController.getOnePost);

postRoutes.post("/", validate(createPostSchema), postsController.createPost);

postRoutes.patch("/:id", withPostId, validate(updatePostSchema), postsController.editPost);

postRoutes.delete("/:id", withPostId, postsController.deletePost);

postRoutes.post("/:id/like", withPostId, validate(postActionUserSchema), postsController.toggleLikePost);

postRoutes.post("/:id/bookmark", withPostId, validate(postActionUserSchema), postsController.toggleBookmarkPost);
