import axios from 'axios';

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost'}/api/db/documentation`;

export interface DocumentationSection {
  sectionId: string;
  title: string;
  content: string;
  lastModified: Date;
  lastModifiedBy: string;
  version: number;
}

export interface CreateDocumentationSection {
  sectionId: string;
  title: string;
  content: string;
  lastModifiedBy: string;
}

export const documentationService = {
  // Get all documentation sections
  getAllSections: async (): Promise<DocumentationSection[]> => {
    const response = await axios.get(API_BASE_URL);
    return response.data;
  },

  // Get a single documentation section
  getSection: async (sectionId: string): Promise<DocumentationSection> => {
    const response = await axios.get(`${API_BASE_URL}/${sectionId}`);
    return response.data;
  },

  // Create a new documentation section
  createSection: async (section: CreateDocumentationSection): Promise<DocumentationSection> => {
    const response = await axios.post(API_BASE_URL, section);
    return response.data;
  },

  // Update a documentation section
  updateSection: async (sectionId: string, section: Partial<DocumentationSection>): Promise<DocumentationSection> => {
    const response = await axios.put(`${API_BASE_URL}/${sectionId}`, section);
    return response.data;
  },

  // Delete a documentation section
  deleteSection: async (sectionId: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/${sectionId}`);
  },

  // Get version history of a section
  getVersionHistory: async (sectionId: string): Promise<DocumentationSection[]> => {
    const response = await axios.get(`${API_BASE_URL}/${sectionId}/history`);
    return response.data;
  }
}; 