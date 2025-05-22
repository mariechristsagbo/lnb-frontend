// Fichier généré pour consommer les endpoints du module workflows
import axios, { AxiosResponse } from 'axios';
import Cookies from 'js-cookie';

// ===================== TYPES ===================== //
export interface UserBasic {
  id: number;
  username: string;
  email: string;
  name?: string;
}

export interface Document {
  id: number;
  title: string;
  description?: string;
  file: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  uploaded_by: number | UserBasic;
  uploaded_by_name?: string;
  uploaded_at: string;
  created_at?: string;
}

export interface Department {
  id: number;
  name: string;
}

export interface Service {
  id: number;
  name: string;
}

export interface Role {
  id: number;
  name: string;
}

export interface WorkflowStep {
  id: number;
  workflow: number | Workflow;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  order: number;
  is_validation_required: boolean;
  assign_to_all: boolean;
  assigned_roles?: Role[];
  assigned_departments?: Department[];
  assigned_services?: Service[];
  hierarchy_level?: number;
  hierarchy_direction?: 'up' | 'down';
  default_assignee?: UserBasic | null;
}

export interface HierarchyConfig {
  id: number;
  step: number;
  level: number;
  direction: 'up' | 'down';
  department?: number;
}

export interface Workflow {
  id: number;
  name: string;
  description?: string;
  code: string;
  status: 'active' | 'inactive' | 'maintenance';
  steps?: WorkflowStep[];
  services?: Service[];
  departments?: Department[];
  authorized_roles?: Role[];
  created_by?: UserBasic;
  created_at?: string;
  updated_at?: string;
}

export interface Comment {
  id: number;
  user: number;
  user_name: string;
  content: string;
  created_at: string;
}

export type StepInstance = {
  id: number;
  status: "pending_validation" | "validated" | "not_validated" | "waiting" | "pending" | "approved" | "rejected" | "in_review" | "completed" | "in_progress";
  status_display?: string;
  task_name?: string;
  request_title?: string;
  priority?: string;
  created_at?: string;
  step?: number | {
    name?: string;
    description?: string;
  };
  // Assurez-vous que EServiceRequest est bien défini ou importé ici aussi
  request?: number | EServiceRequest;

  // Ajoutez ou vérifiez la présence de cette ligne si nécessaire
  [key: string]: unknown;
};

export interface EServiceRequest {
  id: number;
  title?: string;
  description?: string;
  request_code?: string;
  reference_number?: string;
  requester: number | UserBasic;
  requester_name?: string;
  workflow: number | Workflow;
  workflow_name?: string;
  workflow_id?: number;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled' | 'in_review' | 'draft' | 'completed';
  status_display?: string;
  priority?: 'high' | 'medium' | 'normal';
  current_task?: number;
  current_task_name?: string;
  current_step?: number | WorkflowStep;
  current_step_instance?: number | StepInstance;
  task_instances?: StepInstance[];
  attachments?: Document[];
  documents?: Document[];
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface StatisticsResponse {
  total_workflows: number;
  active_workflows: number;
  total_requests: number;
  pending_requests: number;
  completed_requests: number;
  requests_by_status: Record<string, number>;
  requests_by_workflow: Record<string, number>;
  requests_timeline: Record<string, number>;
  average_completion_time: number;
}

// ===================== API BASE ===================== //
const API_BASE = 'https://www.backend.lnb-intranet.globalitnet.org/workflows/';

// Configuration globale pour ajouter les tokens JWT
axios.interceptors.request.use(config => {
  try {
    const tokenCookie = document.cookie
      .split(';')
      .find(cookie => cookie.trim().startsWith('authTokens='));
      
    if (tokenCookie) {
      const tokenValue = decodeURIComponent(tokenCookie.split('=')[1]);
      const tokenData = JSON.parse(tokenValue);
      if (tokenData && tokenData.access) {
        config.headers['Authorization'] = `Bearer ${tokenData.access}`;
      }
    }
  } catch (error) {
    console.error("Erreur lors de la récupération du token d'authentification:", error);
  }
  
  return config;
});

// ===================== WORKFLOWS ===================== //
export const listWorkflows = () => axios.get<Workflow[]>(`${API_BASE}workflows/`);
export const createWorkflow = (data: Partial<Workflow>) => axios.post<Workflow>(`${API_BASE}workflows/create/`, data);
export const retrieveWorkflow = (id: number) => axios.get<Workflow>(`${API_BASE}workflows/${id}/`);
export const updateWorkflow = (id: number, data: Partial<Workflow>) => axios.put<Workflow>(`${API_BASE}workflows/${id}/update/`, data);
export const partialUpdateWorkflow = (id: number, data: Partial<Workflow>) => axios.patch<Workflow>(`${API_BASE}workflows/${id}/partial-update/`, data);
export const deleteWorkflow = (id: number) => axios.delete(`${API_BASE}workflows/${id}/delete/`);
export const listWorkflowSteps = (workflowId: number) => axios.get<WorkflowStep[]>(`${API_BASE}workflows/${workflowId}/steps/`);
export const listOrganizationalWorkflows = () => axios.get<Workflow[]>(`${API_BASE}workflows/organizational-workflows/`);
export const updateWorkflowStartStepOrder = (id: number, data: { start_step_order: number }) => 
  axios.put<Workflow>(`${API_BASE}workflows/${id}/start-step-order/`, data);

// ===================== ÉTAPES DE WORKFLOW ===================== //
export const listWorkflowStepsAll = () => axios.get<WorkflowStep[]>(`${API_BASE}workflow-steps/`);
export const createWorkflowStep = (data: Partial<WorkflowStep>) => axios.post<WorkflowStep>(`${API_BASE}workflow-steps/create/`, data);
export const retrieveWorkflowStep = (id: number) => axios.get<WorkflowStep>(`${API_BASE}workflow-steps/${id}/`);
export const updateWorkflowStep = (id: number, data: Partial<WorkflowStep>) => axios.put<WorkflowStep>(`${API_BASE}workflow-steps/${id}/update/`, data);
export const partialUpdateWorkflowStep = (id: number, data: Partial<WorkflowStep>) => 
  axios.patch<WorkflowStep>(`${API_BASE}workflow-steps/${id}/partial-update/`, data);
export const deleteWorkflowStep = (id: number) => axios.delete(`${API_BASE}workflow-steps/${id}/delete/`);
export const getStepHierarchyConfig = (stepId: number) => 
  axios.get<HierarchyConfig>(`${API_BASE}steps/${stepId}/hierarchy-config/`);
export const updateStepHierarchyConfig = (stepId: number, data: Partial<HierarchyConfig>) => 
  axios.put<HierarchyConfig>(`${API_BASE}steps/${stepId}/hierarchy-config/`, data);
export const assignStepHierarchical = (stepId: number, data: { department?: number }) => 
  axios.post(`${API_BASE}steps/${stepId}/hierarchical-assignment/`, data);
export const testStepHierarchicalAssignment = (stepId: number) => 
  axios.get(`${API_BASE}steps/${stepId}/hierarchical-assignment/test/`);
export const testStepHierarchicalAssignmentWithData = (stepId: number, data: { department?: number }) => 
  axios.post(`${API_BASE}steps/${stepId}/hierarchical-assignment/test/`, data);

// ===================== DEMANDES DE eSERVICE ===================== //
export const listEServiceRequests = () => axios.get<EServiceRequest[]>(`${API_BASE}requests/`);
export const createEServiceRequest = (data: Partial<EServiceRequest>) => 
  axios.post<EServiceRequest>(`${API_BASE}requests/create/`, data);
export const retrieveEServiceRequest = (id: number) => axios.get<EServiceRequest>(`${API_BASE}requests/${id}/`);
export const updateEServiceRequest = (id: number, data: Partial<EServiceRequest>) => 
  axios.put<EServiceRequest>(`${API_BASE}requests/${id}/update/`, data);
export const partialUpdateEServiceRequest = (id: number, data: Partial<EServiceRequest>) => 
  axios.patch<EServiceRequest>(`${API_BASE}requests/${id}/partial-update/`, data);
export const deleteEServiceRequest = (id: number) => axios.delete(`${API_BASE}requests/${id}/delete/`);
export const getRequestStepsHistory = (requestId: number) => 
  axios.get<StepInstance[]>(`${API_BASE}requests/${requestId}/history/`);
export const addDocumentToEServiceRequest = (requestId: number, data: FormData) => 
  axios.post<Document>(`${API_BASE}requests/${requestId}/add-document/`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
export const cancelEServiceRequest = (requestId: number, data: { comment?: string; reason?: string }) => 
  axios.post(`${API_BASE}requests/${requestId}/cancel/`, data);

/* 
// export async function createEServiceRequest(data: any) {
//   // Vérifie ici l'URL exacte attendue par ton backend
//   return axios.post('/workflows/requests/', data); // ← à adapter si besoin
// }
*/

// ===================== INSTANCES D'ÉTAPE ===================== //
export const listStepInstances = () => axios.get<StepInstance[]>(`${API_BASE}step-instances/`);
export const retrieveStepInstance = (id: number) => axios.get<StepInstance>(`${API_BASE}step-instances/${id}/`);
export const updateStepInstance = (id: number, data: Partial<StepInstance>) => 
  axios.put<StepInstance>(`${API_BASE}step-instances/${id}/update/`, data);
export const partialUpdateStepInstance = (id: number, data: Partial<StepInstance>) => 
  axios.patch<StepInstance>(`${API_BASE}step-instances/${id}/partial-update/`, data);
export const updateStepInstanceStatus = (instanceId: number, data: { action: string; comments?: string }) => 
  axios.post(`${API_BASE}step-instances/${instanceId}/update-status/`, data);
export const addDocumentToStepInstance = (instanceId: number, data: FormData) => 
  axios.post<Document>(`${API_BASE}step-instances/${instanceId}/add-document/`, data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

export const assignStepInstance = async (
  stepInstanceId: number,
  targetUserId: number
): Promise<AxiosResponse<StepInstance>> => {
  const token = getAuthToken(); // Assurez-vous que getAuthToken récupère le bon token (Bearer)
  if (!token) throw new Error("Non authentifié");
  try {
    const payload = { user_id: targetUserId };
    const response = await axios.post<StepInstance>(
      `${API_BASE}step-instances/${stepInstanceId}/assign/`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response;
  } catch (error) {
    console.error(`Erreur API assignStepInstance (step: ${stepInstanceId}, user: ${targetUserId}):`, error);
    throw error;
  }
};

// ===================== VUES UTILISATEUR ===================== //
export const getMyRequests = () => axios.get<EServiceRequest[]>(`${API_BASE}my-requests/`);
export const getAssignedTasks = () => axios.get<StepInstance[]>(`${API_BASE}assigned-tasks/`);
export const getAvailableWorkflows = () => axios.get<Workflow[]>(`${API_BASE}available-workflows/`);

// ===================== STATISTIQUES ===================== //
export const getWorkflowStatistics = () => axios.get<StatisticsResponse>(`${API_BASE}statistics/`);

// Fonction utilitaire pour gestion des erreurs axios
export const handleAxiosError = (error: unknown): string => {
  // Vérifiez si c'est une erreur Axios 
  if (axios.isAxiosError(error) && error.response) {
    // La requête a été faite et le serveur a répondu avec un code d'état
    if (error.response.status === 401) {
      return 'Session expirée. Veuillez vous reconnecter.';
    } else if (error.response.status === 403) {
      return 'Vous n\'avez pas les permissions nécessaires pour cette action.';
    } else if (error.response.data) {
      // Si le serveur a renvoyé un message d'erreur
      const errorMessage = typeof error.response.data === 'string' 
        ? error.response.data 
        : JSON.stringify(error.response.data);
      return `Erreur: ${errorMessage}`;
    }
    return `Erreur du serveur (${error.response.status})`;
  } else if (axios.isAxiosError(error) && error.request) {
    // La requête a été faite mais aucune réponse n'a été reçue
    return 'Aucune réponse du serveur. Veuillez vérifier votre connexion.';
  } else {
    // Une erreur s'est produite lors de la configuration de la requête
    return error instanceof Error ? error.message : 'Une erreur inconnue est survenue';
  }
};

// Utilisation de JS-Cookie comme alternative pour les environnements où document.cookie n'est pas disponible
export const getAuthToken = () => {
  try {
    // Utiliser l'import ES6 au lieu de require
    if (typeof window !== 'undefined') {
      const tokenCookie = Cookies.get('authTokens');
      
      if (!tokenCookie) {
        return null;
      }
      
      try {
        const tokenData = JSON.parse(tokenCookie);
        if (tokenData && tokenData.access) {
          return tokenData.access;
        }
      } catch (e) {
        console.error('Erreur de parsing du token:', e);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du token:', error);
    return null;
  }
};

// Configuration manuelle pour les cas où l'intercepteur ne fonctionne pas
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  } : {
    'Content-Type': 'application/json',
  };
};