"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from 'next/link';
// Supprimer les imports non utilisés
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons";
import Cookies from 'js-cookie';
import { jwtDecode } from "jwt-decode"; // Vous devrez peut-être installer cette dépendance

// Mise à jour des interfaces avec des types plus stricts
interface WorkflowStep {
  id: number;
  name: string;
  description: string;
  order: number;
  assignment_type: 'user' | 'service' | 'function' | 'role' | 'department';
  assignment_value?: string;
  requires_all_approvals: boolean;
  auto_assign_next: boolean;
  notification_template?: string;
  is_final_step: boolean;
  template: number;
  assigned_user?: number | null;
  assigned_role?: number | null;
  assigned_service?: number | null;
  assigned_function?: number | null;
  assigned_department?: number | null;
}

interface WorkflowTemplate {
  id: number;
  name: string;
  description: string;
  workflow_type: 'custom' | 'leave_request' | 'service_request';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  steps: WorkflowStep[];
}

// Définition des types pour remplacer any
interface JwtPayload {
  role?: string;
  [key: string]: unknown;
}

interface WorkflowDetails {
  id: number;
  name: string;
  description?: string;
  workflow_type: string;
  steps: WorkflowStep[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface _FormError {
  message: string;
  field?: string;
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkflows, setSelectedWorkflows] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [_userRole, setUserRole] = useState<string | null>(null); // Ajout du préfixe _
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorkflowDetails, setSelectedWorkflowDetails] = useState<WorkflowDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Ajouter ces états pour gérer le modal d'édition
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [workflowToEdit, setWorkflowToEdit] = useState<WorkflowTemplate | null>(null);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    description: string;
    workflow_type: string;
    is_active: boolean;
  }>({
    name: "",
    description: "",
    workflow_type: "custom",
    is_active: true
  });

  // Fonction améliorée pour obtenir les tokens et extraire les informations utilisateur
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authTokens = Cookies.get('authTokens');
        console.log("Cookie authTokens:", authTokens ? "Présent" : "Absent");
        
        if (!authTokens) {
          console.log("Aucun cookie d'authentification trouvé");
          setIsAuthenticated(false);
          setAccessToken(null);
          setUserRole(null);
          setIsLoading(false); // Arrêter le chargement immédiatement
          return;
        }
        
        try {
          const tokens = JSON.parse(authTokens);
          
          if (!tokens || !tokens.access) {
            console.log("Token d'accès manquant dans le cookie");
            setIsAuthenticated(false);
            setAccessToken(null);
            setUserRole(null);
            setIsLoading(false);
            return;
          }
          
          console.log("Token d'accès trouvé et défini");
          setAccessToken(tokens.access);
          setIsAuthenticated(true);
          
          // Extraire les informations de l'utilisateur du token
          try {
            const decoded = jwtDecode<JwtPayload>(tokens.access);
            console.log("Informations du token:", decoded);
            
            // Stocker le rôle de l'utilisateur si disponible
            if (decoded && decoded.role) {
              console.log("Rôle trouvé:", decoded.role);
              setUserRole(decoded.role);
            } else {
              console.log("Aucun rôle trouvé dans le token");
            }
          } catch (decodeError) {
            console.error("Erreur lors du décodage du token:", decodeError);
          }
        } catch (parseError) {
          console.error("Erreur lors du parsing du token:", parseError);
          setIsAuthenticated(false);
          setAccessToken(null);
          setUserRole(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'authentification:", error);
        setIsAuthenticated(false);
        setAccessToken(null);
        setUserRole(null);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Récupération des workflows après authentification
  useEffect(() => {
    async function fetchWorkflows() {
      if (!isAuthenticated || !accessToken) {
        if (!isLoading) {
          setError("Non authentifié");
        }
        return;
      }

      setIsLoading(true);
      
      try {
        // Correction de l'URL de base et gestion des erreurs
        const baseUrl = 'https://www.backend.lnb-intranet.globalitnet.org';
        const response = await fetch(`${baseUrl}/workflows/api/workflows/`, {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.message || `Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        // Traitement des données reçues
        const formattedWorkflows = Array.isArray(data) ? data : data.results || [];
        
        // Ajout des détails pour chaque workflow
        const workflowsWithDetails = await Promise.all(
          formattedWorkflows.map(async (workflow: WorkflowTemplate) => {
            try {
              // Utiliser l'endpoint correct pour les détails
              const detailsResponse = await fetch(`${baseUrl}/workflows/api/workflows/${workflow.id}/`, {
                headers: {
                  "Authorization": `Bearer ${accessToken}`,
                  "Accept": "application/json"
                }
              });
              
              if (!detailsResponse.ok) {
                throw new Error(`Erreur lors de la récupération des détails du workflow ${workflow.id}`);
              }

              const details = await detailsResponse.json();
              
              return {
                ...workflow,
                ...details,
                tasks: details.steps || []
              };
            } catch (error) {
              console.error(`Erreur pour le workflow ${workflow.id}:`, error);
              return workflow;
            }
          })
        );

        setWorkflows(workflowsWithDetails);
        setError(null);
        
      } catch (error) {
        console.error("Erreur lors de la récupération des workflows:", error);
        setError(error instanceof Error ? error.message : "Erreur lors de la récupération des données");
      } finally {
        setIsLoading(false);
      }
    }

    fetchWorkflows();
  }, [isAuthenticated, accessToken, isLoading]);

  const handleDeleteWorkflows = useCallback(async (workflowIds: number[]) => {
    if (!isAuthenticated || !accessToken) {
      setError("Non authentifié");
      return;
    }
  
    setIsLoading(true);
  
    try {
      // Stocker les résultats et erreurs pour chaque suppression
      const results = await Promise.allSettled(workflowIds.map(async (id) => {
        console.log(`Suppression du workflow ${id}...`);
        const response = await fetch(`https://www.backend.lnb-intranet.globalitnet.org/workflows/api/workflows/${id}/`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Erreur lors de la suppression du workflow ${id}:`, errorText);
          
          if (response.status === 401) {
            setIsAuthenticated(false);
            setAccessToken(null);
            throw new Error("Session expirée. Veuillez vous reconnecter.");
          } else if (response.status === 404) {
            throw new Error(`Le workflow avec l'ID ${id} n'existe pas ou a déjà été supprimé.`);
          } else if (response.status === 403) {
            throw new Error(`Vous n'avez pas les droits nécessaires pour supprimer le workflow avec l'ID ${id}.`);
          } else {
            throw new Error(`Erreur ${response.status} lors de la suppression du workflow avec l'ID ${id}.`);
          }
        }
        
        console.log(`Workflow ${id} supprimé avec succès.`);
        return id;
      }));
      
      // Analyser les résultats pour déterminer succès/échecs
      const successfulIds = results
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<number>).value);
        
      const failedCount = results.filter(result => result.status === 'rejected').length;
  
      // Mise à jour de l'état après suppression
      if (successfulIds.length > 0) {
        setWorkflows(prev => prev.filter(w => !successfulIds.includes(w.id)));
        setSelectedWorkflows(prev => prev.filter(id => !successfulIds.includes(id)));
      }
      
      // Message approprié basé sur les résultats
      if (failedCount === 0) {
        setNotification({ 
          type: "success", 
          message: `${successfulIds.length} workflow${successfulIds.length > 1 ? 's' : ''} supprimé${successfulIds.length > 1 ? 's' : ''} avec succès.` 
        });
      } else if (successfulIds.length === 0) {
        setNotification({ 
          type: "error", 
          message: `Échec de la suppression des workflows.` 
        });
      } else {
        setNotification({ 
          type: "success", 
          message: `${successfulIds.length} workflow${successfulIds.length > 1 ? 's' : ''} supprimé${successfulIds.length > 1 ? 's' : ''} avec succès. ${failedCount} échec${failedCount > 1 ? 's' : ''}.` 
        });
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      if (error instanceof Error) {
        setNotification({ type: "error", message: error.message });
      } else {
        setNotification({ type: "error", message: "Une erreur inconnue s'est produite lors de la suppression." });
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, accessToken, setError, setIsLoading, setWorkflows, setSelectedWorkflows, setNotification]);

  // Utilisation de useCallback pour les fonctions
  const handleDeleteConfirmation = useCallback((workflowIds: number[]) => {
    const confirmMessage = workflowIds.length === 1
      ? `Êtes-vous sûr de vouloir supprimer le workflow "${workflows.find(w => w.id === workflowIds[0])?.name || 'Sans nom'}" ?`
      : `Êtes-vous sûr de vouloir supprimer ces ${workflowIds.length} workflows ?`;
  
    if (window.confirm(confirmMessage)) {
      handleDeleteWorkflows(workflowIds);
    }
  }, [workflows, handleDeleteWorkflows]);

  // Utilisation de useMemo pour les calculs coûteux
  const filteredWorkflows = useMemo(() => {
    return workflows.filter(workflow => {
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase();
      return (
        (workflow?.name?.toLowerCase()?.includes(searchLower) ?? false) ||
        (workflow?.description?.toLowerCase()?.includes(searchLower) ?? false)
      );
    });
  }, [workflows, searchQuery]);

  /**
   * Fonction pour formater le type de workflow en texte lisible
   */
  const formatWorkflowType = (type: string): string => {
    switch (type?.toLowerCase()) {
      case 'custom':
        return 'Personnalisé';
      case 'leave_request':
        return 'Demande de congé';
      case 'service_request':
        return 'Demande de services';
      default:
        // Formater le type par défaut en remplaçant les underscores par des espaces et en capitalisant
        if (!type) return 'Type inconnu';
        return type
          .split('_')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
    }
  };

  // Effet pour faire disparaître la notification après un délai
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000); // Disparaît après 5 secondes
      
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Ajoutez cette fonction pour récupérer les détails d'un workflow
  const fetchWorkflowDetails = async (workflowId: number): Promise<void> => {
    if (!isAuthenticated || !accessToken) {
      setError("Non authentifié");
      return;
    }
  
    setIsLoadingDetails(true);
  
    try {
      const baseUrl = 'https://www.backend.lnb-intranet.globalitnet.org';
      
      const response = await fetch(`${baseUrl}/api/workflows/${workflowId}/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
      });
  
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
  
      const data = await response.json();
      setSelectedWorkflowDetails(data);
      setIsModalOpen(true);
      
    } catch (error) {
      console.error("Erreur lors de la récupération des détails:", error);
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Erreur lors de la récupération des détails"
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Ajouter cette fonction pour fermer le modal
  const closeModal = () => {
    setIsModalOpen(false);
    // Petit délai avant de nettoyer les données pour une meilleure UX
    setTimeout(() => setSelectedWorkflowDetails(null), 300);
  };

  // Fonction pour ouvrir le modal d'édition
  const openEditModal = (workflow: WorkflowTemplate) => {
    setWorkflowToEdit(workflow);
    setEditFormData({
      name: workflow.name,
      description: workflow.description || "",
      workflow_type: workflow.workflow_type,
      is_active: workflow.is_active
    });
    setIsEditModalOpen(true);
  };

  // Fonction pour fermer le modal d'édition
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setTimeout(() => {
      setWorkflowToEdit(null);
      setEditFormData({
        name: "",
        description: "",
        workflow_type: "custom",
        is_active: true
      });
    }, 300);
  };

  // Fonction pour gérer les changements dans le formulaire d'édition
  const handleEditChange = (field: keyof typeof editFormData, value: string | boolean) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fonction pour enregistrer les modifications
  const handleSaveEdit = async (): Promise<void> => {
    if (!workflowToEdit || !accessToken) return;
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`https://www.backend.lnb-intranet.globalitnet.org/workflows/workflow-templates/${workflowToEdit.id}/`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editFormData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur lors de la mise à jour: ${response.status} - ${errorText}`);
      }
      
      const updatedWorkflow = await response.json();
      
      // Mettre à jour l'état des workflows
      setWorkflows(prev => prev.map(w => w.id === workflowToEdit.id ? updatedWorkflow : w));
      
      setNotification({
        type: "success",
        message: "Workflow mis à jour avec succès."
      });
      
      closeEditModal();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du workflow:", error);
      if (error instanceof Error) {
        setNotification({
          type: "error",
          message: error.message
        });
      } else {
        setNotification({
          type: "error",
          message: "Une erreur inconnue s'est produite lors de la mise à jour."
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto w-full">
        {/* Barre d'actions */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Workflows
            </h1>
          </div>

          <div className="flex gap-3">
            <Link href="/workflows/addWorkflows">
              <button 
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                disabled={!isAuthenticated || error?.includes("permissions")}
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Nouveau workflow
              </button>
            </Link>
            
            {selectedWorkflows.length > 0 && (
              <div className="flex gap-2">
                <Link href={`/workflows/edit/${selectedWorkflows[0]}`}>
                  <button
                    disabled={selectedWorkflows.length !== 1}
                    className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors
                      ${selectedWorkflows.length === 1 
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  >
                    <PencilIcon className="w-5 h-5 mr-2" />
                    Modifier
                  </button>
                </Link>
                
                <button
                  onClick={() => handleDeleteConfirmation(selectedWorkflows)}
                  className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <TrashBinIcon className="w-5 h-5 mr-2" />
                  Supprimer ({selectedWorkflows.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notifications et erreurs */}
        {error && error.includes("permissions") && (
          <div className="mb-4 p-4 bg-yellow-600 text-white rounded-md">
            <h3 className="font-bold text-lg mb-2">Accès limité</h3>
            <p>{error}</p>
            <p className="mt-2">Si vous pensez que vous devriez avoir accès à cette fonctionnalité, veuillez contacter votre administrateur.</p>
          </div>
        )}

        {error && !error.includes("Non authentifié") && !error.includes("permissions") && (
          <div className="mb-4 p-4 text-white bg-red-600 rounded-md text-center">
            <h3 className="font-bold text-lg mb-2">Erreur</h3>
            <p>{error}</p>
          </div>
        )}

        {notification && (
          <div
            className={`mb-4 p-4 rounded-md text-center ${
              notification.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* INSÉRER LA BARRE DE RECHERCHE ICI - version réduite */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm mb-6">
          <div className="flex items-center px-6 py-4">
            <div className="relative w-64">  {/* Ajout d'une largeur fixe de 64 (256px) */}
              <input
                type="text"
                placeholder="Rechercher un workflow..." // Texte réduit
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <svg 
                className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>

            <div className="ml-4 flex items-center">
              {!isLoading && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredWorkflows.length} sur {workflows.length} workflows
                </span>
              )}
            </div>

            {selectedWorkflows.length > 0 && (
              <div className="ml-4 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {selectedWorkflows.length} {selectedWorkflows.length === 1 ? 'élément sélectionné' : 'éléments sélectionnés'}
              </div>
            )}
          </div>
        </div>

        {/* Section du tableau avec une width fixe et overflow contrôlé */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm">
          {/* En-tête du tableau avec le nombre total */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-800 dark:text-white">
              Liste des templates de workflow
              {!isLoading && (
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({workflows.length} {workflows.length === 1 ? 'template' : 'templates'})
                </span>
              )}
            </h2>
          </div>
          
          {/* État de chargement */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-700 dark:border-t-blue-400"></div>
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Chargement des workflows...</p>
            </div>
          ) : error ? (
            <div className="py-12 px-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Une erreur est survenue</h3>
              <p className="text-gray-500 dark:text-gray-400">{error}</p>
            </div>
          ) : workflows.length === 0 ? (
            <div className="py-12 px-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Aucun workflow trouvé</h3>
              <p className="text-gray-500 dark:text-gray-400">Aucun template de workflow disponible. Commencez par en créer un nouveau.</p>
              <Link href="/workflows/addWorkflows">
                <button className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Créer un workflow
                </button>
              </Link>
            </div>
          ) : (
            // Container du tableau avec défilement horizontal limité à cette section
            <div className="overflow-x-auto" style={{ maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="w-10 px-6 py-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                          onChange={(e) => {
                            const allIds = workflows.map(w => w.id);
                            setSelectedWorkflows(e.target.checked ? allIds : []);
                          }}
                          checked={selectedWorkflows.length === workflows.length && workflows.length > 0}
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Nom</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Description</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Étapes</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Statut</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Date de création</th>
                    <th scope="col" className="relative px-6 py-3 w-32">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
                  {filteredWorkflows.map((workflow) => (
                    <tr 
                      key={workflow.id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        selectedWorkflows.includes(workflow.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                            checked={selectedWorkflows.includes(workflow.id)}
                            onChange={() => {
                              const isSelected = selectedWorkflows.includes(workflow.id);
                              setSelectedWorkflows(
                                isSelected
                                  ? selectedWorkflows.filter(id => id !== workflow.id)
                                  : [...selectedWorkflows, workflow.id]
                              );
                            }}
                          />
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{workflow.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs truncate text-sm text-gray-500 dark:text-gray-400">
                          {workflow.description || "Aucune description"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          workflow.workflow_type?.toLowerCase() === 'custom'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                            : workflow.workflow_type?.toLowerCase() === 'leave_request'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : workflow.workflow_type?.toLowerCase() === 'service_request'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {formatWorkflowType(workflow.workflow_type)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-center font-medium">
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {workflow.steps ? workflow.steps.length : 0}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          workflow.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          <span className={`mr-1.5 h-2 w-2 rounded-full ${
                            workflow.is_active ? 'bg-green-500' : 'bg-gray-500'
                          }`}></span>
                          {workflow.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(workflow.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => fetchWorkflowDetails(workflow.id)}
                            className="rounded p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900"
                            title="Voir les détails"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000-4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => openEditModal(workflow)}
                            className="rounded p-1 text-yellow-600 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-900"
                            title="Modifier"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteConfirmation([workflow.id])}
                            className="rounded p-1 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900"
                            title="Supprimer"
                          >
                            <TrashBinIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination - à implémenter si nécessaire */}
          {!isLoading && workflows.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex flex-1 justify-between sm:hidden">
                <button className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Précédent</button>
                <button className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Suivant</button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Affichage de <span className="font-medium">{filteredWorkflows.length}</span> résultats sur <span className="font-medium">{workflows.length}</span> au total
                  </p>
                </div>
                {/* Pagination à implémenter si nécessaire */}
              </div>
            </div>
          )}
        </div>
      </div>
    
      {/* ...Reste du code: modals, notifications, etc. */}
      {notification && (
        <div
          className={`fixed bottom-4 right-4 p-4 rounded-md shadow-lg ${
            notification.type === "success" 
              ? "bg-green-600 text-white" 
              : "bg-red-600 text-white"
          }`}
          style={{ zIndex: 1000, maxWidth: '400px' }}
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {notification.type === "success" ? (
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">
                {notification.message}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setNotification(null)}
                  className="inline-flex rounded-md p-1.5 text-white hover:bg-white hover:bg-opacity-10 focus:outline-none"
                >
                  <span className="sr-only">Fermer</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal de détails du workflow */}
      {isModalOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay de fond sombre */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={closeModal}
            ></div>

            {/* Centrage du modal */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Contenu du modal */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
              {isLoadingDetails ? (
                <div className="p-8 flex justify-center items-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
                  <p className="ml-3 text-gray-700 dark:text-gray-300">Chargement des détails...</p>
                </div>
              ) : selectedWorkflowDetails ? (
                <>
                  {/* En-tête du modal */}
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white" id="modal-title">
                      Détails du workflow
                    </h3>
                    <button 
                      type="button" 
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                      onClick={closeModal}
                    >
                      <span className="sr-only">Fermer</span>
                      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Corps du modal - informations générales */}
                  <div className="px-6 py-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                          <span>{selectedWorkflowDetails.name}</span>
                          <span className={`ml-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            selectedWorkflowDetails.is_active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                            <span className={`mr-1.5 h-2 w-2 rounded-full ${
                              selectedWorkflowDetails.is_active ? 'bg-green-500' : 'bg-gray-500'
                            }`}></span>
                            {selectedWorkflowDetails.is_active ? 'Actif' : 'Inactif'}
                          </span>
                          <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            selectedWorkflowDetails.workflow_type?.toLowerCase() === 'custom'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                              : selectedWorkflowDetails.workflow_type?.toLowerCase() === 'leave_request'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : selectedWorkflowDetails.workflow_type?.toLowerCase() === 'service_request'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                          }`}>
                            {formatWorkflowType(selectedWorkflowDetails.workflow_type)}
                          </span>
                        </h4>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{selectedWorkflowDetails.description || "Aucune description"}</p>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Créé le:</span>{' '}
                          {new Date(selectedWorkflowDetails.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Modifié le:</span>{' '}
                          {new Date(selectedWorkflowDetails.updated_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">ID:</span>{' '}
                          {selectedWorkflowDetails.id}
                        </div>
                      </div>
                    </div>

                    {/* Liste des étapes */}
                    {selectedWorkflowDetails.steps && selectedWorkflowDetails.steps.length > 0 ? (
                      <div className="mt-6">
                        <h4 className="font-medium text-gray-800 dark:text-white mb-2">
                          Étapes du workflow ({selectedWorkflowDetails.steps.length})
                        </h4>
                        <ul className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden divide-y divide-gray-200 dark:divide-gray-700">
                          {selectedWorkflowDetails.steps
                            .sort((a: WorkflowStep, b: WorkflowStep) => a.order - b.order)
                            .map((step: WorkflowStep, index: number) => (
                              <li key={step.id} className="p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                                <div className="flex items-start">
                                  <div className="flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mr-3">
                                    {index + 1}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex justify-between">
                                      <h5 className="font-medium text-gray-900 dark:text-white">
                                        {step.name}
                                        {step.is_final_step && (
                                          <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                                            Étape finale
                                          </span>
                                        )}
                                      </h5>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                      {step.description || "Aucune description"}
                                    </p>
                                    
                                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                                      <div className="flex items-center">
                                        <span className="font-medium text-gray-700 dark:text-gray-300 mr-1">Assigné à:</span>
                                        <span>
                                          {step.assignment_type === 'user' && 'Utilisateur spécifique'}
                                          {step.assignment_type === 'role' && 'Rôle'}
                                          {step.assignment_type === 'service' && 'Service'}
                                          {step.assignment_type === 'function' && 'Fonction'}
                                          {step.assignment_type === 'department' && 'Département'}
                                        </span>
                                      </div>
                                      
                                      <div className="flex items-center">
                                        <span className="font-medium text-gray-700 dark:text-gray-300 mr-1">Approvals:</span>
                                        <span>
                                          {step.requires_all_approvals ? 'Tous requis' : 'Un seul requis'}
                                        </span>
                                      </div>
                                      
                                      <div className="flex items-center">
                                        <span className="font-medium text-gray-700 dark:text-gray-300 mr-1">Auto-assignation:</span>
                                        <span>
                                          {step.auto_assign_next ? 'Activée' : 'Désactivée'}
                                        </span>
                                      </div>
                                      
                                      <div className="flex items-center">
                                        <span className="font-medium text-gray-700 dark:text-gray-300 mr-1">Ordre:</span>
                                        <span>{step.order}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="mt-6">
                        <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400 dark:text-yellow-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-100">Aucune étape définie</h3>
                              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-200">
                                <p>Ce workflow n&apos;a pas d&apos;étapes définies. Utilisez l&apos;éditeur pour ajouter des étapes.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div> {/* Ajout de cette balise fermante */}

                  {/* Pied du modal avec les boutons d'action */}
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                      onClick={closeModal}
                    >
                      Fermer
                    </button>
                    <Link href={`/workflows/edit/${selectedWorkflowDetails.id}`}>
                      <button
                        type="button"
                        className="inline-flex items-center rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600"
                      >
                        <PencilIcon className="mr-2 h-4 w-4" />
                        Modifier
                      </button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-gray-500 dark:text-gray-400">
                    Impossible de charger les détails du workflow. Veuillez réessayer.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Modal d'édition du workflow */}
      {isEditModalOpen && workflowToEdit && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay de fond sombre */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
              onClick={closeEditModal}
            ></div>

            {/* Centrage du modal */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Contenu du modal */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              {/* En-tête du modal */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white" id="modal-title">
                  Modifier le workflow
                </h3>
                <button 
                  type="button" 
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                  onClick={closeEditModal}
                >
                  <span className="sr-only">Fermer</span>
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Formulaire d'édition */}
              <div className="px-6 py-4">
                <form className="space-y-4">
                  <div>
                    <label 
                      htmlFor="workflow-name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Nom du workflow <span className="text-red-500" aria-hidden="true">*</span>
                      <span className="sr-only">(requis)</span>
                    </label>
                    <input
                      type="text"
                      id="workflow-name"
                      value={editFormData.name}
                      onChange={(e) => handleEditChange('name', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label 
                      htmlFor="workflow-description"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Description <span className="text-red-500" aria-hidden="true">*</span>
                      <span className="sr-only">(requis)</span>
                    </label>
                    <textarea
                      id="workflow-description"
                      value={editFormData.description}
                      onChange={(e) => handleEditChange('description', e.target.value)}
                      rows={3}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="workflow-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type de workflow <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="workflow-type"
                      value={editFormData.workflow_type}
                      onChange={(e) => handleEditChange('workflow_type', e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="custom">Personnalisé</option>
                      <option value="leave_request">Demande de congé</option>
                      <option value="service_request">Demande de services</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="workflow-active"
                      checked={editFormData.is_active}
                      onChange={(e) => handleEditChange('is_active', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <label htmlFor="workflow-active" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Actif
                    </label>
                  </div>
                  
                  <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium">Note:</span> Pour modifier les étapes du workflow, veuillez utiliser l&apos;éditeur complet.
                    </p>
                    <div className="mt-2">
                      <Link href={`/workflows/edit/${workflowToEdit.id}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                        Accéder à l&apos;éditeur complet
                      </Link>
                    </div>
                  </div>
                </form>
              </div>

              {/* Pied du modal avec les boutons d'action */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                  onClick={closeEditModal}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  onClick={handleSaveEdit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enregistrement...
                    </>
                  ) : (
                    'Enregistrer les modifications'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}