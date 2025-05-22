"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getAssignedTasks,
  updateStepInstanceStatus,
  addDocumentToStepInstance,
  retrieveEServiceRequest,
  assignStepInstance, // --- AJOUT: Importer la fonction manquante ---
  EServiceRequest,
  StepInstance,
  handleAxiosError
} from "../../../../../services/workflows_endpoints";
// Assuming entityService exports a User type or similar for assignable entities
import { entityService } from '@/services/entityService'; // Import entityService
// --- AJOUT: Icônes supplémentaires ---
import { FaCheck, FaTimes, FaUser,FaCogs, FaFileAlt, FaTrash, FaInfoCircle, FaShare, FaComment } from "react-icons/fa";
import Cookies from 'js-cookie'; // Import js-cookie

// Importer le service d'authentification correctement
import { getValidToken } from '@/services/auth';

// Define the type based on usage if not exported
type AssignableEntity = {
  id: number;
  name?: string; // Optional based on usage: user.name || user.username || user.email
  username?: string;
  email?: string;
};

// Ajouter un type pour les détails du demandeur
type RequesterDetails = {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
  full_name?: string;
  username?: string;
};

// --- MODIFIÉ: Fonction utilitaire pour récupérer le token ---
const getAuthToken = async (): Promise<string | null> => {
  console.log("🔍 Début de getAuthToken - recherche du token...");
  
  try {
    console.log("Méthode 1: Tentative via getValidToken...");
    const token = await getValidToken();
    if (token) {
      console.log(`✅ Token récupéré via getValidToken (longueur: ${token.length}, début: ${token.substring(0, 10)}...)`);
      return token;
    }
    console.log("❌ getValidToken n'a pas retourné de token");
    
  } catch (error) {
    console.error("⚠️ Erreur lors de la récupération via getValidToken:", error);
    
    try {
      console.log("Méthode 2: Recherche dans les cookies...");
      console.log("📋 Liste des cookies disponibles:", document.cookie);
      
      // Méthode 2A: js-cookie avec 'authTokens'
      const tokenCookie = Cookies.get('authTokens');
      console.log("Cookie 'authTokens':", tokenCookie ? "trouvé" : "non trouvé");
      if (tokenCookie) {
        try {
          const parsedTokens = JSON.parse(tokenCookie);
          console.log("Structure du cookie authTokens:", Object.keys(parsedTokens));
          if (parsedTokens.access) {
            console.log(`✅ Token trouvé dans authTokens.access (longueur: ${parsedTokens.access.length}, début: ${parsedTokens.access.substring(0, 10)}...)`);
            return parsedTokens.access;
          }
        } catch (e) {
          console.error("Erreur lors du parsing du cookie authTokens:", e);
        }
      }
      
      // Méthode 2B: Recherche de cookies alternatifs
      console.log("Méthode 3: Recherche d'autres noms de cookies...");
      const cookieNames = ['access_token', 'token', 'jwt', 'authToken'];
      for (const name of cookieNames) {
        console.log(`Recherche du cookie '${name}'...`);
        const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
        if (match) {
          const decodedToken = decodeURIComponent(match[1]);
          console.log(`✅ Token trouvé dans cookie '${name}' (longueur: ${decodedToken.length}, début: ${decodedToken.substring(0, 10)}...)`);
          return decodedToken;
        }
      }
      
      // Méthode 4: LocalStorage
      console.log("Méthode 4: Recherche dans localStorage...");
      const storageKeys = ['authTokens', 'token', 'access_token', 'jwt'];
      for (const key of storageKeys) {
        const rawToken = localStorage.getItem(key);
        if (rawToken) {
          console.log(`Trouvé dans localStorage['${key}']`);
          try {
            const parsedToken = JSON.parse(rawToken);
            console.log("Structure du token dans localStorage:", Object.keys(parsedToken));
            if (parsedToken.access) {
              console.log(`✅ Token trouvé dans localStorage.${key}.access`);
              return parsedToken.access;
            }
            if (parsedToken.token) {
              console.log(`✅ Token trouvé dans localStorage.${key}.token`);
              return parsedToken.token;
            }
          } catch {
            console.log(`Token brut trouvé dans localStorage['${key}'], non-JSON`);
            return rawToken;
          }
        }
      }
      
      console.log("📱 Inspection du contexte global window.user ou similaire...");
      // @ts-expect-error - Assuming 'window.user' might not be typed
      if (window.user && window.user.token) {
        console.log("✅ Token trouvé dans window.user.token");
        // @ts-expect-error - Assuming 'window.user' might not be typed
        return window.user.token;
      }
      
    } catch (fallbackError) {
      console.error("💥 Erreur grave lors des méthodes alternatives:", fallbackError);
    }
  }
  
  console.error("❌ Échec total - aucun token trouvé par aucune méthode");
  return null;
};


export default function RequestValidationPage() {
  const router = useRouter();

  // États
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<StepInstance[]>([]);
  const [selectedTask, setSelectedTask] = useState<StepInstance | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<EServiceRequest | null>(null);
  const [comment, setComment] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  type ActionType = 'validated' | 'rejected' | 'request_info' | 'forwarded' | 'commented';
  const [action, setAction] = useState<ActionType>('validated'); // Action par défaut
  const [targetUserId, setTargetUserId] = useState<number | null>(null); // --- AJOUT: ID utilisateur cible ---
  const [assignableUsers, setAssignableUsers] = useState<AssignableEntity[]>([]); // --- AJOUT: Liste des utilisateurs ---
  const [requesterDetails, setRequesterDetails] = useState<RequesterDetails | null>(null);

  // Helper function to format date
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Date invalide';
    }
  };

  // --- MODIFICATION: Fonction pour charger les utilisateurs ---
  const fetchAssignableUsers = useCallback(async () => {
    try {
      // Utiliser la nouvelle fonction asynchrone
      const token = await getAuthToken();
      
      if (token) {
        console.log("Token trouvé, longueur:", token.length);
        const usersResponse = await entityService.getAllUsers(token);
        setAssignableUsers(usersResponse.results || []);
      } else {
        // Si on ne peut pas récupérer le token, on ne peut pas charger les utilisateurs.
        console.error("Token introuvable dans toutes les sources possibles pour charger les utilisateurs.");
        setError("Impossible de récupérer le token d'authentification nécessaire pour charger les utilisateurs. Veuillez vous reconnecter.");
        // Ne pas tenter d'appeler getAllUsers sans token car il est requis.
      }
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error);
      setError("Échec du chargement des utilisateurs. Veuillez réessayer.");
    }
  }, []);

  // --- MODIFICATION: loadInitialData pour inclure les utilisateurs ---
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Charger les tâches assignées, traitées et les utilisateurs en parallèle
      const [assignedTasksResponse, _usersResponse] = await Promise.all([
        getAssignedTasks(),
        fetchAssignableUsers() // Charger les utilisateurs
      ]);
      
      console.log("🔍 Tâches reçues:", {
        total: assignedTasksResponse.data?.length || 0,
        statuts: assignedTasksResponse.data?.map(task => task.status),
        premièreTâche: assignedTasksResponse.data?.[0] ? {
          id: assignedTasksResponse.data[0].id,
          statut: assignedTasksResponse.data[0].status,
          titre: assignedTasksResponse.data[0].request_title,
          step: assignedTasksResponse.data[0].step,
          request: assignedTasksResponse.data[0].request,
        } : null
      });
      
      setTasks(assignedTasksResponse.data);
    } catch (error) {
      const errorMessage = handleAxiosError(error);
      console.error("❌ Erreur lors du chargement des données:", error);
      setError(errorMessage);
      if (errorMessage.includes('reconnecter')) {
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  }, [router, fetchAssignableUsers]); // Ajouter fetchAssignableUsers aux dépendances

  // Chargement des données au montage
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Fonction pour récupérer les détails d'un utilisateur par ID
  const fetchRequesterDetails = async (userId: number) => {
    try {
      console.log("Recherche des détails du demandeur avec ID:", userId);
      
      // Rechercher l'utilisateur dans la liste des utilisateurs déjà chargée
      const foundUser = assignableUsers.find(user => user.id === userId);
      
      if (foundUser) {
        console.log("Détails du demandeur trouvés dans la liste des utilisateurs:", foundUser);
        
        // Convertir les données au format RequesterDetails
        const requesterData: RequesterDetails = {
          id: foundUser.id,
          // Extraire prénom et nom à partir du champ name (format: 'Prénom NOM')
          first_name: foundUser.name?.split(' ')[0] || '',
          last_name: foundUser.name?.split(' ').slice(1).join(' ') || '',
          email: foundUser.email || '',
          username: foundUser.username || '',
          // Le champ role n'est pas disponible, on peut l'extrapoler du username ou du email si nécessaire
          role: determineRoleFromEmail(foundUser.email) || '',
          full_name: foundUser.name || ''
        };
        
        setRequesterDetails(requesterData);
      } else {
        console.warn(`Utilisateur avec ID ${userId} non trouvé dans la liste des utilisateurs disponibles`);
        setRequesterDetails(null);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des détails du demandeur:", error);
      setRequesterDetails(null);
    }
  };

  // Fonction utilitaire pour déterminer le rôle à partir de l'email
  const determineRoleFromEmail = (email?: string): string => {
    if (!email) return '';
    
    // Exemples de mapping email vers rôle
    if (email.includes('dsi@')) return 'Directeur des Systèmes d\'Information';
    if (email.includes('daf@')) return 'Directeur Administratif et Financier';
    if (email.includes('csi@')) return 'Chef Service Informatique';
    if (email.includes('chef_')) return 'Chef de Service';
    if (email.includes('cs')) return 'Chef de Section';
    
    // Extraire le rôle du préfixe de l'email (avant le @)
    const prefix = email.split('@')[0];
    if (prefix && !prefix.includes('.')) {
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
    
    return '';
  };

  // Récupération des détails d'une demande
  const fetchRequestDetails = async (taskId: number) => {
    try {
      setLoading(true);
      const task = tasks.find(t => t.id === taskId);
      if (!task) throw new Error('Tâche non trouvée');
      // --- AJOUT: Vérifier si task.request existe ---
      if (!task.request) {
        throw new Error('Informations de la requête manquantes pour cette tâche.');
      }
      // --- FIN AJOUT ---
      setSelectedTask(task);
      const requestId = typeof task.request === 'number' ? task.request : task.request.id;
      const response = await retrieveEServiceRequest(requestId);
      setSelectedRequest(response.data);
      
      // Ajouter cette partie pour récupérer les détails du demandeur
      if (response.data.requester && typeof response.data.requester === 'object' && response.data.requester.id) {
        fetchRequesterDetails(response.data.requester.id);
      } else if (typeof response.data.requester === 'number') {
        fetchRequesterDetails(response.data.requester);
      } else {
        setRequesterDetails(null); // Réinitialiser si pas de demandeur identifiable
      }
    } catch (error) {
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

  // Gestion des fichiers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // --- MODIFICATION: handleAction pour gérer 'forwarded' ---
  const handleAction = async () => {
    if (!selectedTask) return;

    // Validation spécifique à l'action
    if (action === 'rejected' && !comment.trim()) {
      setNotification({ type: 'error', message: 'Un commentaire est obligatoire pour rejeter la demande.' });
      return;
    }
    // --- AJOUT: Validation pour 'forwarded' ---
    if (action === 'forwarded' && !targetUserId) {
      setNotification({ type: 'error', message: 'Veuillez sélectionner un utilisateur à qui transférer la tâche.' });
      return;
    }
    // --- FIN AJOUT ---

    setLoading(true);
    setNotification(null); // Réinitialiser la notification

    try {
      // --- AJOUT: Logique spécifique pour 'forwarded' ---
      if (action === 'forwarded' && targetUserId) {
        await assignStepInstance(selectedTask.id, targetUserId);
        // Optionnel: Ajouter un commentaire via l'API de commentaire si nécessaire,
        // car l'API d'assignation ne prend peut-être pas de commentaire.
        if (comment.trim()) {
          // Supposons une fonction addCommentToStepInstance(taskId, comment)
          // await addCommentToStepInstance(selectedTask.id, comment.trim());
          console.log("Commentaire ajouté (simulation):", comment.trim());
        }
        setNotification({ type: 'success', message: `La tâche a été transférée avec succès à l'utilisateur sélectionné.` });
      } else {
      // --- FIN AJOUT ---
        // Logique pour les autres actions (validated, rejected, etc.)
        const payload = { action, comments: comment.trim() };
        await updateStepInstanceStatus(selectedTask.id, payload);

        // Gestion des pièces jointes (peut-être pas pertinent pour 'forwarded' ?)
        if (attachments.length > 0 && action !== 'forwarded') { // Ne pas joindre si on transfère ? À vérifier.
          await Promise.all(attachments.map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('description', comment.trim() || `Document ajouté lors de l'action: ${action}`);
            await addDocumentToStepInstance(selectedTask.id, formData);
          }));
        }
        setNotification({
          type: 'success',
          message:
            action === 'validated'
              ? 'La demande a été validée avec succès.'
              : action === 'rejected'
              ? 'La demande a été rejetée avec succès.'
              : action === 'request_info'
              ? 'La demande d\'information supplémentaire a été envoyée.'
              : action === 'commented'
              ? 'Le commentaire a été ajouté avec succès.'
              : `Action "${action}" effectuée avec succès.`
        });
      // --- AJOUT: Fin du bloc else ---
      }
      // --- FIN AJOUT ---

      // Réinitialiser l'état de la sélection et du formulaire
      setSelectedTask(null);
      setSelectedRequest(null);
      setComment('');
      setAttachments([]);
      setAction('validated'); // Réinitialiser l'action par défaut
      setTargetUserId(null); // --- AJOUT: Réinitialiser l'utilisateur cible ---

      // Recharger toutes les données pour mettre à jour les listes
      await loadInitialData();

    } catch (error) {
      setNotification({ type: 'error', message: handleAxiosError(error) });
    } finally {
      setLoading(false);
    }
  };
  // --- FIN MODIFICATION ---

  // Filtrer les tâches par recherche
  const filteredTasks = tasks.filter(task => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const taskName = task.task_name?.toLowerCase() || '';
    let requesterName = '';
    if (typeof task.request === 'object' && task.request !== null) {
      // Check if requester is an object and has full_name
      if (typeof task.request.requester === 'object' && task.requester !== null && 'full_name' in task.request.requester && typeof task.request.requester.full_name === 'string') {
        requesterName = task.request.requester.full_name.toLowerCase();
      }
      // Fallback to requester_name if available
      else if (task.request.requester_name) {
        requesterName = task.request.requester_name.toLowerCase();
      }
    }
    return taskName.includes(searchLower) || requesterName.includes(searchLower);
  });

  // Séparation des tâches
  const _pendingTasks = tasks.filter(t => t.status === "pending" || (t.status_display && t.status_display.toLowerCase().includes("attente")));
  const _validatedTasks = tasks.filter(t => t.status === "validated" || (t.status_display && t.status_display.toLowerCase().includes("validé")));
  const processedTasks = tasks.filter(t => t.status === "validated" || t.status === "rejected" || (t.status_display && (t.status_display.toLowerCase().includes("validé") || t.status_display.toLowerCase().includes("rejeté"))));

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-100 via-gray-50 to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-2 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 tracking-tight">Validation des demandes</h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">Interface de validation pour managers et supérieurs hiérarchiques</p>
          </div>
          <div className="hidden md:block">
            <svg className="h-14 w-14 text-emerald-200 dark:text-emerald-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg shadow ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'}`}>
            <div className="flex justify-between items-center">
              <p>{notification.message}</p>
              <button onClick={() => setNotification(null)} className="font-bold">×</button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-lg shadow bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
            <div className="flex justify-between items-center">
              <p>{error}</p>
              <button onClick={() => setError(null)} className="font-bold">×</button>
            </div>
          </div>
        )}

        <div className="grid gap-8">
          {/* Ligne 1 : Colonne 1 et Colonne 3 */}
          <div className={`grid gap-8 ${selectedTask && selectedRequest ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-2'}`}>
            {/* Colonne 1 : Tâches assignées */}
            <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl overflow-hidden border border-gray-200 dark:border-emerald-700">
              <div className="p-5 border-b dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20">
                <h2 className="font-semibold text-lg text-emerald-700 dark:text-emerald-200">Tâches assignées</h2>
                <div className="mt-2 relative">
                  <input
                    type="text"
                    placeholder="Rechercher une tâche..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-emerald-600 dark:text-white focus:ring-2 focus:ring-emerald-400"
                  />
                  <svg className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-emerald-800">
                {filteredTasks.length === 0 && (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Aucune tâche assignée
                  </div>
                )}
                {filteredTasks.map(task => {
                  let statutPro = '';
                  switch (task.status) {
                    case 'pending_validation':
                      statutPro = 'En attente de validation';
                      break;
                    case 'validated':
                      statutPro = 'Validée';
                      break;
                    case 'rejected':
                      statutPro = 'Rejetée';
                      break;
                    case 'in_progress':
                      statutPro = 'En cours de traitement';
                      break;
                    default:
                      statutPro = task.status_display || task.status || 'Statut inconnu';
                  }

                  return (
                    <div
                      key={task.id}
                      onClick={() => fetchRequestDetails(task.id)}
                      className={`p-5 transition-all duration-150 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 cursor-pointer ${selectedTask?.id === task.id ? 'bg-emerald-100 dark:bg-emerald-900/40 border-l-4 border-emerald-500' : ''}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {typeof task.step === 'object' && task.step?.name ? task.step.name : 'Tâche sans nom'}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {task.request_title || 'Aucune description disponible'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Priorité : {task.priority || (typeof task.request === 'object' && task.request?.priority) || 'Non renseigné'}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          {statutPro}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Colonne 3 : Tâches validées */}
            <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl overflow-hidden border border-gray-200 dark:border-emerald-700">
              <div className="p-5 border-b dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20">
                <h2 className="font-semibold text-lg text-emerald-700 dark:text-emerald-200">Toutes les tâches traitées</h2>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-emerald-800 max-h-[60vh] overflow-y-auto">
                {processedTasks.length === 0 && (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    Aucune tâche traitée
                  </div>
                )}
                {processedTasks.map(task => {
                  const actionTaken = (typeof task.action_taken === 'string' ? task.action_taken : null) ?? (typeof task.status === 'string' ? task.status : null);
                  const isApproved = actionTaken === 'validated' || actionTaken === 'approved';
                  let displayStatusText = '';
                  if (actionTaken === 'validated' || actionTaken === 'approved') {
                    displayStatusText = 'Approuvée';
                  } else if (actionTaken === 'rejected') {
                    displayStatusText = 'Rejetée';
                  } else {
                    // Ensure status_display and actionTaken are strings before using them
                    const statusDisplayStr = typeof task.status_display === 'string' ? task.status_display : null;
                    displayStatusText = statusDisplayStr || actionTaken || 'Traitée';
                  }

                  return (
                    <div
                      key={task.id}
                      onClick={() => fetchRequestDetails(task.id)}
                      className={`group p-4 cursor-pointer transition-all duration-150 hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedTask?.id === task.id ? 'bg-emerald-50 dark:bg-emerald-900/30 border-l-4 border-emerald-500' : ''}`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                        <div className="flex-grow">
                          <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                            {task.request_title || 'Demande sans titre'}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Code : {(typeof task.request_code === 'string' || typeof task.request_code === 'number') ? task.request_code : 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Étape : {typeof task.step === 'object' && task.step?.name ? task.step.name : (task.task_name || 'Inconnue')}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Demandeur : {typeof task.requester_name === 'string' && task.requester_name ? task.requester_name : 'Inconnu'}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right mt-2 sm:mt-0">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${isApproved ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-200' : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-200'}`}>
                            {displayStatusText}
                          </span>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Traité le: {formatDate(typeof task.completed_at === 'string' ? task.completed_at : null)}
                          </p>
                        </div>
                      </div>
                      {typeof task.comments === 'string' && task.comments && (
                        <div className="mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                          <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                            Commentaire: {task.comments}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ligne 2 : Colonne 2 (détail) sur toute la largeur */}
          {selectedTask && selectedRequest && (
            <div className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl overflow-hidden border border-gray-200 dark:border-emerald-700">
              <div className="p-8">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Détail de la demande</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Référence: {selectedRequest.reference_number || `#${selectedRequest.id}`}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTask(null);
                      setSelectedRequest(null);
                    }}
                    className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informations de la tâche */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-inner">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Informations de la tâche</h3>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center">
                        <FaUser className="mr-2 text-gray-500 dark:text-gray-300" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Demandeur</p>
                          {requesterDetails ? (
                            <div className="mt-1">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {`${requesterDetails.first_name || ''} ${requesterDetails.last_name || ''}`}
                                {!requesterDetails.first_name && !requesterDetails.last_name && 
                                  (requesterDetails.full_name || requesterDetails.username || 'Anonyme')}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {requesterDetails.email || 'Email non disponible'}
                              </p>
                              {requesterDetails.role && (
                                <p className="text-xs italic text-emerald-600 dark:text-emerald-400">
                                  {requesterDetails.role}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                              {typeof selectedRequest.requester === 'object' && selectedRequest.requester?.name
                                ? selectedRequest.requester.name
                                : 'Non renseigné'}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <FaFileAlt className="mr-2 text-gray-500 dark:text-gray-300" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Objet de la demande</p>
                          <p className="mt-1 text-sm text-gray-900 dark:text-white">
                            {selectedRequest.title || 'Non renseigné'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <FaCogs className="mr-2 text-gray-500 dark:text-gray-300" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Priorité</p>
                          <p className="mt-1 text-sm text-gray-900 dark:text-white">
                            {selectedRequest.priority || 'Non renseigné'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <FaCogs className="mr-2 text-gray-500 dark:text-gray-300" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Soumis le</p>
                          <p className="mt-1 text-sm text-gray-900 dark:text-white">
                            {selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleString('fr-FR') : 'Non renseigné'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <FaCogs className="mr-2 text-gray-500 dark:text-gray-300" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Référence</p>
                          <p className="mt-1 text-sm text-gray-900 dark:text-white">
                            {selectedRequest.request_code || `#${selectedRequest.id}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informations de l'étape */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-inner">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Informations de l&apos;étape</h3>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center">
                        <FaCogs className="mr-2 text-gray-500 dark:text-gray-300" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Étape actuelle</p>
                          <p className="mt-1 text-sm text-gray-900 dark:text-white">
                            {typeof selectedTask?.step === 'object' && selectedTask.step?.name ? selectedTask.step.name : 'Non renseigné'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <FaFileAlt className="mr-2 text-gray-500 dark:text-gray-300" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Description de l&apos;étape</p>
                          <p className="mt-1 text-sm text-gray-900 dark:text-white">
                            {typeof selectedTask?.step === 'object' && selectedTask.step?.description ? selectedTask.step.description : 'Non renseigné'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <FaCogs className="mr-2 text-gray-500 dark:text-gray-300" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Statut</p>
                          <p className="mt-1 text-sm text-gray-900 dark:text-white">
                            {selectedRequest.status === 'in_progress' ? 'En cours de traitement' : selectedRequest.status || 'Non renseigné'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Informations du workflow */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-inner">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Informations du workflow</h3>
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center">
                        <FaCogs className="mr-2 text-gray-500 dark:text-gray-300" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Type de service</p>
                          <p className="mt-1 text-sm text-gray-900 dark:text-white">
                            {typeof selectedRequest.workflow === 'object' && selectedRequest.workflow?.name ? selectedRequest.workflow.name : 'Non renseigné'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <FaCogs className="mr-2 text-gray-500 dark:text-gray-300" />
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Code du eService</p>
                          <p className="mt-1 text-sm text-gray-900 dark:text-white">
                            {typeof selectedRequest.workflow === 'object' && selectedRequest.workflow?.code ? selectedRequest.workflow.code : 'Non renseigné'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-gray-200 dark:border-emerald-600 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Description</h3>
                  <div className="mt-4 p-4 bg-gray-50 rounded-md dark:bg-gray-600">
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {selectedRequest.description || 'Aucune description fournie'}
                    </p>
                  </div>

                  {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Documents joints</h3>
                      <div className="mt-4 space-y-3">
                        {selectedRequest.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md dark:bg-gray-700">
                            <div className="flex items-center">
                              <FaFileAlt className="h-5 w-5 text-gray-400 dark:text-gray-300 mr-3" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {attachment.file_name || `Document ${index + 1}`}
                              </span>
                            </div>
                            <a
                              href={attachment.file} // Assuming 'file' is the correct property for the URL
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300"
                            >
                              Télécharger
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Validation</h3>
                    <div className="mt-4">
                      <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-white">
                        Commentaire (obligatoire pour le rejet)
                      </label>
                      <textarea
                        id="comment"
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                        placeholder="Ajoutez un commentaire si nécessaire..."
                      />
                    </div>

                    <div className="mt-4">
                      <label htmlFor="action" className="block text-sm font-medium text-gray-700 dark:text-white">
                        Action à effectuer
                      </label>
                      <select
                        id="action"
                        value={action}
                        onChange={(e) => setAction(e.target.value as ActionType)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                      >
                        <option value="validated">Valider</option>
                        <option value="rejected">Rejeter</option>
                        <option value="request_info">Demander plus d&apos;informations</option>
                        <option value="forwarded">Transférer</option>
                        <option value="commented">Ajouter un commentaire</option>
                      </select>
                    </div>

                    {/* --- MODIFICATION: Affichage conditionnel du sélecteur d'utilisateur --- */}
                    {action === 'forwarded' && (
                      <div className="mt-4">
                        <label htmlFor="targetUser" className="block text-sm font-medium text-gray-700 dark:text-white">
                          Transférer à
                        </label>
                        <select
                          id="targetUser"
                          value={targetUserId ?? ''}
                          onChange={(e) => setTargetUserId(e.target.value ? parseInt(e.target.value) : null)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm dark:bg-gray-700 dark:border-emerald-600 dark:text-white"
                        >
                          <option value="">-- Sélectionner un utilisateur --</option>
                          {assignableUsers.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.name || user.username || user.email} {/* Adaptez selon les champs disponibles */}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {/* --- FIN MODIFICATION --- */}

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-white">
                        Ajouter des documents
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md dark:border-emerald-600">
                        <div className="space-y-1 text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <div className="flex text-sm text-gray-600 dark:text-gray-300">
                            <label className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300">
                              <span>Téléverser un fichier</span>
                              <input
                                type="file"
                                className="sr-only"
                                onChange={handleFileChange}
                                multiple
                              />
                            </label>
                            <p className="pl-1">ou glisser-déposer</p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            PDF, DOCX, JPEG jusqu&apos;à 10MB
                          </p>
                        </div>
                      </div>

                      {attachments.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {attachments.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md dark:bg-gray-600">
                              <div className="flex items-center">
                                <FaFileAlt className="h-4 w-4 text-gray-500 dark:text-gray-300 mr-2" />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAttachment(index)}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <FaTrash className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* --- MODIFICATION: Bouton d'action unique (validation mise à jour) --- */}
                    <div className="mt-8 flex flex-col md:flex-row justify-end gap-4">
                      <button
                        type="button"
                        onClick={handleAction}
                        disabled={
                          loading ||
                          (action === 'rejected' && !comment.trim()) ||
                          (action === 'forwarded' && !targetUserId) // Désactiver si transfert sans utilisateur cible
                        }
                        className={`inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white
                                    ${action === 'rejected' ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800' : ''}
                                    ${action === 'validated' ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-800' : ''}
                                    ${action === 'request_info' ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800' : ''}
                                    ${action === 'forwarded' ? 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800' : ''}
                                    ${action === 'commented' ? 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800' : ''}
                                    disabled:opacity-50 disabled:cursor-not-allowed transition`}
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Traitement...
                          </>
                        ) : (
                          <>
                            {action === 'validated' && <FaCheck className="mr-2 -ml-1 h-5 w-5" />}
                            {action === 'rejected' && <FaTimes className="mr-2 -ml-1 h-5 w-5" />}
                            {action === 'request_info' && <FaInfoCircle className="mr-2 -ml-1 h-5 w-5" />}
                            {action === 'forwarded' && <FaShare className="mr-2 -ml-1 h-5 w-5" />}
                            {action === 'commented' && <FaComment className="mr-2 -ml-1 h-5 w-5" />}
                            {/* Texte du bouton basé sur l'action */}
                            {action === 'validated' && 'Valider la demande'}
                            {action === 'rejected' && 'Rejeter la demande'}
                            {action === 'request_info' && "Demander plus d'infos"}
                            {action === 'forwarded' && 'Transférer la tâche'}
                            {action === 'commented' && 'Ajouter le commentaire'}
                          </>
                        )}
                      </button>
                    </div>
                    {/* --- FIN MODIFICATION --- */}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
