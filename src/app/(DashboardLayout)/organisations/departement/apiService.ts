import { Department, Responsable } from './types';
import Cookies from 'js-cookie';
import { api } from '@/config/api';


export const API_ENDPOINTS = {
  GET_DEPARTMENTS: `/services/departments/`,
  DELETE_DEPARTMENT: `/services/departments/`,
  GET_DEPARTMENT_DETAILS: `/services/departments/`,
  GET_USERS: `/utilisateurs/user-gestion/list-all-users/`,
  UPDATE_DEPARTMENT: `/services/departments/`,
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = Cookies.get('authTokens');
  if (!token) throw new Error("Non authentifié");
  
  try {
    const accessToken = JSON.parse(token).access;
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
  } catch (e) {
    throw new Error("Session invalide");
  }
};

export const fetchDepartments = async (): Promise<Department[]> => {
  try {
    const { data } = await api.get(API_ENDPOINTS.GET_DEPARTMENTS);
    return Array.isArray(data) ? data : data?.departments || [];
  } catch (error: any) {
    const errorMessage = error.response?.data?.detail || 'Erreur lors de la récupération des départements';
    throw new Error(errorMessage);
  }
};

export const fetchDepartmentDetails = async (id: number): Promise<Department> => {
  try {
    const { data } = await api.get(`${API_ENDPOINTS.GET_DEPARTMENT_DETAILS}${id}/`);
    return data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.detail || 'Erreur lors de la récupération des détails';
    throw new Error(errorMessage);
  }
};

export const deleteDepartment = async (id: number): Promise<void> => {
  try {
    const token = Cookies.get('authTokens');
    if (!token) throw new Error("Non authentifié");
    
    const accessToken = JSON.parse(token).access;
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.DELETE_DEPARTMENT}${id}/delete/`,
      {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Erreur lors de la suppression");
    }
  } catch (error: any) {
    const errorMessage = error.message || 'Erreur lors de la suppression';
    throw new Error(errorMessage);
  }
};

export const updateDepartment = async (id: number, data: any): Promise<Department> => {
  try {
    const token = Cookies.get('authTokens');
    if (!token) throw new Error("Non authentifié");
    
    const accessToken = JSON.parse(token).access;
    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.UPDATE_DEPARTMENT}${id}/update/`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Erreur lors de la modification.");
    }

    return await response.json();
  } catch (error: any) {
    const errorMessage = error.message || 'Erreur lors de la mise à jour';
    throw new Error(errorMessage);
  }
};

export const fetchUsers = async (): Promise<Responsable[]> => {
  try {
    const response = await api.get(API_ENDPOINTS.GET_USERS);
    return Array.isArray(response.data) ? response.data : response.data.utilisateurs || [];
  } catch (error: any) {
    const errorMessage = error.response?.data?.detail || 'Erreur lors de la récupération des utilisateurs';
    throw new Error(errorMessage);
  }
};