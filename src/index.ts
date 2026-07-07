import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import "dotenv/config";
import { postRoutes } from "./api/posts/posts.routes.js";
import { commentRoutes } from "./api/comments/comments.routes.js";
import db from "./config/db.js";
import { userRoutes } from "./api/users/users.routes.js";
import { sendSuccess } from "./utils/response.utils.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import authRoutes from "./api/auth/auth.routes.js";

db.connect();

const app: Application = express();
const PORT: number = Number(process.env.PORT) || 3000;

app.use(express.json());

app.use(helmet());

app.use(
    cors({
        // origin: ["http://localhost:1234", "miweb.com"]
    })
);

app.get("/api", (_req: Request, res: Response) => {
    return sendSuccess(res, null, "Server is running correctly");
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRoutes);
app.use("/api/comments", commentRoutes);

// 1) Captura de rutas no encontradas (debe ir DESPUÉS de todas las rutas).
app.use(notFoundHandler);

// 2) Manejador global de errores (siempre el último "middleware" en nuestro servidor).
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

/**
 * Auth JWT — estado actual:
 *
 * ✅ Hecho:
 * - /api/auth: register, login, me, change-password, logout
 * - Identidad vía req.user.id (checkAuth / optionalAuth)
 * - Posts: create/edit/delete/like/bookmark protegidos; assertPostOwner
 * - Comments: create/delete/like protegidos; assertCommentOwner
 * - Users: PATCH/DELETE con assertSelf; POST /users eliminado (usar /auth/register)
 * - GET posts/comments/users con optionalAuth; viewer = req.user?.id
 * - assertPrivacy: dueño/admin bypass
 *
 * ⏳ Pendiente (futuro):
 * - follow/unfollow usuarios
 * - Feed con visibility followers|private
 * - Acceso a posts privados vía shareToken
 * - GET /users/me/* (hoy: GET /auth/me)
 */
