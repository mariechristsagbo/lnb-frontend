// useDepartments.ts
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Department, NotificationType } from '../types';
import { 
  fetchDepartments, 
  fetchDepartmentDetails, 
  deleteDepartment, 
  updateDepartment, 
  fetchUsers 
} from '../apiService';

export function useDepartments() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<NotificationType>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour la modale de détails
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDepartmentDetails, setSelectedDepartmentDetails] = useState<Department | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  
  // États pour la modale d'édition
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDepartment, setEditDepartment] = useState<Department | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  // Charger les départements
  const loadDepartments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDepartments();
      setDepartments(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(message);
      setNotification({ type: 'error', message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger les utilisateurs
  const loadUsers = useCallback(async () => {
    try {
      const userList = await fetchUsers();
      setUsers(userList);
    } catch (err) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
    }
  }, []);

  // Gestion de la sélection
  const handleSelectDepartment = useCallback((id: number) => {
    setSelectedDepartments(prev => 
      prev.includes(id) 
        ? prev.filter(depId => depId !== id)
        : [...prev, id]
    );
  }, []);

  const handleSelectAllDepartments = useCallback((ids: number[]) => {
    setSelectedDepartments(ids);
  }, []);

  // Gestion des détails
  const handleViewDetails = useCallback(async (id: number) => {
    setIsDetailModalOpen(true);
    setIsDetailLoading(true);
    setDetailError(null);
    
    try {
      const details = await fetchDepartmentDetails(id);
      setSelectedDepartmentDetails(details);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des détails';
      setDetailError(message);
    } finally {
      setIsDetailLoading(false);
    }
  }, []);

  // Gestion de l'édition
  const handleOpenEdit = useCallback(async () => {
    if (selectedDepartments.length !== 1) return;
    
    const departmentId = selectedDepartments[0];
    setIsEditLoading(true);
    setEditError(null);
    
    try {
      const details = await fetchDepartmentDetails(departmentId);
      setEditDepartment(details);
      await loadUsers();
      setIsEditModalOpen(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement du département';
      setEditError(message);
      setNotification({ type: 'error', message });
    } finally {
      setIsEditLoading(false);
    }
  }, [selectedDepartments, loadUsers]);

  const handleEditSubmit = useCallback(async (formData: { 
    name: string; 
    description: string; 
    responsable_id: number | '' 
  }) => {
    if (!editDepartment) return;
    
    setIsEditLoading(true);
    setEditError(null);
    
    try {
      const updatedDepartment = await updateDepartment(editDepartment.id, {
        name: formData.name,
        description: formData.description,
        responsable_id: formData.responsable_id || null,
      });
      
      setDepartments(prev => 
        prev.map(dep => 
          dep.id === editDepartment.id ? { ...dep, ...updatedDepartment } : dep
        )
      );
      
      setNotification({ 
        type: 'success', 
        message: 'Département mis à jour avec succès' 
      });
      
      setIsEditModalOpen(false);
      setSelectedDepartments([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setEditError(message);
    } finally {
      setIsEditLoading(false);
    }
  }, [editDepartment]);

  // Gestion de la suppression
  const handleDeleteDepartments = useCallback(async (ids: number[]) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer ${ids.length} département(s) ?`)) {
      return;
    }
    
    setNotification({ 
      type: 'info', 
      message: `Suppression de ${ids.length} département(s) en cours...` 
    });
    
    try {
      await Promise.all(ids.map(id => deleteDepartment(id)));
      setDepartments(prev => prev.filter(dep => !ids.includes(dep.id)));
      setSelectedDepartments(prev => prev.filter(id => !ids.includes(id)));
      
      setNotification({ 
        type: 'success', 
        message: `${ids.length} département(s) supprimé(s) avec succès` 
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setNotification({ type: 'error', message });
    }
  }, []);

  // Filtrage des départements
  const filteredDepartments = useCallback(() => {
    if (!searchQuery) return departments;
    
    const searchLower = searchQuery.toLowerCase();
    return departments.filter(department => {
      const name = department.name?.toLowerCase() || '';
      const description = department.description?.toLowerCase() || '';
      const responsableName = typeof department.responsable === 'object' && department.responsable?.username
        ? department.responsable.username.toLowerCase()
        : '';
      
      return (
        name.includes(searchLower) ||
        description.includes(searchLower) ||
        responsableName.includes(searchLower) ||
        department.code?.toLowerCase().includes(searchLower) ||
        department.functions?.some(fn => fn.toLowerCase().includes(searchLower)) ||
        department.services?.some(svc => svc.toLowerCase().includes(searchLower))
      );
    });
  }, [departments, searchQuery]);

  // Effet de chargement initial
  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  return {
    // État
    departments: filteredDepartments(),
    selectedDepartments,
    searchQuery,
    notification,
    isLoading,
    error,
    isDetailModalOpen,
    selectedDepartmentDetails,
    isDetailLoading,
    detailError,
    isEditModalOpen,
    editDepartment,
    isEditLoading,
    editError,
    users,
    
    // Actions
    setSearchQuery,
    handleSelectDepartment,
    handleSelectAllDepartments,
    handleViewDetails,
    handleOpenEdit,
    handleEditSubmit,
    handleDeleteDepartments,
    closeDetailModal: () => setIsDetailModalOpen(false),
    closeEditModal: () => setIsEditModalOpen(false),
    refreshDepartments: loadDepartments,
    loadDepartments,
    loadUsers,
    filteredDepartments,
  };
}