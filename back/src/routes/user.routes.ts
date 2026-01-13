import { Router } from "express";
import { userController } from "@/controllers/user.controller";
import { authenticate, authorize } from "@/middlewares/auth";
import { validateBody } from "@/middlewares/validateBody";
import {
  registerSchema,
  loginSchema,
  updateUserSchema,
  recoverPasswordSchema,
  createAdminSchema,
  createUserByAdminSchema,
  updateUserByAdminSchema,
} from "@/schemas/user.schema";
import { imageUploader } from "@/middlewares/upload";
import { validateQuery, verifySubscription } from "@/middlewares";
import z from "zod";
const router = Router();
router.post("/auth/register", validateBody(registerSchema), userController.register);
router.post("/auth/login", validateBody(loginSchema), userController.login);
router.post("/auth/logout", authenticate, userController.logout);
router.get("/auth/me", authenticate, userController.me);
router.post("/auth/recover-password", validateQuery(recoverPasswordSchema), userController.recoverPassword);
router.post(
  "/auth/reset-password",
  validateBody(z.object({ token: z.string(), newPassword: z.string().min(6) })),
  userController.resetPassword
);
router.get("/auth/verify-email", userController.verifyEmail);
router.post(
  "/auth/resend-verification",
  validateBody(z.object({ email: z.string().email() })),
  userController.resendVerificationEmail
);
router.patch("/", authenticate, validateBody(updateUserSchema), userController.updateUser);
router.patch("/profile-photo", authenticate, imageUploader.single("photo"), userController.updateProfilePhoto);
router.post("/users/create", authenticate, verifySubscription, validateBody(createUserByAdminSchema), userController.createUserByAdmin);
router.get("/users/business", authenticate, verifySubscription, userController.getUsersByBusiness);
router.patch("/users/:id", authenticate, verifySubscription, validateBody(updateUserByAdminSchema), userController.updateUserByAdmin);
router.delete("/users/:id", authenticate, verifySubscription, userController.deleteUser);
router.post("/admins", authenticate, authorize(0, 1), validateBody(createAdminSchema), userController.createAdmin);
router.get("/admins", authenticate, authorize(0, 1), userController.getBusinessAdmins);
export default router;
