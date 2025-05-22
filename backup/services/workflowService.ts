import axios from 'axios';

// Interfaces pour les données de workflow
interface WorkflowStep {
  id?: number;
  name: string;
  description: string;
  order: number;
  assignee_type: 'user' | 'role' | 'department';
  assignee_id: number;
  workflow_id?: number;
}

interface WorkflowData {
  name: string;
  description: string;
  department_id: number;
  steps: WorkflowStep[];
  is_active?: boolean;
}

const BASE_URL = 'https://www.backend.lnb-intranet.globalitnet.org';

export const workflowService = {
  // Récupérer les workflows par département
  async getWorkflowsByDepartment(token: string) {
    const response = await axios.get(`${BASE_URL}/workflows/api/workflows/by-department/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      }
    });
    return response.data;
  },

  // Créer un nouveau workflow
  async createWorkflow(token: string, workflowData: WorkflowData) {
    const response = await axios.post(`${BASE_URL}/api/workflows/`, workflowData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    return response.data;
  },

  // Créer une étape de workflow
  async createWorkflowStep(token: string, stepData: WorkflowStep) {
    const response = await axios.post(`${BASE_URL}/api/workflows/steps/`, stepData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    return response.data;
  }
};