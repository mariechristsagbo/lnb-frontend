import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { User, Mail, BarChart2, CheckSquare, Archive, ArchiveRestore, X } from 'lucide-react';

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

// Interface pour les erreurs API (si elle n'existe pas déjà)
interface ApiErrorResponse {
  message?: string;
  detail?: string;
  [key: string]: unknown; // Permet d'autres propriétés potentielles
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
  ARCHIVE_POLL: "https://www.backend.lnb-intranet.globalitnet.org/communication/archive_poll/", // Nouvelle URL pour archiver/désarchiver
  VIEW_RESULTS: "https://www.backend.lnb-intranet.globalitnet.org/communication/view_poll_results/",
  RESPOND_POLL: "https://www.backend.lnb-intranet.globalitnet.org/communication/respond_to_poll/"
};

const PollsOverview: React.FC<PollsOverviewProps> = ({ polls: initialPolls }) => {
  console.log("PollsOverview received initialPolls:", initialPolls);
  const [polls, setPolls] = useState<Poll[]>(initialPolls || []);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pollResults, setPollResults] = useState<PollResult | null>(null);
  const [showResultsModal, setShowResultsModal] = useState<boolean>(false);
  const [showVoteModal, setShowVoteModal] = useState<boolean>(false);
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
    setPolls(Array.isArray(initialPolls) ? initialPolls : []);

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
    
    try {
        const tokenData = JSON.parse(tokenCookie);
        return tokenData.access;
    } catch {
        setError("Impossible de lire les informations de session.");
        return null;
    }
  };

  const findUserById = (id: number): AppUser | undefined => {
    return users.find(user => user.id === id);
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

      const response = await fetch(`${API_URLS.ARCHIVE_POLL}${poll.id}/`, {
        method: "POST", // Changé de PATCH à POST
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: currentUserId // Envoyer user_id comme requis par l'API
        }),
      });

      if (!response.ok) {
        let errorData: ApiErrorResponse = {}; // Correction: Utiliser ApiErrorResponse
        try {
            // Essayer de parser comme JSON, mais s'attendre à ce que ce soit potentiellement vide ou non-JSON
            if (response.headers.get("content-type")?.includes("application/json")) {
                errorData = await response.json();
            } else if (response.status !== 204) { // 204 No Content n'a pas de corps
               // Gérer d'autres types de contenu ou juste le statut si nécessaire
               console.log("Réponse d'erreur d'archivage non JSON reçue:", await response.text());
            }
        } catch (e) {
            // Ignorer l'erreur de parsing si le statut est OK (ex: 204 No Content)
            if (!response.ok) {
                console.warn("Impossible de parser la réponse JSON d'erreur pour l'archivage:", e);
            }
        }
        // Correction: Accéder aux propriétés de manière sûre sans 'as any'
        const errorMessage = errorData.detail || errorData.message || `Erreur lors de la modification du statut: ${response.status}`;
        throw new Error(errorMessage);
      }

      const updatedPolls = polls.map(p =>
        p.id === poll.id
          ? {
              ...p,
              is_archived: !p.is_archived, // On suppose que l'API a inversé l'état
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
      // Optionnel: On pourrait quand même ouvrir une modale avec des résultats agrégés (sans noms)
      // Pour l'instant, on bloque simplement l'accès aux détails.
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
      setPollResults(data);
      setSelectedPoll(poll);
      setShowResultsModal(true); // N'afficher la modale que si l'utilisateur est autorisé et que les données sont chargées

    } catch (err) {
      console.error("Erreur lors de la récupération des résultats:", err);
      // Afficher l'erreur spécifique attrapée
      setError(err instanceof Error ? err.message : "Une erreur est survenue lors de la récupération des résultats du sondage.");
      // S'assurer que la modale ne s'ouvre pas en cas d'erreur
      setShowResultsModal(false);
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
      if (!token) {
          setLoading(false);
          return;
      }

      const userId = getConnectedUserId();
      if (userId === null) {
          setError("Impossible de récupérer votre identifiant pour voter. Veuillez vous reconnecter.");
          setLoading(false);
          return;
      }

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
      setSelectedOption('');

    } catch (err) {
      console.error("Erreur lors du vote:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue lors du vote.");
    } finally {
      setLoading(false);
    }
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
              <X className="h-6 w-6" />
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
              <X className="h-6 w-6" />
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
      </div>

      {error && !showVoteModal && !showResultsModal && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {polls.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <BarChart2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg font-medium">Aucun sondage disponible</p>
          <p className="text-gray-500 mt-2">Les sondages actifs apparaîtront ici.</p>
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
                      <CheckSquare className="h-4 w-4" />
                    </button>
                  )}
                  <button 
                    onClick={() => fetchPollResults(poll)}
                    className="text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 rounded-md p-1.5"
                    title="Voir les résultats"
                  >
                    <BarChart2 className="h-4 w-4" />
                  </button>
                  {poll.is_archived ? (
                    <button 
                      onClick={() => togglePollArchiveStatus(poll)}
                      className="text-green-600 hover:text-green-800 transition-colors bg-green-50 rounded-md p-1.5"
                      title="Réactiver le sondage"
                    >
                      <ArchiveRestore className="h-4 w-4" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => togglePollArchiveStatus(poll)}
                      className="text-amber-600 hover:text-amber-800 transition-colors bg-amber-50 rounded-md p-1.5"
                      title="Archiver le sondage"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {renderResultsModal()}
      {renderVoteModal()}
    </div>
  );
};

export default PollsOverview;

export type { Poll };