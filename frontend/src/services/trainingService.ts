// frontend/src/services/trainingService.ts
import axios from 'axios';
import { PersonalityAttributes, TrainingScenario, ResponseTemplate } from '../features/training/types/training.types';

const API_BASE_URL = '/api/training';  // Adjust based on your API configuration

export const trainingService = {
  // Personality Attributes
  saveAttributes: async (attributes: PersonalityAttributes) => {
    const response = await axios.post(`${API_BASE_URL}/attributes`, attributes);
    return response.data;
  },

  getAttributes: async () => {
    const response = await axios.get(`${API_BASE_URL}/attributes`);
    return response.data;
  },

  // Training Scenarios
  submitScenario: async (scenario: TrainingScenario) => {
    const response = await axios.post(`${API_BASE_URL}/scenarios`, scenario);
    return response.data;
  },

  getScenarios: async () => {
    const response = await axios.get(`${API_BASE_URL}/scenarios`);
    return response.data;
  },

  // Response Templates
  saveTemplates: async (templates: ResponseTemplate[]) => {
    const response = await axios.post(`${API_BASE_URL}/templates`, templates);
    return response.data;
  },

  getTemplates: async () => {
    const response = await axios.get(`${API_BASE_URL}/templates`);
    return response.data;
  },
};