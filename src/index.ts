import express, { Application, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { postRoutes } from "./api/posts/posts.routes.js";
import { commentRoutes } from "./api/comments/comments.routes.js";
import db from "./config/db.js";
import { userRoutes } from "./api/users/users.routes.js";
import { sendSuccess } from "./utils/response.utils.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import authRoutes from "./api/auth/auth.routes.js";
import { notificationRoutes } from "./api/notifications/notifications.routes.js";
import { progressRoutes } from "./api/progress/progress.routes.js";
import { cardRoutes } from "./api/cards/cards.routes.js";
import { serieRoutes } from "./api/serie/serie.routes.js";

db.connect();

const app: Application = express();
const PORT: number = Number(process.env.PORT) || 3000;
const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../public");

app.use(express.json());

app.use(helmet());

app.use(
    cors({
        // origin: ["http://localhost:1234", "miweb.com"]
    })
);

app.use(express.static(publicDir));

app.get("/api", (_req: Request, res: Response) => {
    return sendSuccess(res, null, "Server is running correctly");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/serie", serieRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
