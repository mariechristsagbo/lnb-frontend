"use client";
import Link from "next/link";
import React, { useState, useEffect, useCallback, useRef } from "react"; // Importer useRef
import { useRouter } from 'next/navigation';
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import Cookies from "js-cookie";
import { Bell, AlertCircle, MessageSquare, FileText, Info, Clock } from "lucide-react";

// URL de l'API pour les notifications
const API_URLS = {
  NOTIFICATIONS_RECEIVED: "https://www.backend.lnb-intranet.globalitnet.org/notifications/received/?limit=5",
  NOTIFICATIONS_COUNT: "https://www.backend.lnb-intranet.globalitnet.org/notifications/count/",
  NOTIFICATIONS_MARK_READ: "https://www.backend.lnb-intranet.globalitnet.org/notifications/mark-read/"
};

// Interface pour les notifications
interface Notification {
  id: string;
  recipient: number;
  sender: number;
  sender_details: {
    id: number;
    username: string;
    full_name: string;
    email: string;
  } | null;
  notification_type: number;
  notification_type_name: string;
  notification_type_code: string;
  notification_type_icon: string;
  notification_type_color: string;
  title: string;
  message: string;
  action_url: string | null;
  is_read: boolean;
  is_archived: boolean;
  is_system: boolean;
  created_at: string;
  time_since: string;
  channel: number;
  channel_name: string;
  channel_type: string;
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasNewNotifications, setHasNewNotifications] = useState(false); // Nouvel état pour l'indicateur
  const router = useRouter();
  const isInitialMount = useRef(true); // Pour suivre le montage initial

  // Fonction pour récupérer les headers avec le token - avec gestion d'erreur améliorée
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

  // Mémoriser fetchNotificationCount avec useCallback
  // Ajout d'un argument pour savoir si c'est un check périodique
  const fetchNotificationCount = useCallback(async (isPeriodicCheck = false) => {
    try {
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await fetch(API_URLS.NOTIFICATIONS_COUNT, { headers });
      if (response.ok) {
        const count = await response.json();
        const currentCount = notificationCount; // Sauvegarde la valeur actuelle avant mise à jour

        // Vérifie les nouvelles notifications seulement lors des checks périodiques
        // et si le dropdown est fermé et si le nouveau compte est supérieur à l'ancien
        if (isPeriodicCheck && !isOpen && count > currentCount) {
           setHasNewNotifications(true);
        }

        setNotificationCount(count);

        // Au chargement initial, ne pas montrer l'indicateur 'nouveau'
        if (isInitialMount.current) {
            setHasNewNotifications(false);
            isInitialMount.current = false;
        }

      }
    } catch (err) {
      console.error("Erreur lors de la récupération du nombre de notifications:", err);
    }
  // Ajout de isOpen et notificationCount aux dépendances
  }, [isOpen, notificationCount]); // notificationCount est nécessaire ici pour la comparaison

  // Fonction pour récupérer les notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = getAuthHeaders();
      if (!headers) {
        setError("Session expirée. Veuillez vous reconnecter.");
        setLoading(false);
        return;
      }

      const response = await fetch(API_URLS.NOTIFICATIONS_RECEIVED, { headers });
      if (!response.ok) {
        throw new Error(`Erreur: ${response.status}`);
      }

      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur lors de la récupération des notifications:", err);
      setError("Impossible de charger les notifications");
    } finally {
      setLoading(false);
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

      // Mettre à jour localement
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, is_read: true } : notif
        )
      );

      // Récupère le compte pour mettre à jour le numéro du badge immédiatement
      fetchNotificationCount(false); // false car ce n'est pas un check périodique
    } catch (err) {
      console.error("Erreur lors du marquage comme lu:", err);
    }
  };

  // Fonction pour basculer l'affichage du dropdown
  function toggleDropdown() {
    const nextIsOpen = !isOpen;
    if (nextIsOpen) {
      // Ouverture du dropdown
      fetchNotifications();
      setHasNewNotifications(false); // Marque les notifications comme vues lors de l'ouverture
    }
    setIsOpen(nextIsOpen);
  }

  // Fonction pour fermer le dropdown
  function closeDropdown() {
     if (isOpen) { // Agit seulement si c'est ouvert
        setIsOpen(false);
        // Pas besoin de changer hasNewNotifications ici, l'ouverture le fait déjà.
     }
  }

  // Fonction pour obtenir l'icône appropriée en fonction du type de notification
  const getNotificationIcon = (type: string | null) => {
    if (!type) return <Bell className="w-5 h-5 text-gray-500" />;
    
    switch (type.toLowerCase()) {
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'document':
        return <FileText className="w-5 h-5 text-green-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-purple-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  // Récupérer le compteur de notifications au chargement et périodiquement
  useEffect(() => {
    // Fetch initial
    fetchNotificationCount(false); // false pour le fetch initial

    // Intervalle pour les checks périodiques
    const interval = setInterval(() => {
      fetchNotificationCount(true); // true pour les checks périodiques
    }, 60000); // Toutes les 60 secondes

    // Nettoyage de l'intervalle au démontage
    return () => clearInterval(interval);
  }, [fetchNotificationCount]); // Dépend de la fonction mémoïsée

  return (
    <div className="relative">
      <button
        type="button"
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        onClick={toggleDropdown}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {notificationCount > 0 && ( // Affiche le badge seulement si count > 0
          <span className="absolute right-0 top-0.5 z-10 min-w-[1.25rem] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-xs px-1.5 font-semibold shadow">
            {notificationCount}
             {/* Affiche l'animation ping conditionnellement */}
            {hasNewNotifications && (
                <span className="absolute inline-flex w-full h-full bg-red-400 rounded-full opacity-75 animate-ping"></span>
            )}
          </span>
        )}
        <Bell className="h-5 w-5" />
      </button>

      {isOpen && (
        <Dropdown
          isOpen={isOpen}
          onClose={closeDropdown} // Utilise la fonction closeDropdown modifiée
          className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
            <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Notifications {notificationCount > 0 ? `(${notificationCount})` : ""}
            </h5>
            <button
              type="button"
              onClick={closeDropdown} // Utilise la fonction closeDropdown modifiée
              className="text-gray-500 transition dropdown-toggle dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
              aria-label="Fermer"
            >
              {/* Icône SVG */}
              <svg
                className="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>

          {/* Contenu principal scrollable */}
          <div className="flex-grow overflow-y-auto custom-scrollbar -mx-3 px-3">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8 px-4">
                <p className="text-red-500">{error}</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 px-4">
                <p className="text-gray-500">Aucune nouvelle notification</p>
              </div>
            ) : (
              <ul className="flex flex-col divide-y divide-gray-100 dark:divide-gray-800">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <DropdownItem
                      onItemClick={() => {
                        if (!notification.is_read) {
                          markAsRead(notification.id); // Marque comme lu si nécessaire
                        }
                        // Redirige TOUJOURS vers la page des notifications
                        router.push('../notifications/'); 
                        closeDropdown(); // Ferme le dropdown après l'action
                      }}
                      className={`flex gap-3 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-white/5 transition ${
                        !notification.is_read ? "bg-blue-50 dark:bg-blue-900/30" : "bg-white dark:bg-transparent"
                      }`}
                    >
                      {/* Icône */}
                       <div className="relative w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: notification.notification_type_color ? `${notification.notification_type_color}20` : '#f3f4f6' }}>
                        {getNotificationIcon(notification.notification_type_code)}
                        {!notification.is_read && (
                          <span className="absolute top-0 right-0 z-10 h-2.5 w-2.5 rounded-full border-[1.5px] border-white bg-blue-500 dark:border-gray-900"></span>
                        )}
                      </div>
                      {/* Contenu */}
                      <div className="flex-1 overflow-hidden">
                        <p className="mb-1 text-sm text-gray-800 font-medium dark:text-white/90 truncate">
                          {notification.title || "Notification"}
                        </p>
                        <p className="text-gray-500 text-sm dark:text-gray-400 line-clamp-2">
                          {notification.message || ""}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-gray-500 text-xs dark:text-gray-400">
                          {notification.notification_type_name && (
                            <>
                              <span className="truncate">{notification.notification_type_name}</span>
                              <span className="w-1 h-1 bg-gray-400 rounded-full flex-shrink-0"></span>
                            </>
                          )}
                          <span className="whitespace-nowrap">{notification.time_since || ""}</span>
                        </div>
                      </div>
                    </DropdownItem>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Pied de page */}
          <div className="pt-3 mt-auto border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
            <Link
              href="../notifications/"
              onClick={closeDropdown} // Utilise la fonction closeDropdown modifiée
              className="block px-4 py-2 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Voir toutes les notifications
            </Link>
          </div>
        </Dropdown>
      )}
    </div>
  );
}