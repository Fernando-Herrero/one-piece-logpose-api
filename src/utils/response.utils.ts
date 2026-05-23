import { Response } from "express";

export type ApiSuccessResponse<T> = {
    status: "success";
    message: string;
    data: T;
};
export type ApiErrorResponse = {
    status: "error";
    message: string;
    code: number;
};

export const sendSuccess = <T>(
    res: Response,
    data: T,
    message = "Operation successful",
    code = 200
) => {
    const body: ApiSuccessResponse<T> = { status: "success", message, data };
    return res.status(code).json(body);
};

export const sendError = (res: Response, message = "Internal error", code = 500) => {
    const body: ApiErrorResponse = { status: "error", message, code };
    return res.status(code).json(body);
};
