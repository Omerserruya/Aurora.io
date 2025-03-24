import express, { Request, Response, NextFunction } from "express";
const authRoute = express.Router();
import auth from "../controllers/auth_controller";
import { authentification } from "../controllers/auth_controller";
import passport from "../../passport-config"; 
import { IUser } from "../models/user_model";

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: The Authentication API
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: accessToken
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: The user name
 *         email:
 *           type: string
 *           description: The user email
 *         password:
 *           type: string
 *           description: The user password
 *       example:
 *         username: 'bob'
 *         email: 'bob@gmail.com'
 *         password: '123456'
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Error during registration
 */
authRoute.post('/register', auth.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       401:
 *         description: Unauthorized
 */
authRoute.post('/login', auth.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout a user
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Error during logout
 */
authRoute.post('/logout', auth.logout);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh the access token
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Error during token refresh
 */
authRoute.post('/refresh', auth.refreshToken);

/**
 * @swagger
 * /auth/test:
 *   post:
 *     summary: Test the authentication middleware
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Auth successful
 *       401:
 *         description: Unauthorized
 */
authRoute.post('/test', authentification, auth.test);
authRoute.get('/test', authentification, auth.test);

/**
 * @swagger
 * /auth/current:
 *   get:
 *     summary: Get current user information
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Unauthorized
 */
authRoute.get('/current', authentification, auth.getCurrentUser);

// GitHub authentication routes
/**
 * @swagger
 * /auth/github:
 *   get:
 *     summary: Authenticate with GitHub
 *     tags: [Auth]
 *     description: Redirects to GitHub for authentication
 *     responses:
 *       302:
 *         description: Redirects to GitHub OAuth page
 */
authRoute.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));

/**
 * @swagger
 * /auth/github/callback:
 *   get:
 *     summary: GitHub authentication callback
 *     tags: [Auth]
 *     description: Callback URL for GitHub OAuth authentication
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: OAuth code from GitHub
 *     responses:
 *       302:
 *         description: Redirects to frontend callback URL with user details or error
 */
authRoute.get('/github/callback', 
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('github', { session: false }, (err: Error | null, user: IUser | false, info: any) => {
      if (err && err.message === 'email_exists') {
        return res.redirect('/oauth/callback?error=email_exists');
      }
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.redirect('/oauth/callback?error=auth_failed');
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  auth.loginExternal
);

// Google authentication routes
/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Authenticate with Google
 *     tags: [Auth]
 *     description: Redirects to Google for authentication
 *     responses:
 *       302:
 *         description: Redirects to Google OAuth page
 */
authRoute.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

/**
 * @swagger
 * /auth/google/callback:
 *   get:
 *     summary: Google authentication callback
 *     tags: [Auth]
 *     description: Callback URL for Google OAuth authentication
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: OAuth code from Google
 *     responses:
 *       302:
 *         description: Redirects to frontend callback URL with user details or error
 */
authRoute.get('/google/callback', 
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('google', { session: false }, (err: Error | null, user: IUser | false, info: any) => {
      if (err && err.message === 'email_exists') {
        return res.redirect('/oauth/callback?error=email_exists');
      }
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.redirect('/oauth/callback?error=auth_failed');
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  auth.loginExternal
);

export default authRoute;