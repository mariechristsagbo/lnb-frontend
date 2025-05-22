"use client";
import React, { useState, useEffect, useRef } from "react";
import Button from "@/components/ui/button/Button";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";

import { FaTrash, FaPaperPlane, FaSearch } from "react-icons/fa";
import Cookies from "js-cookie";

// Interfaces pour l'API
interface Message {
  id: number;
  content: string;
  sender_id: number;
  recipient_id?: number;
  conversation_id: number;
  timestamp: string;
  status: "sent" | "delivered" | "read";
  attachment?: string;
  forwarded_from?: number; // Pour identifier les messages transférés
  is_edited?: boolean; // Pour identifier les messages modifiés
}

interface Conversation {
  id: number;
  title?: string;
  participant_ids: number[]; // Modification: participant_ids au lieu de participants
  participants?: number[]; // Garder pour compatibilité avec le code existant
  created_at?: string;
  updated_at?: string;
  unread_count?: number;
  last_message?: Message;
  is_group?: boolean;
}

interface User {
  id: number;
  username: string;
  nom: string;
  prenom: string;
  email?: string;
  profile_image?: string;
}

// 1. Correction du type 'any' en définissant une interface appropriée
// Ajouter cette interface sous les autres interfaces au début du fichier
interface ConversationResponse {
  id: number;
  participant_ids?: number[];
  participants?: number[];
  title?: string;
  created_at?: string;
  updated_at?: string;
  // [key: string]: any; // Pour les autres propriétés inconnues
}

export default function ProfessionalChatApp() {
  // États
  const [activeTab, setActiveTab] = useState<"conversations" | "utilisateurs">("conversations");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  // Ajoutez cet état au début du composant
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);

  // Ajoutez ces états au début de votre composant
  const [isCreatingNewConversation, setIsCreatingNewConversation] = useState<boolean>(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  // Ajouter ces nouveaux états à votre composant
  const [messageToForward, setMessageToForward] = useState<Message | null>(null);
  const [showForwardDialog, setShowForwardDialog] = useState<boolean>(false);
  const [messageToEdit, setMessageToEdit] = useState<Message | null>(null);
  const [editedContent, setEditedContent] = useState<string>("");
  const [showMessageOptions, setShowMessageOptions] = useState<number | null>(null);

  // 1. D'abord, ajouter un nouvel état pour les notifications au début du composant
  interface Notification {
    id: number;
    type: "success" | "error" | "info";
    message: string;
  }

  // Ajouter ceci aux états existants
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Ajoute cette ligne :
  const messagesRef = useRef<Message[]>([]);
  // Mets à jour la référence à chaque changement :
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Ajoutez ce ref au début du composant
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Ajoutez ce useEffect pour scroller automatiquement en bas à chaque nouveau message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedConversation]);

  // 2. Fonction utilitaire pour afficher les notifications
  const addNotification = (type: "success" | "error" | "info", message: string) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    
    // Auto-suppression après 3 secondes
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  };

  // Fonction pour récupérer le token d'authentification
  const getAuthToken = React.useCallback((): string | null => {
    const token = Cookies.get("authTokens");
    if (!token) return null;
    try {
      return JSON.parse(token).access;
    } catch (e) {
      console.error("Erreur lors de la récupération du token:", e);
      return null;
    }
  }, []);

  // Récupérer l'ID de l'utilisateur actuel
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = getAuthToken();
      if (!token) {
        setError("Non authentifié");
        return;
      }

      try {
        const response = await fetch(
          "https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/user-profile/",
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        
        const data = await response.json();
        console.log("Utilisateur connecté:", data);
        
        // La structure de la réponse est { utilisateur: { id, username, ... } }
        if (data && data.utilisateur) {
          setCurrentUserId(data.utilisateur.id);
        } else {
          throw new Error("Format de réponse inattendu");
        }
      } catch (err) {
        console.error("Erreur lors de la récupération de l'utilisateur:", err);
        setError("Impossible de récupérer les informations de l'utilisateur");
      }
    };
    fetchCurrentUser();
  }, [getAuthToken]); // Ajouté

  // 5. Vérification du format des données des conversations lors du fetch
  useEffect(() => {
    if (!currentUserId) return;
    const fetchConversations = async () => {
      const token = getAuthToken();
      if (!token) {
        setError("Non authentifié");
        return;
      }

      try {
        const response = await fetch(
          `https://www.backend.lnb-intranet.globalitnet.org/communication/conversations/${currentUserId}/`, 
          {
            method: "GET",
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );
        
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        
        const data = await response.json();
        console.log("Conversations récupérées:", data);
        
        // Adapter la structure de données aux besoins de l'application
        let conversationsData = [];
        
        if (Array.isArray(data)) {
          conversationsData = data.map((conv: ConversationResponse) => ({
            // id is included in ...conv
            participant_ids: conv.participant_ids || [],
            title: conv.title || `Conversation ${conv.id}`,
            ...conv
          }));
        } else if (data && data.conversations && Array.isArray(data.conversations)) {
          // Transformez les données pour ajouter les propriétés manquantes
          conversationsData = data.conversations.map((conv: ConversationResponse) => ({
            // id is included in ...conv
            participant_ids: conv.participant_ids || [],
            title: conv.title || `Conversation ${conv.id}`,
            ...conv
          }));
        } else {
          console.warn("Format de réponse inattendu pour les conversations:", data);
        }
        
        setConversations(conversationsData);
      } catch (err) {
        console.error("Erreur lors de la récupération des conversations:", err);
        setError("Impossible de récupérer les conversations");
      }
    };

    fetchConversations();
  }, [currentUserId, getAuthToken]); // Ajouté

  // Remplacez la fonction useEffect existante pour récupérer les utilisateurs
  useEffect(() => {
    // Optimiser la fonction fetchUsers
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        console.log("Tentative de récupération des utilisateurs...");
        
        const token = getAuthToken();
        if (!token) {
          setError("Non authentifié");
          return;
        }
        
        const response = await fetch(
          "https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/list-all-users/",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`, // Utilise directement le token
            },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Données utilisateurs reçues:", data);
        
        // La structure semble être { utilisateurs: Array(13) }
        if (data && data.utilisateurs && Array.isArray(data.utilisateurs)) {
          setUsers(data.utilisateurs);
        } else {
          setUsers([]); // Fallback si la structure attendue n'est pas présente
        }
        
      } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs:", error);
        setError("Impossible de charger la liste des utilisateurs");
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [getAuthToken]); // Ajouté

  // 1. Correction de markConversationAsRead pour ne plus dépendre de messages
  const markConversationAsRead = React.useCallback(
    async (conversationId: number, userId: number, messagesToMark: Message[]) => {
      const token = getAuthToken();
      if (!token) return;

      try {
        const unreadMessages = messagesToMark.filter(
          (m) => m.recipient_id === userId && m.status !== "read"
        );

        if (unreadMessages.length === 0) return;

        for (const message of unreadMessages) {
          await fetch(
            `https://www.backend.lnb-intranet.globalitnet.org/communication/messages/${message.id}/mark-as-read/?user_id=${userId}`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
        }

        setMessages((prev) =>
          prev.map((msg) =>
            unreadMessages.some((unread) => unread.id === msg.id)
              ? { ...msg, status: "read" }
              : msg
          )
        );
      } catch (err) {
        console.error("Erreur lors du marquage des messages comme lus:", err);
      }
    },
    [getAuthToken]
  );

  // 2. Correction du useEffect de récupération des messages
  useEffect(() => {
    if (!selectedConversation || !currentUserId) return;

    const fetchMessages = async () => {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setError("Non authentifié");
        setLoading(false);
        return;
      }

      try {
        // Utiliser le bon endpoint
        const response = await fetch(
          `https://www.backend.lnb-intranet.globalitnet.org/communication/conversations/${selectedConversation}/messages/${currentUserId}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!response.ok) {
          setError(`Erreur ${response.status}: ${await response.text()}`);
          setLoading(false);
          return;
        }

        const data = await response.json();
        let fetchedMessages: Message[] = [];
        if (Array.isArray(data)) {
          fetchedMessages = data;
        } else if (data && data.messages && Array.isArray(data.messages)) {
          fetchedMessages = data.messages;
        } else {
          console.warn("Format inattendu pour les messages:", data);
        }

        setMessages(fetchedMessages);
        if (fetchedMessages.length > 0) {
          await markConversationAsRead(selectedConversation, currentUserId, fetchedMessages);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des messages:", err);
        setError("Impossible de récupérer les messages");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedConversation, currentUserId, getAuthToken, markConversationAsRead]);

  // 3. Correction du système de rafraîchissement (intervalle)
  useEffect(() => {
    if (!selectedConversation || !currentUserId) return;

    const fetchNewMessages = async () => {
      const token = getAuthToken();
      if (!token) return;

      try {
        const response = await fetch(
          `https://www.backend.lnb-intranet.globalitnet.org/communication/conversations/${selectedConversation}/messages/${currentUserId}/`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) return;
        const data = await response.json();

        let newMessages: Message[] = [];
        if (Array.isArray(data)) { 
          newMessages = data;
        } else if (data && data.messages && Array.isArray(data.messages)) {
          newMessages = data.messages;
        }

        const oldMessages = messagesRef.current;
        if (
          newMessages.length !== oldMessages.length ||
          (newMessages.length > 0 && oldMessages.length > 0 && newMessages[newMessages.length - 1].id !== oldMessages[oldMessages.length - 1].id)
        ) {
          setMessages(newMessages);
          await markConversationAsRead(selectedConversation, currentUserId, newMessages);
        }
      } catch (err) {
        console.error("Erreur de rafraîchissement:", err);
      }
    };

    const intervalId = setInterval(fetchNewMessages, 3000);
    return () => clearInterval(intervalId);
  }, [selectedConversation, currentUserId, getAuthToken, markConversationAsRead]);

  // Créer une nouvelle conversation
  const _handleStartConversation = async (user: User) => {
    if (!currentUserId) {
      setError("Non authentifié");
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setError("Non authentifié");
      return;
    }

    // Vérifier si une conversation entre ces deux utilisateurs existe déjà
    const existingConversation = conversations.find(conv => {
      // Récupérer les participants
      const participants = conv.participant_ids || conv.participants || [];
      
      // Pour une conversation directe, il y a exactement 2 participants
      if (participants.length !== 2) return false;
      
      // Vérifier si les participants sont l'utilisateur courant et l'utilisateur sélectionné
      return participants.includes(currentUserId) && participants.includes(user.id);
    });

    if (existingConversation) {
      // Si une conversation existe déjà, l'ouvrir au lieu d'en créer une nouvelle
      console.log("Ouverture d'une conversation existante:", existingConversation);
      setSelectedConversation(existingConversation.id);
      setActiveTab("conversations");
      return;
    }

    // Sinon, créer une nouvelle conversation
    try {
      const response = await fetch(
        "https://www.backend.lnb-intranet.globalitnet.org/communication/conversations/", 
        {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({ participants: [user.id, currentUserId] })
        }
      );
      
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      
      const newConversation = await response.json();
      console.log("Nouvelle conversation créée:", newConversation);
      
      // Vérifier que newConversation a le format attendu
      if (newConversation && typeof newConversation === 'object') {
        // Créer un objet de conversation valide, même si certaines propriétés sont manquantes
        const validConversation: Conversation = {
          id: newConversation.id || Date.now(), // Fallback à un timestamp si pas d'ID
          participant_ids: newConversation.participants || [currentUserId, user.id], // Assigner les participants à participant_ids
          participants: newConversation.participants || [currentUserId, user.id], // Garder pour compatibilité
          title: newConversation.title || `${user.prenom} ${user.nom}`, // Fallback au nom de l'utilisateur
          created_at: newConversation.created_at || new Date().toISOString(),
          updated_at: newConversation.updated_at || new Date().toISOString()
        };
        
        setConversations(prev => [validConversation, ...prev]);
        setSelectedConversation(validConversation.id);
        setActiveTab("conversations");
      } else {
        throw new Error("Format de conversation invalide retourné par l'API");
      }
    } catch (err) {
      console.error("Erreur lors de la création de la conversation:", err);
      setError("Impossible de créer la conversation");
    }
  };

  // Fonction pour créer une conversation avec les utilisateurs sélectionnés
  const handleCreateNewConversation = async () => {
    if (selectedUsers.length === 0) {
      setError("Veuillez sélectionner au moins un utilisateur");
      return;
    }

    const token = getAuthToken();
    if (!token || !currentUserId) {
      setError("Non authentifié");
      return;
    }

    try {
      // Participants: utilisateurs sélectionnés + utilisateur actuel
      const allParticipants = [...selectedUsers, currentUserId];
      
      const response = await fetch(
        "https://www.backend.lnb-intranet.globalitnet.org/communication/conversations/", 
        {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({ participants: allParticipants })
        }
      );
      
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      
      const newConversation = await response.json();
      console.log("Nouvelle conversation créée:", newConversation);
      addNotification("success", "Nouvelle conversation créée avec succès");
      
      // Actualiser les conversations et réinitialiser l'interface
      setConversations(prev => [
        {
          ...newConversation,
          participant_ids: allParticipants,
          participants: allParticipants,
        },
        ...prev
      ]);
      
      // Sélectionner la nouvelle conversation
      setSelectedConversation(newConversation.id);
      
      // Réinitialiser l'interface
      setIsCreatingNewConversation(false);
      setSelectedUsers([]);
      setActiveTab("conversations");
    } catch (err) {
      console.error("Erreur lors de la création de la conversation:", err);
      addNotification("error", "Impossible de créer la conversation");
      setError("Impossible de créer la conversation");
    }
  };

  // Fonction pour gérer la sélection d'un utilisateur
  const handleUserSelectionToggle = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // 1. Envoi de message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !currentUserId) return;

    const token = getAuthToken();
    if (!token) {
      setError("Non authentifié");
      return;
    }

    const conversation = conversations.find(c => c.id === selectedConversation);
    if (!conversation) return;

    // Trouver le destinataire (premier participant qui n'est pas l'utilisateur actuel)
    const participants = conversation.participant_ids || conversation.participants || [];
    const recipientId = participants.find(p => p !== currentUserId);
    if (!recipientId) {
      setError("Destinataire introuvable");
      return;
    }

    // Sauvegarder le contenu du message avant de vider le champ
    const messageContent = newMessage;
    
    try {
      const response = await fetch(
        `https://www.backend.lnb-intranet.globalitnet.org/communication/messages/send/${currentUserId}/${recipientId}/`, 
        {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({ 
            content: messageContent,
            conversation_id: selectedConversation
          })
        }
      );
      
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      
      const sentMessageResponse = await response.json();
      console.log("Message envoyé:", sentMessageResponse);
      
      // Ajouter notification de succès
      addNotification("success", "Message envoyé avec succès");
      
      // Vider le champ de message immédiatement après envoi réussi
      setNewMessage("");
      
      // Créer un message complet avec les informations disponibles
      const newSentMessage: Message = {
        id: sentMessageResponse.message_id || Date.now(), // Utiliser message_id ou un timestamp par défaut
        content: messageContent, // Utiliser le contenu du message sauvegardé
        sender_id: currentUserId,
        recipient_id: recipientId,
        conversation_id: selectedConversation,
        timestamp: new Date().toISOString(), // Timestamp actuel
        status: "sent"
      };
      
      // Ajouter le nouveau message à la liste existante
      setMessages(prev => Array.isArray(prev) ? [...prev, newSentMessage] : [newSentMessage]);
      
    } catch (err) {
      console.error("Erreur lors de l'envoi du message:", err);
      addNotification("error", "Impossible d'envoyer le message");
      setError("Impossible d'envoyer le message");
    }
  };

  // Supprimer une conversation
  const handleDeleteConversation = async (conversationId: number) => {
    const token = getAuthToken();
    if (!token) {
      setError("Non authentifié");
      return;
    }

    // Récupérer le titre de la conversation pour l'afficher dans la confirmation
    const conversationToDelete = conversations.find(c => c.id === conversationId);
    const conversationTitle = conversationToDelete ? getConversationTitle(conversationToDelete) : "cette conversation";

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la conversation avec ${conversationTitle} ?`)) {
      return;
    }

    try {
      const response = await fetch(
        `https://www.backend.lnb-intranet.globalitnet.org/communication/conversations/${conversationId}/delete/`, 
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      
      console.log("Conversation supprimée");
      addNotification("success", "Conversation supprimée avec succès");
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Erreur lors de la suppression de la conversation:", err);
      addNotification("error", "Impossible de supprimer la conversation");
      setError("Impossible de supprimer la conversation");
    }
  };

  // Rechercher des messages dans une conversation
  const handleSearchMessages = async (query: string) => {
    if (!selectedConversation || !currentUserId || !query.trim()) return;

    const token = getAuthToken();
    if (!token) {
      setError("Non authentifié");
      return;
    }

    try {
      const response = await fetch(
        `https://www.backend.lnb-intranet.globalitnet.org/communication/conversations/${selectedConversation}/messages/search/?query=${encodeURIComponent(query)}&user_id=${currentUserId}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      
      const searchResults = await response.json();
      console.log("Résultats de recherche:", searchResults);
      
      // Afficher ou utiliser les résultats de recherche comme nécessaire
      if (searchResults.length > 0) {
        setMessages(searchResults);
      } else {
        setError("Aucun message trouvé");
      }
    } catch (err) {
      console.error("Erreur lors de la recherche de messages:", err);
      setError("La recherche a échoué");
    }
  };


  // Récupérer le titre d'une conversation (nom de l'interlocuteur)
  const getConversationTitle = (conversation: Conversation): string => {
    // Vérification que conversation est définie
    if (!conversation) return "Nouvelle discussion";
    
    // Pour les conversations individuelles
    if (!currentUserId) return "Discussion";
    
    // Utiliser participant_ids s'il existe, sinon participants, sinon tableau vide
    const participantIds = conversation.participant_ids || conversation.participants || [];
    
    // Vérifier que participantIds existe avant d'essayer d'y accéder
    if (participantIds.length === 0) {
      return "Discussion";
    }
    
    // Pour une conversation directe, afficher le nom de l'autre participant
    const otherParticipantId = participantIds.find(id => id !== currentUserId);
    if (!otherParticipantId) return "Discussion";
    
    // Trouver l'utilisateur correspondant
    const otherUser = users.find(u => u.id === otherParticipantId);
    if (!otherUser) return "Interlocuteur inconnu";
    
    // Retourner le nom et prénom de l'interlocuteur
    return `${otherUser.prenom} ${otherUser.nom}`;
  };

  // Filtrer les conversations par recherche ET par nombre de membres (au moins 3)
  const filteredConversations = conversations.filter(conv => {
    const participants = conv.participant_ids || conv.participants || [];
    // Afficher seulement les groupes (au moins 3 membres)
    if (participants.length < 3) return false;
    if (!searchQuery) return true;
    return getConversationTitle(conv).toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Fonction pour supprimer un message
  const handleDeleteMessage = async (messageId: number) => {
    const token = getAuthToken();
    if (!token) {
      setError("Non authentifié");
      return;
    }

    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) {
      return;
    }

    try {
      const response = await fetch(
        `https://www.backend.lnb-intranet.globalitnet.org/communication/messages/${messageId}/delete/`, 
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      
      console.log("Message supprimé");
      addNotification("success", "Message supprimé avec succès");
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      console.error("Erreur lors de la suppression du message:", err);
      addNotification("error", "Impossible de supprimer le message");
      setError("Impossible de supprimer le message");
    }
  };

  // Fonction pour modifier un message
  const handleEditMessage = async () => {
    if (!messageToEdit || !editedContent.trim()) return;
    
    const token = getAuthToken();
    if (!token) {
      setError("Non authentifié");
      return;
    }

    try {
      // Obtenir le destinataire du message
      const conversation = conversations.find(c => c.id === messageToEdit.conversation_id);
      if (!conversation) throw new Error("Conversation non trouvée");
      
      const participants = conversation.participant_ids || conversation.participants || [];
      const recipientId = participants.find(id => id !== currentUserId);
      if (!recipientId) throw new Error("Destinataire introuvable");
      
      const response = await fetch(
        `https://www.backend.lnb-intranet.globalitnet.org/communication/messages/${currentUserId}/${recipientId}/${messageToEdit.id}/update/`, 
        {
          method: "POST", // Utiliser POST au lieu de PUT
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({
            content: editedContent,
            conversation: messageToEdit.conversation_id,
            recipient: recipientId
          })
        }
      );
      
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      
      const updatedMessage = await response.json();
      console.log("Message modifié:", updatedMessage);
      addNotification("success", "Message modifié avec succès");
      
      // Mise à jour du message dans l'état local avec l'indication que le message a été modifié
      setMessages(prev => prev.map(msg => 
        msg.id === messageToEdit.id 
          ? { ...msg, content: editedContent, is_edited: true } 
          : msg
      ));
      
      // Réinitialiser les états
      setMessageToEdit(null);
      setEditedContent("");
    } catch (err) {
      console.error("Erreur lors de la modification du message:", err);
      addNotification("error", "Impossible de modifier le message");
      setError("Impossible de modifier le message");
    }
  };

  // Fonction pour transférer un message
  const handleForwardMessage = async (targetConversationId: number) => {
    if (!messageToForward || !currentUserId) {
      setShowForwardDialog(false);
      return;
    }

    const token = getAuthToken();
    if (!token) {
      setError("Non authentifié");
      setShowForwardDialog(false);
      return;
    }

    const targetConversation = conversations.find(c => c.id === targetConversationId);
    if (!targetConversation) {
      setError("Conversation introuvable");
      setShowForwardDialog(false);
      return;
    }

    const participants = targetConversation.participant_ids || targetConversation.participants || [];
    const recipientId = participants.find(p => p !== currentUserId);
    if (!recipientId) {
      setError("Destinataire introuvable");
      setShowForwardDialog(false);
      return;
    }

    try {
      const response = await fetch(
        `https://www.backend.lnb-intranet.globalitnet.org/communication/messages/send/${currentUserId}/${recipientId}/`, 
        {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({ 
            content: messageToForward.content,
            conversation_id: targetConversationId,
            forwarded_from: messageToForward.id
          })
        }
      );
      
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      
      const result = await response.json();
      console.log("Message transféré:", result);
      addNotification("success", "Message transféré avec succès");
      
      setShowForwardDialog(false);
      setMessageToForward(null);
      
      if (targetConversationId === selectedConversation) {
        // Si on transfère dans la même conversation, ajouter le message à la liste
        const newForwardedMessage: Message = {
          id: result.message_id || Date.now(),
          content: messageToForward.content,
          sender_id: currentUserId,
          recipient_id: recipientId,
          conversation_id: targetConversationId,
          timestamp: new Date().toISOString(),
          status: "sent",
          forwarded_from: messageToForward.id // Indiquer que c'est un message transféré
        };
        
        setMessages(prev => [...prev, newForwardedMessage]);
      }
    } catch (err) {
      console.error("Erreur lors du transfert du message:", err);
      addNotification("error", "Impossible de transférer le message");
      setError("Impossible de transférer le message");
      setShowForwardDialog(false);
    }
  };

  // Fonction pour marquer un message spécifique comme lu
  const handleMarkAsRead = async (messageId: number) => {
    const token = getAuthToken();
    if (!token || !currentUserId) return;

    try {
      const response = await fetch(
        `https://www.backend.lnb-intranet.globalitnet.org/communication/messages/${messageId}/mark-as-read/?user_id=${currentUserId}`, 
        { 
          method: "POST",
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
      
      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      
      console.log("Message marqué comme lu");
      addNotification("info", "Message marqué comme lu");
      
      // Mettre à jour le statut du message dans l'état local
      setMessages(prev => prev.map(msg => 
        msg.id === messageId
          ? { ...msg, status: "read" }
          : msg
      ));
    } catch (err) {
      console.error("Erreur lors du marquage du message comme lu:", err);
      addNotification("error", "Impossible de marquer le message comme lu");
    }
  };

  return (
    <div className="h-screen flex bg-white dark:bg-gray-900">
      {/* Liste des conversations / utilisateurs */}
      <div className="w-80 border-r dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b dark:border-gray-700">
          {/* 1. Supprimer le bouton Utilisateurs et garder uniquement le bouton Nouvelle discussion */}
          <div className="mb-4">
            <Button 
              variant="primary" 
              className="w-full"
              onClick={() => {
                setIsCreatingNewConversation(!isCreatingNewConversation);
                if (isCreatingNewConversation) {
                  setSelectedUsers([]);
                }
              }}
            >
              {isCreatingNewConversation ? "Annuler" : "Nouveau groupe de discussion"}
            </Button>
            {isCreatingNewConversation && (
              <Button 
                variant="primary" 
                className="w-full mt-2"
                onClick={handleCreateNewConversation}
                disabled={selectedUsers.length < 2}
              >
                Créer le groupe ({selectedUsers.length + 1} membres)
              </Button>
            )}
          </div>

          {/* 2. Supprimer la section "Vos interlocuteurs" et garder uniquement la recherche */}
          {activeTab === "conversations" && (
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher une discussion..."
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          )}
        </div>
        
        {loading && activeTab === "conversations" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {error && (
          <div className="p-4 text-red-500 text-center">
            {error}
            <button 
              className="block mx-auto mt-2 text-blue-500 underline"
              onClick={() => setError(null)}
            >
              Réessayer
            </button>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto">
          {isCreatingNewConversation ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20">
                <h2 className="font-semibold text-blue-800 dark:text-blue-300">Sélectionner les membres du groupe</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Cliquez sur au moins <b>deux utilisateurs</b> pour créer un groupe (vous serez automatiquement ajouté).
                </p>
              </div>
              {isLoadingUsers ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : users.length > 0 ? (
                users
                  .filter(user => user.id !== currentUserId)
                  .map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleUserSelectionToggle(user.id)}
                      className={`p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        selectedUsers.includes(user.id) ? "bg-blue-100 dark:bg-blue-900/30" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {user.prenom} {user.nom}
                          </h3>
                          <p className="text-sm text-gray-500">{user.username}</p>
                        </div>
                        {selectedUsers.includes(user.id) && (
                          <div className="h-5 w-5 bg-blue-500 rounded-full text-white flex items-center justify-center text-xs">
                            ✓
                          </div>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="p-4 text-center text-gray-500">
                  Aucun utilisateur disponible
                </div>
              )}
            </div>
          ) : ( // Render conversations if not creating new one
            filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => (
                <div
                  key={conv?.id || Math.random()} // Fallback si conv.id est undefined
                  onClick={() => conv?.id && setSelectedConversation(conv.id)}
                  className={`p-4 border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedConversation === conv?.id ? "bg-blue-50 dark:bg-gray-800" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        // Vérifier que participants existe et a une longueur
                        Array.isArray(conv?.participants) && conv.participants.length > 2 
                          ? "bg-blue-500" 
                          : "bg-green-500"
                      }`}></div>
                      <div>
                        <h3 className="font-semibold">
                          {/* Utiliser l'opérateur de chaînage optionnel pour éviter les erreurs */}
                          {conv && getConversationTitle(conv)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {(() => {
                            // Utiliser participant_ids s'il existe, sinon participants
                            const participants = conv.participant_ids || [];
                            if (!participants || participants.length === 0) return "Aucun membre";
                            
                            // Afficher le nombre de participants
                            return `${participants.length} membre${participants.length > 1 ? 's' : ''}`;
                          })()}
                        </p>
                      </div>
                    </div>
                    {conv.unread_count && conv.unread_count > 0 && (
                      <span className="bg-red-500 text-white rounded-full px-2 py-1 text-xs">
                        {conv.unread_count}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.id);
                      }}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <FaTrash />
                    </button>
                  </div>
                  <div className="mt-2 text-sm text-gray-500 flex justify-between">
                    <span className="truncate">
                      {conv.last_message ? conv.last_message.content : "Aucun message"}
                    </span>
                    <span className="text-xs opacity-75">
                      {conv.updated_at ? format(new Date(conv.updated_at), "HH:mm", { locale: fr }) : ""}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                Aucune conversation trouvée
              </div>
            )
          ) // End conversation list rendering
        }
        </div>
      </div>

      {/* Zone de chat */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Titre de la conversation - version simplifiée et plus robuste */}
            <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedConversation && (
                  <>
                    <div className="p-2 rounded-full bg-green-500"></div>
                    <div>
                      <h2 className="font-semibold text-lg">
                        {(() => {
                          const selectedConv = conversations.find(c => c.id === selectedConversation);
                          if (!selectedConv) return "Groupe";
                          return getConversationTitle(selectedConv);
                        })()}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {(() => {
                          const selectedConv = conversations.find(c => c.id === selectedConversation);
                          if (!selectedConv) return "";
                          const participants = selectedConv.participant_ids || [];
                          if (!participants || participants.length === 0) return "Aucun participant";
                          return `${participants.length} participant${participants.length > 1 ? 's' : ''}`;
                        })()}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher dans la conversation..."
                    className="pl-8 pr-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm"
                    onKeyPress={(e) => e.key === "Enter" && handleSearchMessages(e.currentTarget.value)}
                  />
                  <FaSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                </div>
              </div>
            </div>

            {/* Zone de messages avec scroll local */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 flex flex-col justify-end">
              {loading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : messages.length > 0 ? (
                // Afficher les messages du plus ancien au plus récent (ordre normal)
                messages.map((message) => {
                  const isCurrentUser = message.sender_id === currentUserId;
                  const isValidTimestamp = message.timestamp && !isNaN(new Date(message.timestamp).getTime());
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} group relative mb-4`}
                    >
                      <div
                        className={`max-w-md p-3 rounded-lg relative ${
                          isCurrentUser
                            ? "bg-blue-500 text-white"
                            : "bg-white dark:bg-gray-800 shadow-sm"
                        }`}
                      >
                        {/* Afficher le nom de l'expéditeur */}
                        {!isCurrentUser && (
                          <div className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                            {(() => {
                              const sender = users.find(u => u.id === message.sender_id);
                              return sender ? `${sender.prenom} ${sender.nom}` : "Utilisateur inconnu";
                            })()}
                          </div>
                        )}

                        {/* Bouton d'options toujours visible */}
                        <button 
                          className="absolute -right-2 -top-2 bg-white dark:bg-gray-700 rounded-full p-1 shadow z-10"
                          onClick={() => setShowMessageOptions(message.id === showMessageOptions ? null : message.id)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                        
                        {/* Menu d'options - avec couleurs distinctives */}
                        {showMessageOptions === message.id && (
                          <div className={`absolute ${isCurrentUser ? "right-0" : "left-0"} top-0 mt-6 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10 p-1 min-w-[150px]`}>
                            <ul className="text-sm">
                              {isCurrentUser && (
                                <li 
                                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2 text-green-600 dark:text-green-400"
                                  onClick={() => {
                                    setMessageToEdit(message);
                                    setEditedContent(message.content);
                                    setShowMessageOptions(null);
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                  Modifier
                                </li>
                              )}
                              <li 
                                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2 text-yellow-600 dark:text-yellow-400"
                                onClick={() => {
                                  setMessageToForward(message);
                                  setShowForwardDialog(true);
                                  setShowMessageOptions(null);
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                </svg>
                                Transférer
                              </li>
                              {!isCurrentUser && message.status !== "read" && (
                                <li 
                                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                                  onClick={() => {
                                    handleMarkAsRead(message.id);
                                    setShowMessageOptions(null);
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Marquer comme lu
                                </li>
                              )}
                              {isCurrentUser && (
                                <li 
                                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-red-500 flex items-center gap-2"
                                  onClick={() => {
                                    handleDeleteMessage(message.id);
                                    setShowMessageOptions(null);
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Supprimer
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                        
                        <div className="text-sm">
                          {messageToEdit && messageToEdit.id === message.id ? (
                            <div className="flex flex-col gap-2">
                              <textarea
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="p-2 rounded border text-gray-800 dark:text-white dark:bg-gray-700 dark:border-gray-600 w-full"
                                autoFocus
                              />
                              <div className="flex gap-2 justify-end">
                                <button 
                                  onClick={() => setMessageToEdit(null)} 
                                  className="px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                                >
                                  Annuler
                                </button>
                                <button 
                                  onClick={handleEditMessage} 
                                  className="px-2 py-1 text-xs rounded bg-blue-500 text-white"
                                >
                                  Enregistrer
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className={`
                              ${message.forwarded_from ? 'bg-yellow-100 dark:bg-yellow-900/20 p-2 rounded border-l-4 border-yellow-400' : ''}
                              ${message.is_edited ? 'bg-green-100 dark:bg-green-900/20 p-2 rounded border-l-4 border-green-400' : ''}
                            `}>
                              {message.forwarded_from && (
                                <div className="text-xs text-yellow-600 dark:text-yellow-400 mb-1 font-medium">
                                  Message transféré
                                </div>
                              )}
                              {message.content}
                              {message.is_edited && (
                                <div className="text-xs text-green-600 dark:text-green-400 mt-1 italic">
                                  (modifié)
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-2">
                          <span className="text-xs opacity-75">
                            {isValidTimestamp 
                              ? format(new Date(message.timestamp), "HH:mm", { locale: fr })
                              : "Maintenant"
                            }
                          </span>
                          {isCurrentUser && (
                            <span className="text-xs">
                              {message.status === "sent" && "✓"}
                              {message.status === "delivered" && "✓✓"}
                              {message.status === "read" && "✓✓"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-gray-500 py-8">
                  Aucun message. Commencez la conversation!
                </div>
              )}
              {/* Ce div sert de point d'ancrage pour le scroll automatique */}
              <div ref={messagesEndRef} />
            </div>

            {/* Champ d'envoi de message */}
            <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-gray-900">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Écrivez un message au groupe..."
                  className="flex-1 p-2 rounded-lg border dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                />
                <Button 
                  variant="primary" 
                  onClick={handleSendMessage} 
                  className="px-4"
                  disabled={!newMessage.trim()}
                >
                  <FaPaperPlane className="mr-2" />
                  Envoyer
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Sélectionnez une conversation pour commencer
          </div>
        )}

        {/* Dialogue de transfert de message */}
        {showForwardDialog && messageToForward && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-96 max-w-full">
              <div className="p-4 border-b dark:border-gray-700">
                <h3 className="font-semibold">Transférer le message</h3>
                <p className="text-sm text-gray-500 mt-1">Choisissez une conversation</p>
              </div>
              <div className="p-2 max-h-80 overflow-y-auto">
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    onClick={() => handleForwardMessage(conv.id)}
                    className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded-md"
                  >
                    <h4 className="font-medium">{getConversationTitle(conv)}</h4>
                    <p className="text-sm text-gray-500">
                      {(() => {
                        const participants = conv.participant_ids || conv.participants || [];
                        return `${participants.length} participant${participants.length > 1 ? 's' : ''}`;
                      })()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t dark:border-gray-700 flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowForwardDialog(false);
                    setMessageToForward(null);
                  }}
                  className="mr-2"
                >
                  Annuler
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Système de notifications */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
          {notifications.map((notification) => (
            <div 
              key={notification.id}
              className={`p-3 rounded-lg shadow-lg max-w-xs animate-fade-in 
                ${notification.type === "success" ? "bg-green-500 text-white" : 
                  notification.type === "error" ? "bg-red-500 text-white" : 
                  "bg-blue-500 text-white"}`}
            >
              <div className="flex items-center gap-2">
                {notification.type === "success" && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {notification.type === "error" && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {notification.type === "info" && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                <span>{notification.message}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}