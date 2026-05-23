import { Router } from "express";
import * as commentsController from "./comments.controller.js";

export const commentRoutes: Router = Router();

commentRoutes.get("/post/:postId", commentsController.getCommentsByPost);

commentRoutes.post("/", commentsController.createComment);

commentRoutes.delete("/:id", commentsController.deleteComment);
