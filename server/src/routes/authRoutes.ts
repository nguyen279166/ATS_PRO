import { Router } from "express";
import { avatarUpload } from "../utils/cvStorage";
import { validateBody } from "../middleware/validate";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validation/schemas";
import authMiddleware from "./authMiddleware";
import {
  changePassword,
  forgotPassword,
  login,
  me,
  register,
  resetPassword,
  uploadAvatar,
} from "../modules/auth/authController";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.post(
  "/forgot-password",
  validateBody(forgotPasswordSchema),
  forgotPassword,
);
router.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  resetPassword,
);
router.get("/me", authMiddleware, me);
router.put(
  "/password",
  authMiddleware,
  validateBody(changePasswordSchema),
  changePassword,
);
router.post(
  "/upload",
  authMiddleware,
  avatarUpload.single("avatar"),
  uploadAvatar,
);

export default router;
