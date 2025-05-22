"use client";

import React, { useEffect, useState } from "react";
import Link from 'next/link';
import { PlusIcon, PencilIcon, TrashBinIcon, EyeIcon } from "@/icons";
import Cookies from 'js-cookie';
import { jwtDecode } from "jwt-decode";
import { useRouter } from 'next/navigation';
import {
  listWorkflows,
  deleteWorkflow,
  Workflow,
  Department,
  Service,
  handleAxiosError
} from "../../../../services/workflows_endpoints";

// Interface pour le JWT décodé
interface DecodedToken {
  user_id: number;
  exp: number;
  role?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
}

export default function WorkflowsPage() {
  const _router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkflows, setSelectedWorkflows] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [_userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // État pour gérer le modal de confirmation de suppression
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [workflowsToDelete, setWorkflowsToDelete] = useState<number[]>([]);
  const [workflowsToDeleteNames, setWorkflowsToDeleteNames] = useState<string[]>([]);

  // Fonction pour obtenir les tokens et extraire les informations utilisateur
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
          setIsLoading(false);
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
            const decoded = jwtDecode<DecodedToken>(tokens.access);
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

  // Récupération des workflows après authentification - UTILISATION DES FONCTIONS D'API
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
        console.log("Envoi de la requête avec le token");
        
        // Utilisation des fonctions d'API au lieu de fetch direct
        const response = await listWorkflows();
          
        console.log("Données reçues:", response.data);
        
        interface ApiResponse {
          data: Workflow[] | { results: Workflow[] } | { workflows: Workflow[] };
        }
        const apiResponse = response as ApiResponse;
        
        if (Array.isArray(apiResponse.data)) {
          setWorkflows(apiResponse.data);
        } else if ('results' in apiResponse.data) {
          setWorkflows(apiResponse.data.results);
        } else if ('workflows' in apiResponse.data) {
          setWorkflows(apiResponse.data.workflows);
        } else {
          setWorkflows([]);
          console.error("Format de données inattendu:", response.data);
        }
        
        setError(null);
      } catch (error) {
        console.error("Erreur lors de la récupération des workflows:", error);
        // Utilisation de la fonction handleAxiosError
        const errorMessage = handleAxiosError(error);
        setError(errorMessage);
        
        if (errorMessage.includes('reconnecter')) {
          setIsAuthenticated(false);
          setAccessToken(null);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchWorkflows();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken]);

  // Fonction de suppression de workflows - UTILISATION DE deleteWorkflow
  const handleDeleteWorkflows = async (workflowIds: number[]) => {
    if (!isAuthenticated || !accessToken) {
      setError("Non authentifié");
      return;
    }

    // Montrer un indicateur de chargement pour la suppression
    setIsLoading(true);

    try {
      // Stocker les résultats et erreurs pour chaque suppression
      const results = await Promise.allSettled(workflowIds.map(async (id) => {
        console.log(`Suppression du workflow ${id}...`);
        
        // Utilisation de la fonction deleteWorkflow au lieu de fetch direct
        await deleteWorkflow(id);
        
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
      // Utilisation de handleAxiosError
      const errorMessage = handleAxiosError(error);
      setNotification({ type: "error", message: errorMessage });
    } finally {
      setIsLoading(false);
      // Fermer le modal de confirmation après la tentative de suppression
      setDeleteConfirmationOpen(false);
      setWorkflowsToDelete([]);
      setWorkflowsToDeleteNames([]);
    }
  };

  // Fonction pour ouvrir le modal de confirmation de suppression avec des détails spécifiques
  const openDeleteConfirmation = (workflowIds: number[]) => {
    const names = workflowIds.map(id => {
      const workflow = workflows.find(w => w.id === id);
      return workflow?.name || `Workflow #${id}`;
    });
    setWorkflowsToDelete(workflowIds);
    setWorkflowsToDeleteNames(names);
    setDeleteConfirmationOpen(true);
  };

  const filteredWorkflows = workflows.filter(workflow => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      (workflow?.name?.toLowerCase()?.includes(searchLower) ?? false) ||
      (workflow?.description?.toLowerCase()?.includes(searchLower) ?? false) ||
      (workflow?.code?.toLowerCase()?.includes(searchLower) ?? false)
    );
  });

  // Fonction pour rendre l'affichage du rattachement (service/département)
  const renderAttachment = (workflow: Workflow) => {
    const hasServices = workflow.services && workflow.services.length > 0;
    const hasDepartments = workflow.departments && workflow.departments.length > 0;

    if (!hasServices && !hasDepartments) {
      return <span className="text-gray-400">-</span>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {hasServices && (
          <div className="flex items-center flex-wrap gap-1">
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold mr-1">
              Service
            </span>
            {workflow.services?.map((s: number | Service, idx) => (
              <span
                key={typeof s === "number" ? s : s.id}
                className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs mr-1"
              >
                {typeof s === "number" ? s : s.name}
                {workflow.services && idx < workflow.services.length - 1 && <span className="mx-1 text-blue-300">|</span>}
              </span>
            ))}
          </div>
        )}
        {hasDepartments && (
          <div className="flex items-center flex-wrap gap-1">
            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-semibold mr-1">
              Département
            </span>
            {workflow.departments && workflow.departments.map((d: number | Department, idx) => (
              <span
                key={typeof d === "number" ? d : d.id}
                className="px-2 py-0.5 rounded bg-green-50 text-green-700 text-xs mr-1"
              >
                {typeof d === "number" ? d : d.name}
                {workflow.departments && idx < workflow.departments.length - 1 && <span className="mx-1 text-green-300">|</span>}
              </span>
            ))}
          </div>
        )}
      </div>
    );
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

  // Fonction pour obtenir le statut formaté
  const getWorkflowStatus = (workflow: Workflow) => {
    // Adapter le nouveau champ status au précédent is_active
    const isActive = workflow.status === 'active';
    
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
      }`}>
        <span className={`mr-1.5 h-2 w-2 rounded-full ${
          isActive ? 'bg-green-500' : 'bg-gray-500'
        }`}></span>
        {isActive ? 'Actif' : 'Inactif'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-transparent">
      {/* Le reste du JSX reste identique, avec ajustements pour la table */}
      <div className="mx-auto w-full">
        {/* Barre d'actions */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Workflows
            </h1>
          </div>

          <div className="flex gap-3">
            <Link href="/workflows/create">
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
                {selectedWorkflows.length === 1 && (
                  <>
                    <Link href={`/workflows/details/${selectedWorkflows[0]}`}>
                      <button
                        className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        <EyeIcon className="w-5 h-5 mr-2" />
                        Voir détails
                      </button>
                    </Link>
                    <Link href={`/workflows/edit/${selectedWorkflows[0]}`}>
                      <button
                        className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
                      >
                        <PencilIcon className="w-5 h-5 mr-2" />
                        Modifier
                      </button>
                    </Link>
                  </>
                )}
                
                <button
                  onClick={() => openDeleteConfirmation(selectedWorkflows)}
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

        {/* Barre de recherche et options de vue */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm mb-6">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="Rechercher un workflow..."
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
            </div>

            <div className="flex items-center">
              {!isLoading && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredWorkflows.length} sur {workflows.length} workflows
                </span>
              )}
              {selectedWorkflows.length > 0 && (
                <div className="ml-4 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {selectedWorkflows.length} {selectedWorkflows.length === 1 ? 'élément sélectionné' : 'éléments sélectionnés'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section du tableau avec une width fixe et overflow contrôlé */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-sm">
          {/* En-tête du tableau avec le nombre total */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-800 dark:text-white">
              Liste des workflows
              {!isLoading && (
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({workflows.length} {workflows.length === 1 ? 'workflow' : 'workflows'})
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
              <p className="text-gray-500 dark:text-gray-400">Aucun workflow disponible. Commencez par en créer un nouveau.</p>
              <Link href="/workflows/create">
                <button className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Créer un workflow
                </button>
              </Link>
            </div>
          ) : (
            // Container du tableau avec défilement horizontal limité à cette section
            <div className="table-container">
              <table className="responsive-table divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="w-10 px-6 py-3 table-cell">
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
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 table-cell w-[20%]">Nom</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 table-cell w-[25%]">Description</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 hide-sm table-cell w-[10%]">Code</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 hide-md table-cell w-[15%]">Rattachement</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 table-cell w-[10%]">Statut</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 hide-sm table-cell w-[15%]">Date de création</th>
                    <th scope="col" className="relative px-6 py-3 w-[10%] table-cell table-cell-last">
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
                      <td className="whitespace-nowrap px-6 py-4 table-cell">
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
                      <td className="whitespace-nowrap px-6 py-4 table-cell">
                        <div className="font-medium text-gray-900 dark:text-white truncate">{workflow.name}</div>
                      </td>
                      <td className="px-6 py-4 table-cell">
                        <div className="max-w-xs truncate text-sm text-gray-500 dark:text-gray-400">
                          {workflow.description || "Aucune description"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400 hide-sm table-cell">
                        {workflow.code || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm hide-md table-cell">
                        {renderAttachment(workflow)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 table-cell">
                        {getWorkflowStatus(workflow)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400 hide-sm table-cell">
                        {workflow.created_at ? new Date(workflow.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium table-cell table-cell-last">
                        <div className="flex items-center justify-end space-x-2">
                          <Link href={`/workflows/details/${workflow.id}`}>
                            <button 
                              className="rounded p-1 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900"
                              title="Voir les détails"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                          </Link>
                          <Link href={`/workflows/edit/${workflow.id}`}>
                            <button 
                              className="rounded p-1 text-yellow-600 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-900"
                              title="Modifier"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                          </Link>
                          <button 
                            onClick={() => openDeleteConfirmation([workflow.id])}
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
    
      {/* Notification flottante */}
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

      {/* Modal de confirmation de suppression */}
      {deleteConfirmationOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay de fond sombre */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
              aria-hidden="true"
            ></div>

            {/* Centrage du modal */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Contenu du modal */}
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  {/* Icône d'avertissement */}
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  
                  {/* Contenu de l'avertissement */}
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                      Confirmer la suppression
                    </h3>
                    <div className="mt-2">
                      {workflowsToDelete.length === 1 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Vous êtes sur le point de supprimer le workflow <span className="font-semibold">{workflowsToDeleteNames[0]}</span>. Cette action est irréversible et toutes les données associées à ce workflow seront définitivement supprimées.
                        </p>
                      ) : (
                        <>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Vous êtes sur le point de supprimer {workflowsToDelete.length} workflows. Cette action est irréversible et toutes les données associées à ces workflows seront définitivement supprimées.
                          </p>
                          <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                              {workflowsToDeleteNames.map((name, index) => (
                                <li key={index} className="px-3 py-2 text-sm text-gray-800 dark:text-gray-200">
                                  • {name}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}
                      
                      <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-yellow-700 dark:text-yellow-200">
                              Attention : Cette action ne peut pas être annulée. Assurez-vous de vouloir effectuer cette suppression.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Pied du modal avec les boutons d'action */}
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => handleDeleteWorkflows(workflowsToDelete)}
                >
                  Supprimer
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700"
                  onClick={() => {
                    setDeleteConfirmationOpen(false);
                    setWorkflowsToDelete([]);
                    setWorkflowsToDeleteNames([]);
                  }}
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Styles pour le tableau responsive */}
      <style jsx>{`
        .table-container {
          overflow-x: auto;
          max-width: 100%;
          WebkitOverflowScrolling: touch;
        }
        
        .responsive-table {
          table-layout: fixed;
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
        }
        
        .truncate {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          padding-right: 8px;
        }
        
        .table-cell {
          position: relative;
        }
        
        .table-cell:after {
          content: '';
          position: absolute;
          right: 0;
          top: 25%;
          height: 50%;
          width: 1px;
          background-color: #e5e7eb;
        }
        
        .dark .table-cell:after {
          background-color: #374151;
        }
        
        .table-cell-last:after {
          display: none;
        }
        
        @media (max-width: 1024px) {
          .hide-md {
            display: none;
          }
        }
        
        @media (max-width: 768px) {
          .hide-sm {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}