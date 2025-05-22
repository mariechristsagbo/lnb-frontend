"use client";

import React, { useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import Cookies from 'js-cookie';
import { Eye, EyeOff, RefreshCw, Archive, Trash2, X, ChevronRight, CheckCheck, Bell, Search } from 'lucide-react';
import { useRouter } from 'next/navigation'; // <--- AJOUTER CET IMPORT

// Configurations centralisées
const API_URLS = {
  NOTIFICATIONS_RECEIVED: "https://www.backend.lnb-intranet.globalitnet.org/notifications/received/",
  NOTIFICATIONS_SENT: "https://www.backend.lnb-intranet.globalitnet.org/notifications/sent/",
  NOTIFICATIONS_TYPES: "https://www.backend.lnb-intranet.globalitnet.org/notifications/types/",
  NOTIFICATIONS_PREFERENCES: "https://www.backend.lnb-intranet.globalitnet.org/notifications/preferences/",
  NOTIFICATIONS_COUNT: "https://www.backend.lnb-intranet.globalitnet.org/notifications/count/",
  NOTIFICATIONS_DETAIL: "https://www.backend.lnb-intranet.globalitnet.org/notifications/detail/",
  NOTIFICATIONS_MARK_READ: "https://www.backend.lnb-intranet.globalitnet.org/notifications/mark-read/",
  NOTIFICATIONS_MARK_UNREAD: "https://www.backend.lnb-intranet.globalitnet.org/notifications/mark-unread/",
  NOTIFICATIONS_MARK_ALL_READ: "https://www.backend.lnb-intranet.globalitnet.org/notifications/mark-all-read/",
  NOTIFICATIONS_ARCHIVE: "https://www.backend.lnb-intranet.globalitnet.org/notifications/archive/",
  NOTIFICATIONS_DELETE: "https://www.backend.lnb-intranet.globalitnet.org/notifications/delete/"
};

// Interfaces
interface TabsProps {
  defaultValue: string;
  children: ReactNode;
  className?: string;
}

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

interface TabsContentProps {
  value: string;
  activeTab: string;
  children: ReactNode;
  className?: string;
}

interface NotificationType {
  id: number;
  name: string;
  code: string;
  description: string;
  icon: string;
  color: string;
  is_active: boolean;
}

interface Notification {
  id: string;
  recipient: number;
  sender: number;
  sender_details: {
    id: number;
    username: string;
    full_name: string;
    email: string;
  } | null; // Rendre sender_details nullable
  notification_type: number;
  notification_type_name: string;
  notification_type_code: string;
  notification_type_icon: string;
  notification_type_color: string;
  title: string;
  message: string;
  action_url: string | null; // Rendre action_url nullable
  is_read: boolean;
  is_archived: boolean;
  is_system: boolean;
  created_at: string;
  time_since: string;
  channel: number;
  channel_name: string;
  channel_type: string;
}

interface NotificationPreference {
  id: number;
  user: number;
  notification_type: number;
  notification_type_name: string;
  notification_type_code: string;
  notification_type_icon: string;
  channel: number;
  channel_name: string;
  channel_type: string;
  channel_type_display: string;
  is_enabled: boolean;
}

interface NotificationDetail extends Notification {
  metadata: Record<string, unknown>;
  content_type: number | null;
  content_type_details: {
    id: number;
    app_label: string;
    model: string;
  } | null;
  object_id: string | null;
  related_object_info: string;
  created_date: string;
  created_time: string;
  read_at: string | null;
}

interface NotificationFilters {
  readStatus: "all" | "read" | "unread";
  archived: boolean;
  type: string; // Garder string car "all" est une option, ou utiliser un type plus spécifique si possible
  search: string;
}

// Fonction pour formater le message dans le modal
const renderFormattedMessage = (message: string | object | null): ReactNode => {
  // Cas 1: Le message est un objet
  if (typeof message === 'object' && message !== null) {
    return <pre className="text-xs bg-gray-100 p-3 rounded overflow-x-auto whitespace-pre-wrap">{JSON.stringify(message, null, 2)}</pre>;
  }

  // Cas 2: Le message n'est pas une chaîne valide
  if (typeof message !== 'string' || !message.trim()) {
    return <p className="text-gray-500 italic">Contenu du message non disponible ou vide.</p>;
  }

  // Cas 3: Tentative d'analyse du message structuré
  const lines = message.split('\n').map(line => line.trim());
  const mainMessageLines: string[] = [];
  const details: Record<string, string[]> = {};
  let currentKey: string | null = null;
  let isCapturing = false;

  // Regex pour détecter les clés comme "- Titre:", "- Description:"
  const keyRegex = /^-?\s*([\w\sÀ-ÿ]+):\s*(.*)/;
  // Clés à ignorer dans le formatage du message principal (car affichées séparément)
  const ignoredKeys = ['étape actuelle', 'statut', 'expéditeur', 'date d\'envoi', 'date de lecture', 'créée par', 'date de création'];

  for (const line of lines) {
    if (!isCapturing && !line.startsWith('-')) {
      // Capture les lignes initiales comme message principal
      mainMessageLines.push(line);
      continue; // Passe à la ligne suivante
    }

    isCapturing = true; // Commence la capture des détails dès qu'une ligne commence par '-' ou après le message principal

    const match = line.match(keyRegex);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      // Ignorer les clés spécifiques au workflow ou déjà affichées ailleurs
      if (ignoredKeys.includes(key.toLowerCase())) {
        currentKey = null; // Arrête la capture pour cette clé
        continue;
      }
      currentKey = key;
      details[currentKey] = [value]; // Commence une nouvelle liste pour cette clé
    } else if (currentKey && line && !line.startsWith('-')) {
      // Si on a une clé active et que la ligne n'est pas une nouvelle clé, ajoute à la valeur existante (pour multiligne)
      details[currentKey].push(line);
    } else if (currentKey && line.startsWith('-') && !match) {
      // Si la ligne commence par '-' mais ne correspond pas au format clé: valeur, on arrête la capture précédente
      currentKey = null;
    }
    // Ignorer les lignes vides ou celles qui ne correspondent pas après le début de la capture
  }

  const mainMessageText = mainMessageLines.join('\n').trim();
  const detailKeys = Object.keys(details);

  // Si on a extrait des détails, on les affiche de manière structurée
  if (detailKeys.length > 0) {
    return (
      <>
        {mainMessageText && <p className="text-gray-700 mb-4 whitespace-pre-wrap">{mainMessageText}</p>}
        <div className="space-y-3 border-t pt-4 mt-4">
          {detailKeys.map(key => (
            <div key={key}>
              <strong className="text-sm text-gray-600 block mb-0.5">{key}:</strong>
              <p className="text-gray-800 ml-2 whitespace-pre-wrap">{details[key].join('\n')}</p>
            </div>
          ))}
        </div>
      </>
    );
  }

  // Cas 4: Afficher le message brut si aucune structure n'a été détectée
  return <p className="text-gray-700 whitespace-pre-wrap">{message}</p>;
};

// Composant Tooltip (simple implémentation)
const Tooltip: React.FC<{ content: string; children: ReactNode }> = ({ content, children }) => (
  <div className="relative group">
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
      {content}
    </div>
  </div>
);

// Composants Tabs (inchangés)
const Tabs: React.FC<TabsProps> = ({ defaultValue, children, className }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const processChildren = () => {
    return React.Children.map(children, child => {
      if (!React.isValidElement(child)) {
        return child;
      }
      if (child.type === TabsContent) {
        return React.cloneElement(child as React.ReactElement<TabsContentProps>, { activeTab });
      }
      if (React.isValidElement<TabsListProps>(child) && child.type === TabsList) {
        const modifiedTriggers = React.Children.map(child.props.children, (trigger) => {
          if (React.isValidElement<TabsTriggerProps>(trigger) && trigger.type === TabsTrigger) {
            return React.cloneElement(trigger, {
              onClick: () => setActiveTab(trigger.props.value),
              className: `${trigger.props.className || ''} ${
                trigger.props.value === activeTab ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700' // Style amélioré
              }`,
            });
          }
          return trigger;
        });
        return React.cloneElement(child, { children: modifiedTriggers });
      }
      return child;
    });
  };

  return (
    <div className={`tabs-container ${className || ''}`}>
      {processChildren()}
    </div>
  );
};

const TabsList: React.FC<TabsListProps> = ({ children, className }) => {
  return <div className={`tabs-list flex space-x-4 border-b mb-6 ${className || ''}`}>{children}</div>; // Augmentation de l'espace
};

const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, className, onClick }) => {
  return (
    <button
      className={`tabs-trigger px-1 py-2 font-medium text-sm flex items-center gap-2 ${className || ''}`} // Ajustement padding/font
      onClick={onClick}
      data-value={value}
    >
      {children}
    </button>
  );
};

const TabsContent: React.FC<TabsContentProps> = ({ value, activeTab, children, className }) => {
  if (value !== activeTab) {
    return null;
  }
  return <div className={`tabs-content ${className || ''}`}>{children}</div>;
};

// Fonction utilitaire getAuthHeaders (inchangée)
const getAuthHeaders = () => {
  try {
    const tokenCookie = Cookies.get("authTokens");
    if (!tokenCookie) return null;
    const tokenData = JSON.parse(tokenCookie);
    const accessToken = tokenData.access;
    return {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    };
  } catch (error) {
    console.error("Erreur auth header:", error);
    return null;
  }
};

// Nouveaux composants UI
const NotificationBadge: React.FC<{ count: number }> = ({ count }) => (
  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5"> {/* Ajustement position/padding */}
    {count}
  </span>
);

const NotificationCard: React.FC<{
  notification: Notification;
  onView: () => void;
  onMark: () => void;
  onArchive: () => void;
  onDelete: () => void;
}> = ({ notification, onView, onMark, onArchive, onDelete }) => (
  <div className={`group relative p-4 border rounded-lg transition-all duration-150 ${ // Ajout duration
    notification.is_archived ? 'bg-gray-100 border-gray-200' : // Style archive
    notification.is_read ? 'bg-white hover:bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
  }`}>
    {/* Indicateur de rejet (si titre contient "rejetée") */}
    {notification.title?.toLowerCase().includes('rejetée') && (
       <span className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white dark:ring-gray-800" title="Étape rejetée" />
    )}
    {/* Indicateur non lu */}
    {!notification.is_read && !notification.is_archived && (
       <span className="absolute top-3 left-3 h-2 w-2 rounded-full bg-blue-500" />
    )}
    <div className="flex justify-between items-start ml-5"> {/* Ajout marge gauche pour indicateur */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1"> {/* Réduction marge */}
          <div
            className="h-2 w-2 rounded-full flex-shrink-0" // Taille réduite
            style={{ backgroundColor: notification.notification_type_color || '#cccccc' }} // Couleur par défaut
          />
          <h3 className="font-medium text-gray-800 truncate">{notification.title}</h3> {/* Couleur texte */}
        </div>
        <p className="text-gray-600 text-sm line-clamp-2 mb-2">{notification.message}</p>
        <div className="flex items-center gap-3 text-xs text-gray-500"> {/* Augmentation gap */}
          <span>{notification.time_since}</span>
          {notification.sender_details && (
            <>
              <span>•</span>
              <span>De : {notification.sender_details.full_name}</span>
            </>
          )}
           {notification.is_archived && (
             <>
              <span>•</span>
              <span className="text-gray-400 italic">Archivée</span>
             </>
           )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 pl-4">
        {/* Actions visibles au survol */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150"> {/* Gap réduit */}
          <Tooltip content={notification.is_read ? "Marquer non lu" : "Marquer comme lu"}>
            <button
              onClick={onMark}
              className="p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700 rounded-full" // Style hover
            >
              {notification.is_read ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </Tooltip>
          {!notification.is_archived && ( // Ne pas montrer si déjà archivé
            <Tooltip content="Archiver">
              <button
                onClick={onArchive}
                className="p-1.5 text-gray-500 hover:bg-gray-200 hover:text-gray-700 rounded-full"
              >
                <Archive className="h-4 w-4" />
              </button>
            </Tooltip>
          )}
          <Tooltip content="Supprimer">
            <button
              onClick={onDelete}
              className="p-1.5 text-red-500 hover:bg-red-100 rounded-full"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>
        {/* Bouton Détails toujours visible */}
        <button
          onClick={onView}
          className="text-blue-600 hover:text-blue-700 text-xs flex items-center gap-1 mt-auto" // Taille texte réduite, mt-auto
        >
          <span>Détails</span>
          <ChevronRight className="h-3 w-3" /> {/* Taille icône réduite */}
        </button>
      </div>
    </div>
  </div>
);

const FiltersBar: React.FC<{
  filters: NotificationFilters; // Correction: Utiliser NotificationFilters
  onFilterChange: (newFilters: NotificationFilters) => void; // Correction: Utiliser NotificationFilters
  notificationTypes: NotificationType[];
}> = ({ filters, onFilterChange, notificationTypes }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-lg shadow-sm border mb-6"> {/* Ajout mb-6 */}
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label> {/* Taille texte réduite */}
      <select
        value={filters.readStatus}
        onChange={(e) => onFilterChange({ ...filters, readStatus: e.target.value as NotificationFilters['readStatus'] })} // Cast pour la sécurité
        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500" // Style focus
      >
        <option value="all">Tous</option>
        <option value="read">Lus</option>
        <option value="unread">Non lus</option>
      </select>
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">Archives</label>
      <select
        value={filters.archived ? "true" : "false"}
        onChange={(e) => onFilterChange({ ...filters, archived: e.target.value === "true" })}
        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="false">Actives</option> {/* Changé label */}
        <option value="true">Archivées</option>
      </select>
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
      <select
        value={filters.type}
        onChange={(e) => onFilterChange({ ...filters, type: e.target.value })}
        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="all">Tous les types</option>
        {notificationTypes.map(type => (
          <option key={type.id} value={type.code}>{type.name}</option>
        ))}
      </select>
    </div>
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">Recherche</label>
      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher titre ou message..." // Placeholder plus précis
          className="w-full p-2 pl-8 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          value={filters.search}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
        />
        <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-400" /> {/* Ajustement position icône */}
      </div>
    </div>
  </div>
);

// Composant principal NotificationsPanel
export const NotificationsPanel: React.FC = () => {
  const router = useRouter(); // <--- INITIALISER ICI
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sentNotifications, setSentNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<NotificationDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [_notificationTypes, setNotificationTypes] = useState<NotificationType[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreference[]>([]);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [sentLoading, setSentLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sentError, setSentError] = useState<string | null>(null);

  const [filters, setFilters] = useState<NotificationFilters>({
    readStatus: "all",
    archived: false,
    type: "all",
    search: ""
  });

  // Fonction pour récupérer le compteur de notifications non lues
  const updateNotificationCount = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      const response = await fetch(API_URLS.NOTIFICATIONS_COUNT, { headers });
      if (response.ok) {
        const count = await response.json();
        setNotificationCount(count);
      }
    } catch (err) {
      console.error("Erreur maj compteur:", err);
    }
  }, []);

  // Fonction pour récupérer les notifications reçues
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        setError("Session expirée.");
        setLoading(false);
        return;
      }
      let url = API_URLS.NOTIFICATIONS_RECEIVED;
      const params = new URLSearchParams();
      // Application des filtres depuis l'état 'filters'
      if (filters.readStatus === "read") params.append("is_read", "true");
      else if (filters.readStatus === "unread") params.append("is_read", "false");
      params.append("is_archived", filters.archived.toString()); // Toujours envoyer is_archived
      if (filters.type !== "all") params.append("type", filters.type);
      if (filters.search) params.append("search", filters.search); // Ajout filtre recherche

      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error(`Erreur: ${response.status}`);
      const data = await response.json();
      setNotifications(data);
    } catch (err: unknown) {
      console.error("Erreur fetch notifs:", err);
      setError(err instanceof Error ? err.message : "Erreur chargement notifications");
    } finally {
      setLoading(false);
    }
  }, [filters]); // Dépend de l'état des filtres

  // Fonction pour récupérer les notifications envoyées (inchangée pour l'instant)
  const fetchSentNotifications = useCallback(async () => {
    setSentLoading(true);
    setSentError(null);
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        setSentError("Session expirée.");
        setSentLoading(false);
        return;
      }
      const response = await fetch(API_URLS.NOTIFICATIONS_SENT, { headers });
      if (!response.ok) throw new Error(`Erreur: ${response.status}`);
      const data = await response.json();
      setSentNotifications(data);
    } catch (err: unknown) {
      console.error("Erreur fetch sent:", err);
      setSentError(err instanceof Error ? err.message : "Erreur chargement historique");
    } finally {
      setSentLoading(false);
    }
  }, []);

  // Effet pour charger les données initiales (types, prefs, compteur)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const headers = getAuthHeaders();
        if (!headers) return;
        const [typesRes, prefsRes, countRes] = await Promise.all([
          fetch(API_URLS.NOTIFICATIONS_TYPES, { headers }),
          fetch(API_URLS.NOTIFICATIONS_PREFERENCES, { headers }),
          fetch(API_URLS.NOTIFICATIONS_COUNT, { headers })
        ]);
        if (typesRes.ok) setNotificationTypes(await typesRes.json());
        if (prefsRes.ok) setNotificationPreferences(await prefsRes.json());
        if (countRes.ok) setNotificationCount(await countRes.json());
      } catch (err: unknown) {
        console.error("Erreur initial data:", err);
      }
    };
    fetchInitialData();
  }, []);

  // Effet pour charger les notifications quand les filtres changent
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]); // fetchNotifications inclut déjà 'filters' dans ses dépendances

  // Effet pour charger l'historique (une seule fois au montage pour l'instant)
  useEffect(() => {
    fetchSentNotifications();
  }, [fetchSentNotifications]);


  // Fonctions d'action (markAsRead, markAsUnread, etc.)
  const handleApiResponse = async (url: string, method: string, successMessage: string, updateFn: (id: string) => void, id: string) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      const response = await fetch(url, { method, headers });
      if (!response.ok) throw new Error(`Erreur: ${response.status}`);
      updateFn(id); // Met à jour l'état local
      updateNotificationCount(); // Met à jour le compteur
      // alert(successMessage); // Optionnel: afficher une confirmation
    } catch (err) {
      console.error(`Erreur ${method}:`, err);
      alert(`Erreur lors de l'action: ${successMessage}`);
    }
  };

  const markAsRead = (id: string) => handleApiResponse(
    `${API_URLS.NOTIFICATIONS_MARK_READ}${id}/`, 'POST', 'Marquée comme lue',
    (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n)), id
  );

  const markAsUnread = (id: string) => handleApiResponse(
    `${API_URLS.NOTIFICATIONS_MARK_UNREAD}${id}/`, 'POST', 'Marquée comme non lue',
    (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: false } : n)), id
  );

  const archiveNotification = (id: string) => handleApiResponse(
    `${API_URLS.NOTIFICATIONS_ARCHIVE}${id}/`, 'POST', 'Archivée',
    (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_archived: true } : n)), id // Met à jour is_archived
    // Note: Le filtrage se fait via useMemo basé sur filters.archived
  );

  const deleteNotification = (id: string) => {
    if (!confirm("Supprimer cette notification ?")) return;
    handleApiResponse(
      `${API_URLS.NOTIFICATIONS_DELETE}${id}/`, 'DELETE', 'Supprimée',
      (id) => setNotifications(prev => prev.filter(n => n.id !== id)), id
    );
    if (showDetailModal && selectedNotification?.id === id) {
      setShowDetailModal(false); // Ferme le modal si la notif affichée est supprimée
    }
  };

  const markAllAsRead = async () => {
    if (!confirm("Marquer toutes les notifications comme lues ?")) return;
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      const response = await fetch(API_URLS.NOTIFICATIONS_MARK_ALL_READ, { method: "POST", headers });
      if (!response.ok) throw new Error(`Erreur: ${response.status}`);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setNotificationCount(0);
    } catch (err) {
      console.error("Erreur mark all read:", err);
      alert("Erreur lors du marquage de toutes les notifications");
    }
  };

  // Fonction pour voir les détails OU rediriger
  const viewNotificationDetails = async (id: string) => {
    console.log("Attempting to view details or redirect for ID:", id);
    let notificationData: NotificationDetail | null = null;
    let headers: Record<string, string> | null = null;

    try {
      headers = getAuthHeaders();
      if (!headers) {
        console.error("Auth headers missing");
        alert("Session expirée.");
        return;
      }

      // --- Étape 1: Récupérer les détails de la notification ---
      console.log("Fetching details from:", `${API_URLS.NOTIFICATIONS_DETAIL}${id}/`);
      const response = await fetch(`${API_URLS.NOTIFICATIONS_DETAIL}${id}/`, { headers });
      console.log("API Response Status:", response.status);

      if (!response.ok) {
        console.error("API Error Status:", response.status, await response.text());
        throw new Error(`Erreur API: ${response.status}`);
      }
      notificationData = await response.json();
      console.log("API Data received:", notificationData);

      // --- Étape 2: Vérifier si c'est une tâche de validation nécessitant une redirection ---
      // Condition : le titre contient "nouvelle tâche à valider" (ajuster si nécessaire)
      const isValidationTask = notificationData && notificationData.title?.toLowerCase().includes('nouvelle tâche à valider');

      if (isValidationTask) {
        console.log("Validation task detected. Redirecting...");

        // --- Étape 3a: Marquer comme lu (si nécessaire) AVANT redirection ---
        if (notificationData && !notificationData.is_read && headers) {
          try {
            console.log("Marking as read before redirect...");
            await fetch(`${API_URLS.NOTIFICATIONS_MARK_READ}${id}/`, { method: "POST", headers });
            // Mettre à jour l'état local et le compteur immédiatement pour la réactivité
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            updateNotificationCount();
          } catch (readErr) {
            console.error("Failed to mark as read before redirect:", readErr);
            // Continuer la redirection même si le marquage échoue
          }
        }

        // --- Étape 4a: Rediriger ---
        router.push('/demandes/validations/'); // Rediriger vers la page des validations
        return; // Arrêter l'exécution ici
      }

      // --- Étape 3b: Si ce n'est pas une tâche de validation, afficher le modal ---
      console.log("Not a validation task. Showing modal.");
      setSelectedNotification(notificationData);
      setShowDetailModal(true);
      console.log("Modal state updated: show=true, notification set.");

      // --- Étape 4b: Marquer comme lu (si nécessaire) APRÈS avoir mis les données dans le modal ---
      if (notificationData && !notificationData.is_read && headers) {
        try {
          console.log("Marking as read after setting modal data...");
          // L'appel API pour marquer comme lu
          await fetch(`${API_URLS.NOTIFICATIONS_MARK_READ}${id}/`, { method: "POST", headers });
          // Mettre à jour l'état local et le compteur
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
          updateNotificationCount();
        } catch (readErr) {
          console.error("Failed to mark as read after setting modal data:", readErr);
        }
      }

    } catch (err) {
      console.error("Error in viewNotificationDetails catch block:", err);
      alert("Impossible de récupérer les détails ou de traiter la notification.");
      // Assurer que le modal est fermé en cas d'erreur avant l'ouverture
      if (!notificationData) { // Si l'erreur survient avant d'avoir les données
         setShowDetailModal(false);
         setSelectedNotification(null);
      }
    }
  };

  // Fonction updatePreference (inchangée)
  const updatePreference = async (preferenceId: number, isEnabled: boolean) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      const response = await fetch(`${API_URLS.NOTIFICATIONS_PREFERENCES}${preferenceId}/`, {
        method: "PATCH", headers, body: JSON.stringify({ is_enabled: isEnabled })
      });
      if (!response.ok) throw new Error(`Erreur: ${response.status}`);
      setNotificationPreferences(prev => prev.map(p => p.id === preferenceId ? { ...p, is_enabled: isEnabled } : p));
    } catch (err) {
      console.error("Erreur update pref:", err);
      alert("Erreur mise à jour préférence");
    }
  };

  // Filtrage côté client avec useMemo
  const filteredNotifications = useMemo(() => {
    // Le filtrage API gère readStatus, archived, type, search.
    // On retourne directement les notifications reçues de l'API.
    return notifications;
  }, [notifications]); // Dépend seulement de 'notifications' car l'API fait le filtrage

  const filteredSentNotifications = useMemo(() => {
    // Ajouter un filtrage par recherche si nécessaire pour l'historique
    return sentNotifications.filter(notification => {
      const matchesSearch = filters.search === "" || // Si pas de recherche, tout correspond
        notification.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        notification.message.toLowerCase().includes(filters.search.toLowerCase());
      return matchesSearch;
    });
  }, [sentNotifications, filters.search]);


  return (
    <div className="bg-gray-100 min-h-screen p-6 md:p-8"> {/* Fond légèrement différent */}
      <div className="max-w-7xl mx-auto"> {/* Largeur max augmentée */}
        <Tabs defaultValue="received">
          <TabsList className="border-b-0 mb-6"> {/* Suppression bordure, ajout marge */}
            <TabsTrigger value="received" className="relative"> {/* Suppression padding droit */}
              <Bell className="h-4 w-4" /> {/* Taille icône réduite */}
              Boîte de réception
              {notificationCount > 0 && <NotificationBadge count={notificationCount} />}
            </TabsTrigger>
            <TabsTrigger value="sent">
              <Archive className="h-4 w-4" />
              Historique
            </TabsTrigger>
             <TabsTrigger value="settings">
               {/* <Settings className="h-4 w-4" /> Remplacer par une icône appropriée si disponible */}
               Paramètres
             </TabsTrigger>
          </TabsList>

          <TabsContent value="received" activeTab="received">
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-semibold text-gray-800">Notifications</h1> {/* Style titre */}
                <div className="flex gap-2 flex-wrap"> {/* Wrap pour petits écrans */}
                  {notifications.some(n => !n.is_read && !n.is_archived) && ( // Condition pour bouton "Tout marquer comme lu"
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs rounded-md hover:bg-gray-50 transition-colors" // Style bouton
                    >
                      <CheckCheck className="h-4 w-4" />
                      <span>Tout marquer comme lu</span>
                    </button>
                  )}
                  <button
                    onClick={fetchNotifications}
                    title="Actualiser"
                    className="p-2 bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-md transition-colors" // Style bouton
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <FiltersBar
                filters={filters}
                onFilterChange={setFilters}
                notificationTypes={_notificationTypes}
              />

              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-24 bg-white border border-gray-200 animate-pulse rounded-lg" /> // Squelette plus réaliste
                  ))}
                </div>
              ) : error ? (
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-center"> {/* Style erreur */}
                  {error}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-16 bg-white border rounded-lg"> {/* Style "aucune notif" */}
                  <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune notification à afficher.</p>
                  <p className="text-sm text-gray-400 mt-1">Essayez d&apos;ajuster les filtres.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map(notification => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onView={() => viewNotificationDetails(notification.id)}
                      onMark={() => notification.is_read ?
                        markAsUnread(notification.id) : markAsRead(notification.id)}
                      onArchive={() => archiveNotification(notification.id)}
                      onDelete={() => deleteNotification(notification.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="sent" activeTab="received">
             <div className="space-y-6">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <h1 className="text-2xl font-semibold text-gray-800">Historique d&apos;envoi</h1>
                 <div className="flex gap-2">
                    {/* Barre de recherche spécifique à l'historique si nécessaire */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Rechercher dans l'historique..."
                        className="w-full md:w-64 p-2 pl-8 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        value={filters.search} // Utilise le même filtre de recherche pour l'instant
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      />
                      <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-gray-400" />
                    </div>
                   <button
                     onClick={fetchSentNotifications}
                     title="Actualiser l'historique"
                     className="p-2 bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                   >
                     <RefreshCw className="h-4 w-4" />
                   </button>
                 </div>
               </div>

               {sentLoading ? (
                 <div className="space-y-3">
                   {[...Array(5)].map((_, i) => (
                     <div key={i} className="h-24 bg-white border border-gray-200 animate-pulse rounded-lg" />
                   ))}
                 </div>
               ) : sentError ? (
                 <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-center">
                   {sentError}
                 </div>
               ) : filteredSentNotifications.length === 0 ? (
                 <div className="text-center py-16 bg-white border rounded-lg">
                   <Archive className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                   <p className="text-gray-500">Aucune notification envoyée trouvée.</p>
                 </div>
               ) : (
                 <div className="space-y-3">
                   {filteredSentNotifications.map(notification => (
                     <NotificationCard // Réutilisation de NotificationCard, ajuster les actions si nécessaire
                       key={notification.id}
                       notification={notification}
                       onView={() => viewNotificationDetails(notification.id)}
                       // Actions spécifiques à l'historique (peut-être juste voir détails ?)
                       onMark={() => {}} // Pas d'action marquer/non lu sur l'historique
                       onArchive={() => {}} // Pas d'action archiver sur l'historique
                       onDelete={() => deleteNotification(notification.id)} // Suppression possible ?
                     />
                   ))}
                 </div>
               )}
             </div>
           </TabsContent>

           <TabsContent value="settings" activeTab="received">
             <h1 className="text-2xl font-semibold text-gray-800 mb-6">Paramètres de notification</h1>
             <div className="space-y-4 max-w-2xl mx-auto bg-white p-6 rounded-lg border shadow-sm">
               {notificationPreferences.length === 0 && (
                 <p className="text-gray-500 text-center">Chargement des préférences...</p>
               )}
               {notificationPreferences.map(preference => (
                 <div key={preference.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                   <div>
                     <h3 className="font-medium text-gray-800">{preference.notification_type_name}</h3>
                     <p className="text-sm text-gray-500">
                       Via {preference.channel_type_display} ({preference.channel_name})
                     </p>
                   </div>
                   {/* Switch Toggle */}
                   <button
                     role="switch"
                     aria-checked={preference.is_enabled}
                     onClick={() => updatePreference(preference.id, !preference.is_enabled)}
                     className={`relative inline-flex items-center h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                       preference.is_enabled ? 'bg-blue-600' : 'bg-gray-200'
                     }`}
                   >
                     <span
                       aria-hidden="true"
                       className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                         preference.is_enabled ? 'translate-x-5' : 'translate-x-0'
                       }`}
                     />
                   </button>
                 </div>
               ))}
             </div>
           </TabsContent>

        </Tabs>
      </div>

      {/* Modal amélioré */}
      {showDetailModal && selectedNotification && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
            {/* Header du Modal */}
            <div className="flex justify-between items-center p-4 sm:p-5 border-b">
               <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: selectedNotification.notification_type_color || '#cccccc' }}
                  />
                  <h2 className="text-lg font-semibold text-gray-800">{selectedNotification.title}</h2>
               </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenu du Modal */}
            <div className="p-4 sm:p-6 space-y-5 max-h-[60vh] overflow-y-auto">
              {/* Utilisation de la fonction de formatage */}
              <div className="prose prose-sm max-w-none text-gray-700">
                 {renderFormattedMessage(selectedNotification.message)}
              </div>

              {/* Détails Expéditeur, Date, etc. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm border-t pt-4">
                <div className="space-y-0.5">
                  {/* MODIFICATION: Changement du label "Expéditeur" */}
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Traiter par :</div>
                  <div className="font-medium text-gray-800">
                    {selectedNotification.sender_details?.full_name || "Système"}
                  </div>
                </div>
                <div className="space-y-0.5">
                  {/* Label "Date d'envoi" conservé pour clarté */}
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Date d&apos;envoi :</div>
                  <div className="font-medium text-gray-800">
                    {new Date(selectedNotification.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </div>
                </div>
                {selectedNotification.read_at && (
                  <div className="space-y-0.5">
                    {/* MODIFICATION: Changement du label "Date de lecture" */}
                    <div className="text-xs text-gray-500 uppercase tracking-wider">Date de traitement :</div>
                    <div className="font-medium text-gray-800">
                      {new Date(selectedNotification.read_at).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer du Modal */}
            <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
              {/* ... (Bouton Supprimer inchangé) ... */}
              <button
                onClick={() => {
                  deleteNotification(selectedNotification.id);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 text-xs rounded-md transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>

              {/* ... (Bouton Archiver inchangé) ... */}
              {!selectedNotification.is_archived && (
                 <button
                   onClick={() => {
                     archiveNotification(selectedNotification.id);
                     setShowDetailModal(false); // Ferme après archivage
                   }}
                   className="flex items-center gap-1.5 px-3 py-1.5 text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 text-xs rounded-md transition-colors"
                 >
                   <Archive className="h-4 w-4" />
                   Archiver
                 </button>
              )}

              {/* Bouton conditionnel : Redirection validation OU Lien externe */}
              {(() => {
                // Condition : le titre contient "nouvelle tâche à valider" (ajuster si nécessaire)
                const isValidationTask = selectedNotification.title?.toLowerCase().includes('nouvelle tâche à valider');

                if (isValidationTask) {
                  // Bouton pour rediriger vers la page de validation
                  return (
                    <button
                      onClick={() => {
                        console.log("Redirecting to validations page...");
                        // Optionnel: Marquer comme lu si ce n'est pas déjà fait au clic
                        if (!selectedNotification.is_read) {
                           markAsRead(selectedNotification.id); // Utilise la fonction existante
                        }
                        router.push('/demandes/validations/');
                        setShowDetailModal(false); // Ferme le modal après clic
                      }}
                      className="px-4 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Traiter la demande {/* Ou "Valider", "Ouvrir la tâche", etc. */}
                    </button>
                  );
                } else if (selectedNotification.action_url) {
                  // Bouton pour rediriger vers /demandes/listes/
                  return (
                    <button
                      onClick={() => {
                        console.log("Redirecting to list page...");
                        // Optionnel: Marquer comme lu si ce n'est pas déjà fait au clic
                        if (!selectedNotification.is_read) {
                           markAsRead(selectedNotification.id);
                        }
                        router.push('/demandes/listes/'); // Redirection vers la page de liste
                        setShowDetailModal(false); // Ferme le modal après clic
                      }}
                      className="px-4 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Voir la liste {/* Texte du bouton mis à jour */}
                    </button>
                  );
                }
                // Si ce n'est pas une tâche de validation ET qu'il n'y a pas d'action_url, ne rien afficher
                return null;
              })()}

              {/* ... (Bouton Fermer inchangé) ... */}
               <button
                 onClick={() => setShowDetailModal(false)}
                 className="px-4 py-1.5 text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 text-xs rounded-md transition-colors"
               >
                 Fermer
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Export des composants Tabs si nécessaire ailleurs
export { Tabs, TabsList, TabsTrigger, TabsContent };

// Ajout des keyframes pour l'animation du modal dans un fichier CSS global ou via un composant Style
/*
@keyframes modal-scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.animate-modal-scale-in {
  animation: modal-scale-in 0.2s ease-out forwards;
}
*/