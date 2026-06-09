import { Router } from "express";
import { checkAuth } from "../auth/auth.middleware.js";
import * as commentsController from "./comments.controller.js";
import {
    loadAuthorFromBody,
    loadComment,
    loadPostFromBody,
    loadPostFromParams,
    validateParentComment,
    assertCommentOwner,
} from "./comments.middlewares.js";
import { commentIdParamSchema, createCommentSchema, postIdParamSchema } from "./comments.schemas.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { optionalAuth } from "../auth/auth.middleware.js";

export const commentRoutes: Router = Router();

const withCommentId = validate(commentIdParamSchema, "params");
const withPostId = validate(postIdParamSchema, "params");
const withCreateComment = validate(createCommentSchema);

commentRoutes.get(
    "/post/:postId",
    [optionalAuth, withPostId, loadPostFromParams],
    commentsController.getCommentsByPost
);

commentRoutes.post(
    "/",
    [checkAuth, withCreateComment, loadPostFromBody, loadAuthorFromBody, validateParentComment],
    commentsController.createComment
);

commentRoutes.delete(
    "/:id",
    [checkAuth, withCommentId, loadComment, assertCommentOwner],
    commentsController.deleteComment
);

commentRoutes.post("/:id/like", [checkAuth, withCommentId, loadComment], commentsController.toggleLikeComment);
