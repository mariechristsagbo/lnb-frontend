import React, { useState, ReactNode, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { Eye, EyeOff, RefreshCw, Archive, Trash2, X, ChevronRight, CheckCheck, Bell } from 'lucide-react';

// Mise à jour des URL de l'API pour utiliser HTTPS et corriger les chemins
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
  };
  notification_type: number;
  notification_type_name: string;
  notification_type_code: string;
  notification_type_icon: string;
  notification_type_color: string;
  title: string;
  message: string;
  action_url: string;
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

// Ajout d'une nouvelle interface pour les détails de notification
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

const Tabs: React.FC<TabsProps> = ({ defaultValue, children, className }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  // Fonction pour traiter les enfants
  const processChildren = () => {
    return React.Children.map(children, child => {
      if (!React.isValidElement(child)) {
        return child;
      }

      // Pour le contenu des onglets, ajouter la prop activeTab
      if (child.type === TabsContent) {
        return React.cloneElement(child as React.ReactElement<TabsContentProps>, { activeTab });
      }
      
      // For the tab list, process each trigger
      if (React.isValidElement<TabsListProps>(child) && child.type === TabsList) {
        const modifiedTriggers = React.Children.map(child.props.children, (trigger) => {
          if (React.isValidElement<TabsTriggerProps>(trigger) && trigger.type === TabsTrigger) {
            return React.cloneElement(trigger, {
              onClick: () => setActiveTab(trigger.props.value),
              className: `${trigger.props.className || ''} ${
                trigger.props.value === activeTab ? 'border-b-2 border-blue-500 text-blue-600' : ''
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
  return <div className={`tabs-list flex space-x-2 border-b mb-4 ${className || ''}`}>{children}</div>;
};

const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, className, onClick }) => {
  return (
    <button 
      className={`tabs-trigger px-4 py-2 font-medium ${className || ''}`}
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

// Fonction utilitaire pour récupérer les headers avec le token
const getAuthHeaders = () => {
  const tokenCookie = Cookies.get("authTokens");
  if (!tokenCookie) return null;
  
  const tokenData = JSON.parse(tokenCookie);
  const accessToken = tokenData.access;
  
  return {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
};

// Composant NotificationsPanel qui utilise les composants Tabs
export const NotificationsPanel: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sentNotifications, setSentNotifications] = useState<Notification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<NotificationDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Préfixer avec _ pour indiquer que c'est intentionnellement non utilisé pour le moment
  const [_notificationTypes, setNotificationTypes] = useState<NotificationType[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreference[]>([]);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  
  const [loading, setLoading] = useState(true);
  const [sentLoading, setSentLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sentError, setSentError] = useState<string | null>(null);
  const [filterReadStatus, setFilterReadStatus] = useState<string>("all");
  const [filterArchived, setFilterArchived] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<string>("all");

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }
      
      // Construction de l'URL avec les paramètres de filtre
      let url = API_URLS.NOTIFICATIONS_RECEIVED;
      const params = new URLSearchParams();
      
      if (filterReadStatus === "read") {
        params.append("is_read", "true");
      } else if (filterReadStatus === "unread") {
        params.append("is_read", "false");
      }
      
      if (filterArchived) {
        params.append("is_archived", "true");
      }
      
      if (filterType !== "all") {
        params.append("type", filterType);
      }
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }
      
      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      console.error("Erreur:", err);
      setError("Erreur lors du chargement des notifications");
    } finally {
      setLoading(false);
    }
  }, [filterReadStatus, filterArchived, filterType]);

  useEffect(() => {
    fetchNotifications();
    fetchSentNotifications();
  }, [fetchNotifications, filterReadStatus, filterArchived, filterType]);

  useEffect(() => {
    const fetchNotificationData = async () => {
      try {
        const headers = getAuthHeaders();
        if (!headers) return;

        // Récupérer les types de notifications
        const typesResponse = await fetch(API_URLS.NOTIFICATIONS_TYPES, { headers });
        if (typesResponse.ok) {
          const typesData = await typesResponse.json();
          setNotificationTypes(typesData);
        }

        // Correction ici: utilisation correcte de preferencesResponse au lieu de preferences
        const preferencesResponse = await fetch(API_URLS.NOTIFICATIONS_PREFERENCES, { headers });
        if (preferencesResponse.ok) {
          const preferencesData = await preferencesResponse.json();
          setNotificationPreferences(preferencesData);
        }

        // Récupérer le nombre de notifications
        const countResponse = await fetch(API_URLS.NOTIFICATIONS_COUNT, { headers });
        if (countResponse.ok) {
          const countData = await countResponse.json();
          setNotificationCount(countData);
        }
      } catch (err) {
        console.error("Erreur lors de la récupération des données:", err);
      }
    };

    fetchNotificationData();
  }, []);

  // Fonction pour récupérer les notifications reçues avec filtres
  const fetchSentNotifications = async () => {
    setSentLoading(true);
    setSentError(null);
    
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        setSentError("Session expirée. Veuillez vous reconnecter.");
        setSentLoading(false);
        return;
      }
      
      const response = await fetch(API_URLS.NOTIFICATIONS_SENT, { headers });
      
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }
      
      const data = await response.json();
      setSentNotifications(data);
    } catch (err) {
      console.error("Erreur:", err);
      setSentError("Erreur lors du chargement des notifications envoyées");
    } finally {
      setSentLoading(false);
    }
  };

  // Fonction pour consulter les détails d'une notification
  const viewNotificationDetails = async (id: string) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      
      const response = await fetch(`${API_URLS.NOTIFICATIONS_DETAIL}${id}/`, { headers });
      
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }
      
      const data = await response.json();
      setSelectedNotification(data);
      setShowDetailModal(true);
      
      // Si la notification n'est pas lue, la marquer comme lue
      if (!data.is_read) {
        await markAsRead(id);
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des détails:", err);
      alert("Impossible de récupérer les détails de la notification");
    }
  };

  // Fonction pour marquer une notification comme lue
  const markAsRead = async (id: string) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      
      const response = await fetch(`${API_URLS.NOTIFICATIONS_MARK_READ}${id}/`, {
        method: "POST",
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }
      
      // Mise à jour locale
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );

      // Mettre à jour le compteur
      updateNotificationCount();
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  // Fonction pour marquer une notification comme non lue
  const markAsUnread = async (id: string) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      
      const response = await fetch(`${API_URLS.NOTIFICATIONS_MARK_UNREAD}${id}/`, {
        method: "POST",
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }
      
      // Mise à jour locale
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, is_read: false } : notif
        )
      );

      // Mettre à jour le compteur
      updateNotificationCount();
    } catch (err) {
      console.error("Erreur:", err);
    }
  };

  // Fonction pour marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      if (!confirm("Voulez-vous marquer toutes les notifications comme lues ?")) {
        return;
      }
      
      const headers = getAuthHeaders();
      if (!headers) return;
      
      const response = await fetch(API_URLS.NOTIFICATIONS_MARK_ALL_READ, {
        method: "POST",
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }
      
      // Mettre à jour les notifications localement
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      
      // Mettre à jour le compteur de notifications
      setNotificationCount(0);
      
      alert("Toutes les notifications ont été marquées comme lues");
    } catch (err) {
      console.error("Erreur:", err);
      alert("Une erreur est survenue lors du marquage des notifications");
    }
  };

  // Fonction pour archiver une notification
  const archiveNotification = async (id: string) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      
      const response = await fetch(`${API_URLS.NOTIFICATIONS_ARCHIVE}${id}/`, {
        method: "POST",
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }
      
      // Mise à jour locale si on n'affiche pas les archives
      if (!filterArchived) {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
      } else {
        // Mise à jour du statut si on affiche les archives
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === id ? { ...notif, is_archived: true } : notif
          )
        );
      }
      
      alert("Notification archivée avec succès");
    } catch (err) {
      console.error("Erreur lors de l'archivage:", err);
      alert("Erreur lors de l'archivage de la notification");
    }
  };

  // Mettre à jour le compteur de notifications
  const updateNotificationCount = async () => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      
      const response = await fetch(API_URLS.NOTIFICATIONS_COUNT, { headers });
      
      if (response.ok) {
        const count = await response.json();
        setNotificationCount(count);
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour du compteur:", err);
    }
  };

  // Fonction pour supprimer une notification
  const deleteNotification = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette notification ?")) {
      return;
    }
    
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      
      const response = await fetch(`${API_URLS.NOTIFICATIONS_DELETE}${id}/`, {
        method: "DELETE",
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }
      
      // Retirer la notification localement
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      
      // Si une notification non lue est supprimée, mettre à jour le compteur
      updateNotificationCount();
      
      alert("Notification supprimée avec succès");
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      alert("Erreur lors de la suppression de la notification");
    }
  };

  // Fonction pour mettre à jour une préférence
  const updatePreference = async (preferenceId: number, isEnabled: boolean) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;
      
      const response = await fetch(`${API_URLS.NOTIFICATIONS_PREFERENCES}${preferenceId}/`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ is_enabled: isEnabled })
      });
      
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }
      
      // Mise à jour locale des préférences
      setNotificationPreferences(prev =>
        prev.map(pref =>
          pref.id === preferenceId ? { ...pref, is_enabled: isEnabled } : pref
        )
      );
    } catch (err) {
      console.error("Erreur lors de la mise à jour de la préférence:", err);
      alert("Erreur lors de la mise à jour de la préférence");
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="received">
        <TabsList>
          <TabsTrigger value="received">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Notifications reçues</span>
              {notificationCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {notificationCount}
                </span>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger value="sent">Historique</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>
        
        <TabsContent value="received" activeTab="received">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Notifications reçues</h2>
              <div className="flex space-x-2">
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition-colors flex items-center space-x-1"
                  onClick={fetchNotifications}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Actualiser</span>
                </button>
                {notifications.some(n => !n.is_read) && (
                  <button 
                    className="px-4 py-2 bg-gray-600 text-white rounded shadow hover:bg-gray-700 transition-colors flex items-center space-x-1"
                    onClick={markAllAsRead}
                  >
                    <CheckCheck className="h-4 w-4" />
                    <span>Tout marquer comme lu</span>
                  </button>
                )}
              </div>
            </div>
            
            {/* Filtres */}
            <div className="flex flex-wrap gap-3 bg-gray-50 p-3 rounded-lg">
              <div>
                <label className="text-sm text-gray-600 mr-2">Statut:</label>
                <select
                  value={filterReadStatus}
                  onChange={(e) => setFilterReadStatus(e.target.value)}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="all">Tous</option>
                  <option value="read">Lus</option>
                  <option value="unread">Non lus</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-600 mr-2">Archives:</label>
                <select
                  value={filterArchived ? "true" : "false"}
                  onChange={(e) => setFilterArchived(e.target.value === "true")}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="false">Non archivées</option>
                  <option value="true">Archivées</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm text-gray-600 mr-2">Type:</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-1 border rounded text-sm"
                >
                  <option value="all">Tous les types</option>
                  {_notificationTypes.map(type => (
                    <option key={type.id} value={type.code}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Aucune notification</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map(notification => (
                  <div key={notification.id} 
                       className={`p-4 border rounded-lg ${
                         notification.is_archived 
                           ? 'bg-gray-50 border-gray-200' 
                           : notification.is_read 
                             ? 'bg-white' 
                             : 'bg-blue-50 border-blue-200'
                       }`}>
                    <div className="flex justify-between">
                      <h3 className="font-medium">{notification.title}</h3>
                      <span className="px-2 py-1 text-xs rounded-full" 
                            style={{ 
                              backgroundColor: notification.notification_type_color + '20',
                              color: notification.notification_type_color 
                            }}>
                        {notification.notification_type_name}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-600">{notification.message}</p>
                    {notification.sender_details && (
                      <p className="mt-1 text-xs text-gray-500">
                        De: {notification.sender_details.full_name}
                      </p>
                    )}
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-sm text-gray-500">{notification.time_since}</span>
                      <div className="space-x-2">
                        <button 
                          className="px-3 py-1 border rounded text-sm flex items-center space-x-1"
                          onClick={() => viewNotificationDetails(notification.id)}
                        >
                          <ChevronRight className="h-4 w-4" />
                          <span>Détails</span>
                        </button>
                        
                        {notification.is_read ? (
                          <button 
                            className="px-3 py-1 border rounded text-sm flex items-center space-x-1 text-blue-600"
                            onClick={() => markAsUnread(notification.id)}
                          >
                            <EyeOff className="h-4 w-4" />
                            <span>Non lu</span>
                          </button>
                        ) : (
                          <button 
                            className="px-3 py-1 border rounded text-sm flex items-center space-x-1 text-green-600"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Eye className="h-4 w-4" />
                            <span>Lu</span>
                          </button>
                        )}
                        
                        {!notification.is_archived && (
                          <button 
                            className="px-3 py-1 border rounded text-sm flex items-center space-x-1 text-gray-600"
                            onClick={() => archiveNotification(notification.id)}
                          >
                            <Archive className="h-4 w-4" />
                            <span>Archiver</span>
                          </button>
                        )}
                        
                        <button 
                          className="px-3 py-1 border rounded text-sm flex items-center space-x-1 text-red-500"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="sent" activeTab="received">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Notifications envoyées</h2>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition-colors flex items-center space-x-1"
                onClick={fetchSentNotifications}
              >
                <RefreshCw className="h-4 w-4" />
                <span>Actualiser</span>
              </button>
            </div>
            
            {sentLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : sentError ? (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {sentError}
              </div>
            ) : sentNotifications.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Aucune notification envoyée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sentNotifications.map(notification => (
                  <div key={notification.id} className="p-4 border rounded-lg bg-white">
                    <div className="flex justify-between">
                      <h3 className="font-medium">{notification.title}</h3>
                      <span className="px-2 py-1 text-xs rounded-full" 
                            style={{ 
                              backgroundColor: notification.notification_type_color + '20',
                              color: notification.notification_type_color 
                            }}>
                        {notification.notification_type_name}
                      </span>
                    </div>
                    <p className="mt-2 text-gray-600">{notification.message}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <div className="flex space-x-2 text-xs text-gray-500">
                        <span>Envoyée: {notification.time_since}</span>
                        <span>•</span>
                        <span>
                          Statut: {notification.is_read ? 'Lue' : 'Non lue'} {notification.is_archived ? '(Archivée)' : ''}
                        </span>
                      </div>
                      <button 
                        className="px-3 py-1 border rounded text-sm flex items-center space-x-1"
                        onClick={() => viewNotificationDetails(notification.id)}
                      >
                        <ChevronRight className="h-4 w-4" />
                        <span>Détails</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="settings" activeTab="received">
          <h2 className="text-xl font-bold mb-4">Paramètres de notification</h2>
          <div className="space-y-4 max-w-2xl mx-auto">
            {notificationPreferences.map(preference => (
              <div key={preference.id} className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
                <div>
                  <h3 className="font-medium">{preference.notification_type_name}</h3>
                  <p className="text-sm text-gray-500">
                    Via {preference.channel_type_display}
                  </p>
                </div>
                <div 
                  className={`relative inline-block w-12 h-6 rounded-full ${
                    preference.is_enabled ? 'bg-blue-600' : 'bg-gray-200'
                  } cursor-pointer`}
                  onClick={() => updatePreference(preference.id, !preference.is_enabled)}
                >
                  <div className={`absolute w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                    preference.is_enabled ? 'right-1' : 'left-1'
                  } top-1`}></div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Modal de détails de notification */}
      {showDetailModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">{selectedNotification.title}</h2>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setShowDetailModal(false)}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-gray-800 mb-4">{selectedNotification.message}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Type:</p>
                    <p className="font-medium">{selectedNotification.notification_type_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Date d&apos;envoi:</p>
                    <p className="font-medium">{selectedNotification.created_at}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Expéditeur:</p>
                    <p className="font-medium">
                      {selectedNotification.sender_details ? selectedNotification.sender_details.full_name : "Système"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Date de lecture:</p>
                    <p className="font-medium">{selectedNotification.read_at || "Non lue"}</p>
                  </div>
                </div>
              </div>
              
              {selectedNotification.action_url && (
                <div className="mb-4">
                  <a 
                    href={selectedNotification.action_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition-colors inline-block"
                  >
                    Ouvrir le lien associé
                  </a>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <button 
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowDetailModal(false)}
                >
                  Fermer
                </button>
                
                {!selectedNotification.is_archived && (
                  <button 
                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-1"
                    onClick={() => {
                      archiveNotification(selectedNotification.id);
                      setShowDetailModal(false);
                    }}
                  >
                    <Archive className="h-4 w-4" />
                    <span>Archiver</span>
                  </button>
                )}
                
                <button 
                  className="px-4 py-2 border border-red-300 rounded text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-1"
                  onClick={() => {
                    deleteNotification(selectedNotification.id);
                    setShowDetailModal(false);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Supprimer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };