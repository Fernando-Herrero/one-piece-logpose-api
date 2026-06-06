import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { sendError } from "../utils/response.utils.js";

type ValidationTarget = "body" | "params" | "query";

/**
 * Middleware de validación con Zod.
 * Parsea y sanitiza req.body | req.params | req.query antes del controller.
 * Si falla → 400 con mensajes legibles (sin llegar a MongoDB).
 */
export const validate =
    (schema: ZodType, target: ValidationTarget = "body") =>
    (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req[target]);

        if (!result.success) {
            const message = result.error.issues.map((issue) => issue.message).join(". ");
            sendError(res, message, 400);
            return;
        }

        req[target] = result.data;
        next();
    };
