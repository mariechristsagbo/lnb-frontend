import React, { useState, ReactNode, useEffect } from 'react';
import Cookies from 'js-cookie';

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

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  created_at: string;
  read: boolean;
  sender?: string;
  priority?: 'low' | 'medium' | 'high';
  link?: string;
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

// Composant NotificationsPanel qui utilise les composants Tabs
export const NotificationsPanel: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Récupération du token d'authentification
      const tokenCookie = Cookies.get("authTokens");
      if (!tokenCookie) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }
      
      const tokenData = JSON.parse(tokenCookie);
      const accessToken = tokenData.access;
      
      // Appel à l'API pour récupérer les notifications
      const response = await fetch(
        "https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/sys-gestion/notifications/received/", 
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération des notifications: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Notifications reçues:", data);
      
      // Si l'API renvoie les données dans un format différent, ajustez la ligne suivante
      setNotifications(data);
    } catch (err) {
      console.error("Erreur lors de la récupération des notifications:", err);
      setError("Une erreur est survenue lors du chargement des notifications.");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      const tokenCookie = Cookies.get("authTokens");
      if (!tokenCookie) return;
      
      const tokenData = JSON.parse(tokenCookie);
      const accessToken = tokenData.access;
      
      const response = await fetch(
        `https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/sys-gestion/notifications/mark-read/${id}/`, 
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }
      
      // Mettre à jour localement
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (err) {
      console.error("Erreur lors du marquage comme lu:", err);
    }
  };

  const deleteNotification = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette notification ?")) {
      return;
    }
    
    try {
      const tokenCookie = Cookies.get("authTokens");
      if (!tokenCookie) return;
      
      const tokenData = JSON.parse(tokenCookie);
      const accessToken = tokenData.access;
      
      const response = await fetch(
        `https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/sys-gestion/notifications/delete/${id}/`, 
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }
      
      // Retirer la notification localement
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      alert("Erreur lors de la suppression de la notification");
    }
  };

  // Formater la date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="received">
        <TabsList>
          <TabsTrigger value="received">Notifications reçues</TabsTrigger>
          <TabsTrigger value="sent">Historique</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>
        
        <TabsContent value="received" activeTab="received">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Notifications reçues</h2>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition-colors"
                onClick={fetchNotifications}
              >
                Actualiser
              </button>
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
              notifications.map(notification => (
                <div key={notification.id} className={`p-4 border rounded-lg ${notification.read ? 'bg-white' : 'bg-blue-50'}`}>
                  <div className="flex justify-between">
                    <h3 className="font-medium">{notification.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      notification.type === 'info' ? 'bg-blue-100 text-blue-800' : 
                      notification.type === 'success' ? 'bg-green-100 text-green-800' : 
                      notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {notification.type}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-600">{notification.message}</p>
                  {notification.sender && (
                    <p className="mt-1 text-xs text-gray-500">
                      De: {notification.sender}
                    </p>
                  )}
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-sm text-gray-500">{formatDate(notification.created_at)}</span>
                    <div className="space-x-2">
                      {!notification.read && (
                        <button 
                          className="px-3 py-1 border rounded text-sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Marquer comme lu
                        </button>
                      )}
                      <button 
                        className="px-3 py-1 border rounded text-sm text-red-500"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="sent" activeTab="received">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">L&apos;historique des notifications</h2>
            </div>
            
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">L&apos;historique des notifications sera disponible prochainement</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" activeTab="received">
          <h2 className="text-xl font-bold mb-4">Paramètres de notification</h2>
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
              <div>
                <h3 className="font-medium">Notifications par email</h3>
                <p className="text-sm text-gray-500">Recevoir des emails pour les notifications importantes</p>
              </div>
              <div className="relative inline-block w-12 h-6 rounded-full bg-gray-200 cursor-pointer">
                <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all"></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
              <div>
                <h3 className="font-medium">Notifications dans l&apos;application</h3>
                <p className="text-sm text-gray-500">Afficher les notifications dans l&apos;interface</p>
              </div>
              <div className="relative inline-block w-12 h-6 rounded-full bg-blue-600 cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all"></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg bg-white shadow-sm">
              <div>
                <h3 className="font-medium">Fréquence des résumés</h3>
                <p className="text-sm text-gray-500">Réception des résumés de notifications</p>
              </div>
              <select className="px-3 py-2 border rounded-md">
                <option value="daily">Quotidien</option>
                <option value="weekly">Hebdomadaire</option>
                <option value="never">Jamais</option>
              </select>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };