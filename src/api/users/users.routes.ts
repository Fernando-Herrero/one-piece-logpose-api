import { Router } from "express";
import * as usersController from "./users.controller.js";
import { createUserSchema, updateUserSchema, userIdParamSchema } from "./users.schemas.js";
import { validate } from "../../utils/validate.middleware.js";

export const userRoutes: Router = Router();

userRoutes.get("/", usersController.getAllUsers);

userRoutes.get("/:id", validate(userIdParamSchema, "params"), usersController.getOneUser);

userRoutes.post("/", validate(createUserSchema), usersController.createUser);

userRoutes.patch(
    "/:id",
    validate(userIdParamSchema, "params"),
    validate(updateUserSchema),
    usersController.editUser
);

userRoutes.delete("/:id", validate(userIdParamSchema, "params"), usersController.deleteUser);
