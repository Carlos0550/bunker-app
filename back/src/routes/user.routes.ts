import { Router } from "express";
import { userController } from "@/controllers/user.controller";
import { authenticate } from "@/middlewares/auth";
import { validateBody } from "@/middlewares/validateBody";
import { registerSchema, loginSchema, updateUserSchema, recoverPasswordSchema } from "@/schemas/user.schema";
import { imageUploader } from "@/middlewares/upload";
import { validateQuery } from "@/middlewares";
import z from "zod";

const router = Router();

 
router.post("/auth/register", validateBody(registerSchema), userController.register);
router.post("/auth/login", validateBody(loginSchema), userController.login);
router.post("/auth/logout", authenticate, userController.logout);
router.get("/auth/me", authenticate, userController.me);
router.post("/auth/recover-password", validateQuery(recoverPasswordSchema), userController.recoverPassword);

 
router.patch("/", authenticate, validateBody(updateUserSchema), userController.updateUser);
router.patch("/profile-photo", authenticate, imageUploader.single("photo"), userController.updateProfilePhoto);

router.post("/auth/reset-password", validateBody(z.object({ token: z.string(), newPassword: z.string().min(6) })), userController.resetPassword);

export default router;
