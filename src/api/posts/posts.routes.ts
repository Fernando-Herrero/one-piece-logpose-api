import { Router } from "express";
import * as postsController from "./posts.controller.js";
import {
    assertPostHasPdf,
    assertPostOwner,
    loadPost,
    loadPostByShareToken,
    validateCreatePostAuthor,
    validateUpdatePostText,
} from "./posts.middlewares.js";
import { createPostSchema, postIdParamSchema, removePostImageSchema, shareTokenParamSchema, updatePostSchema } from "./posts.schemas.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { checkAuth, optionalAuth } from "../auth/auth.middleware.js";
import { uploadPdf, uploadPostImages, uploadPostMedia } from "../../config/cloudinary.js";

export const postRoutes: Router = Router();

const withPostId = validate(postIdParamSchema, "params");
const withShareToken = validate(shareTokenParamSchema, "params");
const withCreatePost = validate(createPostSchema);
const withUpdatePost = validate(updatePostSchema);
const withRemovePostImage = validate(removePostImageSchema);

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
    [checkAuth, withPostId, loadPost, assertPostOwner, assertPostHasPdf, uploadPdf.single("pdf")],
    postsController.updatePostPdf
);

postRoutes.post(
    "/:id/images",
    [checkAuth, withPostId, loadPost, assertPostOwner, uploadPostImages.array("images", 4)],
    postsController.addPostImages
);

postRoutes.delete(
    "/:id/images",
    [checkAuth, withPostId, withRemovePostImage, loadPost, assertPostOwner],
    postsController.removePostImage
);
