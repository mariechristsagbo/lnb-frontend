import { api } from '@/config/api';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  username: string;
}

interface UserProfile {
  utilisateur: {
    id: number;
    username: string;
    role: string | null;
    nom: string | null;
    prenom: string | null;
    email: string;
    telephone: string | null;
    adresse: string | null;
    date_naissance: string | null;
    lieu_naissance: string | null;
    statut: string;
    photo_profil: string | null;
    is_deleted: boolean;
    language: string;
    timezone: string;
    departement?: string | null;
    service?: string | null;
    chef_service?: string | null;
    position_info?: {
      ip: string;
      bogon: boolean;
    };
  };
}
export interface Department {
  id: number;
  name: string;
}

export interface Group {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  bio: string;
  adresse: string;
  group_type: 'logique' | 'physique';
  department: string;
  function: string;
  project: string;
  auto_assign: boolean;
  role_id: number;
  photo: string | File;
  created_by: number;
  parent_group_id?: number;
}


// ---- Types pour les permissions ----
export interface Permission {
  id: number;
  name: string;
  description: string;
  category: string | null;
}

// ---- Types pour le niveau hiérarchique ----
export interface HierarchyLevel {
  id: number;
  name: string;
  level: number;
  order?: number; // certains objets ont ce champ
}

// ---- Types pour les départements ----
export interface Department {
  id: number;
  name: string;
  code: string | null;
}

// ---- Types pour les rôles ----
export interface Role {
  id: number;
  name: string;
  description: string;
  department: Department;
  hierarchy_level: HierarchyLevel;
  weight: number;
  superior_role: {
    id: number;
    name: string;
    hierarchy_level: number;
  } | null;
  subordinate_roles: any[];
  permissions: Permission[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ---- Types pour le résultat global ----
export interface RolesApiResponse {
  roles: Role[];
  total_count: number;
  departments: Department[];
  hierarchy_levels: HierarchyLevel[];
}


export const userService = {
  // Récupérer tous les utilisateurs
  async getAllUsers(): Promise<{ utilisateurs: User[] }> {
    const response = await api.get<{ utilisateurs: User[] }>(
      '/utilisateurs/user-gestion/list-all-users/'
    );
    return response.data;
  },

  // // Récupérer tous les départements
  // async getDepartments(): Promise<{ departments: Department[] }> {
  //   const response = await api.get<{ departments: Department[] }>(
  //     '/services/departments/'
  //   );
  //   return response.data;
  // },

  // Récupérer le profil de l'utilisateur connecté
  async getUserProfile(): Promise<UserProfile> {
    const response = await api.get<UserProfile>(
      `/utilisateurs/user-gestion/user-profile/`
    );
    return response.data;
  },
};


export const groupService = {
  // Créer un groupe
  async createGroup(data: FormData): Promise<{ id: number }> {
    const response = await api.post<{ id: number }>(
      '/utilisateurs_groupes/create-group/',
      data,
      { isFormData: true }
    );
    return response.data;
  },

  // Créer un sous-groupe
  async createSubgroup(data: FormData): Promise<{ id: number }> {
    const response = await api.post<{ id: number }>(
      '/utilisateurs_groupes/create-subgroup/',
      data,
      { isFormData: true }
    );
    return response.data;
  },

  // Ajouter des membres à un groupe
  async addGroupMembers(groupId: number, memberIds: number[]): Promise<void> {
    await api.post(
      `/utilisateurs_groupes/add-members-to-group/${groupId}/`, 
      { member_ids: memberIds }
    );
  },

  // Lister tous les groupes
  async listGroups(): Promise<Array<{ id: number; name: string }>> {
    const response = await api.get<Array<{ id: number; name: string }>>(
      '/utilisateurs_groupes/list-groups/'
    );
    return response.data;
  },

  // Récupérer un groupe par ID
  async getGroup(groupId: number): Promise<Group> {
    const response = await api.get<Group>(
      `/utilisateurs_groupes/groups/${groupId}/`
    );
    return response.data;
  },

  // Mettre à jour un groupe
  async updateGroup(groupId: number, data: Partial<Group>): Promise<Group> {
    const response = await api.patch<Group>(
      `/utilisateurs_groupes/groups/${groupId}/`,
      data
    );
    return response.data;
  },

  // Supprimer un groupe
  async deleteGroup(groupId: number): Promise<void> {
    await api.delete(`/utilisateurs_groupes/groups/${groupId}/`);
  }
};


export const role = async () => {
  const response = await api.get<RolesApiResponse>(
    '/roles/list-roles/'
  );
  return response.data;
}