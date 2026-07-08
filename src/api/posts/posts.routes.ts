import { Router } from "express";
import * as postsController from "./posts.controller.js";
import {
    assertPostOwner,
    loadPost,
    loadPostByShareToken,
    validateCreatePostAuthor,
    validateUpdatePostText,
} from "./posts.middlewares.js";
import { createPostSchema, postIdParamSchema, shareTokenParamSchema, updatePostSchema } from "./posts.schemas.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { checkAuth, optionalAuth } from "../auth/auth.middleware.js";
import { uploadPdf, uploadPostMedia } from "../../config/cloudinary.js";

export const postRoutes: Router = Router();

const withPostId = validate(postIdParamSchema, "params");
const withShareToken = validate(shareTokenParamSchema, "params");
const withCreatePost = validate(createPostSchema);
const withUpdatePost = validate(updatePostSchema);

postRoutes.get("/", [optionalAuth], postsController.getAllPosts);

postRoutes.get(
    "/share/:shareToken",
    [optionalAuth, withShareToken, loadPostByShareToken],
    postsController.getPostByShareToken
);

postRoutes.get("/:id", [optionalAuth, withPostId, loadPost], postsController.getOnePost);

postRoutes.post(
    "/",
    [
        checkAuth,
        uploadPostMedia.fields([
            { name: "images", maxCount: 4 },
            { name: "pdf", maxCount: 1 },
        ]),
        withCreatePost,
        validateCreatePostAuthor,
    ],
    postsController.createPost
);

postRoutes.patch(
    "/:id",
    [checkAuth, withPostId, withUpdatePost, loadPost, assertPostOwner, validateUpdatePostText],
    postsController.editPost
);

postRoutes.delete("/:id", [checkAuth, withPostId, loadPost, assertPostOwner], postsController.deletePost);

postRoutes.post("/:id/like", [checkAuth, withPostId, loadPost], postsController.toggleLikePost);

postRoutes.post("/:id/bookmark", [checkAuth, withPostId, loadPost], postsController.toggleBookmarkPost);

postRoutes.patch(
    "/:id/pdf",
    [checkAuth, withPostId, loadPost, assertPostOwner, uploadPdf.single("pdf")],
    postsController.updatePostPdf
);
