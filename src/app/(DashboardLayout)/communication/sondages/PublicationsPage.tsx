import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import {
  PlusCircle, Edit2, Trash2, MessageSquare,
  X, Send, ChevronLeft, EyeIcon, Calendar, User, Mail // <-- Ajout de Mail
} from 'lucide-react';

// URLs de l'API
const API_URLS = {
  VIEW_PUBLICATIONS: "https://www.backend.lnb-intranet.globalitnet.org/communication/view_publications/",
  DETAIL_PUBLICATION: "https://www.backend.lnb-intranet.globalitnet.org/communication/detail_publication/",
  VIEW_COMMENTS: "https://www.backend.lnb-intranet.globalitnet.org/communication/view_publication_comments/",
  CREATE_PUBLICATION: "https://www.backend.lnb-intranet.globalitnet.org/communication/create_publication/",
  COMMENT_PUBLICATION: "https://www.backend.lnb-intranet.globalitnet.org/communication/comment_on_publication/",
  LIST_USERS: "https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/list-all-users/" // <-- Nouvelle URL
};

// Interfaces
interface Comment {
  // Ancienne structure commentée :
  // id: number;
  // content: string;
  // created_at: string;
  // user: {
  //   id: number;
  //   name: string; 
  //   avatar?: string;
  // };

  // Nouvelle structure basée sur l'API view_publication_comments
  commentaire_n: number; // Utiliser commentaire_n au lieu de commentaire_n° pour éviter les caractères spéciaux
  commentateur: string;
  commentaire: string;
  date: string;
  heure: string;
}

// Interface pour la structure brute des commentaires reçus de l'API
interface RawCommentData {
  commentaire_n?: number;
  'commentaire_n°'?: number; // Gérer la clé alternative
  commentateur?: string;
  commentaire?: string;
  date?: string;
  heure?: string;
  // Ajoutez d'autres propriétés si elles existent dans la réponse API
}

// Nouvelle interface pour les utilisateurs
interface AppUser {
  id: number;
  email: string;
  nom: string; 
  prenom: string;
  // Supprimer ou commenter first_name/last_name
  // first_name: string; 
  // last_name: string;
  // Ajoutez d'autres champs si nécessaire (ex: avatar)
}

interface Publication {
  id: number;
  title: string;
  content: string;
  category: string;
  created_at: string;
  is_public: boolean;
  author_id: number;
  comments_count?: number;
  updated_at?: string;
  is_archived?: boolean;
}

interface PublicationDetail extends Publication {
  author: {
    id: number;
    name: string; // Ou first_name/last_name si l'API détail le renvoie comme ça
    avatar?: string;
  } | null;
  views_count: number;
  likes_count: number;
  comments: Comment[];
}

interface JwtPayload {
  exp: number;
  user_id?: number; // Assurez-vous que 'user_id' est la bonne clé
  [key: string]: unknown;
}

/**
 * Récupère l'ID de l'utilisateur à partir du token JWT stocké dans les cookies.
 * @returns L'ID de l'utilisateur ou null si non trouvé/invalide.
 */
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

    // IMPORTANT: Vérifiez la clé exacte ('user_id', 'sub', etc.)
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

const PublicationsPage: React.FC = () => {
  const [selectedPublication, setSelectedPublication] = useState<PublicationDetail | null>(null);
  const [showPublicationDetail, setShowPublicationDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [publications, setPublications] = useState<Publication[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]); // <-- Nouvel état pour les utilisateurs

  // Ajout de l'état pour la nouvelle publication
  const [newPublication, setNewPublication] = useState<{
    title: string;
    content: string;
    category: string;
    is_public: boolean;
  }>({
    title: '',
    content: '',
    category: 'Annonce',
    is_public: true,
  });

  // Fonction pour récupérer les headers avec le token
  const getAuthHeaders = () => {
    try {
      const tokenCookie = Cookies.get("authTokens");
      if (!tokenCookie) {
        console.log("Pas de token d'authentification trouvé");
        return null;
      }
      
      const tokenData = JSON.parse(tokenCookie);
      if (!tokenData || !tokenData.access) {
        console.log("Format de token invalide");
        return null;
      }
      
      const accessToken = tokenData.access;
      
      return {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des headers d'authentification:", error);
      return null;
    }
  };

  // Fonction pour récupérer les utilisateurs
  const fetchUsers = async (headers: HeadersInit) => {
    try {
      const response = await fetch(API_URLS.LIST_USERS, { headers });
      if (!response.ok) {
        console.error(`Erreur fetchUsers - Statut: ${response.status}`);
        throw new Error(`Impossible de charger les utilisateurs (Statut: ${response.status})`);
      }
      const data = await response.json();
      
      console.log("Réponse brute de l'API LIST_USERS:", JSON.stringify(data, null, 2)); 

      // --- CORRECTION ICI ---
      // Utiliser la clé "utilisateurs" de votre réponse API
      const userList = data.utilisateurs || []; 
      // --- FIN CORRECTION ---

      console.log("Liste des utilisateurs extraite (userList):", userList);

      if (Array.isArray(userList)) {
         // --- AJOUT: Vérifier la structure des objets utilisateurs ---
         if (userList.length > 0) {
            console.log("Premier utilisateur extrait:", userList[0]); 
            // Vérifiez si userList[0].first_name et userList[0].last_name existent
            // L'API renvoie "nom" et "prenom", pas "first_name" et "last_name" !
         }
         // --- FIN AJOUT ---
         setUsers(userList);
      } else {
         console.error("La liste des utilisateurs extraite n'est pas un tableau:", userList);
         setUsers([]); 
      }
    } catch (error) {
       console.error("Erreur dans fetchUsers:", error);
       setUsers([]); 
       throw error; 
    }
  };

  // Fonction pour récupérer les publications (légèrement modifiée pour accepter les headers)
  const fetchPublications = async (headers: HeadersInit) => {
    const response = await fetch(API_URLS.VIEW_PUBLICATIONS, { headers });
     if (!response.ok) {
      throw new Error('Impossible de charger les publications');
    }
    const data = await response.json();
    console.log("Réponse publications:", data);

    // Assurez-vous que la clé est correcte ('publications')
    let pubs: Publication[] = [];
    if (Array.isArray(data.publications)) {
       pubs = data.publications;
    } else if (Array.isArray(data)) { // Fallback si la réponse est directement un tableau
       pubs = data;
    }
    setPublications(Array.isArray(pubs) ? pubs : []);
  };

  // Utiliser useEffect pour charger les deux listes
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      const headers = getAuthHeaders();
      if (!headers) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setLoading(false);
        setPublications([]); // Assurer un tableau vide
        setUsers([]); // Assurer un tableau vide
        return;
      }

      try {
        // Charger les utilisateurs et les publications en parallèle
        await Promise.all([
          fetchUsers(headers),
          fetchPublications(headers)
        ]);
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        setError(err instanceof Error ? err.message : "Une erreur est survenue lors du chargement.");
        setPublications([]); // Assurer un tableau vide en cas d'erreur
        setUsers([]); // Assurer un tableau vide en cas d'erreur
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []); // Dépendance vide pour charger une seule fois

  // Récupérer les détails d'une publication
  const fetchPublicationDetail = async (id: number) => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      // Récupérer les commentaires (et les infos de base de la publication via cette API)
      const commentsResponse = await fetch(`${API_URLS.VIEW_COMMENTS}${id}/`, { 
        method: 'GET',
        headers 
      });
      
      if (!commentsResponse.ok) {
        throw new Error(`Erreur commentaires: ${commentsResponse.status}`);
      }

      const commentsData = await commentsResponse.json();
      console.log("Données brutes VIEW_COMMENTS:", commentsData); // Log pour vérifier

      // --- CORRECTION EXTRACTION ---
      // Extraire les détails de la publication et les commentaires de la réponse
      const publicationInfoFromCommentsApi = commentsData.publication || {}; // Infos de base de la publication
      // Utiliser RawCommentData au lieu de any pour le paramètre 'c'
      const commentsList: Comment[] = (commentsData.commentaires || []).map((c: RawCommentData) => ({
        // Mapper les clés de l'API vers l'interface Comment
        commentaire_n: c.commentaire_n ?? c['commentaire_n°'] ?? 0, // Gérer les deux clés possibles
        commentateur: c.commentateur || 'Inconnu',
        commentaire: c.commentaire || '',
        date: c.date || '',
        heure: c.heure || ''
      })); 
      // --- FIN CORRECTION EXTRACTION ---

      // Combiner les données (utiliser les infos de publication de l'API commentaires)
      // Si l'API DETAIL_PUBLICATION est nécessaire pour d'autres champs (views_count, likes_count),
      // il faudra fusionner detailData et publicationInfoFromCommentsApi
      const combinedData: PublicationDetail = {
        // Champs de base de Publication (à remplir depuis publicationInfoFromCommentsApi ou detailData)
        id: id, // On a l'ID
        title: publicationInfoFromCommentsApi.titre || 'Titre inconnu', // Utiliser titre de l'API commentaires
        content: publicationInfoFromCommentsApi.contenu || '', // Utiliser contenu de l'API commentaires
        created_at: `${publicationInfoFromCommentsApi.date || ''}T${publicationInfoFromCommentsApi.heure || ''}Z`, // Combiner date/heure si besoin format ISO
        author_id: 0, // L'API VIEW_COMMENTS ne donne pas author_id, il faudrait DETAIL_PUBLICATION pour ça
        category: '', // L'API VIEW_COMMENTS ne donne pas category
        is_public: true, // Supposition, à récupérer de DETAIL_PUBLICATION si nécessaire

        // Champs spécifiques à PublicationDetail
        author: { // Utiliser l'auteur de l'API commentaires
          id: 0, // ID non fourni par VIEW_COMMENTS
          name: publicationInfoFromCommentsApi.auteur || 'Auteur inconnu' 
        }, 
        views_count: 0, // Non fourni par VIEW_COMMENTS
        likes_count: 0, // Non fourni par VIEW_COMMENTS
        comments: commentsList // Utiliser la liste extraite et mappée
      };

      console.log("Données combinées pour affichage détail:", combinedData); // Log pour vérifier

      setSelectedPublication(combinedData);
      setShowPublicationDetail(true);
      setError(null);
    } catch (err) {
      console.error("Erreur lors de la récupération des détails/commentaires:", err);
      setError("Impossible de charger les détails de la publication");
    } finally {
      setLoading(false);
    }
  };

  // Créer une nouvelle publication
  const createPublication = async () => {
    try {
      setLoading(true);
      setError(null); // Réinitialiser l'erreur au début

      const headers = getAuthHeaders();
      if (!headers) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      if (!newPublication.title || !newPublication.content) {
        setError("Le titre et le contenu sont obligatoires");
        setLoading(false);
        return;
      }

      // Récupération de l'ID utilisateur via la fonction utilitaire
      const author_id = getConnectedUserId();

      if (author_id === null) {
        setError("Impossible de récupérer l'identifiant de l'utilisateur. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      const payload = {
        ...newPublication,
        author_id // Utiliser l'ID récupéré
      };

      console.log("Payload envoyé pour création:", JSON.stringify(payload, null, 2)); // Log pour débogage

      const response = await fetch(API_URLS.CREATE_PUBLICATION, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      console.log("Réponse brute de création:", response); // Log pour débogage

      if (!response.ok) {
        let errorData = null;
        try {
          errorData = await response.json();
          console.error("Données d'erreur API:", errorData); // Log détaillé de l'erreur API
        } catch {
          console.error("Impossible de parser la réponse d'erreur JSON");
        }
        // Tenter de fournir un message d'erreur plus utile
        const errorMessage = errorData ? JSON.stringify(errorData) : `Statut ${response.status}`;
        throw new Error(`Erreur lors de la création: ${errorMessage}`);
      }

      // Si la réponse est OK, on peut essayer de lire le JSON (même si c'est juste un message de succès)
      const successData = await response.json();
      console.log("Réponse succès API:", successData); // Log de la réponse succès

      setNewPublication({
        title: '',
        content: '',
        category: 'Annonce',
        is_public: true
      });

      setShowCreateModal(false);
      setError(null);
      // Rafraîchir la liste
      fetchPublications(headers);
    } catch (err: unknown) {
      console.error("Erreur détaillée dans createPublication:", err);
      // Afficher une erreur plus conviviale à l'utilisateur
      setError(`Impossible de créer la publication. ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un commentaire
  const addComment = async (publicationId: number) => {
    try {
      if (!commentContent.trim()) {
        return; // Ne rien faire si le commentaire est vide
      }

      const headers = getAuthHeaders();
      if (!headers) {
        setError("Session expirée. Veuillez vous reconnecter.");
        return;
      }

      // --- MODIFICATION ICI ---
      // Récupération de l'ID utilisateur via la fonction utilitaire
      const userId = getConnectedUserId();

      if (userId === null) {
        setError("Impossible de récupérer l'identifiant de l'utilisateur pour commenter. Veuillez vous reconnecter.");
        return;
      }
      // --- FIN MODIFICATION ---


      const payload = {
        content: commentContent,
        user_id: userId // <-- AJOUTER user_id au payload
      };

      console.log("Payload envoyé pour commentaire:", JSON.stringify(payload, null, 2)); // Log pour débogage

      const response = await fetch(`${API_URLS.COMMENT_PUBLICATION}${publicationId}/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorData = { status: "error", message: `Erreur HTTP ${response.status}` };
        try {
          // Essayer de parser le message d'erreur JSON du backend
          errorData = await response.json();
        } catch {
          console.error("Impossible de parser la réponse d'erreur JSON du commentaire");
        }
        // Utiliser le message d'erreur du backend s'il existe
        throw new Error(`Erreur: ${response.status} ${errorData.message || JSON.stringify(errorData)}`);
      }

      // Réinitialiser le champ de commentaire
      setCommentContent('');
      
      // Rafraîchir les détails pour voir le nouveau commentaire
      // Assurez-vous que fetchPublicationDetail recharge aussi les commentaires
      fetchPublicationDetail(publicationId); 

    } catch (err) {
      console.error("Erreur lors de l'ajout du commentaire:", err);
      setError(`Impossible d'ajouter le commentaire: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  };

  // Formater la date
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

  // Obtenir la couleur du badge en fonction de la catégorie
  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase() || '') {
      case 'annonce':
        return 'bg-blue-100 text-blue-800';
      case 'événement':
      case 'evenement':
        return 'bg-green-100 text-green-800';
      case 'news':
      case 'actualité':
      case 'actualite':
        return 'bg-purple-100 text-purple-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    if (showCreateModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showCreateModal]);

  // Fonction pour trouver un utilisateur par ID
  const findUserById = (id: number): AppUser | undefined => {
    return users.find(user => user.id === id);
  };

  return showCreateModal ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backdropFilter: "blur(6px)",
        background: "rgba(0,0,0,0.25)",
        WebkitBackdropFilter: "blur(6px)"
      }}
    >
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden relative animate-fade-in">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900">Nouvelle publication</h3>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-gray-500 hover:text-gray-700 bg-white p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-5">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Titre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={newPublication.title}
                onChange={(e) => setNewPublication({...newPublication, title: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Entrez un titre accrocheur"
                required
              />
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Contenu <span className="text-red-500">*</span>
              </label>
              <textarea
                id="content"
                value={newPublication.content}
                onChange={(e) => setNewPublication({...newPublication, content: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[180px]"
                placeholder="Décrivez le contenu de votre publication..."
                required
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  id="category"
                  value={newPublication.category}
                  onChange={(e) => setNewPublication({...newPublication, category: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Annonce">Annonce</option>
                  <option value="Événement">Événement</option>
                  <option value="Actualité">Actualité</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              
              <div className="flex items-center h-full pt-6">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="is_public"
                    checked={newPublication.is_public}
                    onChange={(e) => setNewPublication({...newPublication, is_public: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">Publication publique</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => setShowCreateModal(false)}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={createPublication}
              disabled={loading || !newPublication.title || !newPublication.content}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium shadow-sm"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Création...
                </>
              ) : (
                <>Publier</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md shadow-sm mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <X className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Affichage standard des publications */}
      {!showPublicationDetail && (
        <>
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Publications</h2>
                <p className="text-gray-500 mt-1">Gérez toutes vos communications internes et publiques</p>
              </div>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-5 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-colors duration-200 shadow-sm"
              >
                <PlusCircle className="h-4.5 w-4.5" />
                Nouvelle publication
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-80 bg-white rounded-lg shadow-sm">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-4 text-gray-500">Chargement des publications...</p>
              </div>
            </div>
          ) : (
            (Array.isArray(publications) && publications.length > 0 ? (
              publications.map((publication) => {
                // Trouver l'auteur correspondant dans la liste des utilisateurs
                const author = findUserById(publication.author_id);

                // --- LOG IMPORTANT ---
                console.log(`Cherche auteur pour pub ID ${publication.id}, author_id ${publication.author_id}. Trouvé:`, author);
                // --- FIN LOG ---

                return (
                  <div key={publication.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(publication.category)}`}>
                          {publication.category || 'Non catégorisé'}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center">
                          <Calendar className="h-4 w-4 mr-1.5 opacity-75" />
                          {formatDate(publication.created_at)}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-800 mb-3 line-clamp-1">{publication.title}</h3>
                      
                      <div className="prose max-w-none text-gray-600 mb-5">
                        <p className="line-clamp-3">{publication.content}</p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center text-gray-600 text-sm space-x-4"> {/* Ajout de space-x-4 */}
                          <div className="flex items-center">
                             <div className="bg-gray-100 rounded-full h-8 w-8 flex items-center justify-center mr-2 flex-shrink-0"> {/* Ajout flex-shrink-0 */}
                               <User className="h-4 w-4 text-gray-500" />
                             </div>
                             {/* Afficher Nom et Prénom (CORRIGÉ) */}
                             <span className="truncate"> 
                               {/* Utiliser "prenom" et "nom" */}
                               {author ? `${author.prenom || ''} ${author.nom || ''}`.trim() : `ID: ${publication.author_id}`}
                             </span>
                          </div>
                          {/* Afficher l'email si l'auteur est trouvé */}
                          {author && author.email && (
                            <div className="flex items-center text-gray-500">
                              <Mail className="h-4 w-4 mr-1.5 opacity-75 flex-shrink-0" /> {/* Ajout flex-shrink-0 */}
                              <span className="truncate">{author.email}</span> {/* Ajout truncate */}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => fetchPublicationDetail(publication.id)}
                            className="text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md"
                          >
                            <EyeIcon className="h-4.5 w-4.5" />
                            <span>Voir</span>
                            {(publication.comments_count ?? 0) > 0 && (
                              <span className="ml-1 bg-white text-blue-700 px-1.5 py-0.5 rounded-full text-xs font-medium border border-blue-100">
                                {publication.comments_count}
                              </span>
                            )}
                          </button>
                          <button className="text-gray-500 hover:text-gray-700 transition-colors bg-gray-50 hover:bg-gray-100 p-1.5 rounded-md">
                            <Edit2 className="h-4.5 w-4.5" />
                          </button>
                          <button className="text-red-500 hover:text-red-700 transition-colors bg-red-50 hover:bg-red-100 p-1.5 rounded-md">
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-10 text-center">
                <div className="bg-gray-50 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700">Aucune publication disponible</h3>
                <p className="text-gray-500 mt-2 max-w-lg mx-auto">Créez votre première publication pour informer et communiquer avec votre équipe et vos partenaires.</p>
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="mt-6 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-5 rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm"
                >
                  <PlusCircle className="h-4.5 w-4.5" />
                  Créer une publication
                </button>
              </div>
            )
          ))}
        </>
      )}

      {/* Affichage détaillé d'une publication */}
      {showPublicationDetail && selectedPublication && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
            <div className="flex items-center">
              <button 
                onClick={() => setShowPublicationDetail(false)}
                className="mr-4 text-gray-500 hover:text-gray-700 transition-colors bg-white p-2 rounded-full shadow-sm"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold text-gray-800">Détails de la publication</h2>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-wrap items-center justify-between mb-6">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(selectedPublication.category)} mb-2 sm:mb-0`}>
                {selectedPublication.category || 'Non catégorisé'}
              </span>
              <div className="flex items-center flex-wrap gap-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1.5" />
                  {formatDate(selectedPublication.created_at)}
                </span>
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {selectedPublication.views_count || 0} vues
                </span>
                <span className="flex items-center">
                  <User className="h-4 w-4 mr-1.5" />
                  {/* Adaptez ici si l'API détail renvoie first/last name */}
                  {selectedPublication.author?.name || 'Auteur inconnu'}
                </span>
              </div>
            </div>
            
            <h3 className="text-2xl font-semibold text-gray-800 mb-5">{selectedPublication.title}</h3>
            
            <div className="prose prose-blue max-w-none text-gray-600 mb-8">
              <p className="whitespace-pre-line">{selectedPublication.content}</p>
            </div>
            
            <div className="border-t border-gray-200 pt-8 mt-8">
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="text-lg font-medium text-gray-800 mb-1 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                  Commentaires ({selectedPublication.comments?.length || 0})
                </h4>
                <p className="text-sm text-gray-500">
                  Participez à la discussion en ajoutant vos commentaires ci-dessous
                </p>
              </div>
              
              {/* --- MODIFICATION LISTE COMMENTAIRES --- */}
              {selectedPublication.comments?.length > 0 ? (
                <div className="space-y-5 mb-8">
                  {selectedPublication.comments.map((comment) => (
                    // Utiliser commentaire_n comme clé
                    <div key={comment.commentaire_n} className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start mb-3">
                        <div className="bg-blue-100 rounded-full h-10 w-10 flex items-center justify-center text-blue-600 mr-3 flex-shrink-0">
                          {/* Afficher la première lettre du commentateur */}
                          {comment.commentateur ? comment.commentateur.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            {/* Afficher le nom du commentateur */}
                            <div className="font-medium text-gray-900">{comment.commentateur || 'Utilisateur inconnu'}</div>
                            {/* Afficher date et heure */}
                            <div className="text-sm text-gray-500">{`${comment.date} ${comment.heure}`}</div>
                          </div>
                          {/* Afficher le contenu du commentaire */}
                          <p className="text-gray-600">{comment.commentaire}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // ... (Affichage "Aucun commentaire") ...
                <div className="text-center py-8 bg-gray-50 rounded-lg mb-8">
                  <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-600 font-medium">Aucun commentaire pour le moment</p>
                  <p className="text-gray-500 mt-1">Soyez le premier à commenter cette publication</p>
                </div>
              )}
              {/* --- FIN MODIFICATION LISTE COMMENTAIRES --- */}
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="text-sm font-medium text-gray-700 mb-3">Ajouter un commentaire</h5>
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Partagez votre avis..."
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-l-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => addComment(selectedPublication.id)}
                    disabled={!commentContent.trim()}
                    className="bg-blue-600 text-white px-4 py-3 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicationsPage;

export type { Publication, AppUser as User }; // Exporter aussi le type User si besoin ailleurs