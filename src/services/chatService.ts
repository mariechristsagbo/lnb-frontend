import axios from 'axios';
import Cookies from 'js-cookie';

// Ajout des interfaces en haut du fichier
interface APIError extends Error {
  response?: {
    data?: {
      error?: string;
      [key: string]: unknown;
    };
  };
}

// Configuration de l'API avec base URL
const api = axios.create({
  baseURL: 'https://www.backend.lnb-intranet.globalitnet.org/',
});

// Ajout du token à toutes les requêtes
api.interceptors.request.use((config) => {
  const authTokens = Cookies.get('authTokens');
  if (authTokens) {
    try {
      const parsedTokens = JSON.parse(authTokens);
      config.headers.Authorization = `Bearer ${parsedTokens.access}`;
    } catch (error) {
      console.error("Erreur lors de la lecture du token:", error);
    }
  }
  return config;
});

// Fonction pour récupérer la liste des utilisateurs
export const fetchUserList = async () => {
  try {
    const response = await api.get('/utilisateurs/user-list/');
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    return [];
  }
};

// Fonction pour récupérer les conversations d'un utilisateur
export const fetchUserConversations = async (userId: number) => {
  try {
    const response = await api.get(`/communication/conversations/${userId}/`);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des conversations:", error);
    throw error;
  }
};

// Fonction pour créer une nouvelle conversation
export const createConversation = async (participants: number[]) => {
  try {
    // Vérification des participants
    if (!participants || participants.length < 2) {
      throw new Error("Au moins 2 participants sont nécessaires pour créer une conversation");
    }
    
    const payload = {
      participants: participants,
      // Ajoutez ces champs qui pourraient être nécessaires selon votre API
      user_ids: participants, // Autre nom possible
      user_id: participants[0],
      recipient_id: participants[1],
    };
    
    console.log("Payload création conversation:", payload);
    const response = await api.post('/communication/conversations/', payload);
    console.log("Réponse API création conversation:", response.data);
    
    // Si l'API ne renvoie pas directement la conversation complète,
    // construisons manuellement l'objet conversation
    if (response.data && (response.data.conversation_id || response.data.id)) {
      const conversationId = response.data.conversation_id || response.data.id;
      return {
        id: conversationId,
        participants: participants,
        is_group: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Autres champs si nécessaires
      };
    }
    
    return response.data;
  } catch (error) {
    console.error("Erreur détaillée lors de la création de la conversation:", error);
    throw error;
  }
};

// Fonction pour envoyer un message - version corrigée
export const sendMessage = async (senderId: number, recipientId: number, content: string, conversationId: number) => {
  try {
    console.log(`Envoi de message de ${senderId} à ${recipientId} dans la conversation ${conversationId}:`, content);
    
    const payload = {
      conversation_id: conversationId,
      content: content,
      sender_id: senderId,
      recipient_id: recipientId
    };
    
    try {
      console.log("Tentative d'envoi via /communication/messages/");
      const response = await api.post(`/communication/messages/`, payload);
      console.log("Réponse API sendMessage via messages:", response.data);
      return response.data;
    } catch { // Suppression du paramètre _firstError non utilisé
      console.log("Première approche échouée, essai avec URL de conversation");
      
      try {
        console.log(`Tentative d'envoi via /communication/conversations/${conversationId}/messages/`);
        const response = await api.post(`/communication/conversations/${conversationId}/messages/`, {
          content: content,
          sender_id: senderId
        });
        console.log("Réponse API sendMessage via conversations/id/messages:", response.data);
        return response.data;
      } catch { // Suppression du paramètre _secondError non utilisé
        // Troisième approche - structure spécifique
        const finalPayload = {
          conversation_id: conversationId, // Envoyé comme paramètre explicite
          content
        };
        
        const response = await api.post(`/communication/messages/send/${senderId}/${recipientId}/?conversation_id=${conversationId}`, 
          finalPayload
        );
        console.log("Réponse API avec conversation_id en paramètre d'URL:", response.data);
        return response.data;
      }
    }
  } catch (error: unknown) {
    console.error("All attempts to send the message failed:", error);
    
    // Cast to APIError type if it matches the structure
    const apiError = error as APIError;
    if (apiError.response?.data) {
      console.error("Error details:", apiError.response.data);
      
      if (apiError.response.data.error?.includes('conversation_id')) {
        console.error("The error concerns the conversation_id, please check the format expected by the API");
      }
    }
    throw error;
  }
};

// Fonction pour récupérer les messages d'une conversation
export const fetchConversationMessages = async (conversationId: number, userId: number) => {
  try {
    const response = await api.get(`/communication/conversations/${conversationId}/messages/${userId}/`);
    console.log("Messages récupérés:", response.data);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération des messages de la conversation ${conversationId}:`, error);
    return [];
  }
};

export const deleteConversation = async (conversationId: number) => {
  try {
    await api.delete(`/communication/conversations/${conversationId}/delete/`);
  } catch (error) {
    console.error(`Erreur lors de la suppression de la conversation ${conversationId}:`, error);
    throw error;
  }
};

export const deleteMessage = async (messageId: number) => {
  try {
    await api.delete(`/communication/messages/${messageId}/delete/`);
  } catch (error) {
    console.error(`Erreur lors de la suppression du message ${messageId}:`, error);
    throw error;
  }
};

export const markMessageAsRead = async (messageId: number) => {
  try {
    await api.post(`/communication/messages/${messageId}/mark-as-read/`);
  } catch (error) {
    console.error(`Erreur lors du marquage comme lu du message ${messageId}:`, error);
    throw error;
  }
};

export const replyToMessage = async (messageId: number, userId: number, content: string) => {
  const response = await api.post(`/communication/messages/${messageId}/reply/${userId}/`, { content });
  return response.data;
};

export const updateMessage = async (senderId: number, recipientId: number, messageId: number, content: string) => {
  const response = await api.put(`/communication/messages/${senderId}/${recipientId}/${messageId}/update/`, { content });
  return response.data;
};

// Fonction utilitaire pour examiner l'API
export const exploreAPI = async (endpoint: string) => {
  try {
    const response = await api.get(`/${endpoint}`);
    console.log(`Exploration de l'API ${endpoint}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de l'exploration de l'API ${endpoint}:`, error);
    return null;
  }
};

// Fonction pour examiner la structure attendue pour l'envoi de message
export const getMessageStructure = async () => {
  try {
    const response = await api.options(`/communication/messages/send/`);
    console.log("Structure attendue pour les messages:", response.data);
    return response.data;
  } catch (error: unknown) {
    console.error("Erreur lors de la récupération de la structure des messages:", error);
    const apiError = error as APIError;
    if (apiError.response?.data) {
      console.log("Information dans l'erreur:", apiError.response.data);
    }
    return null;
  }
};