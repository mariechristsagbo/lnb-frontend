import React, { useState, ReactNode } from 'react';

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

const Tabs: React.FC<TabsProps> = ({ defaultValue, children, className }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <div className={`tabs-container ${className || ''}`}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          if (child.type === TabsContent) {
            return React.cloneElement(child as React.ReactElement<TabsContentProps>, { activeTab });
          } else if (child.type === TabsList) {
            return React.cloneElement(child, {
              ...React.Children.map((child as React.ReactElement<TabsListProps>).props.children, (tabTrigger: React.ReactNode) => {
                if (React.isValidElement<TabsTriggerProps>(tabTrigger) && tabTrigger.type === TabsTrigger) {
                  return React.cloneElement(tabTrigger as React.ReactElement<TabsTriggerProps>, {
                    onClick: () => setActiveTab(tabTrigger.props.value),
                  });
                }
                return tabTrigger;
              }),
            });
          }
          return child;
        }
        return child;
      })}
    </div>
  );
};

const TabsList: React.FC<TabsListProps> = ({ children, className }) => {
  return <div className={`tabs-list flex space-x-2 border-b mb-4 ${className || ''}`}>{children}</div>;
};

const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, className, onClick }) => {
  return (
    <button 
      className={`tabs-trigger px-4 py-2 ${className || ''}`}
      onClick={onClick}
      data-value={value} // Ajout de l'attribut data pour utiliser value
      aria-selected={false} // Amélioration de l'accessibilité
      role="tab"
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

// Données fictives pour les notifications
const notifications = [
  { id: 1, title: "Mise à jour système", message: "Une mise à jour du système est prévue pour demain à 22h00.", type: "info", date: "2023-03-21", sent: true },
  { id: 2, title: "Nouvelle fonctionnalité", message: "Le module de rapports avancés est maintenant disponible.", type: "success", date: "2023-03-20", sent: true },
];

// Composant NotificationsPanel qui utilise les composants Tabs
export const NotificationsPanel: React.FC = () => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="notifications">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
          <TabsTrigger value="templates">Modèles</TabsTrigger>
        </TabsList>
        
        <TabsContent value="notifications" activeTab="notifications">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Gestion des notifications</h2>
              <button className="px-4 py-2 bg-primary text-white rounded">
                Nouvelle notification
              </button>
            </div>
            
            {notifications.map(notification => (
              <div key={notification.id} className="p-4 border rounded-lg">
                <div className="flex justify-between">
                  <h3 className="font-medium">{notification.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    notification.type === 'info' ? 'bg-blue-100 text-blue-800' : 
                    notification.type === 'success' ? 'bg-green-100 text-green-800' : 
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {notification.type}
                  </span>
                </div>
                <p className="mt-2 text-gray-600">{notification.message}</p>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-gray-500">{notification.date}</span>
                  <div className="space-x-2">
                    <button className="px-3 py-1 border rounded text-sm">Modifier</button>
                    <button className="px-3 py-1 border rounded text-sm text-red-500">Supprimer</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="settings" activeTab="notifications">
          <h2 className="text-xl font-bold mb-4">Paramètres de notification</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Notifications par email</h3>
                <p className="text-sm text-gray-500">Envoyer des emails en plus des notifications</p>
              </div>
              <div className="relative inline-block w-12 h-6 rounded-full bg-gray-200">
                <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white"></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Notifications push</h3>
                <p className="text-sm text-gray-500">Envoyer des notifications push aux appareils</p>
              </div>
              <div className="relative inline-block w-12 h-6 rounded-full bg-blue-600">
                <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white"></div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="templates" activeTab="notifications">
          <h2 className="text-xl font-bold mb-4">Modèles de notification</h2>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Notification de bienvenue</h3>
              <p className="mt-2 text-gray-600">Bienvenue sur notre plateforme! Nous sommes ravis de vous avoir parmi nous.</p>
              <div className="mt-4 flex justify-end space-x-2">
                <button className="px-3 py-1 border rounded text-sm">Modifier</button>
                <button className="px-3 py-1 border rounded text-sm">Utiliser</button>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium">Alerte de maintenance</h3>
              <p className="mt-2 text-gray-600">Une maintenance est prévue le [DATE] à [HEURE]. Le service sera indisponible pendant cette période.</p>
              <div className="mt-4 flex justify-end space-x-2">
                <button className="px-3 py-1 border rounded text-sm">Modifier</button>
                <button className="px-3 py-1 border rounded text-sm">Utiliser</button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };