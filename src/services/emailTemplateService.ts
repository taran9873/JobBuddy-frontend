import { EmailTemplate } from '../store/emailSettingsStore';
import axios from 'axios';

// Original: const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/email-templates`;
// The VITE_API_URL already includes '/api', so we avoid duplication
const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8081/api'}/email-templates`;

/**
 * Fetch all email templates
 */
export const getAllTemplates = async (): Promise<EmailTemplate[]> => {
  try {
    const response = await axios.get(API_URL);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching email templates:', error);
    throw error;
  }
};

/**
 * Get templates by type
 */
export const getTemplatesByType = async (type: string): Promise<EmailTemplate[]> => {
  try {
    const response = await axios.get(`${API_URL}?type=${type}`);
    return response.data.data;
  } catch (error) {
    console.error(`Error fetching ${type} templates:`, error);
    throw error;
  }
};

/**
 * Get template by ID
 */
export const getTemplateById = async (id: string): Promise<EmailTemplate> => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching template details:', error);
    throw error;
  }
};

/**
 * Create a new template
 */
export const createTemplate = async (template: Omit<EmailTemplate, '_id'>): Promise<EmailTemplate> => {
  try {
    const response = await axios.post(API_URL, template);
    return response.data.data;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
};

/**
 * Update an existing template
 */
export const updateTemplate = async (id: string, template: Partial<EmailTemplate>): Promise<EmailTemplate> => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, template);
    return response.data.data;
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
};

/**
 * Delete a template
 */
export const deleteTemplate = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/${id}`);
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
};

/**
 * Set a template as default
 */
export const setDefaultTemplate = async (id: string): Promise<EmailTemplate> => {
  try {
    const response = await axios.patch(`${API_URL}/${id}/set-default`);
    return response.data.data;
  } catch (error) {
    console.error('Error setting template as default:', error);
    throw error;
  }
}; 