import express from 'express';
import { documentationController } from '../controllers/documentationController';

const router = express.Router();

// Get all documentation sections
router.get('/', documentationController.getAllSections);

// Get a single documentation section
router.get('/:sectionId', documentationController.getSection);

// Create a new documentation section
router.post('/', documentationController.createSection);

// Update a documentation section
router.put('/:sectionId', documentationController.updateSection);

// Delete a documentation section
router.delete('/:sectionId', documentationController.deleteSection);

// Get version history of a section
router.get('/:sectionId/history', documentationController.getVersionHistory);

export default router; 