import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

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

const PollsOverview: React.FC<PollsOverviewProps> = ({ polls: initialPolls }) => {
  // États
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pollResults, setPollResults] = useState<PollResult | null>(null);
  
  // États pour les modales
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);
  const [showVoteModal, setShowVoteModal] = useState<boolean>(false);
  
  // États pour les formulaires
  const [newQuestion, setNewQuestion] = useState<string>('');
  const [newOptions, setNewOptions] = useState<string[]>(['', '']);
  const [selectedOption, setSelectedOption] = useState<string>('');
  
  // Synchroniser l'état local des sondages avec les props
  useEffect(() => {
    setPolls(initialPolls);
  }, [initialPolls]);

  // Formatage de la date
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

  // Obtenir le style d'état du sondage
  const getPollStatusStyle = (isArchived: boolean) => {
    return isArchived 
      ? 'bg-gray-100 text-gray-700' 
      : 'bg-green-100 text-green-800';
  };

  // Obtenir le texte d'état du sondage
  const getPollStatusText = (isArchived: boolean) => {
    return isArchived ? 'Archivé' : 'Actif';
  };

  // Obtention du token d'authentification
  const getToken = () => {
    const tokenCookie = Cookies.get("authTokens");
    if (!tokenCookie) {
      setError("Session expirée. Veuillez vous reconnecter.");
      return null;
    }
    
    const tokenData = JSON.parse(tokenCookie);
    return tokenData.access;
  };

  // Récupérer l'ID utilisateur à partir des cookies ou du localStorage
  const getUserId = () => {
    // Remplacez ceci par la logique appropriée pour récupérer l'ID utilisateur dans votre application
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      return JSON.parse(userInfo).id;
    }
    return 0; // Valeur par défaut si non disponible
  };

  // Fonctions d'API
  const createPoll = async () => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;
      
      // Filtrer les options vides
      const filteredOptions = newOptions.filter(option => option.trim() !== '');
      
      // Vérifier que le sondage a un titre et au moins 2 options
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
      
      const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/communication/create_poll/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: newQuestion,
          options: filteredOptions,
          creator_id: getUserId()
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la création du sondage: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Ajouter le nouveau sondage à la liste
      const newPoll: Poll = {
        id: data.id,
        creator_id: getUserId(),
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
      console.error("Erreur lors de la création du sondage:", err);
      setError("Une erreur est survenue lors de la création du sondage.");
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
      
      // Filtrer les options vides
      const filteredOptions = newOptions.filter(option => option.trim() !== '');
      
      // Vérifications de validation
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
      
      console.log("Données envoyées:", {
        question: newQuestion,
        options: filteredOptions,  // important: utiliser "options" et non "choices"
        creator_id: selectedPoll.creator_id
      });
      
      // Utilisation de la méthode PUT au lieu de PATCH
      const response = await fetch(`https://www.backend.lnb-intranet.globalitnet.org/communication/update_poll/${selectedPoll.id}/`, {
        method: "PUT",  // Essayer avec PUT si PATCH ne fonctionne pas
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: newQuestion,
          options: filteredOptions,  // important: utiliser "options" et non "choices"
          creator_id: selectedPoll.creator_id
        }),
      });
      
      if (!response.ok) {
        console.error(`Erreur HTTP: ${response.status}`);
        // Essayer de récupérer les détails de l'erreur
        try {
          const errorData = await response.json();
          throw new Error(errorData.detail || `Erreur lors de la mise à jour du sondage: ${response.status}`);
        } catch {
          throw new Error(`Erreur lors de la mise à jour du sondage: ${response.status}`);
        }
      }
      
      const data = await response.json();
      console.log("Réponse du serveur:", data);
      
      // Mettre à jour le sondage dans la liste locale
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
  
  const deletePoll = async () => {
    if (!selectedPoll) return;
    
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;
      
      const response = await fetch(`https://www.backend.lnb-intranet.globalitnet.org/communication/delete_poll/${selectedPoll.id}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la suppression du sondage: ${response.status}`);
      }
      
      // Supprimer le sondage de la liste
      const updatedPolls = polls.filter(poll => poll.id !== selectedPoll.id);
      setPolls(updatedPolls);
      setShowDeleteModal(false);
      
    } catch (err) {
      console.error("Erreur lors de la suppression du sondage:", err);
      setError("Une erreur est survenue lors de la suppression du sondage.");
    } finally {
      setLoading(false);
    }
  };
  
  const togglePollArchiveStatus = async (poll: Poll) => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;
      
      // Nous utilisons l'endpoint de mise à jour pour également archiver/désarchiver
      const response = await fetch(`https://www.backend.lnb-intranet.globalitnet.org/communication/update_poll/${poll.id}/`, {
        method: "PATCH", // Changer la méthode HTTP
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: poll.question,
          options: poll.options, // Assurez-vous que ce nom correspond à ce que votre API attend
          creator_id: poll.creator_id,
          is_archived: !poll.is_archived
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la modification du statut: ${response.status}`);
      }
      
      // Mettre à jour le sondage dans la liste
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
      setError("Une erreur est survenue lors de la modification du statut du sondage.");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPollResults = async (poll: Poll) => {
    try {
      setLoading(true);
      const token = getToken();
      if (!token) return;
      
      const response = await fetch(`https://www.backend.lnb-intranet.globalitnet.org/communication/view_poll_results/${poll.id}/`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des résultats: ${response.status}`);
      }
      
      const data = await response.json();
      setPollResults(data);
      setSelectedPoll(poll);
      setShowResultsModal(true);
      
    } catch (err) {
      console.error("Erreur lors de la récupération des résultats:", err);
      setError("Une erreur est survenue lors de la récupération des résultats du sondage.");
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
      
      // Récupérer l'ID utilisateur
      const userId = getUserId();
      
      // Construire correctement l'URL
      const response = await fetch(`https://www.backend.lnb-intranet.globalitnet.org/communication/respond_to_poll/${selectedPoll.id}/`, {
        method: "POST",  // Vérifier que cette méthode est bien celle attendue par l'API
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
        // Récupérer le message d'erreur du serveur si disponible
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
      
      // Afficher un message de succès
      setError(null);
      
      // Afficher les résultats après le vote
      fetchPollResults(selectedPoll);
      
    } catch (err) {
      console.error("Erreur lors du vote:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue lors du vote.");
    } finally {
      setLoading(false);
    }
  };
  
  // Fonctions utilitaires pour les formulaires
  const resetCreateForm = () => {
    setNewQuestion('');
    setNewOptions(['', '']);
    setError(null);
  };
  
  const initEditForm = (poll: Poll) => {
    setSelectedPoll(poll);
    setNewQuestion(poll.question);
    // Assurez-vous d'avoir au moins 2 options, même si certaines sont vides
    setNewOptions([...poll.options, '', ''].slice(0, Math.max(poll.options.length, 2)));
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

  // Rendu des popups modaux
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
    if (!showDeleteModal || !selectedPoll) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="text-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mt-3">Supprimer le sondage</h3>
            <p className="text-gray-600 mt-1">
              Êtes-vous sûr de vouloir supprimer ce sondage ? Cette action ne peut pas être annulée.
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md mb-4">
            <p className="text-sm font-medium text-gray-700">{selectedPoll.question}</p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
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
    
    // Calcul du nombre total de votes
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
              // Calcul du pourcentage de votes pour cette option
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

      {error && !showCreateModal && !showEditModal && !showDeleteModal && !showVoteModal && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
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
        <div className="grid gap-6">
          {polls.map((poll) => (
            <div key={poll.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPollStatusStyle(poll.is_archived)}`}>
                    {getPollStatusText(poll.is_archived)}
                  </span>
                  <span className="text-sm text-gray-500">
                    Créé le {formatDate(poll.created_at)}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{poll.question}</h3>
                
                <div className="space-y-3 mb-5">
                  <h4 className="text-sm font-medium text-gray-700">Options de réponse:</h4>
                  <div className="grid gap-2">
                    {poll.options.map((option, index) => (
                      <div 
                        key={`${poll.id}-option-${index}`} 
                        className="bg-gray-50 border border-gray-200 rounded-md p-3 flex items-center"
                      >
                        <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 mr-3 text-xs font-medium">
                          {index + 1}
                        </div>
                        <span className="text-gray-700">{option}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-600">
                    {poll.is_archived ? "Dernière mise à jour: " : "Actif depuis: "}
                    {formatDate(poll.updated_at)}
                  </span>
                  
                  <div className="flex space-x-2">
                    {/* Bouton de vote (à ajouter) */}
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
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    
                    <button 
                      onClick={() => fetchPollResults(poll)}
                      className="text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 rounded-md p-1.5"
                      title="Voir les résultats"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => initEditForm(poll)}
                      className="text-gray-600 hover:text-gray-800 transition-colors bg-gray-50 rounded-md p-1.5"
                      title="Modifier le sondage"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    {poll.is_archived ? (
                      <button 
                        onClick={() => togglePollArchiveStatus(poll)}
                        className="text-green-600 hover:text-green-800 transition-colors bg-green-50 rounded-md p-1.5"
                        title="Réactiver le sondage"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    ) : (
                      <button 
                        onClick={() => togglePollArchiveStatus(poll)}
                        className="text-amber-600 hover:text-amber-800 transition-colors bg-amber-50 rounded-md p-1.5"
                        title="Archiver le sondage"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
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