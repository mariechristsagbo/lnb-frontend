// Types de données pour l'API
export interface ServiceRequestData {
  workflow: number;
  requester: number;
  description: string;
  status: string;
  current_task?: number;
}

export interface ServiceRequestResponse {
  id: number;
  workflow: number;
  workflow_name: string;
  requester: number;
  requester_name: string;
  description: string;
  status: string;
  status_display: string;
  created_at: string;
  updated_at: string;
  current_task: number | null;
  current_task_name: string | null;
  reference_number: string;
  completed_at: string | null;
}

const API_BASE_URL = 'http://www.backend.lnb-intranet.globalitnet.org';

export const api = {
  async getNotificationTypes() {
    const response = await fetch(`${API_BASE_URL}/notifications/types/`);
    return response.json();
  },

  async getNotifications() {
    const response = await fetch(`${API_BASE_URL}/notifications/received/`);
    return response.json();
  },

  async getNotificationPreferences() {
    const response = await fetch(`${API_BASE_URL}/notifications/preferences/`);
    return response.json();
  },

  async getNotificationCount() {
    const response = await fetch(`${API_BASE_URL}/notifications/count/`);
    return response.json();
  },
}