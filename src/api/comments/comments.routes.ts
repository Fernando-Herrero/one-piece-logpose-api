import { Router } from "express";
import * as commentsController from "./comments.controller.js";
import {
    commentActionUserSchema,
    commentIdParamSchema,
    createCommentSchema,
    postIdParamSchema,
    viewerQuerySchema,
} from "./comments.schemas.js";
import { validate } from "../../utils/validate.middleware.js";

export const commentRoutes: Router = Router();

const withCommentId = validate(commentIdParamSchema, "params");
const withViewer = validate(viewerQuerySchema, "query");

commentRoutes.get(
    "/post/:postId",
    validate(postIdParamSchema, "params"),
    withViewer,
    commentsController.getCommentsByPost
);

commentRoutes.post("/", validate(createCommentSchema), commentsController.createComment);

commentRoutes.delete("/:id", withCommentId, commentsController.deleteComment);

commentRoutes.post(
    "/:id/like",
    withCommentId,
    validate(commentActionUserSchema),
    commentsController.toggleLikeComment
);
