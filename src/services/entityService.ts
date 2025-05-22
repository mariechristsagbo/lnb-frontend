import axios from 'axios';

// Interfaces pour les données de l'API
interface Role {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

interface Function {
  id: number;
  name: string;
}

interface Service {
  id: number;
  name: string;
}

const BASE_URL = 'https://www.backend.lnb-intranet.globalitnet.org';

export const entityService = {
  async getAllUsers(token: string) {
    try {
      const response = await fetch('https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/list-all-users/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        console.error('Réponse users non ok:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Données users reçues:', data);

      // Définition du type pour les utilisateurs de l'API
      interface ApiUser {
        id: number | string;
        nom?: string;
        prenom?: string;
        email: string;
        username: string;
      }

      // Transformation des données pour correspondre au format attendu
      const formattedUsers = data.utilisateurs.map((user: ApiUser) => ({
        id: user.id,
        name: `${user.prenom || ''} ${user.nom || ''}`.trim() || user.username,
        email: user.email,
        username: user.username
      }));

      console.log('Données users formatées:', formattedUsers);
      return { results: formattedUsers }; // Format compatible avec le composant
    } catch (error) {
      console.error('Erreur getAllUsers:', error);
      throw error;
    }
  },

  async getAllRoles(token: string) {
    try {
      const response = await axios.get(`${BASE_URL}/roles/list-roles/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Données roles reçues:', response.data);
      const formattedRoles = response.data.roles.map((role: Role) => ({
        id: role.id,
        name: role.name
      }));
      console.log('Données roles formatées:', formattedRoles);
      return { results: formattedRoles };
    } catch (error) {
      console.error('Erreur getAllRoles:', error);
      throw error;
    }
  },

  async getAllDepartments(token: string) {
    try {
      const response = await axios.get(`${BASE_URL}/services/departments/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Données départements reçues:', response.data);
      const formattedDepartments = response.data.departments.map((dept: Department) => ({
        id: dept.id,
        name: dept.name
      }));
      console.log('Données départements formatées:', formattedDepartments);
      return { results: formattedDepartments };
    } catch (error) {
      console.error('Erreur getAllDepartments:', error);
      throw error;
    }
  },

  async getAllFunctions(token: string) {
    try {
      const response = await axios.get(`${BASE_URL}/services/functions/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Données fonctions reçues:', response.data);
      const formattedFunctions = response.data.functions.map((func: Function) => ({
        id: func.id,
        name: func.name
      }));
      console.log('Données fonctions formatées:', formattedFunctions);
      return { results: formattedFunctions };
    } catch (error) {
      console.error('Erreur getAllFunctions:', error);
      throw error;
    }
  },

  async getAllServices(token: string) {
    try {
      const response = await axios.get(`${BASE_URL}/services/list-services/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Données services reçues:', response.data);
      const formattedServices = response.data.services.map((service: Service) => ({
        id: service.id,
        name: service.name
      }));
      console.log('Données services formatées:', formattedServices);
      return { results: formattedServices };
    } catch (error) {
      console.error('Erreur getAllServices:', error);
      throw error;
    }
  }
};