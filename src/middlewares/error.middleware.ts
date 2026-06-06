import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response.utils.js";

interface HTTPError extends Error {
    statusCode?: number;
}

// Middleware para rutas no encontradas (404).
// Se ejecuta cuando ninguna ruta previa ha respondido y delega al manejador global.
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
    const error: HTTPError = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

// Middleware global de errores. Debe declarar los 4 parámetros para que
// Express lo identifique como manejador de errores, aunque `next` no se use.
//
// Recibe errores de:
//   - asyncHandler → fallos técnicos en controllers (BD caída, etc.)
//   - notFoundHandler → rutas que no existen (404)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: HTTPError, req: Request, res: Response, next: NextFunction) => {
    const code = err.statusCode || 500;

    // Log completo en servidor para depurar; el cliente recibe mensaje controlado.
    console.error(`[${req.method} ${req.originalUrl}]`, err);

    const message =
        code >= 500 ? "Error interno del servidor" : err.message || "Something went wrong in the server";

    return sendError(res, message, code);
};
