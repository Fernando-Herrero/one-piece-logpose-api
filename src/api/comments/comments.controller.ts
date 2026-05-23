import { Request, Response } from "express";
import { Comment } from "./comments.model.js";
import { Post } from "../posts/posts.model.js";
import { asyncHandler } from "../../utils/async-handler.js";
import { sendSuccess, sendError } from "../../utils/response.utils.js";

const AUTHOR_FIELDS = "username firstName lastName avatar";

async function syncPostCommentsCount(postId: unknown): Promise<void> {
    const id = String(postId);
    const n = await Comment.countDocuments({ postId: id });
    await Post.findByIdAndUpdate(id, { commentsCount: n });
}

export const createComment = asyncHandler(async (req: Request, res: Response) => {
    const body = { ...req.body };
    if (body.parentComment) {
        body.isReply = true;
    }
    const newComment = await Comment.create(body);
    await Post.findByIdAndUpdate(newComment.postId, { $inc: { commentsCount: 1 } });
    const populated = await Comment.findById(newComment._id)
        .populate("author", AUTHOR_FIELDS)
        .populate({ path: "parentComment", populate: { path: "author", select: AUTHOR_FIELDS } });
    return sendSuccess(res, populated, "Comentario creado", 201);
});

export const getCommentsByPost = asyncHandler(async (req: Request, res: Response) => {
    const { postId } = req.params;
    const comments = await Comment.find({ postId })
        .populate("author", AUTHOR_FIELDS)
        .populate({ path: "parentComment", populate: { path: "author", select: AUTHOR_FIELDS } });
    return sendSuccess(res, comments);
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const comment = await Comment.findById(id);

    if (!comment) {
        return sendError(res, "Comentario no encontrado", 404);
    }

    const postId = comment.postId;
    await Comment.deleteMany({ parentComment: id });
    await Comment.findByIdAndDelete(id);
    await syncPostCommentsCount(postId);

    return sendSuccess(res, comment, "Comentario eliminado");
});
