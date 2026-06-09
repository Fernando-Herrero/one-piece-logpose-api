import { Router } from "express";
import { changePassword, login, logout, me, register } from "./auth.controller.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createUserSchema } from "../users/users.schemas.js";
import { checkAuth } from "./auth.middleware.js";
import { changePasswordSchema, loginSchema } from "./auth.schemas.js";

const authRoutes = Router();

authRoutes.post("/register", validate(createUserSchema), register);
authRoutes.post("/login", validate(loginSchema), login);
authRoutes.get("/me", [checkAuth], me);
authRoutes.patch("/change-password", [checkAuth, validate(changePasswordSchema)], changePassword);
authRoutes.post("/logout", [checkAuth], logout);

export default authRoutes;
