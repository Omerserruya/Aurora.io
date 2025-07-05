import express from 'express';
import { getRecommendations } from '../controllers/aiRecommendations.controller';
import { authentification } from '../shared/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: AI Recommendations
 *     description: AI-powered infrastructure recommendations
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
 * /ai-recommendations:
 *   get:
 *     summary: Get AI recommendations for cloud infrastructure
 *     tags: [AI Recommendations]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *       - in: query
 *         name: connectionId
 *         schema:
 *           type: string
 *         required: true
 *         description: The cloud connection ID
 *       - in: query
 *         name: refresh
 *         schema:
 *           type: string
 *         required: false
 *         description: Whether to refresh recommendations (true/false)
 *     responses:
 *       200:
 *         description: Successfully retrieved AI recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       impact:
 *                         type: string
 *                       solution:
 *                         type: string
 *                       severity:
 *                         type: string
 *                         enum: [Critical, Medium, Low]
 *                       color:
 *                         type: string
 *                         enum: [error, warning, info, success]
 *                       icon:
 *                         type: string
 *       400:
 *         description: Missing required parameters
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
// REST endpoint for AI recommendations
router.get('/', authentification, getRecommendations);

export default router; 