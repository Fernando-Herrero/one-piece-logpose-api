import { Router } from "express";
import * as commentsController from "./comments.controller.js";
import {
    loadAuthorFromBody,
    loadComment,
    loadPostFromBody,
    loadPostFromParams,
    validateParentComment,
} from "./comments.middlewares.js";
import {
    commentActionUserSchema,
    commentIdParamSchema,
    createCommentSchema,
    postIdParamSchema,
    viewerQuerySchema,
} from "./comments.schemas.js";
import { validate } from "../../middlewares/validate.middleware.js";

export const commentRoutes: Router = Router();

const withCommentId = validate(commentIdParamSchema, "params");
const withPostId = validate(postIdParamSchema, "params");
const withViewer = validate(viewerQuerySchema, "query");
const withCreateComment = validate(createCommentSchema);
const withActionUser = validate(commentActionUserSchema);

commentRoutes.get(
    "/post/:postId",
    [withPostId, withViewer, loadPostFromParams],
    commentsController.getCommentsByPost
);

commentRoutes.post(
    "/",
    [withCreateComment, loadPostFromBody, loadAuthorFromBody, validateParentComment],
    commentsController.createComment
);

commentRoutes.delete("/:id", [withCommentId, loadComment], commentsController.deleteComment);

commentRoutes.post(
    "/:id/like",
    [withCommentId, withActionUser, loadComment],
    commentsController.toggleLikeComment
);
