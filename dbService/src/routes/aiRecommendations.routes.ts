import express from 'express';
import { AIRecommendation } from '../models/aiRecommendation.model';

const router = express.Router();

// Get recommendations for a user and connection
router.get('/', async (req, res) => {
  try {
    const { userId, connectionId } = req.query;
    
    if (!userId || !connectionId) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const recommendations = await AIRecommendation.find({
      userId,
      connectionId,
    }).sort({ createdAt: -1 });

    res.json({ recommendations });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// Save new recommendations
router.post('/', async (req, res) => {
  try {
    const { userId, connectionId, recommendations } = req.body;

    if (!userId || !connectionId || !recommendations || !Array.isArray(recommendations)) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Delete existing recommendations for this user and connection
    await AIRecommendation.deleteMany({ userId, connectionId });

    // Insert new recommendations
    const recommendationsToSave = recommendations.map(rec => ({
      ...rec,
      userId,
      connectionId,
    }));

    const savedRecommendations = await AIRecommendation.insertMany(recommendationsToSave);

    res.json({ recommendations: savedRecommendations });
  } catch (error) {
    console.error('Error saving recommendations:', error);
    res.status(500).json({ error: 'Failed to save recommendations' });
  }
});

export default router; 