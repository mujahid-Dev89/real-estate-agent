import axios from 'axios';
import { PersonalityAttributes, TrainingScenario, ResponseTemplate } from '../types/training.types';

const BASE_URL = '/api/training';

export const trainingService = {
  // Personality attributes
  saveAttributes: async (attributes: PersonalityAttributes) => {
    const response = await axios.post(`${BASE_URL}/attributes`, attributes);
    return response.data;
  },
  
  // Training scenarios
  submitScenario: async (scenario: TrainingScenario) => {
    const response = await axios.post(`${BASE_URL}/scenarios`, scenario);
    return response.data;
  },
  
  // Response templates
  saveTemplates: async (templates: ResponseTemplate[]) => {
    const response = await axios.post(`${BASE_URL}/templates`, templates);
    return response.data;
  }
};