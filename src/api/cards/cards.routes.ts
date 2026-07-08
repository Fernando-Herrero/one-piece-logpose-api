import { Router } from "express";
import { checkAuth } from "../auth/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import * as cardsController from "./cards.controller.js";
import { cardTypeParamSchema, cardUserIdParamSchema } from "./cards.schemas.js";

export const cardRoutes = Router();

const withCardType = validate(cardTypeParamSchema, "params");
const withUserId = validate(cardUserIdParamSchema, "params");

cardRoutes.get("/catalog", cardsController.getCatalog);
cardRoutes.get("/catalog/:type", [withCardType], cardsController.getCatalogByType);
cardRoutes.get("/me", [checkAuth], cardsController.getMyCollection);
cardRoutes.get("/me/:type", [checkAuth, withCardType], cardsController.getMyCollectionByType);
cardRoutes.get("/users/:userId", [checkAuth, withUserId], cardsController.getUserCollection);
