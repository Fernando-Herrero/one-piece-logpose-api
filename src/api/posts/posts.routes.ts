import { Router } from "express";
import * as postsController from "./posts.controller.js";

export const postRoutes: Router = Router();

postRoutes.get("/", postsController.getAllPosts);

postRoutes.get("/user/:userId", postsController.getPostsByUser);

postRoutes.get("/my-posts/:userId", postsController.getMyPosts);

postRoutes.get("/share/:shareToken", postsController.getPostByShareToken);

postRoutes.get("/:id", postsController.getOnePost);

postRoutes.post("/", postsController.createPost);

postRoutes.put("/:id", postsController.editPost);

postRoutes.delete("/:id", postsController.deletePost);
