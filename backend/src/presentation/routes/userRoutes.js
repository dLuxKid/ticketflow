import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import * as authController from '../controllers/authController.js';
import handleImg from '../../shared/middleware/uploadImage.js';

const router = Router();

// ─── Public routes ─────────────────────────────────────────────────────────────
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// Returns current user from cookie/token (no auth required — guest-safe)
router.get(
  '/get-my-account',
  authController.isLoggedIn,
  userController.getMyAccount,
);

// ─── Protected routes ──────────────────────────────────────────────────────────
router.use(authController.protect);

router.get('/me', userController.getUser);
router.patch('/update-my-password', authController.updatePassword);
router.patch('/update-my-details', handleImg, userController.updateMe);
router.delete('/delete-me', userController.deleteMe);

// ─── Admin-only routes ─────────────────────────────────────────────────────────
router.use(authController.restrictTo('admin'));

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUser);

export default router;
