import express from "express";
const usersRoute = express.Router();
import userController from "../controllers/user_controller";
import { authentification, internalServiceMiddleware } from "@shared/authMiddleware";
import multer from 'multer';
import path from 'path';
import fs from 'fs';

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: The Users API
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: accessToken
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
 * /users/add:
 *   post:
 *     summary: Create a new user (Admin only)
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully
 *       401:
 *         description: Unauthorized
 */
usersRoute.post('/add', authentification, userController.addUser);

/**
 * @swagger
 * /users/internal/add:
 *   post:
 *     summary: Create a new user (Internal service only)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully
 *       401:
 *         description: Unauthorized - Internal service access only
 */
usersRoute.post('/internal/add', internalServiceMiddleware, userController.addUser);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: A list of users
 */
usersRoute.get('/', userController.getUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: The user data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
usersRoute.get('/:id', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Check if it's an internal service request
  if (req.headers['x-internal-service'] === 'true') {
    return next();
  }
  // Otherwise, apply regular authentication
  authentification(req, res, next);
}, userController.getUserById);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user by ID
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: User updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
usersRoute.put('/:id', (req, res, next) => {
  // Check if it's an internal service request
  if (req.headers['x-internal-service'] === 'true') {
    return next();
  }
  // Otherwise, apply regular authentication
  authentification(req, res, next);
}, userController.updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
usersRoute.delete('/:id', authentification, userController.deleteUser);

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const uploadDirENV = process.env.PROFILE_UPLOAD_PATH;
    if (!uploadDirENV) {
      return cb(new Error('PROFILE_UPLOAD_PATH is not defined in the environment variables') as any);
    }
    const uploadDir = path.resolve(uploadDirENV);
    if (!uploadDir) {
      return cb(new Error('PROFILE_UPLOAD_PATH is not defined in the environment variables') as any);
    }

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = `avatar-${uniqueSuffix}${ext}`;
    console.log('Generated filename:', filename); // Debug log
    cb(null, filename);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req: any, file: any, cb: any) => {
    console.log('Received file:', file.originalname, 'Type:', file.mimetype); // Debug log
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed') as any);
    }
  }
});

/**
 * @swagger
 * /users/{id}/avatar:
 *   post:
 *     summary: Upload a user avatar
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: User avatar image file
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *       400:
 *         description: Bad request or invalid file type
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
usersRoute.post(
  '/:id/avatar',
  authentification,
  upload.single('avatar'),
  userController.uploadAvatar
);

/**
 * @swagger
 * /users/findByEmail/{email}:
 *   get:
 *     summary: Find a user by email (internal service only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: email
 *         schema:
 *           type: string
 *         required: true
 *         description: The user email
 *       - in: query
 *         name: includePassword
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Whether to include the password field
 *     responses:
 *       200:
 *         description: The user data
 *       403:
 *         description: Forbidden - Internal service access only
 *       404:
 *         description: User not found
 */
usersRoute.get('/findByEmail/:email', userController.findUserByEmail);

/**
 * @swagger
 * /users/validatePassword:
 *   post:
 *     summary: Validate a password against a hashed password (internal service only)
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *               - hashedPassword
 *             properties:
 *               password:
 *                 type: string
 *               hashedPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password validation result
 *       401:
 *         description: Unauthorized - Internal service access only
 *       500:
 *         description: Server error
 */
usersRoute.post('/validatePassword', internalServiceMiddleware, userController.validatePassword);

/**
 * @swagger
 * /users/{id}/token:
 *   put:
 *     summary: Add a token to a user (internal service only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token added successfully
 *       401:
 *         description: Unauthorized - Internal service access only
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
usersRoute.put('/:id/token', internalServiceMiddleware, userController.addUserToken);

/**
 * @swagger
 * /users/{id}/token/{token}:
 *   delete:
 *     summary: Remove a token from a user (internal service only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: The token to remove
 *     responses:
 *       200:
 *         description: Token removed successfully
 *       401:
 *         description: Unauthorized - Internal service access only
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
usersRoute.delete('/:id/token/:token', internalServiceMiddleware, userController.removeUserToken);

/**
 * @swagger
 * /users/{id}/verifyToken/{token}:
 *   get:
 *     summary: Verify if a token exists for a user (internal service only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: The token to verify
 *     responses:
 *       200:
 *         description: Token verification result
 *       401:
 *         description: Unauthorized - Internal service access only
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
usersRoute.get('/:id/verifyToken/:token', internalServiceMiddleware, userController.verifyUserToken);

/**
 * @swagger
 * /users/{id}/updateToken:
 *   put:
 *     summary: Update a token for a user (internal service only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldToken
 *               - newToken
 *             properties:
 *               oldToken:
 *                 type: string
 *               newToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token updated successfully
 *       401:
 *         description: Unauthorized - Internal service access only
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
usersRoute.put('/:id/updateToken', internalServiceMiddleware, userController.updateUserToken);

/**
 * @swagger
 * /users/findByGithubId/{githubId}:
 *   get:
 *     summary: Find a user by GitHub ID (internal service only)
 *     description: Retrieves a user by their GitHub ID. This endpoint is only accessible by internal services.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: githubId
 *         schema:
 *           type: string
 *         required: true
 *         description: GitHub ID of the user
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       401:
 *         description: Not authorized to use this endpoint
 *       500:
 *         description: Server error
 */
usersRoute.get('/findByGithubId/:githubId', internalServiceMiddleware, userController.findUserByGithubId);

/**
 * @swagger
 * /users/findByGoogleId/{googleId}:
 *   get:
 *     summary: Find a user by Google ID (internal service only)
 *     description: Retrieves a user by their Google ID. This endpoint is only accessible by internal services.
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: googleId
 *         schema:
 *           type: string
 *         required: true
 *         description: Google ID of the user
 *     responses:
 *       200:
 *         description: User found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       401:
 *         description: Not authorized to use this endpoint
 *       500:
 *         description: Server error
 */
usersRoute.get('/findByGoogleId/:googleId', internalServiceMiddleware, userController.findUserByGoogleId);

/**
 * @swagger
 * /users/reset-password:
 *   post:
 *     summary: Reset user password
 *     description: Allows an authenticated user to reset their password by providing their current password and a new password
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: The user's current password
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: The new password (must be at least 8 characters)
 *             example:
 *               currentPassword: "oldPassword123"
 *               newPassword: "newPassword456"
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password updated successfully"
 *       400:
 *         description: Bad request - missing fields or invalid password
 *       401:
 *         description: Unauthorized - invalid current password or not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
usersRoute.post('/reset-password', authentification, userController.resetPassword);

/**
 * @swagger
 * /users/profile/me:
 *   get:
 *     summary: Get current user profile
 *     description: Get the authenticated user's profile information including firstTimeLogin status
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - user not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
usersRoute.get('/profile/me', authentification, userController.getUserProfile);

export default usersRoute;