import axios from "axios"

const API_BASE_URL = "http://localhost:8000/api"

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message)
    return Promise.reject(error)
  },
)

// Type definitions
export type AIModel = "deepseek" | "mistral" | "openai"

interface ScenarioResponse {
  scenario_query: string
  scenario_context: string
  response_text: string
}

// API endpoints for personality training
export const personalityTrainingApi = {
  // Personality Attributes
  getAttributes: () => api.get("/personality/attributes"),
  updateAttributes: (data: any) => api.put("/personality/attributes", data),

  // Response Templates
  getTemplates: () => api.get("/templates"),
  createTemplate: (data: any) => api.post("/templates", data),
  updateTemplate: (id: string, data: any) => api.put(`/templates/${id}`, data),
  deleteTemplate: (id: string) => api.delete(`/templates/${id}`),

  // Training Scenarios
  getScenarios: () => api.get("/training/scenarios"),
  submitScenarioResponse: (id: string, data: any) => api.post(`/scenarios/${id}/response`, data),

  // Training Progress
  getProgress: () => api.get("/training/progress"),
  saveProgress: (data: any) => api.post("/training/progress", data),

  // AI Evaluation
  evaluateResponse: (data: ScenarioResponse, model?: AIModel) =>
    api.post("/training/evaluate", data, {
      params: { model },
    }),

  // Agent Chat
  chatWithAgent: (data: {
    message: string
    history: Array<{ role: string; content: string }>
    model?: AIModel
  }) => api.post("/agent/chat", data),
}

