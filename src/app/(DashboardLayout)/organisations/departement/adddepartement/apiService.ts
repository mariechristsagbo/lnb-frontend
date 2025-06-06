import api from "@/config/api";

interface User {
  id: number;
  role: string;
  nom: string;
  prenom: string;
  username: string;
}

export interface DepartmentFormData {
  name: string;
  description: string;
  responsable_id: string | null;
}

// Récupérer la liste des utilisateurs
export const fetchUsers = async (): Promise<User[]> => {
  try {
    const response = await api.get('/utilisateurs/user-gestion/list-all-users/');
    console.log(response.data);
    // Gérer les deux formats de réponse possibles
    return Array.isArray(response.data) ? response.data : response?.data?.utilisateurs || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    throw error;
  }
};

// Créer un nouveau département
export const createDepartment = async (data: Omit<DepartmentFormData, 'responsable_id'> & { 
  responsable_id: number | null 
}): Promise<any> => {
  try {
    const response = await api.post('/services/departments/create/', data);
    return response;
  } catch (error) {
    console.error("Erreur lors de la création du département:", error);
    throw error;
  }
};