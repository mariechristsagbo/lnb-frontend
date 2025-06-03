"use client";

// Suppression de l'import non utilisé de Image
import React, { useEffect, useState } from "react";
import Link from 'next/link';
import Image from 'next/image'; // On garde l'import car on va l'utiliser
import { PlusIcon, PencilIcon, TrashBinIcon, UserIcon as SearchIcon } from "@/icons";
import Cookies from 'js-cookie';

// Types spécifiques pour remplacer any
interface Department {
  id: number;
  name: string;
}

interface Service {
  id: number;
  name: string;
}

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  username: string;
  telephone: string;
  adresse: string;
  date_naissance: string;
  lieu_naissance: string;
  statut: string;
  photo_profil: string | null;
  is_deleted: boolean;
  language: string;
  timezone: string;
  departement: Department | null;
  service: Service | null;
  role: string;
  position_ip: {
    ip: string;
    bogon: boolean;
  };
  is_superuser?: boolean;
  is_staff?: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: keyof User, direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [userListForSuperior, setUserListForSuperior] = useState<User[]>([]);
  const [showSuperiorModal, setShowSuperiorModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedSuperior, setSelectedSuperior] = useState<number | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const token = Cookies.get('authTokens');
      if (!token) {
        setError("Non authentifié");
        setLoading(false);
        return;
      }

      const accessToken = JSON.parse(token).access;
      try {
        const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/list-all-users/", {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        
        const data = await response.json();
        setUsers(data.utilisateurs || []);
      } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs:", error);
        setError("Impossible de charger les utilisateurs.");
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const handleDeleteUsers = async (userIds: number[]) => {
    const token = Cookies.get('authTokens');
    if (!token) {
      setError("Non authentifié");
      return;
    }

    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ces utilisateurs ?")) {
      return;
    }

    const accessToken = JSON.parse(token).access;
    try {
      const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/delete-users/", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ user_ids: userIds }),
      });

      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

      setUsers(prev => prev.filter(user => !userIds.includes(user.id)));
      setSelectedUsers([]);
      setNotification({ 
        type: "success", 
        message: userIds.length > 1 
          ? `${userIds.length} utilisateurs supprimés avec succès.` 
          : "Utilisateur supprimé avec succès."
      });
      
      // Masquer la notification après 3 secondes
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setNotification({ type: "error", message: "Impossible de supprimer les utilisateurs." });
    }
  };

  const handleSort = (key: keyof User) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filtrer les utilisateurs en fonction de la recherche
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      user.nom.toLowerCase().includes(searchLower) ||
      user.prenom.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower) ||
      user.username.toLowerCase().includes(searchLower) ||
      (user.role && user.role.toLowerCase().includes(searchLower)) ||
      (user.departement?.name && user.departement.name.toLowerCase().includes(searchLower)) ||
      (user.service?.name && user.service.name.toLowerCase().includes(searchLower))
    );
  });

  // Trier les utilisateurs
  const sortedUsers = React.useMemo(() => {
    const sortableUsers = [...filteredUsers];
    if (sortConfig !== null) {
      sortableUsers.sort((a, b) => {
        // Gestion des valeurs nulles ou undefined
        if (a === null || a === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
        if (b === null || b === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
        
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === null || aValue === undefined) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue === null || bValue === undefined) return sortConfig.direction === 'asc' ? 1 : -1;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableUsers;
  }, [filteredUsers, sortConfig]);

  // Paginer les utilisateurs
  const paginatedUsers = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedUsers, currentPage, itemsPerPage]);

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

  // Générer les numéros de page pour la pagination
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const handleSetSuperior = async () => {
    if (!selectedUser || !selectedSuperior) {
      setNotification({ type: "error", message: "Veuillez sélectionner un utilisateur et un supérieur" });
      return;
    }

    setModalLoading(true);
    const token = Cookies.get('authTokens');
    if (!token) {
      setError("Non authentifié");
      setModalLoading(false);
      return;
    }

    const accessToken = JSON.parse(token).access;
    try {
      const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/set-superieur/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          user_id: selectedUser,
          superieur_id: selectedSuperior
        }),
      });

      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

      setNotification({ type: "success", message: "Supérieur assigné avec succès" });
      setShowSuperiorModal(false);
      
      // Rafraîchir la liste des utilisateurs pour afficher les changements
      // Vous pourriez vouloir recharger les données ici
    } catch (error) {
      console.error("Erreur lors de l'assignation du supérieur:", error);
      setNotification({ type: "error", message: "Impossible d'assigner le supérieur" });
    } finally {
      setModalLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleSoftDeleteUser = async (userId: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir désactiver cet utilisateur ?")) {
      return;
    }

    const token = Cookies.get('authTokens');
    if (!token) {
      setError("Non authentifié");
      return;
    }

    const accessToken = JSON.parse(token).access;
    try {
      const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/soft-delete-user/", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

      // Mettre à jour l'état local pour refléter le changement
      setUsers(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, is_deleted: true } : user
        )
      );
      
      setNotification({ type: "success", message: "Utilisateur désactivé avec succès" });
    } catch (error) {
      console.error("Erreur lors de la désactivation:", error);
      setNotification({ type: "error", message: "Impossible de désactiver l'utilisateur" });
    }

    setTimeout(() => setNotification(null), 3000);
  };

  const handleRestoreUser = async (userId: number) => {
    const token = Cookies.get('authTokens');
    if (!token) {
      setError("Non authentifié");
      return;
    }

    const accessToken = JSON.parse(token).access;
    try {
      const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/restore-user/", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

      // Mettre à jour l'état local pour refléter le changement
      setUsers(prev => 
        prev.map(user => 
          user.id === userId ? { ...user, is_deleted: false } : user
        )
      );
      
      setNotification({ type: "success", message: "Utilisateur réactivé avec succès" });
    } catch (error) {
      console.error("Erreur lors de la réactivation:", error);
      setNotification({ type: "error", message: "Impossible de réactiver l'utilisateur" });
    }

    setTimeout(() => setNotification(null), 3000);
  };

  const _handleDeleteUserPermanently = async (userId: number) => {
    if (!window.confirm("ATTENTION: Vous êtes sur le point de supprimer définitivement cet utilisateur. Cette action est irréversible. Voulez-vous continuer ?")) {
      return;
    }

    const token = Cookies.get('authTokens');
    if (!token) {
      setError("Non authentifié");
      return;
    }

    const accessToken = JSON.parse(token).access;
    try {
      const response = await fetch(`https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/delete-user/${userId}/`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

      // Supprimer l'utilisateur de l'état local
      setUsers(prev => prev.filter(user => user.id !== userId));
      
      setNotification({ type: "success", message: "Utilisateur supprimé définitivement" });
    } catch (error) {
      console.error("Erreur lors de la suppression définitive:", error);
      setNotification({ type: "error", message: "Impossible de supprimer définitivement l'utilisateur" });
    }

    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleSuperuser = async (userIds: number[]) => {
    const token = Cookies.get('authTokens');
    if (!token) {
      setError("Non authentifié");
      return;
    }
  
    if (!window.confirm(`Êtes-vous sûr de vouloir modifier les droits superuser pour ${userIds.length} utilisateur(s) ?`)) {
      return;
    }
  
    const accessToken = JSON.parse(token).access;
    try {
      // Traiter chaque utilisateur sélectionné
      const results = await Promise.all(userIds.map(async (userId) => {
        const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/toggle-superuser/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            user_id: userId,
            is_superuser: true,
            is_staff: true
          }),
        });
  
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
  
        return userId;
      }));
  
      // Mise à jour de l'état local des utilisateurs
      setUsers(prev => prev.map(user => {
        if (results.includes(user.id)) {
          return {
            ...user,
            is_superuser: true,
            is_staff: true
          };
        }
        return user;
      }));
  
      // Message de succès
      setNotification({
        type: "success",
        message: `Les droits superuser ont été accordés à ${results.length} utilisateur${results.length > 1 ? 's' : ''}`
      });
  
      // Réinitialiser la sélection
      setSelectedUsers([]);
      
      // Masquer la notification après 3 secondes
      setTimeout(() => setNotification(null), 3000);
      
    } catch (error) {
      console.error("Erreur lors de la modification des droits superuser:", error);
      setNotification({
        type: "error",
        message: "Erreur lors de la modification des droits superuser"
      });
    }
  };

  const openSuperiorModal = (userId: number) => {
    setSelectedUser(userId);
    setSelectedSuperior(null);
    // Récupérer la liste des utilisateurs actifs qui pourraient être supérieurs
    setUserListForSuperior(users.filter(u => !u.is_deleted && u.id !== userId));
    setShowSuperiorModal(true);
  };

  return (
    <>
      <style jsx>{`
        .table-container {
          overflow-x: auto;
          max-width: 100%;
        }
        
        .responsive-table {
          table-layout: fixed;
          width: 100%;
        }
        
        .truncate {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        
        @media (max-width: 1024px) {
          .hide-md {
            display: none;
          }
        }
        
        @media (max-width: 768px) {
          .hide-sm {
            display: none;
          }
        }
      `}</style>
      
      <div className="min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-lg px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
          {/* Notifications flottantes */}
          {error && (
            <div className="fixed top-4 right-4 z-50 p-4 min-w-[300px] text-white bg-red-600 rounded-lg shadow-lg text-center animate-fade-in flex items-center justify-between">
              <span>{error}</span>
              <button 
                onClick={() => setError(null)} 
                className="ml-4 text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          )}
          {notification && (
            <div className={`fixed top-4 right-4 z-50 p-4 min-w-[300px] rounded-lg shadow-lg text-center flex items-center justify-between ${
              notification.type === "success" 
                ? "bg-green-600 text-white" 
                : "bg-red-600 text-white"
            }`}>
              <span>{notification.message}</span>
              <button 
                onClick={() => setNotification(null)} 
                className="ml-4 text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          )}

          {/* Barre d'actions */}
          <div className="mb-8 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Utilisateurs
              </h1>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher un utilisateur..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Revenir à la première page lors d'une recherche
                  }}
                  className="pl-10 pr-4 py-2 w-72 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
                />
                <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ×
                  </button>
                )}
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {filteredUsers.length} {filteredUsers.length > 1 ? 'utilisateurs' : 'utilisateur'} trouvé{filteredUsers.length > 1 ? 's' : ''}
              </div>
            </div>

            <div className="flex gap-3">
              <Link href="/utilisateurs/users/add">
                <button className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 font-medium">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Nouvel utilisateur
                </button>
              </Link>
              
              {selectedUsers.length > 0 && (
                <>
                  <button
                    onClick={() => handleDeleteUsers(selectedUsers)}
                    className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors duration-200 font-medium"
                  >
                    <TrashBinIcon className="w-4 h-4 mr-2" />
                    Supprimer ({selectedUsers.length})
                  </button>
                  
                  {/* Nouveau bouton pour les droits superuser */}
                  <button
                    onClick={() => handleToggleSuperuser(selectedUsers)}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors duration-200 font-medium"
                  >
                    <svg 
                      className="w-4 h-4 mr-2" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                      />
                    </svg>
                    Droits Superuser ({selectedUsers.length})
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Table avec état de chargement */}
          <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="table-container">
              <table className="responsive-table divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="p-4 w-[5%] text-left">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          const currentPageIds = paginatedUsers.map(u => u.id);
                          if (e.target.checked) {
                            // Ajouter uniquement les utilisateurs de la page actuelle qui ne sont pas déjà sélectionnés
                            const newSelected = [...selectedUsers];
                            currentPageIds.forEach(id => {
                              if (!newSelected.includes(id)) {
                                newSelected.push(id);
                              }
                            });
                            setSelectedUsers(newSelected);
                          } else {
                            // Retirer uniquement les utilisateurs de la page actuelle
                            setSelectedUsers(selectedUsers.filter(id => !currentPageIds.includes(id)));
                          }
                        }}
                        checked={paginatedUsers.length > 0 && paginatedUsers.every(user => selectedUsers.includes(user.id))}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                      />
                    </th>
                    <th 
                      onClick={() => handleSort('nom')}
                      scope="col" 
                      className="px-6 py-3 w-[20%] text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center">
                        Utilisateur
                        {sortConfig?.key === 'nom' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('email')}
                      scope="col" 
                      className="px-6 py-3 w-[20%] text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center">
                        Email
                        {sortConfig?.key === 'email' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('telephone')}
                      scope="col" 
                      className="hide-sm px-6 py-3 w-[10%] text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center">
                        Téléphone
                        {sortConfig?.key === 'telephone' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('role')}
                      scope="col" 
                      className="px-6 py-3 w-[10%] text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center">
                        Rôle
                        {sortConfig?.key === 'role' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('is_deleted')}
                      scope="col" 
                      className="px-6 py-3 w-[10%] text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <div className="flex items-center">
                        Statut
                        {sortConfig?.key === 'is_deleted' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th scope="col" className="hide-md px-6 py-3 w-[10%] text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Département
                    </th>
                    <th scope="col" className="hide-sm px-6 py-3 w-[10%] text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Service
                    </th>
                    <th scope="col" className="px-6 py-3 w-[15%] text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-700">
                  {loading ? (
                    // État de chargement
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={`skeleton-${index}`} className="animate-pulse">
                        <td className="p-4"><div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                            <div className="ml-4">
                              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                              <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded mt-2"></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                        <td className="hide-sm px-6 py-4"><div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                        <td className="px-6 py-4"><div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div></td>
                        <td className="hide-md px-6 py-4"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                        <td className="hide-sm px-6 py-4"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        {searchQuery ? "Aucun utilisateur ne correspond à votre recherche" : "Aucun utilisateur trouvé"}
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => (
                      <tr 
                        key={user.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150"
                      >
                        <td className="p-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => {
                              const isSelected = selectedUsers.includes(user.id);
                              setSelectedUsers(
                                isSelected
                                  ? selectedUsers.filter(id => id !== user.id)
                                  : [...selectedUsers, user.id]
                              );
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {user.photo_profil ? (
                                <Image
                                  src={user.photo_profil}
                                  alt={`Photo de ${user.prenom}`}
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                    {user.prenom && user.prenom[0]}{user.nom && user.nom[0]}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.prenom} {user.nom}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                @{user.username}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 truncate text-sm text-gray-900 dark:text-gray-200">
                          {user.email}
                        </td>
                        <td className="hide-sm px-6 py-4 truncate text-sm text-gray-900 dark:text-gray-200">
                          {user.telephone || "—"}
                        </td>
                        <td className="px-6 py-4 truncate text-sm text-gray-900 dark:text-gray-200">
                          <div className="flex items-center">
                            {user.role || "—"}
                            {user.is_superuser && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                Superuser
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.is_deleted
                              ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                              : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          }`}>
                            {user.is_deleted ? "Inactif" : "Actif"}
                          </span>
                        </td>
                        <td className="hide-md px-6 py-4 truncate text-sm text-gray-900 dark:text-gray-200">
                          {user.departement?.name || "—"}
                        </td>
                        <td className="hide-sm px-6 py-4 truncate text-sm text-gray-900 dark:text-gray-200">
                          {user.service?.name || "—"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Link href={`/utilisateurs/users/${user.id}`}>
                              <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300" title="Voir les détails">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                            </Link>
                            <Link href={`/utilisateurs/users/edit/${user.id}`} className="hide-sm">
                              <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300" title="Modifier">
                                <PencilIcon className="w-5 h-5" />
                              </button>
                            </Link>
                            <button 
                              onClick={() => openSuperiorModal(user.id)}
                              className="hide-md text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300" 
                              title="Définir un supérieur"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </button>
                            {user.is_deleted ? (
                              <button 
                                onClick={() => handleRestoreUser(user.id)}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300" 
                                title="Réactiver l'utilisateur"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleSoftDeleteUser(user.id)}
                                className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300" 
                                title="Désactiver l'utilisateur"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6 mt-4">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  } dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600`}
                >
                  Précédent
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  } dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600`}
                >
                  Suivant
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Affichage de <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> à{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, sortedUsers.length)}
                    </span>{" "}
                    sur <span className="font-medium">{sortedUsers.length}</span> résultats
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                        currentPage === 1
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-500 hover:bg-gray-50"
                      } dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600`}
                    >
                      <span className="sr-only">Précédent</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Affichage intelligent des numéros de page */}
                    {totalPages <= 7 ? (
                      // Si moins de 7 pages, afficher toutes les pages
                      pageNumbers.map(number => (
                        <button
                          key={number}
                          onClick={() => setCurrentPage(number)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === number
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {number}
                        </button>
                      ))
                    ) : (
                      // Si plus de 7 pages, afficher stratégiquement
                      <>
                        {/* Toujours afficher la première page */}
                        <button
                          onClick={() => setCurrentPage(1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === 1
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
                          }`}
                        >
                          1
                        </button>
                        
                        {/* Ellipsis au début si nécessaire */}
                        {currentPage > 3 && (
                          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600">
                            ...
                          </span>
                        )}
                        
                        {/* Pages autour de la page courante */}
                        {pageNumbers
                          .filter(number => 
                            number !== 1 && 
                            number !== totalPages && 
                            Math.abs(currentPage - number) <= 1
                          )
                          .map(number => (
                            <button
                              key={number}
                              onClick={() => setCurrentPage(number)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === number
                                  ? "z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                                  : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
                              }`}
                            >
                              {number}
                            </button>
                          ))
                        }
                        
                        {/* Ellipsis à la fin si nécessaire */}
                        {currentPage < totalPages - 2 && (
                          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600">
                            ...
                          </span>
                        )}
                        
                        {/* Toujours afficher la dernière page */}
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === totalPages
                              ? "z-10 bg-blue-50 border-blue-500 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                              : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                        currentPage === totalPages
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white text-gray-500 hover:bg-gray-50"
                      } dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600`}
                    >
                      <span className="sr-only">Suivant</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10l3.293 3.293a1 1 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Modal */}
        {showSuperiorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Assigner un supérieur
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Sélectionner un supérieur
                </label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  value={selectedSuperior || ""}
                  onChange={(e) => setSelectedSuperior(Number(e.target.value) || null)}
                >
                  <option value="">-- Sélectionner un supérieur --</option>
                  {userListForSuperior.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.prenom} {user.nom} ({user.role || 'Aucun rôle'})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSuperiorModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSetSuperior}
                  disabled={modalLoading || !selectedSuperior}
                  className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                    modalLoading || !selectedSuperior 
                      ? "bg-blue-400 cursor-not-allowed" 
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {modalLoading ? "Traitement..." : "Confirmer"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}