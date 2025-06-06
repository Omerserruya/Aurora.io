import { Request, Response } from 'express';
import { Documentation, IDocumentation } from '../models/Documentation';

export const documentationController = {
  // Get all documentation sections
  getAllSections: async (req: Request, res: Response) => {
    try {
      console.log('Fetching all documentation sections...');
      const sections = await Documentation.find();
      console.log('Found sections:', sections);
      res.json(sections);
    } catch (error) {
      console.error('Error in getAllSections:', error);
      res.status(500).json({ message: 'Error fetching documentation sections', error });
    }
  },

  // Get a single documentation section
  getSection: async (req: Request, res: Response) => {
    try {
      console.log('Fetching section:', req.params.sectionId);
      const section = await Documentation.findOne({ sectionId: req.params.sectionId });
      console.log('Found section:', section);
      if (!section) {
        return res.status(404).json({ message: 'Documentation section not found' });
      }
      res.json(section);
    } catch (error) {
      console.error('Error in getSection:', error);
      res.status(500).json({ message: 'Error fetching documentation section', error });
    }
  },

  // Create a new documentation section
  createSection: async (req: Request, res: Response) => {
    try {
      const { sectionId, title, content, lastModifiedBy } = req.body;
      console.log('Creating section:', { sectionId, title, lastModifiedBy });
      
      // Check if section already exists
      const existingSection = await Documentation.findOne({ sectionId });
      if (existingSection) {
        console.log('Section already exists:', sectionId);
        return res.status(400).json({ message: 'Documentation section already exists' });
      }

      const newSection = new Documentation({
        sectionId,
        title,
        content,
        lastModifiedBy,
        version: 1
      });

      await newSection.save();
      console.log('Created new section:', newSection);
      res.status(201).json(newSection);
    } catch (error) {
      console.error('Error in createSection:', error);
      res.status(500).json({ message: 'Error creating documentation section', error });
    }
  },

  // Update a documentation section
  updateSection: async (req: Request, res: Response) => {
    try {
      const { title, content, lastModifiedBy } = req.body;
      const sectionId = req.params.sectionId;
      console.log('Updating section:', { sectionId, title, lastModifiedBy });

      const section = await Documentation.findOne({ sectionId });
      if (!section) {
        console.log('Section not found:', sectionId);
        return res.status(404).json({ message: 'Documentation section not found' });
      }

      // Update section with new content and increment version
      section.title = title;
      section.content = content;
      section.lastModifiedBy = lastModifiedBy;
      section.version += 1;
      section.lastModified = new Date();

      await section.save();
      console.log('Updated section:', section);
      res.json(section);
    } catch (error) {
      console.error('Error in updateSection:', error);
      res.status(500).json({ message: 'Error updating documentation section', error });
    }
  },

  // Delete a documentation section
  deleteSection: async (req: Request, res: Response) => {
    try {
      console.log('Deleting section:', req.params.sectionId);
      const section = await Documentation.findOneAndDelete({ sectionId: req.params.sectionId });
      if (!section) {
        console.log('Section not found for deletion:', req.params.sectionId);
        return res.status(404).json({ message: 'Documentation section not found' });
      }
      console.log('Deleted section:', section);
      res.json({ message: 'Documentation section deleted successfully' });
    } catch (error) {
      console.error('Error in deleteSection:', error);
      res.status(500).json({ message: 'Error deleting documentation section', error });
    }
  },

  // Get version history of a section
  getVersionHistory: async (req: Request, res: Response) => {
    try {
      console.log('Getting version history for section:', req.params.sectionId);
      const section = await Documentation.findOne({ sectionId: req.params.sectionId });
      if (!section) {
        console.log('Section not found for version history:', req.params.sectionId);
        return res.status(404).json({ message: 'Documentation section not found' });
      }
      
      // Return version history
      const history = {
        currentVersion: section.version,
        lastModified: section.lastModified,
        lastModifiedBy: section.lastModifiedBy
      };
      console.log('Version history:', history);
      res.json(history);
    } catch (error) {
      console.error('Error in getVersionHistory:', error);
      res.status(500).json({ message: 'Error fetching version history', error });
    }
  }
}; 