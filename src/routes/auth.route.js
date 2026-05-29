import express from 'express';
import passport from 'passport';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import AuthController from '../controllers/auth.controller.js';

const router = express.Router();

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/login'
  }),
  (req, res) => {
    const user = req.user;

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Redirect với query parameters chứa tokens
    const params = new URLSearchParams({
      accessToken,
      refreshToken,
      email: user.email,
      role: user.role
    });

    res.redirect(`${process.env.BASE_URL_FE}/auth/callback?${params.toString()}`);
  }
);

router.get('/callback', (req, res) => {
  res.send();
});

router.get('/refresh', AuthController.rfToken);

export default router;