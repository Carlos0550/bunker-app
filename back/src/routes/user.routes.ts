import { Router } from "express";
import { userController } from "@/controllers/user.controller";
import { authenticate } from "@/middlewares/auth";
import { validateBody } from "@/middlewares/validateBody";
import { registerSchema, loginSchema, updateUserSchema } from "@/schemas/user.schema";
import { imageUploader } from "@/middlewares/upload";

const router = Router();

 
router.post("/auth/register", validateBody(registerSchema), userController.register);
router.post("/auth/login", validateBody(loginSchema), userController.login);
router.post("/auth/logout", authenticate, userController.logout);
router.get("/auth/me", authenticate, userController.me);

 
router.patch("/", authenticate, validateBody(updateUserSchema), userController.updateUser);
router.patch("/profile-photo", authenticate, imageUploader.single("photo"), userController.updateProfilePhoto);

export default router;
