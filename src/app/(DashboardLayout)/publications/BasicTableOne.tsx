"use client";

import React, { useState, useEffect } from "react";
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import {
  PlusCircle, Edit2, Trash2, MessageSquare,
  X, Send, ChevronLeft, EyeIcon, Calendar, User,
  AlertTriangle
} from 'lucide-react';

// URLs de l'API
const API_URLS = {
  VIEW_PUBLICATIONS: "https://www.backend.lnb-intranet.globalitnet.org/communication/view_publications/",
  DETAIL_PUBLICATION: "https://www.backend.lnb-intranet.globalitnet.org/communication/detail_publication/",
  VIEW_COMMENTS: "https://www.backend.lnb-intranet.globalitnet.org/communication/view_publication_comments/",
  CREATE_PUBLICATION: "https://www.backend.lnb-intranet.globalitnet.org/communication/create_publication/",
  UPDATE_PUBLICATION: "https://www.backend.lnb-intranet.globalitnet.org/communication/update_publication/",
  DELETE_PUBLICATION: "https://www.backend.lnb-intranet.globalitnet.org/communication/delete_publication/",
  COMMENT_PUBLICATION: "https://www.backend.lnb-intranet.globalitnet.org/communication/comment_on_publication/",
  LIST_USERS: "https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/list-all-users/"
};

// Interfaces
interface Comment {
  commentaire_n: number;
  commentateur: string;
  commentaire: string;
  date: string;
  heure: string;
}

interface AppUser {
  id: number;
  email: string;
  nom: string;
  prenom: string;
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
    name: string;
    avatar?: string;
  } | null;
  views_count: number;
  likes_count: number;
  comments: Comment[];
}

interface JwtPayload {
  exp: number;
  user_id?: number;
  [key: string]: unknown;
}

interface CreatePublicationPayload {
  title: string;
  content: string;
  category: string;
  is_public: boolean;
  author_id: number;
  destinataires?: number[];
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
  const [users, setUsers] = useState<AppUser[]>([]);

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

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPublication, setEditingPublication] = useState<Publication | null>(null);
  const [editFormData, setEditFormData] = useState<{
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

  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [publicationToDelete, setPublicationToDelete] = useState<Publication | null>(null);

  const [selectedRecipients, setSelectedRecipients] = useState<number[]>([]);
  const [recipientSearch, setRecipientSearch] = useState('');
  const filteredUsers = users.filter(user =>
    `${user.prenom} ${user.nom} ${user.email}`.toLowerCase().includes(recipientSearch.toLowerCase())
  );

  const [showUserListModal, setShowUserListModal] = useState(false);

  useEffect(() => {
    const isModalOpen = showCreateModal || showEditModal || showDeleteConfirmModal || showPublicationDetail;

    if (isModalOpen) {
      document.body.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    }

    return () => {
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
    };
  }, [showCreateModal, showEditModal, showDeleteConfirmModal, showPublicationDetail]);

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

  const fetchUsers = async (headers: HeadersInit) => {
    try {
      const response = await fetch(API_URLS.LIST_USERS, { headers });
      if (!response.ok) {
        console.error(`Erreur fetchUsers - Statut: ${response.status}`);
        throw new Error(`Impossible de charger les utilisateurs (Statut: ${response.status})`);
      }
      const data = await response.json();

      const userList = data.utilisateurs || [];
      setUsers(userList);
    } catch (error) {
       console.error("Erreur dans fetchUsers:", error);
       setUsers([]);
       throw error;
    }
  };

  const fetchPublications = async (headers: HeadersInit) => {
    const response = await fetch(API_URLS.VIEW_PUBLICATIONS, { headers });
     if (!response.ok) {
      throw new Error('Impossible de charger les publications');
    }
    const data = await response.json();
    console.log("Réponse publications:", data);

    let pubs: Publication[] = [];
    if (Array.isArray(data.publications)) {
       pubs = data.publications;
    } else if (Array.isArray(data)) {
       pubs = data;
    }
    setPublications(Array.isArray(pubs) ? pubs : []);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      const headers = getAuthHeaders();
      if (!headers) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setLoading(false);
        setPublications([]);
        setUsers([]);
        return;
      }

      try {
        await Promise.all([
          fetchUsers(headers),
          fetchPublications(headers)
        ]);
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        setError(err instanceof Error ? err.message : "Une erreur est survenue lors du chargement.");
        setPublications([]);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const fetchPublicationDetail = async (id: number) => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      const commentsResponse = await fetch(`${API_URLS.VIEW_COMMENTS}${id}/`, {
        method: 'GET',
        headers
      });

      if (!commentsResponse.ok) {
        throw new Error(`Erreur commentaires: ${commentsResponse.status}`);
      }

      const commentsData = await commentsResponse.json();
      console.log("Données brutes VIEW_COMMENTS:", commentsData);

      const publicationInfoFromCommentsApi = commentsData.publication || {};
      const commentsList: Comment[] = (commentsData.commentaires || []).map((c: Record<string, unknown>) => ({
        commentaire_n: c.commentaire_n ?? c['commentaire_n°'] ?? 0,
        commentateur: c.commentateur || 'Inconnu',
        commentaire: c.commentaire || '',
        date: c.date || '',
        heure: c.heure || ''
      }));

      const combinedData: PublicationDetail = {
        id: id,
        title: publicationInfoFromCommentsApi.titre || 'Titre inconnu',
        content: publicationInfoFromCommentsApi.contenu || '',
        created_at: `${publicationInfoFromCommentsApi.date || ''}T${publicationInfoFromCommentsApi.heure || ''}Z`,
        author_id: 0,
        category: '',
        is_public: true,
        author: {
          id: 0,
          name: publicationInfoFromCommentsApi.auteur || 'Auteur inconnu'
        },
        views_count: 0,
        likes_count: 0,
        comments: commentsList
      };

      console.log("Données combinées pour affichage détail:", combinedData);

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

  const createPublication = async () => {
    try {
      setLoading(true);
      setError(null);

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

      const author_id = getConnectedUserId();

      if (author_id === null) {
        setError("Impossible de récupérer l'identifiant de l'utilisateur. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      const payload: CreatePublicationPayload = {
        ...newPublication,
        author_id
      };
      if (!newPublication.is_public) {
        if (Array.isArray(selectedRecipients) && selectedRecipients.every(id => typeof id === 'number')) {
            payload.destinataires = selectedRecipients;
        } else {
            console.warn("selectedRecipients n'est pas un tableau de nombres valide:", selectedRecipients);
            setError("Erreur dans la sélection des destinataires.");
            setLoading(false);
            return;
        }
      }

      console.log("Payload envoyé pour création:", JSON.stringify(payload, null, 2));

      const response = await fetch(API_URLS.CREATE_PUBLICATION, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      console.log("Réponse brute de création:", response);

      if (!response.ok) {
        let errorData: unknown = null;
        try {
          errorData = await response.json();
          console.error("Données d'erreur API:", errorData);
        } catch {
          console.error("Impossible de parser la réponse d'erreur JSON");
        }
        let errorMessage = `Statut ${response.status}`;
        if (errorData && typeof errorData === 'object') {
            if ('message' in errorData && typeof errorData.message === 'string') {
                errorMessage = errorData.message;
            } else if ('detail' in errorData && typeof errorData.detail === 'string') {
                errorMessage = errorData.detail;
            } else {
                errorMessage = JSON.stringify(errorData);
            }
        } else if (typeof errorData === 'string') {
            errorMessage = errorData;
        }
        throw new Error(`Erreur lors de la création: ${errorMessage}`);
      }

      const successData = await response.json();
      console.log("Réponse succès API:", successData);

      setNewPublication({
        title: '',
        content: '',
        category: 'Annonce',
        is_public: true
      });
      setSelectedRecipients([]);

      setShowCreateModal(false);
      setError(null);
      const updatedHeaders = getAuthHeaders();
      if (updatedHeaders) {
          fetchPublications(updatedHeaders);
      }

    } catch (err: unknown) {
      console.error("Erreur détaillée dans createPublication:", err);
      setError(`Impossible de créer la publication. ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (publicationId: number) => {
    try {
      if (!commentContent.trim()) {
        return;
      }

      const headers = getAuthHeaders();
      if (!headers) {
        setError("Session expirée. Veuillez vous reconnecter.");
        return;
      }

      const userId = getConnectedUserId();

      if (userId === null) {
        setError("Impossible de récupérer l'identifiant de l'utilisateur pour commenter. Veuillez vous reconnecter.");
        return;
      }

      const payload = {
        content: commentContent,
        user_id: userId
      };

      console.log("Payload envoyé pour commentaire:", JSON.stringify(payload, null, 2));

      const response = await fetch(`${API_URLS.COMMENT_PUBLICATION}${publicationId}/`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let errorData = { status: "error", message: `Erreur HTTP ${response.status}` };
        try {
          errorData = await response.json();
        } catch {
          console.error("Impossible de parser la réponse d'erreur JSON du commentaire");
        }
        throw new Error(`Erreur: ${response.status} ${errorData.message || JSON.stringify(errorData)}`);
      }

      setCommentContent('');
      fetchPublicationDetail(publicationId);

    } catch (err) {
      console.error("Erreur lors de l'ajout du commentaire:", err);
      setError(`Impossible d'ajouter le commentaire: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    }
  };

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

  const findUserById = (id: number): AppUser | undefined => {
    return users.find(user => user.id === id);
  };

  const initEditPublicationForm = (publication: Publication) => {
    const currentUserId = getConnectedUserId();

    if (currentUserId === null) {
      setError("Impossible de vérifier votre identité pour modifier la publication. Veuillez vous reconnecter.");
      return;
    }

    if (publication.author_id !== currentUserId) {
      setError("Vous n'êtes pas autorisé à modifier cette publication car vous n'êtes pas son auteur.");
      return;
    }

    setEditingPublication(publication);
    setEditFormData({
      title: publication.title,
      content: publication.content,
      category: publication.category,
      is_public: publication.is_public,
    });
    setError(null);
    setShowEditModal(true);
  };

  const updatePublication = async () => {
    if (!editingPublication) {
      setError("Aucune publication sélectionnée pour la mise à jour.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const headers = getAuthHeaders();
      if (!headers) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      const currentUserId = getConnectedUserId();
      if (editingPublication.author_id !== currentUserId) {
        setError("Action non autorisée.");
        setLoading(false);
        return;
      }

      if (!editFormData.title || !editFormData.content) {
        setError("Le titre et le contenu sont obligatoires pour la mise à jour.");
        setLoading(false);
        return;
      }

      const payload = {
        title: editFormData.title,
        content: editFormData.content,
        category: editFormData.category,
        is_public: editFormData.is_public,
        author_id: editingPublication.author_id
      };

      console.log("Payload envoyé pour mise à jour:", JSON.stringify(payload, null, 2));

      const response = await fetch(`${API_URLS.UPDATE_PUBLICATION}${editingPublication.id}/`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error("Erreur API mise à jour:", responseData);
        const errorMessage = responseData?.message || JSON.stringify(responseData) || `Erreur ${response.status}`;
        throw new Error(`Erreur lors de la mise à jour: ${errorMessage}`);
      }

      console.log("Réponse succès mise à jour:", responseData);

      setPublications(prevPublications =>
        prevPublications.map(pub =>
          pub.id === editingPublication.id
            ? { ...pub, ...editFormData, updated_at: new Date().toISOString() }
            : pub
        )
      );

      setShowEditModal(false);
      setEditingPublication(null);

    } catch (err) {
      console.error("Erreur dans updatePublication:", err);
      setError(`Impossible de mettre à jour la publication. ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const initDelete = (publication: Publication) => {
    const currentUserId = getConnectedUserId();
    if (currentUserId === null) {
      setError("Impossible de vérifier votre identité. Veuillez vous reconnecter.");
      return;
    }

    if (publication.author_id !== currentUserId) {
      setError("Vous n'êtes pas autorisé à supprimer cette publication car vous n'êtes pas son auteur.");
      return;
    }

    setPublicationToDelete(publication);
    setError(null);
    setShowDeleteConfirmModal(true);
  };

  const deletePublication = async () => {
    if (!publicationToDelete) return;

    try {
      setLoading(true);
      setError(null);
      const headers = getAuthHeaders();
      if (!headers) {
        setError("Session expirée.");
        setLoading(false);
        return;
      }

      const currentUserId = getConnectedUserId();
      if (publicationToDelete.author_id !== currentUserId) {
          setError("Action non autorisée.");
          setLoading(false);
          return;
      }

      console.log(`Tentative de suppression de la publication ID: ${publicationToDelete.id}`);

      const response = await fetch(`${API_URLS.DELETE_PUBLICATION}${publicationToDelete.id}/`, {
        method: 'DELETE',
        headers,
      });

      let responseData = {};
      try {
          responseData = await response.json();
      } catch (e: unknown) {
          if (response.status !== 204) {
              console.warn("Impossible de parser la réponse JSON de suppression:", e);
          }
      }

      if (!response.ok) {
        console.error("Erreur API suppression:", response.status, responseData);
        const errorMessage =
          (responseData as { message?: string; detail?: string })?.message ||
          (responseData as { message?: string; detail?: string })?.detail ||
          `Erreur ${response.status}`;
        throw new Error(`Erreur lors de la suppression: ${errorMessage}`);
      }

      console.log("Réponse succès suppression:", responseData);

      setPublications(prevPublications =>
        prevPublications.filter(pub => pub.id !== publicationToDelete.id)
      );

      setShowDeleteConfirmModal(false);
      setPublicationToDelete(null);

    } catch (err) {
      console.error("Erreur dans deletePublication:", err);
      setError(`Impossible de supprimer la publication. ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const renderEditModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden relative animate-fade-in">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900">Modifier la publication</h3>
            <button
              onClick={() => { setShowEditModal(false); setEditingPublication(null); }}
              className="text-gray-500 hover:text-gray-700 bg-white p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="p-6">
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="space-y-5">
            <div>
              <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">Titre <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="edit-content" className="block text-sm font-medium text-gray-700 mb-1">Contenu <span className="text-red-500">*</span></label>
              <textarea
                id="edit-content"
                value={editFormData.content}
                onChange={(e) => setEditFormData({...editFormData, content: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[180px]"
                required
              ></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <select
                  id="edit-category"
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    id="edit-is_public"
                    checked={editFormData.is_public}
                    onChange={(e) => setEditFormData({...editFormData, is_public: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-700">Publication publique</span>
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-100">
            <button
              onClick={() => { setShowEditModal(false); setEditingPublication(null); }}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Annuler
            </button>
            <button
              onClick={updatePublication}
              disabled={loading || !editFormData.title || !editFormData.content}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium"
            >
              {loading ? 'Mise à jour...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeleteConfirmModal = () => {
    if (!showDeleteConfirmModal || !publicationToDelete) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-container-class">
        <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
          <div className="flex flex-col items-center text-center mb-4">
             <AlertTriangle className="h-12 w-12 text-red-500 mb-3" />
             <h3 className="text-lg font-semibold text-gray-900">Confirmer la suppression</h3>
          </div>
          <p className="text-sm text-gray-600 text-center mb-6">
            Êtes-vous sûr de vouloir supprimer définitivement la publication &quot;{publicationToDelete.title}&quot; ? Cette action est irréversible.
          </p>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}
          <div className="mt-6 flex justify-center space-x-4">
            <button
              type="button"
              onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setPublicationToDelete(null);
                  setError(null);
              }}
              className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={deletePublication}
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

  const UserCheckboxListModal = ({ show, onClose, users, selectedRecipients, setSelectedRecipients }: { show: boolean, onClose: () => void, users: AppUser[], selectedRecipients: number[], setSelectedRecipients: (recipients: number[] | ((prev: number[]) => number[])) => void }) => {
    const handleCheckboxChange = (userId: number) => {
      setSelectedRecipients((prevSelected: number[]) =>
        prevSelected.includes(userId)
          ? prevSelected.filter(id => id !== userId)
          : [...prevSelected, userId]
      );
    };

    if (!show) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Sélectionner les destinataires</h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 bg-white p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="p-6 max-h-96 overflow-y-auto">
            {users.map(user => (
              <div key={user.id} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={`user-${user.id}`}
                  checked={selectedRecipients.includes(user.id)}
                  onChange={() => handleCheckboxChange(user.id)}
                  className="mr-2"
                />
                <label htmlFor={`user-${user.id}`} className="text-sm">
                  {user.prenom} {user.nom} ({user.email})
                </label>
              </div>
            ))}
          </div>
          <div className="flex justify-end p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
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
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
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

                {!newPublication.is_public && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Destinataires <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Rechercher un utilisateur..."
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={recipientSearch}
                      onChange={e => setRecipientSearch(e.target.value)}
                    />
                    <button
                      onClick={() => setShowUserListModal(true)}
                      className="w-full bg-blue-600 text-white rounded-lg py-2.5 hover:bg-blue-700 transition-colors"
                    >
                      Sélectionner les destinataires
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      {selectedRecipients.length === 0
                        ? "Sélectionnez au moins un destinataire."
                        : `${selectedRecipients.length} destinataire(s) sélectionné(s).`}
                    </p>
                  </div>
                )}
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
      )}
      {showEditModal && renderEditModal()}
      {renderDeleteConfirmModal()}

      <UserCheckboxListModal
        show={showUserListModal}
        onClose={() => setShowUserListModal(false)}
        users={filteredUsers}
        selectedRecipients={selectedRecipients}
        setSelectedRecipients={setSelectedRecipients}
      />

      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {error && !showCreateModal && !showEditModal && !showDeleteConfirmModal && !showPublicationDetail && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {!showPublicationDetail && (
          <>
            <div className="bg-white shadow-sm rounded-lg p-6 mb-6 border border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Publications</h2>
                  <p className="text-gray-500 mt-1 text-sm">Gérez toutes vos communications internes et publiques.</p>
                </div>
                <button
                  onClick={() => {
                    setNewPublication({ title: '', content: '', category: 'Annonce', is_public: true });
                    setError(null);
                    setShowCreateModal(true);
                  }}
                  className="mt-3 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-colors duration-150 shadow-sm"
                >
                  <PlusCircle className="h-4.5 w-4.5" />
                  Nouvelle publication
                </button>
              </div>
            </div>

            {loading && !showCreateModal && !showEditModal && !showDeleteConfirmModal ? (
              <div className="flex justify-center items-center h-60 bg-white rounded-lg shadow-sm border border-gray-100">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                  <p className="mt-3 text-gray-500 text-sm">Chargement des publications...</p>
                </div>
              </div>
            ) : (
              Array.isArray(publications) && publications.length > 0 ? (
                <div className="space-y-5">
                  {publications.map((publication) => {
                    const author = findUserById(publication.author_id);
                    console.log(`Cherche auteur pour pub ID ${publication.id}, author_id ${publication.author_id}. Trouvé:`, author);

                    return (
                      <div key={publication.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                        <div className="p-5 sm:p-6">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getCategoryColor(publication.category)} mb-2 sm:mb-0`}>
                              {publication.category || 'Non défini'}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center">
                              <Calendar className="h-3.5 w-3.5 mr-1 opacity-75" />
                              {formatDate(publication.created_at)}
                            </span>
                          </div>

                          <h3 className="text-lg font-semibold text-gray-800 mb-2 leading-snug line-clamp-2">{publication.title}</h3>

                          <div className="text-sm text-gray-600 mb-4 line-clamp-3">
                            {publication.content}
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center text-xs text-gray-600 mb-3 sm:mb-0 min-w-0">
                              <div className="bg-gray-100 rounded-full h-7 w-7 flex items-center justify-center mr-2 flex-shrink-0">
                                <User className="h-4 w-4 text-gray-500" />
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
                                <span className="font-medium text-gray-800 truncate block">
                                  {author ? `${author.prenom || ''} ${author.nom || ''}`.trim() : `ID: ${publication.author_id}`}
                                </span>
                                {author?.email && (
                                  <span className="text-gray-500 truncate block sm:inline">{author.email}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex space-x-1.5">
                              <button
                                onClick={() => fetchPublicationDetail(publication.id)}
                                className="text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md text-xs"
                                title="Voir les détails et commentaires"
                              >
                                <EyeIcon className="h-3.5 w-3.5" />
                                <span>Voir</span>
                                {(publication.comments_count ?? 0) > 0 && (
                                  <span className="ml-1 bg-white text-blue-700 px-1 py-0.5 rounded-full text-[10px] font-medium border border-blue-100">
                                    {publication.comments_count}
                                  </span>
                                )}
                              </button>
                              <button
                                onClick={() => initEditPublicationForm(publication)}
                                className="text-gray-500 hover:text-gray-700 transition-colors bg-gray-50 hover:bg-gray-100 p-1.5 rounded-md"
                                title="Modifier la publication"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => initDelete(publication)}
                                className="text-red-500 hover:text-red-700 transition-colors bg-red-50 hover:bg-red-100 p-1.5 rounded-md"
                                title="Supprimer la publication"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-10 text-center">
                  <div className="bg-gray-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700">Aucune publication pour le moment</h3>
                  <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">Commencez par créer une nouvelle publication pour partager des informations.</p>
                  <button
                    onClick={() => {
                      setNewPublication({ title: '', content: '', category: 'Annonce', is_public: true });
                      setError(null);
                      setShowCreateModal(true);
                    }}
                    className="mt-5 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-150 shadow-sm"
                  >
                    <PlusCircle className="h-4.5 w-4.5" />
                    Créer une publication
                  </button>
                </div>
              )
            )}
          </>
        )}

        {showPublicationDetail && selectedPublication && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 max-w-3xl mx-auto">
            <button
              onClick={() => setShowPublicationDetail(false)}
              className="mb-6 flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Retour à la liste
            </button>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getCategoryColor(selectedPublication.category)}`}>
                  {selectedPublication.category || 'Non défini'}
                </span>
                <span className="text-xs text-gray-500 flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1 opacity-75" />
                  {formatDate(selectedPublication.created_at)}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedPublication.title}</h2>
              <div className="text-gray-700 text-base whitespace-pre-line">{selectedPublication.content}</div>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center text-xs text-gray-600">
                  <User className="h-4 w-4 mr-1" />
                  {selectedPublication.author?.name}
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <EyeIcon className="h-4 w-4 mr-1" />
                  {selectedPublication.views_count} vues
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  {selectedPublication.comments.length} commentaires
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Commentaires</h3>
                {selectedPublication.comments.length === 0 ? (
                  <div className="text-gray-500 text-sm">Aucun commentaire pour cette publication.</div>
                ) : (
                  <ul className="space-y-4">
                    {selectedPublication.comments.map((comment) => (
                      <li key={comment.commentaire_n} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-800 text-sm">{comment.commentateur}</span>
                          <span className="text-xs text-gray-500 ml-2">{comment.date} {comment.heure}</span>
                        </div>
                        <div className="text-gray-700 text-sm">{comment.commentaire}</div>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-6">
                  <textarea
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => addComment(selectedPublication.id)}
                      disabled={loading || !commentContent.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                      {loading ? 'Envoi...' : 'Envoyer'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PublicationsPage;
export type { Publication, AppUser as User };
