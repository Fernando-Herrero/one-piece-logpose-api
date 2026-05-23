import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Tipo de una función controller async: recibe req/res/next y devuelve una Promise.
 * Express 5 soporta async nativo, pero este wrapper sigue siendo útil para centralizar
 * el manejo de errores con next(error) de forma explícita y predecible.
 */
type AsyncController = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Envuelve controllers async para delegar errores inesperados al errorHandler global.
 *
 * Flujo:
 *   1. Express llama al handler devuelto por asyncHandler.
 *   2. Ejecutamos tu controller (fn) dentro de Promise.resolve().
 *   3. Si fn termina bien → responde con sendSuccess/sendError como siempre.
 *   4. Si fn lanza o la Promise falla → .catch(next) pasa el error a errorHandler.
 *
 * Qué NO sustituye:
 *   - Respuestas de negocio (404, 400…) las sigues devolviendo tú con sendError.
 *   - Solo elimina el try/catch repetido que capturaba fallos técnicos (BD, etc.).
 */
export const asyncHandler =
    (fn: AsyncController): RequestHandler =>
    (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
