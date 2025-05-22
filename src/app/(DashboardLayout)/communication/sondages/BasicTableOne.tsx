"use client";

import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { User, Mail, AlertTriangle, Trash2 } from 'lucide-react';

interface Poll {
  id: number;
  creator_id: number;
  question: string;
  options: string[];
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

interface PollResult {
  question: string;
  choices: {
    choice: string;
    vote_count: number;
    voters: {
      username: string;
      full_name: string;
    }[];
  }[];
}

interface PollsOverviewProps {
  polls: Poll[];
}

interface JwtPayload {
  exp: number;
  user_id?: number;
  [key: string]: unknown;
}

interface AppUser {
  id: number;
  email: string;
  nom: string; 
  prenom: string;
}

interface ApiErrorResponse {
  message?: string;
  detail?: string;
  [key: string]: unknown; // Allow other properties
}

const getConnectedUserId = (): number | null => {
  const tokenData = Cookies.get('authTokens');
  if (!tokenData) {
    console.error("Aucun token d'authentification trouvé dans les cookies.");
    return null;
  }

  try {
    const parsedToken = JSON.parse(tokenData);
    const accessToken = parsedToken.access;

    if (!accessToken) {
      console.error("Le token d'accès est manquant dans les données des cookies.");
      return null;
    }

    const decodedToken = jwtDecode<JwtPayload>(accessToken);
    const userId = decodedToken.user_id;

    if (typeof userId === 'number') {
      return userId;
    } else {
      console.error("L'ID utilisateur n'a pas été trouvé ou n'est pas un nombre dans le token décodé.", decodedToken);
      return null;
    }
  } catch (error) {
    console.error("Erreur lors de la lecture ou du décodage du token:", error);
    return null;
  }
};

const API_URLS = {
  LIST_USERS: "https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/list-all-users/",
  CREATE_POLL: "https://www.backend.lnb-intranet.globalitnet.org/communication/create_poll/",
  UPDATE_POLL: "https://www.backend.lnb-intranet.globalitnet.org/communication/update_poll/", // Gardé pour la mise à jour générale (si nécessaire ailleurs)
  DELETE_POLL: "https://www.backend.lnb-intranet.globalitnet.org/communication/delete_poll/",
  // --- AJOUT URL ARCHIVE ---
  ARCHIVE_POLL: "https://www.backend.lnb-intranet.globalitnet.org/communication/archive_poll/", // URL spécifique pour archiver/désarchiver
  // --- FIN AJOUT ---
  VIEW_RESULTS: "https://www.backend.lnb-intranet.globalitnet.org/communication/view_poll_results/",
  RESPOND_POLL: "https://www.backend.lnb-intranet.globalitnet.org/communication/respond_to_poll/"
};

const PollsOverview: React.FC<PollsOverviewProps> = ({ polls: initialPolls }) => {
  // --- MODIFICATION: Initialiser l'état avec un tableau vide par défaut ---
  // Ajout d'un log pour vérifier la prop reçue
  console.log("PollsOverview received initialPolls:", initialPolls);
  // Utiliser initialPolls OU un tableau vide si initialPolls est undefined/null
  const [polls, setPolls] = useState<Poll[]>(initialPolls || []);
  // --- FIN MODIFICATION ---

  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pollResults, setPollResults] = useState<PollResult | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);
  const [showVoteModal, setShowVoteModal] = useState<boolean>(false);
  const [pollToDelete, setPollToDelete] = useState<Poll | null>(null);
  const [newQuestion, setNewQuestion] = useState<string>('');
  const [newOptions, setNewOptions] = useState<string[]>(['', '']);
  const [selectedOption, setSelectedOption] = useState<string>('');

  const fetchUsers = async (headers: HeadersInit) => {
    try {
      const response = await fetch(API_URLS.LIST_USERS, { headers });
      if (!response.ok) {
        console.error(`Erreur fetchUsers - Statut: ${response.status}`);
        throw new Error(`Impossible de charger les utilisateurs (Statut: ${response.status})`);
      }
      const data = await response.json();
      console.log("Réponse brute de l'API LIST_USERS:", JSON.stringify(data, null, 2)); 
      
      const userList = data.utilisateurs || []; 
      console.log("Liste des utilisateurs extraite (userList):", userList);

      if (Array.isArray(userList)) {
         setUsers(userList);
      } else {
         console.error("La liste des utilisateurs extraite n'est pas un tableau:", userList);
         setUsers([]); 
      }
    } catch (error) {
       console.error("Erreur dans fetchUsers:", error);
       setUsers([]); 
    }
  };

  useEffect(() => {
    // --- MODIFICATION: S'assurer que initialPolls est un tableau avant de mettre à jour l'état ---
    // Cela évite de remettre l'état à undefined si la prop change en undefined
    setPolls(Array.isArray(initialPolls) ? initialPolls : []);
    // --- FIN MODIFICATION ---

    const loadUsers = async () => {
        const token = getToken();
        if (!token) {
            setUsers([]);
            return;
        }
        const headers = {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
        };
        await fetchUsers(headers);
    };

    loadUsers();

  }, [initialPolls]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPollStatusStyle = (isArchived: boolean) => {
    return isArchived 
      ? 'bg-gray-100 text-gray-700' 
      : 'bg-green-100 text-green-800';
  };

  const getPollStatusText = (isArchived: boolean) => {
    return isArchived ? 'Archivé' : 'Actif';
  };

  const getToken = () => {
    const tokenCookie = Cookies.get("authTokens");
    if (!tokenCookie) {
      setError("Session expirée. Veuillez vous reconnecter.");
      return null;
    }
    
    const tokenData = JSON.parse(tokenCookie);
    return tokenData.access;
  };

  const findUserById = (id: number): AppUser | undefined => {
    return users.find(user => user.id === id);
  };

  const createPoll = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
          setLoading(false);
          return;
      }

      const creatorId = getConnectedUserId();
      if (creatorId === null) {
          setError("Impossible de récupérer l'identifiant de l'utilisateur. Veuillez vous reconnecter.");
          setLoading(false);
          return;
      }

      const filteredOptions = newOptions.filter(option => option.trim() !== '');

      if (!newQuestion.trim()) {
        setError("Veuillez entrer une question pour le sondage.");
        setLoading(false);
        return;
      }
      if (filteredOptions.length < 2) {
        setError("Veuillez entrer au moins 2 options valides pour le sondage.");
        setLoading(false);
        return;
      }

      const payload = {
        question: newQuestion,
        options: filteredOptions,
        creator_id: creatorId
      };

      console.log("Payload envoyé pour création sondage:", JSON.stringify(payload, null, 2));

      const response = await fetch(API_URLS.CREATE_POLL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data?.message || data?.detail || `Erreur ${response.status}`;
        console.error("Erreur API création sondage:", data);
        throw new Error(`Erreur lors de la création du sondage: ${errorMessage}`);
      }

      console.log("Réponse API création sondage:", data);

      const newPollId = data.poll_id; 
      if (typeof newPollId !== 'number') {
          console.error("L'ID du nouveau sondage n'a pas été reçu correctement:", data);
          throw new Error("Impossible de récupérer l'ID du sondage créé.");
      }

      const newPoll: Poll = {
        id: newPollId,
        creator_id: creatorId,
        question: newQuestion,
        options: filteredOptions,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_archived: false
      };

      setPolls([newPoll, ...polls]);
      resetCreateForm();
      setShowCreateModal(false);

    } catch (err) {
      console.error("Erreur dans createPoll:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue lors de la création du sondage.");
    } finally {
      setLoading(false);
    }
  };
  
  const updatePoll = async () => {
    if (!selectedPoll) return;
    
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) return;
      
      const filteredOptions = newOptions.filter(option => option.trim() !== '');
      
      if (!newQuestion.trim()) {
        setError("Veuillez entrer une question pour le sondage.");
        setLoading(false);
        return;
      }
      
      if (filteredOptions.length < 2) {
        setError("Veuillez entrer au moins 2 options pour le sondage.");
        setLoading(false);
        return;
      }
      
      console.log("Données envoyées pour mise à jour:", {
        question: newQuestion,
        options: filteredOptions,
        creator_id: selectedPoll.creator_id
      });
      
      const response = await fetch(`${API_URLS.UPDATE_POLL}${selectedPoll.id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: newQuestion,
          options: filteredOptions,
          creator_id: selectedPoll.creator_id
        }),
      });
      
      const data = await response.json(); 

      if (!response.ok) {
        console.error(`Erreur HTTP: ${response.status}`, data);
        const errorMessage = data?.detail || data?.message || `Erreur lors de la mise à jour du sondage: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      console.log("Réponse du serveur (mise à jour):", data);
      
      const updatedPolls = polls.map(poll => 
        poll.id === selectedPoll.id 
          ? { 
              ...poll, 
              question: newQuestion, 
              options: filteredOptions,
              updated_at: new Date().toISOString()
            } 
          : poll
      );
      
      setPolls(updatedPolls);
      setShowEditModal(false);
      
    } catch (err) {
      console.error("Erreur lors de la mise à jour du sondage:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue lors de la mise à jour du sondage.");
    } finally {
      setLoading(false);
    }
  };
  
  const initDelete = (poll: Poll) => {
    // --- AJOUT LOG ---
    console.log('initDelete appelée avec:', poll); 
    // --- FIN AJOUT LOG ---

    const currentUserId = getConnectedUserId();
    if (currentUserId === null) {
      setError("Impossible de vérifier votre identité. Veuillez vous reconnecter.");
      return;
    }

    if (poll.creator_id !== currentUserId) {
      setError("Vous n'êtes pas autorisé à supprimer ce sondage car vous n'êtes pas son créateur.");
      return;
    }

    setPollToDelete(poll);
    setError(null);
    setShowDeleteModal(true);
  };

  const deletePoll = async () => {
    if (!pollToDelete) return;
    
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) {
          setLoading(false);
          return;
      }

      const currentUserId = getConnectedUserId();
      if (pollToDelete.creator_id !== currentUserId) {
          setError("Action non autorisée.");
          setLoading(false);
          return;
      }

      console.log(`Tentative de suppression du sondage ID: ${pollToDelete.id}`);

      const response = await fetch(`${API_URLS.DELETE_POLL}${pollToDelete.id}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      let responseData: ApiErrorResponse = {}; // Utiliser le type ApiErrorResponse
      try {
          // Essayer de parser comme JSON, mais s'attendre à ce que ce soit potentiellement vide ou non-JSON
          if (response.headers.get("content-type")?.includes("application/json")) {
              responseData = await response.json();
          } else if (response.status !== 204) { // 204 No Content n'a pas de corps
             // Gérer d'autres types de contenu ou juste le statut si nécessaire
             console.log("Réponse de suppression non JSON reçue:", await response.text());
          }
      } catch (e) {
          // Ignorer l'erreur de parsing si le statut est OK (ex: 204 No Content)
          if (!response.ok) {
              console.warn("Impossible de parser la réponse JSON de suppression:", e);
          }
      }

      if (!response.ok) {
        console.error("Erreur API suppression:", response.status, responseData);
        // Accéder aux propriétés de manière sûre
        const errorMessage = responseData?.message || responseData?.detail || `Erreur ${response.status}`;
        throw new Error(`Erreur lors de la suppression: ${errorMessage}`);
      }

      console.log("Réponse succès suppression:", responseData);

      const updatedPolls = polls.filter(poll => poll.id !== pollToDelete.id);
      setPolls(updatedPolls);
      setShowDeleteModal(false);
      setPollToDelete(null);

    } catch (err) {
      console.error("Erreur lors de la suppression du sondage:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue lors de la suppression du sondage.");
    } finally {
      setLoading(false);
    }
  };
  
  const togglePollArchiveStatus = async (poll: Poll) => {
    const currentUserId = getConnectedUserId();
    if (currentUserId === null) {
      setError("Impossible de vérifier votre identité. Veuillez vous reconnecter.");
      return;
    }

    // --- AJOUT: Vérification du créateur pour l'archivage ---
    if (poll.creator_id !== currentUserId) {
      setError("Seul le créateur du sondage peut modifier son statut (archiver/réactiver).");
      return; // Arrêter si l'utilisateur actuel n'est pas le créateur
    }
    // --- FIN AJOUT ---

    try {
      setLoading(true);
      setError(null); // Effacer les erreurs précédentes (y compris le message de restriction potentiel)
      const token = getToken();
      if (!token) {
          setLoading(false);
          return;
      }

      console.log(`Tentative de basculement archive pour poll ID: ${poll.id} par user ID: ${currentUserId}`);

      const response = await fetch(`${API_URLS.ARCHIVE_POLL}${poll.id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: currentUserId
        }),
      });

      let responseData: ApiErrorResponse = {}; // Utiliser le type ApiErrorResponse
      try {
          if (response.headers.get("content-type")?.includes("application/json")) {
              responseData = await response.json();
          } else if (response.ok) { // Si OK mais pas JSON (ex: 204)
              console.log("Réponse d'archivage non JSON reçue (Statut OK):", response.status);
          } else {
              console.log("Réponse d'erreur d'archivage non JSON reçue:", await response.text());
          }
      } catch (e) {
           if (!response.ok) {
              console.warn("Impossible de parser la réponse d'erreur JSON pour l'archivage:", e);
           } else {
              // Peut arriver si la réponse est OK mais pas du JSON valide (inattendu)
              console.warn("Impossible de parser la réponse JSON pour l'archivage (Statut OK):", e);
           }
      }


      if (!response.ok) {
        console.error("Erreur API archivage:", response.status, responseData);
        // Accéder aux propriétés de manière sûre
        const errorMessage = responseData?.detail || responseData?.message || `Erreur lors de la modification du statut: ${response.status}`;
        throw new Error(errorMessage);
      }

      console.log("Réponse succès archivage:", responseData);

      const updatedPolls = polls.map(p =>
        p.id === poll.id
          ? {
              ...p,
              is_archived: !p.is_archived,
              updated_at: new Date().toISOString()
            }
          : p
      );
      setPolls(updatedPolls);

    } catch (err) {
      console.error("Erreur lors de la modification du statut:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue lors de la modification du statut du sondage.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPollResults = async (poll: Poll) => {
    // --- AJOUT: Vérification du créateur ---
    const currentUserId = getConnectedUserId();
    if (currentUserId === null) {
      setError("Impossible de vérifier votre identité. Veuillez vous reconnecter.");
      return; // Arrêter si l'utilisateur n'est pas connecté
    }

    if (poll.creator_id !== currentUserId) {
      setError("Seul le créateur du sondage peut consulter les résultats détaillés.");
      // Optionnel: Afficher un message temporaire ou ne rien faire
      // toast.error("Accès restreint aux résultats.");
      return; // Arrêter si l'utilisateur actuel n'est pas le créateur
    }
    // --- FIN AJOUT ---

    try {
      setLoading(true);
      setError(null); // Effacer les erreurs précédentes (y compris le message de restriction)
      const token = getToken();
      if (!token) {
          setLoading(false);
          return;
      }

      console.log(`Récupération des résultats pour poll ID: ${poll.id} par user ID: ${currentUserId}`);

      const response = await fetch(`${API_URLS.VIEW_RESULTS}${poll.id}/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData?.detail || errorData?.message || `Erreur lors de la récupération des résultats: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Résultats reçus:", data);
      setPollResults(data);
      setSelectedPoll(poll);
      setShowResultsModal(true); // N'afficher la modale que si autorisé et réussi

    } catch (err) {
      console.error("Erreur lors de la récupération des résultats:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue lors de la récupération des résultats du sondage.");
      setShowResultsModal(false); // S'assurer que la modale ne s'ouvre pas en cas d'erreur
    } finally {
      setLoading(false);
    }
  };
  
  const submitVote = async () => {
    if (!selectedPoll || !selectedOption) return;
    
    try {
      setLoading(true);
      setError(null);
      const token = getToken();
      if (!token) return;
      
      const userId = getConnectedUserId();
      
      const response = await fetch(`${API_URLS.RESPOND_POLL}${selectedPoll.id}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          choice: selectedOption,
          user_id: userId
        }),
      });
      
      if (!response.ok) {
        console.error(`Erreur HTTP: ${response.status}`);
        try {
          const errorData = await response.json();
          throw new Error(errorData.detail || `Erreur lors du vote: ${response.status}`);
        } catch {
          throw new Error(`Erreur lors du vote: ${response.status}`);
        }
      }
      
      const data = await response.json();
      console.log("Réponse du serveur:", data);
      
      setShowVoteModal(false);
      
      setError(null);
      
      fetchPollResults(selectedPoll);
      
    } catch (err) {
      console.error("Erreur lors du vote:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue lors du vote.");
    } finally {
      setLoading(false);
    }
  };
  
  const resetCreateForm = () => {
    setNewQuestion('');
    setNewOptions(['', '']);
    setError(null);
  };
  
  const initEditForm = (poll: Poll) => {
    const currentUserId = getConnectedUserId();

    if (currentUserId === null) {
      setError("Impossible de vérifier votre identité pour modifier le sondage. Veuillez vous reconnecter.");
      return; 
    }

    if (poll.creator_id !== currentUserId) {
      setError("Vous n'êtes pas autorisé à modifier ce sondage car vous n'êtes pas son créateur.");
      return; 
    }

    setSelectedPoll(poll);
    setNewQuestion(poll.question);
    const optionsForEdit = [...poll.options];
    while(optionsForEdit.length < 2) {
        optionsForEdit.push('');
    }
    setNewOptions([...optionsForEdit, '', ''].slice(0, Math.max(optionsForEdit.length, 2))); 
    setError(null);
    setShowEditModal(true);
  };
  
  const addOption = () => {
    setNewOptions([...newOptions, '']);
  };
  
  const updateOption = (index: number, value: string) => {
    const updatedOptions = [...newOptions];
    updatedOptions[index] = value;
    setNewOptions(updatedOptions);
  };
  
  const removeOption = (index: number) => {
    if (newOptions.length <= 2) {
      setError("Un sondage doit avoir au moins 2 options.");
      return;
    }
    
    const updatedOptions = newOptions.filter((_, i) => i !== index);
    setNewOptions(updatedOptions);
  };

  const renderCreateModal = () => {
    if (!showCreateModal) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Créer un nouveau sondage</h3>
            <button 
              onClick={() => {
                setShowCreateModal(false);
                resetCreateForm();
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
                Question du sondage
              </label>
              <input
                type="text"
                id="question"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Entrez votre question..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Options de réponse
              </label>
              <div className="space-y-2">
                {newOptions.map((option, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="ml-2 text-gray-500 hover:text-red-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                onClick={addOption}
                className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Ajouter une option
              </button>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(false);
                resetCreateForm();
              }}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={createPoll}
              disabled={loading}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : 'Créer le sondage'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderEditModal = () => {
    if (!showEditModal || !selectedPoll) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Modifier le sondage</h3>
            <button 
              onClick={() => setShowEditModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="edit-question" className="block text-sm font-medium text-gray-700 mb-1">
                Question du sondage
              </label>
              <input
                type="text"
                id="edit-question"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Entrez votre question..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Options de réponse
              </label>
              <div className="space-y-2">
                {newOptions.map((option, index) => (
                  <div key={index} className="flex items-center">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="ml-2 text-gray-500 hover:text-red-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                onClick={addOption}
                className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Ajouter une option
              </button>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={updatePoll}
              disabled={loading}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Mise à jour...' : 'Mettre à jour'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderDeleteModal = () => {
    if (!showDeleteModal || !pollToDelete) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-container-class">
        <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
          <div className="flex flex-col items-center text-center mb-4">
             <AlertTriangle className="h-12 w-12 text-red-500 mb-3" />
             <h3 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
          </div>

          <p className="text-sm text-gray-600 text-center mb-6">
            Êtes-vous sûr de vouloir supprimer définitivement le sondage suivant ? Cette action est irréversible.
          </p>

          <div className="bg-gray-50 border border-gray-200 p-3 rounded-md mb-6 text-center">
             <p className="text-sm font-medium text-gray-800 truncate">{pollToDelete.question}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-center space-x-4">
            <button
              type="button"
              onClick={() => {
                  setShowDeleteModal(false);
                  setPollToDelete(null);
                  setError(null);
              }}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={deletePoll}
              disabled={loading}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Suppression...' : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderResultsModal = () => {
    if (!showResultsModal || !selectedPoll || !pollResults) return null;
    
    const totalVotes = pollResults.choices.reduce((acc, choice) => acc + choice.vote_count, 0);
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Résultats du sondage</h3>
            <button 
              onClick={() => setShowResultsModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="mb-4">
            <h4 className="text-md font-medium text-gray-800 mb-2">{pollResults.question}</h4>
            <p className="text-sm text-gray-600">Total des votes : {totalVotes}</p>
          </div>
          
          <div className="space-y-4 mb-6">
            {pollResults.choices.map((choice, index) => {
              const percentage = totalVotes > 0 ? Math.round((choice.vote_count / totalVotes) * 100) : 0;
              
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">{choice.choice}</span>
                    <span className="text-gray-600">{choice.vote_count} vote{choice.vote_count !== 1 ? 's' : ''} ({percentage}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  {choice.voters && choice.voters.length > 0 && (
                    <div className="mt-1 ml-2">
                      <p className="text-xs text-gray-500">
                        Votants : {choice.voters.map(voter => voter.full_name || voter.username).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowResultsModal(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderVoteModal = () => {
    if (!showVoteModal || !selectedPoll) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Voter au sondage</h3>
            <button 
              onClick={() => setShowVoteModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="mb-4">
            <h4 className="text-md font-medium text-gray-800 mb-3">{selectedPoll.question}</h4>
            
            <div className="space-y-2">
              {selectedPoll.options.map((option, index) => (
                <div key={index} className="flex items-center">
                  <input
                    type="radio"
                    id={`option-${index}`}
                    name="poll-option"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    value={option}
                    checked={selectedOption === option}
                    onChange={() => setSelectedOption(option)}
                  />
                  <label htmlFor={`option-${index}`} className="ml-3 block text-sm font-medium text-gray-700">
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowVoteModal(false)}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={submitVote}
              disabled={loading || !selectedOption}
              className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Envoi...' : 'Voter'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Sondages</h2>
        <button 
          onClick={() => {
            resetCreateForm();
            setShowCreateModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium inline-flex items-center gap-2 transition-colors duration-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nouveau sondage
        </button>
      </div>

      {error && !showCreateModal && !showEditModal && !showDeleteModal && !showVoteModal && !showResultsModal && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {polls.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-600 text-lg font-medium">Aucun sondage disponible</p>
          <p className="text-gray-500 mt-2">Créez votre premier sondage en cliquant sur le bouton ci-dessus.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => {
            const creator = findUserById(poll.creator_id);
            console.log(`Cherche créateur pour poll ID ${poll.id}, creator_id ${poll.creator_id}. Trouvé:`, creator);

            return (
              <div key={poll.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPollStatusStyle(poll.is_archived)}`}>
                    {getPollStatusText(poll.is_archived)}
                  </span>
                  <span className="text-xs text-gray-500" title={poll.created_at}>
                    Créé le {formatDate(poll.created_at)}
                  </span>
                </div>

                <div className="p-5 flex-grow">
                  <h3 className="text-md font-semibold text-gray-800 mb-3 leading-snug">{poll.question}</h3>

                  <div className="flex items-center space-x-3 mb-4 text-xs text-gray-600 border-b border-gray-100 pb-3">
                    <div className="flex items-center flex-shrink-0">
                      <User className="h-3.5 w-3.5 mr-1 text-gray-400" />
                      <span className="truncate">
                        {creator ? `${creator.prenom || ''} ${creator.nom || ''}`.trim() : `ID: ${poll.creator_id}`}
                      </span>
                    </div>
                    {creator?.email && (
                      <div className="flex items-center min-w-0">
                        <Mail className="h-3.5 w-3.5 mr-1 text-gray-400 flex-shrink-0" />
                        <span className="truncate" title={creator.email}>{creator.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">Options :</h4>
                    {poll.options.map((option, index) => (
                      <div key={`${poll.id}-option-${index}`} className="text-gray-700 text-sm flex items-start">
                         <span className="text-gray-400 mr-1.5 text-xs mt-0.5">&#9679;</span>
                         <span>{option}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-end space-x-1.5">
                  {!poll.is_archived && (
                    <button 
                      onClick={() => {
                        setSelectedPoll(poll);
                        setSelectedOption('');
                        setShowVoteModal(true);
                      }}
                      className="text-green-600 hover:text-green-800 transition-colors bg-green-50 rounded-md p-1.5"
                      title="Voter"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /> </svg>
                    </button>
                  )}
                  <button 
                    onClick={() => fetchPollResults(poll)}
                    className="text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 rounded-md p-1.5"
                    title="Voir les résultats"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> </svg>
                  </button>
                  <button 
                    onClick={() => initEditForm(poll)}
                    className="text-gray-600 hover:text-gray-800 transition-colors bg-gray-100 rounded-md p-1.5"
                    title="Modifier le sondage"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /> </svg>
                  </button>
                  {poll.is_archived ? (
                    <button 
                      onClick={() => togglePollArchiveStatus(poll)}
                      className="text-green-600 hover:text-green-800 transition-colors bg-green-50 rounded-md p-1.5"
                      title="Réactiver le sondage"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /> </svg>
                    </button>
                  ) : (
                    <button 
                      onClick={() => togglePollArchiveStatus(poll)}
                      className="text-amber-600 hover:text-amber-800 transition-colors bg-amber-50 rounded-md p-1.5"
                      title="Archiver le sondage"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /> </svg>
                    </button>
                  )}
                  <button
                    onClick={() => initDelete(poll)}
                    className="text-red-500 hover:text-red-700 transition-colors bg-red-50 hover:bg-red-100 rounded-md p-1.5"
                    title="Supprimer le sondage"
                  >
                     <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {renderCreateModal()}
      {renderEditModal()}
      {renderDeleteModal()}
      {renderResultsModal()}
      {renderVoteModal()}
    </div>
  );
};

export default PollsOverview;

export type { Poll };