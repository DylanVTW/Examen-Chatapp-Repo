import express from "express";
import {
  getProfile,
  login,
  logout,
  refresh,
  register,
  uploadProfileImage,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  validateLogin,
  validateRegister,
  handleValidationErrors,
} from "../middleware/validators.js";
import { uploadProfileImage as uploadProfileImageMiddleware } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/register", validateRegister, handleValidationErrors, register);
router.post("/login", validateLogin, handleValidationErrors, login);
router.post("/logout", logout);
router.post("/refresh", refresh);
router.get("/profile", requireAuth, getProfile);
router.post(
  "/profile/image",
  requireAuth,
  uploadProfileImageMiddleware.single("image"),
  uploadProfileImage,
);

export default router;
