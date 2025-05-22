'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import Link from 'next/link';
import axios from "axios";
import { 
  getMyRequests, 
  retrieveEServiceRequest, 
  getRequestStepsHistory,
  listEServiceRequests,
  handleAxiosError,
  EServiceRequest,
  StepInstance,
  Document
} from "../../../../../services/workflows_endpoints";
import { Modal } from "@/components/ui/modal";
import { Loader2 } from "lucide-react";

// Fonction de formatage de date à utiliser directement dans ce fichier
const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'Date non disponible';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Date invalide';
  
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

// Interface pour le token JWT
interface DecodedToken {
  user_id: number;
  exp: number;
  is_staff?: boolean;
  is_superuser?: boolean;
}

// On utilise les interfaces du fichier workflows_endpoints.ts pour plus de cohérence
// Avec quelques adaptations pour respecter votre implémentation existante
interface ServiceRequest extends Omit<EServiceRequest, 'task_instances' | 'attachments'> {
  workflow_name: string;
  requester_name: string;
  current_task_name: string;
}

interface ServiceRequestDetails extends EServiceRequest {
  task_instances: StepInstance[];
  attachments: Document[];
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return 'En attente de traitement';
    case 'in_review': return 'En cours d’analyse';
    case 'in_progress': return 'En cours de traitement';
    case 'approved': return 'Approuvée';
    case 'rejected': return 'Rejetée';
    case 'completed': return 'Complétée';
    case 'draft': return 'Brouillon';
    case 'cancelled': return 'Annulée';
    default: return status;
  }
};

export default function RequestListPage() {
  const router = useRouter();
  
  // États
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'my' | 'all' | 'assigned'>('my'); // Ajouter 'assigned'
  const [isAdmin, setIsAdmin] = useState(false);
  const [_assignedRequestIds, setAssignedRequestIds] = useState<number[] | null>(null); // Nouvel état
  const [_loadingAssigned, setLoadingAssigned] = useState(false); // État de chargement spécifique

  // Nouveaux états pour l'annulation et la modification
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelComment, setCancelComment] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  const [showEditForm, setShowEditForm] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    priority: 'normal',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Gérer la sélection individuelle
  const handleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // Filtrage des demandes selon le statut sélectionné
  const filteredRequests: ServiceRequest[] = statusFilter === 'all'
    ? requests
    : requests.filter((req) => req.status === statusFilter);

  // Gérer la sélection/déselection de tout
  const handleSelectAll = () => {
    if (selectedIds.length === filteredRequests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRequests.map((r: ServiceRequest) => r.id));
    }
  };

  // Récupération du token d'authentification
  const getAuthToken = () => {
    const token = Cookies.get('authTokens');
    if (!token) {
      throw new Error("Token d'accès introuvable. Veuillez vous reconnecter.");
    }
    
    const parsedToken = JSON.parse(token);
    const accessToken = parsedToken.access;
    
    try {
      // Décoder le token pour obtenir l'ID utilisateur
      const decoded = jwtDecode<DecodedToken>(accessToken);
      // Vérifier si l'utilisateur est admin ou superuser
      const userIsAdmin = decoded.is_staff || decoded.is_superuser;
      setIsAdmin(Boolean(userIsAdmin));
      return { accessToken, userId: decoded.user_id, isAdmin: userIsAdmin };
    } catch (error) {
      console.error("Erreur lors du décodage du token:", error);
      throw new Error("Token d'accès invalide. Veuillez vous reconnecter.");
    }
  };

  // Récupération des demandes
  useEffect(() => {
    const fetchRequests = async () => {
          try {
            setLoading(true);
            // Vérifier l'authentification
            const { isAdmin } = getAuthToken();
    
            let responseData: EServiceRequest[] | { results: EServiceRequest[] };
            
            if (viewMode === 'all' && isAdmin) {
              // Utiliser l'endpoint pour récupérer toutes les demandes (admin seulement)
              const response = await listEServiceRequests();
              responseData = response.data;
            } else {
              // Utiliser l'endpoint pour récupérer les demandes de l'utilisateur connecté
              const response = await getMyRequests();
              responseData = response.data;
            }
        
        // Transformer les données en ServiceRequest[]
        const transformRequest = (request: EServiceRequest): ServiceRequest => ({
          ...request,
          workflow_name:
            request.workflow_name ||
            (typeof request.workflow === 'object' && request.workflow !== null && request.workflow.name)
            || 'Non renseigné',
          requester_name:
            request.requester_name ||
            (typeof request.requester === 'object' && request.requester !== null && request.requester.username)
            || '',
          current_task_name: request.current_task_name || ''
        });

        // Type guard to check if responseData has results property
        if (Array.isArray(responseData)) {
          setRequests(responseData.map(transformRequest));
        } else if ('results' in responseData && Array.isArray((responseData as { results: EServiceRequest[] }).results)) {
          setRequests((responseData as { results: EServiceRequest[] }).results.map(transformRequest));
        } else {
          console.error('Format de données inattendu:', responseData);
          setRequests([]);
          setError('Format de données inattendu');
        }
      } catch (error) {
        console.error('Erreur:', error);
        // Utiliser la fonction handleAxiosError depuis workflows_endpoints.ts
        const errorMessage = handleAxiosError(error);
        setError(errorMessage);
        
        if (errorMessage.includes('reconnecter')) {
          setTimeout(() => {
            router.push('/auth/login');
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [router, viewMode]);

  // Récupération des détails d'une demande
  const fetchRequestDetails = async (requestId: number) => {
    try {
      setLoading(true);
      
      // Récupérer les détails de la demande avec l'endpoint dédié
      const response = await retrieveEServiceRequest(requestId);
      const requestData = response.data;
      
      // Récupérer l'historique des étapes avec l'endpoint dédié
      const historyResponse = await getRequestStepsHistory(requestId);
      
      // Define the type for the response data
      interface HistoryResponse {
        history?: StepInstance[];
      }
      
      const historyData: StepInstance[] = Array.isArray(historyResponse.data) 
        ? historyResponse.data 
        : ((historyResponse.data as HistoryResponse).history || []);
      
      // Combine data and ensure required properties are present
      const processedTaskInstances = historyData.map((step: StepInstance) => ({
        ...step,
        task: step.task || 0,
        task_name: step.task_name || 'Sans nom',
        assignee: step.assignee || null,
        assignee_name: step.assignee_name || null,
        status: step.status || 'pending',
        status_display: step.status_display || '',
        comments: step.comments || [],
        completed_at: step.completed_at || null
      }));
      
      const fullData: ServiceRequestDetails = {
        ...requestData,
        task_instances: processedTaskInstances,
        attachments: requestData.attachments || []
      };
      
      setSelectedRequest(fullData);
      setShowDetails(true);
    } catch (error) {
      console.error('Erreur:', error);
      // Utiliser la fonction handleAxiosError depuis workflows_endpoints.ts
      const errorMessage = handleAxiosError(error);
      setError(errorMessage);
      
      if (errorMessage.includes('reconnecter')) {
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour annuler une demande
  const handleCancelRequest = async () => {
    if (!selectedRequest) return;
    setCancelLoading(true);
    try {
      await axios.post(
        `https://www.backend.lnb-intranet.globalitnet.org/workflows/requests/${selectedRequest.id}/cancel/`,
        { comment: cancelComment }
      );
      setShowCancelForm(false);
      setCancelComment('');
      // Refresh la liste et les détails
      fetchRequestDetails(selectedRequest.id);
      // Optionnel: afficher un message de succès
    } catch (error) {
      setError(handleAxiosError(error));
    } finally {
      setCancelLoading(false);
    }
  };

  // Fonction pour ouvrir le formulaire de modification
  const openEditForm = () => {
    if (!selectedRequest) return;
    setEditData({
      title: selectedRequest.title || '',
      description: selectedRequest.description || '',
      priority: selectedRequest.priority || 'normal',
    });
    setShowEditForm(true);
  };

  const handleEditRequest = async () => {
    if (!selectedRequest) return;
    setEditError(null);
    setEditLoading(true);
    try {
      await axios.patch(
        `https://www.backend.lnb-intranet.globalitnet.org/workflows/requests/${selectedRequest.id}/partial-update/`,
        {
          title: editData.title,
          description: editData.description,
          priority: editData.priority,
          status: "pending"
        }
      );
      setShowEditForm(false);
      // Refresh la liste et les détails
      fetchRequestDetails(selectedRequest.id);
    } catch (error) {
      setEditError(handleAxiosError(error));
    } finally {
      setEditLoading(false);
    }
  };

  // Fonction pour récupérer les IDs des demandes dont une tâche est assignée à l'utilisateur
  const _fetchAssignedTaskRequestIds = async (userId: number) => {
    setLoadingAssigned(true); // Démarrer le chargement spécifique
    try {
      const { accessToken } = getAuthToken(); // Récupérer le token
      // Utiliser l'URL exacte fournie, en remplaçant l'ID statique par l'ID dynamique
      const response = await axios.get(`http://127.0.0.1:8000/workflows/user/all-tasks/?user_id=${userId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      // S'assurer que la réponse est un tableau
      if (Array.isArray(response.data)) {
        // Définir une interface pour la structure attendue de la tâche
        interface TaskWithRequest {
          request: number;
          // Ajoutez d'autres propriétés si nécessaire
        }
        // Extraire les IDs uniques des demandes depuis les tâches
        const requestIds = [...new Set(response.data.map((task: TaskWithRequest) => task.request))];
        setAssignedRequestIds(requestIds); // Pas besoin de 'as number[]' si TaskWithRequest est correct
      } else {
        console.error("Format de réponse inattendu pour les tâches assignées:", response.data);
        setAssignedRequestIds([]); // Mettre un tableau vide en cas d'erreur de format
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des tâches assignées:", error);
      setError(handleAxiosError(error)); // Afficher l'erreur
      setAssignedRequestIds([]); // Mettre un tableau vide en cas d'erreur
    } finally {
      setLoadingAssigned(false); // Arrêter le chargement spécifique
    }
  };

  // Générer la couleur en fonction du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'approved':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'in_review':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Fonction pour fermer la modale de détails
  const closeDetails = () => {
    setShowDetails(false);
    setSelectedRequest(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="bg-white dark:bg-gray-700 shadow rounded-lg mb-6 p-6 border dark:border-emerald-600">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {viewMode === 'my' ? 'Mes demandes d\'e-services' : 'Toutes les demandes d\'e-services'}
              </h1>
              <nav className="flex mt-2">
                <ol className="flex items-center space-x-2 text-sm dark:text-white">
                  <li className="text-emerald-600 dark:text-emerald-400">Accueil</li>
                  <li>/</li>
                  <li className="text-gray-500 dark:text-gray-300">
                    {viewMode === 'my' ? 'Mes demandes' : 'Toutes les demandes'}
                  </li>
                </ol>
              </nav>
            </div>
            {isAdmin && (
              <div className="flex space-x-3">
                <button
                  onClick={() => setViewMode('my')}
                  className={`px-4 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors 
                    ${viewMode === 'my' 
                      ? 'border-transparent text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800' 
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-600 dark:text-white dark:border-gray-500 dark:hover:bg-gray-500'
                    }`}
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Mes demandes
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-4 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors
                    ${viewMode === 'all' 
                      ? 'border-transparent text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800' 
                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-600 dark:text-white dark:border-gray-500 dark:hover:bg-gray-500'
                    }`}
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Toutes les demandes
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded-md mb-6 dark:bg-red-900/30 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-700 shadow rounded-lg mb-6 p-4 border dark:border-emerald-600">
          <div className="sm:flex sm:items-center sm:justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filtrer par statut</h3>
            <div className="mt-3 sm:mt-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full sm:w-auto rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm dark:bg-gray-600 dark:border-emerald-600 dark:text-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente de traitement</option>
                <option value="in_review">En cours d’analyse</option>
                <option value="in_progress">En cours de traitement</option>
                <option value="approved">Approuvée</option>
                <option value="rejected">Rejetée</option>
                <option value="completed">Complétée</option>
                <option value="draft">Brouillon</option>
              </select>
            </div>
            {/* Bouton pour créer une nouvelle demande */}
            <div className="mt-4 sm:mt-0">
              <Link 
                href="/demandes" 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800"
              >
                Nouvelle demande
              </Link>
            </div>
          </div>
        </div>

        {/* Liste des demandes */}
        <div className="bg-white dark:bg-gray-700 shadow rounded-lg border dark:border-emerald-600">
          {loading && !showDetails ? (
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
              <p className="mt-2 text-gray-700 dark:text-white">Chargement des demandes...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 dark:text-gray-300">Aucune demande ne correspond à vos critères.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filteredRequests.length && filteredRequests.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      E-Service
                    </th>
                    {viewMode === 'all' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Demandeur
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Date de création
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                  {filteredRequests.map((request) => {
                    console.log('Request rendu:', request);
                    return (
                      <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(request.id)}
                            onChange={() => handleSelect(request.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {request.workflow_name || 'Non renseigné'}
                        </td>
                        {viewMode === 'all' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {request.requester_name || `Utilisateur #${request.requester}`}
                          </td>
                        )}
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                          {request.description || ''}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {formatDate(request.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {getStatusLabel(request.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => fetchRequestDetails(request.id)}
                            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 mr-4"
                          >
                            Détails
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de détails - reste inchangé */}
      {showDetails && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-fade-in-up">
            {/* En-tête de la modal */}
            <div className="flex justify-between items-center border-b p-4 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center space-x-2">
                <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Détails de la demande&nbsp;: {selectedRequest.request_code || selectedRequest.reference_number || "Sans code"}
                </h3>
              </div>
              <button 
                onClick={closeDetails}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label="Fermer"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Contenu de la modal avec défilement - reste identique */}
            <div className="overflow-y-auto p-6 max-h-[70vh]">
              {/* Informations générales */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Informations générales</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Titre de la demande</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{selectedRequest.title}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Code de la demande</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedRequest.request_code || selectedRequest.reference_number || "Sans code"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Demandeur</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedRequest.requester_name ||
                          (selectedRequest.requester && typeof selectedRequest.requester === 'object'
                            ? (selectedRequest.requester.username || '')
                            : '')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Statut</dt>
                      <dd className="mt-1">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedRequest.status)}`}>
                          {getStatusLabel(selectedRequest.status)}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Date de création</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(selectedRequest.created_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Dernière mise à jour</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(selectedRequest.updated_at)}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-line">
                        {selectedRequest.description}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Tâche actuelle */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tâche actuelle</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
                  {selectedRequest.task_instances && selectedRequest.task_instances.length > 0 ? (
                    (() => {
                      const _currentTask = selectedRequest.task_instances.find(
                        (t) => t.status !== 'completed'
                      ) || selectedRequest.task_instances[0];
              
                      return (
                        <>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {/* Nom de la tâche masqué */}
                            *****
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Assignée à : *****
                          </p>
                        </>
                      );
                    })()
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Aucune tâche en cours
                    </p>
                  )}
                </div>
              </div>

              {/* Historique des tâches et commentaires */}
              {selectedRequest.task_instances && selectedRequest.task_instances.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Historique des tâches</h4>
                  <div className="space-y-4">
                    {selectedRequest.task_instances
                      .filter(taskInstance => taskInstance.status !== 'pending_validation') // <-- Masquer les tâches "pending_validation"
                      .map((taskInstance) => (
                      <div key={taskInstance.id} className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
                        <div className="flex justify-between">
                          {/* Nom de la tâche masqué */}
                          <h5 className="font-medium text-gray-900 dark:text-white">*****</h5>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(taskInstance.status)}`}>
                            {taskInstance.status_display || taskInstance.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Assignée à : *****
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Créée le: {formatDate(taskInstance.created_at || new Date().toISOString())}
                        </p>
                        {typeof taskInstance.completed_at === 'string' && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Complétée le: {formatDate(taskInstance.completed_at)}
                          </p>
                        )}
                        
                        {/* Commentaires */}
                        {Array.isArray(taskInstance.comments) && taskInstance.comments.length > 0 && (
                          <div className="mt-3">
                            <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Commentaires</h6>
                            <div className="space-y-2">
                              {taskInstance.comments.map((comment) => (
                                <div key={comment.id} className="border border-gray-200 dark:border-gray-600 rounded p-3">
                                  <div className="flex justify-between">
                                    {/* Nom de l'auteur masqué */}
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">*****</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(comment.created_at)}</span>
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{comment.content}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pièces jointes */}
              {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Pièces jointes</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                      {selectedRequest.attachments.map((attachment) => (
                        <li key={attachment.id} className="py-3 flex justify-between items-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition">
                          <div className="flex items-center">
                            <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{attachment.file_name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Ajouté par {attachment.uploaded_by_name} le {formatDate(attachment.created_at)}
                              </p>
                            </div>
                          </div>
                          <a
                            href={attachment.file}
                            download
                            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 text-sm font-medium"
                          >
                            Télécharger
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Détails du workflow */}
              {selectedRequest.workflow && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Détails du workflow</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nom</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {typeof selectedRequest.workflow === 'object' && selectedRequest.workflow !== null
                            ? selectedRequest.workflow.name
                            : ''}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Code</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {typeof selectedRequest.workflow === 'object' && selectedRequest.workflow !== null
                            ? selectedRequest.workflow.code
                            : ''}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Statut</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {typeof selectedRequest.workflow === 'object' && selectedRequest.workflow !== null
                            ? selectedRequest.workflow.status
                            : ''}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-line">
                          {typeof selectedRequest.workflow === 'object' && selectedRequest.workflow !== null
                            ? selectedRequest.workflow.description
                            : ''}
                        </dd>
                      </div>
                      {typeof selectedRequest.workflow === 'object' &&
                        selectedRequest.workflow !== null &&
                        Array.isArray(selectedRequest.workflow.departments) &&
                        selectedRequest.workflow.departments.length > 0 ? (
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Départements</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                            {selectedRequest.workflow.departments
                              .filter(dep => dep && typeof dep.name === 'string')
                              .map(dep => dep.name)
                              .join(', ') || 'Non renseigné'}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                </div>
              )}
              <div className="text-xs text-gray-400 mt-2">
                Statut technique : <span className="font-mono">{selectedRequest.status}</span>
              </div>
            </div>
            
            {/* Formulaire d'annulation */}
            {showCancelForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border dark:border-emerald-600">
                  <h4 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Annuler la demande</h4>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Commentaire d&apos;annulation
                  </label>
                  <textarea
                    className="w-full rounded border-gray-300 dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                    rows={2}
                    value={cancelComment}
                    onChange={e => setCancelComment(e.target.value)}
                    placeholder="Renseignez un motif d'annulation"
                  />
                  <div className="flex justify-end mt-4 space-x-2">
                    <button
                      onClick={() => setShowCancelForm(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                      disabled={cancelLoading}
                    >
                      Fermer
                    </button>
                    <button
                      onClick={handleCancelRequest}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                      disabled={cancelLoading || !cancelComment}
                    >
                      {cancelLoading ? "Annulation..." : "Confirmer l'annulation"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Formulaire de modification */}
            {showEditForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border dark:border-emerald-600 relative">
                  <button
                    onClick={() => setShowEditForm(false)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    aria-label="Fermer"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Modifier la demande</h3>
                  <div className="space-y-4">
                    <input
                      className="w-full rounded border-gray-300 dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                      value={editData.title}
                      onChange={e => setEditData({ ...editData, title: e.target.value })}
                      placeholder="Titre"
                    />
                    <textarea
                      className="w-full rounded border-gray-300 dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                      rows={3}
                      value={editData.description}
                      onChange={e => setEditData({ ...editData, description: e.target.value })}
                      placeholder="Description"
                    />
                    <select
                      className="w-full rounded border-gray-300 dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                      value={editData.priority}
                      onChange={e => setEditData({ ...editData, priority: e.target.value })}
                    >
                      <option value="high">Haute</option>
                      <option value="medium">Moyenne</option>
                      <option value="normal">Normale</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-2 mt-6">
                    <button
                      onClick={() => setShowEditForm(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                      disabled={editLoading}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleEditRequest}
                      className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                      disabled={editLoading}
                    >
                      {editLoading ? "Modification..." : "Enregistrer"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Pied de la modal */}
            <div className="border-t p-4 flex justify-end space-x-2 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <button
                onClick={closeDetails}
                className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
              >
                Fermer
              </button>
              {/* Bouton d'annulation désactivé */}
              <button
                disabled
                className="px-4 py-2 bg-gray-300 text-gray-400 rounded-md cursor-not-allowed"
                title="L'annulation n'est pas disponible"
              >
                Annuler la demande
              </button>
              {['pending', 'in_review', 'in_progress', 'en_attente', 'En attente de traitement'].includes(selectedRequest.status) && (
                <button
                  onClick={openEditForm}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  Modifier la demande
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE MODIFICATION */}
      <Modal
        isOpen={showEditForm}
        onClose={() => setShowEditForm(false)}
        className="max-w-lg"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Modifier la demande
          </h2>
          {editLoading && (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}
          {editError && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-md text-sm">
              {editError}
            </div>
          )}
          {!editLoading && (
            <form onSubmit={e => { e.preventDefault(); handleEditRequest(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre</label>
                <input
                  type="text"
                  value={editData.title}
                  onChange={e => setEditData(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editData.description}
                  onChange={e => setEditData(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priorité</label>
                <select
                  value={editData.priority}
                  onChange={e => setEditData(f => ({ ...f, priority: e.target.value }))}
                  className="w-full px-3 py-2 border rounded"
                  required
                >
                  <option value="high">Haute</option>
                  <option value="medium">Moyenne</option>
                  <option value="normal">Normale</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editLoading ? "Modification..." : "Enregistrer"}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* MODALE DE DÉTAILS */}
      <Modal
        isOpen={showDetails && !!selectedRequest && !showEditForm}
        onClose={closeDetails}
        className="max-w-4xl"
      >
        {selectedRequest && (
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-fade-in-up">
            {/* En-tête de la modal */}
            <div className="flex justify-between items-center border-b p-4 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center space-x-2">
                <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Détails de la demande&nbsp;: {selectedRequest.request_code || selectedRequest.reference_number || "Sans code"}
                </h3>
              </div>
              <button 
                onClick={closeDetails}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                aria-label="Fermer"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Contenu de la modal avec défilement */}
            <div className="overflow-y-auto p-6 max-h-[70vh]">
              {/* Informations générales */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Informations générales</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Titre de la demande</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{selectedRequest.title}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Code de la demande</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedRequest.request_code || selectedRequest.reference_number || "Sans code"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Demandeur</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                        {selectedRequest.requester_name ||
                          (selectedRequest.requester && typeof selectedRequest.requester === 'object'
                            ? (selectedRequest.requester.username || '')
                            : '')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Statut</dt>
                      <dd className="mt-1">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedRequest.status)}`}>
                          {getStatusLabel(selectedRequest.status)}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Date de création</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(selectedRequest.created_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Dernière mise à jour</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white">{formatDate(selectedRequest.updated_at)}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-line">
                        {selectedRequest.description}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Tâche actuelle */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tâche actuelle</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
                  {selectedRequest.task_instances && selectedRequest.task_instances.length > 0 ? (
                    (() => {
                      const _currentTask = selectedRequest.task_instances.find(
                        (t) => t.status !== 'completed'
                      ) || selectedRequest.task_instances[0];
              
                      return (
                        <>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {/* Nom de la tâche masqué */}
                            *****
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Assignée à : *****
                          </p>
                        </>
                      );
                    })()
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Aucune tâche en cours
                    </p>
                  )}
                </div>
              </div>

              {/* Historique des tâches et commentaires */}
              {selectedRequest.task_instances && selectedRequest.task_instances.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Historique des tâches</h4>
                  <div className="space-y-4">
                    {selectedRequest.task_instances
                      .filter(taskInstance => taskInstance.status !== 'pending_validation') // <-- Masquer les tâches "pending_validation"
                      .map((taskInstance) => (
                      <div key={taskInstance.id} className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
                        <div className="flex justify-between">
                          {/* Nom de la tâche masqué */}
                          <h5 className="font-medium text-gray-900 dark:text-white">*****</h5>
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(taskInstance.status)}`}>
                            {taskInstance.status_display || taskInstance.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Assignée à : *****
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Créée le: {formatDate(taskInstance.created_at || new Date().toISOString())}
                        </p>
                        {typeof taskInstance.completed_at === 'string' && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Complétée le: {formatDate(taskInstance.completed_at)}
                          </p>
                        )}
                        
                        {/* Commentaires */}
                        {Array.isArray(taskInstance.comments) && taskInstance.comments.length > 0 && (
                          <div className="mt-3">
                            <h6 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Commentaires</h6>
                            <div className="space-y-2">
                              {taskInstance.comments.map((comment) => (
                                <div key={comment.id} className="border border-gray-200 dark:border-gray-600 rounded p-3">
                                  <div className="flex justify-between">
                                    {/* Nom de l'auteur masqué */}
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">*****</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(comment.created_at)}</span>
                                  </div>
                                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{comment.content}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pièces jointes */}
              {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Pièces jointes</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-600">
                      {selectedRequest.attachments.map((attachment) => (
                        <li key={attachment.id} className="py-3 flex justify-between items-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition">
                          <div className="flex items-center">
                            <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{attachment.file_name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Ajouté par {attachment.uploaded_by_name} le {formatDate(attachment.created_at)}
                              </p>
                            </div>
                          </div>
                          <a
                            href={attachment.file}
                            download
                            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 text-sm font-medium"
                          >
                            Télécharger
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Détails du workflow */}
              {selectedRequest.workflow && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Détails du workflow</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Nom</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {typeof selectedRequest.workflow === 'object' && selectedRequest.workflow !== null
                            ? selectedRequest.workflow.name
                            : ''}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Code</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {typeof selectedRequest.workflow === 'object' && selectedRequest.workflow !== null
                            ? selectedRequest.workflow.code
                            : ''}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Statut</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                          {typeof selectedRequest.workflow === 'object' && selectedRequest.workflow !== null
                            ? selectedRequest.workflow.status
                            : ''}
                        </dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-line">
                          {typeof selectedRequest.workflow === 'object' && selectedRequest.workflow !== null
                            ? selectedRequest.workflow.description
                            : ''}
                        </dd>
                      </div>
                      {typeof selectedRequest.workflow === 'object' &&
                        selectedRequest.workflow !== null &&
                        Array.isArray(selectedRequest.workflow.departments) &&
                        selectedRequest.workflow.departments.length > 0 ? (
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Départements</dt>
                          <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                            {selectedRequest.workflow.departments
                              .filter(dep => dep && typeof dep.name === 'string')
                              .map(dep => dep.name)
                              .join(', ') || 'Non renseigné'}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                </div>
              )}
              <div className="text-xs text-gray-400 mt-2">
                Statut technique : <span className="font-mono">{selectedRequest.status}</span>
              </div>
            </div>
            
            {/* Pied de la modal */}
            <div className="border-t p-4 flex justify-end space-x-2 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <button
                onClick={closeDetails}
                className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
              >
                Fermer
              </button>
              {/* Bouton d'annulation désactivé */}
              <button
                disabled
                className="px-4 py-2 bg-gray-300 text-gray-400 rounded-md cursor-not-allowed"
                title="L'annulation n'est pas disponible"
              >
                Annuler la demande
              </button>
              {['pending', 'in_review', 'in_progress', 'en_attente', 'En attente de traitement'].includes(selectedRequest.status) && (
                <button
                  onClick={openEditForm}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                >
                  Modifier la demande
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}