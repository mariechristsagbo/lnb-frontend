"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import Cookies from "js-cookie";

// Modifiez l'interface User pour correspondre au format de l'API
interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  username: string;
}

interface GroupFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
  bio: string;
  adresse: string;
  group_type: string;
  department: string;
  function: string;
  project: string;
  auto_assign: boolean;
  role_id: number;
  photo: string;
  created_by: number;
}

interface SubgroupFormData {
  parent_group_id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  bio: string;
  adresse: string;
  department: string;
  function: string;
  project: string;
  photo: string;
}

interface DialogState {
  isOpen: boolean;
  type: 'fragment' | 'remove' | 'link' | 'merge' | 'view' | null;
}

interface ParentGroup {
  id: number;
  name: string;
  // autres propriétés si nécessaire
}

export default function CreateGroupPage() {
  const router = useRouter();
  const [isSubgroup, setIsSubgroup] = useState(false);
  const [formData, setFormData] = useState<GroupFormData>({
    name: "",
    email: "",
    phone: "",
    role: "",
    bio: "",
    adresse: "",
    group_type: "",
    department: "",
    function: "",
    project: "",
    auto_assign: false,
    role_id: 0,
    photo: "",
    created_by: 0
  });
  
  const [subgroupData, setSubgroupData] = useState<SubgroupFormData>({
    parent_group_id: 0,
    name: "",
    email: "",
    phone: "",
    role: "",
    bio: "",
    adresse: "",
    department: "",
    function: "",
    project: "",
    photo: ""
  });

  // Préfixer les états non utilisés avec _
  const [_dialogState, _setDialogState] = useState<DialogState>({
    isOpen: false,
    type: null
  });

  // États pour la gestion des groupes
  const [_selectedGroup, _setSelectedGroup] = useState<number>(0);
  const [_selectedSubgroup, _setSelectedSubgroup] = useState<number>(0);
  const [_subgroups, _setSubgroups] = useState<number[][]>([[]]);
  const [_membersToRemove, _setMembersToRemove] = useState<number[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [parentGroups, setParentGroups] = useState<ParentGroup[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  // Charger les groupes parents pour le sous-groupe
  useEffect(() => {
    const fetchParentGroups = async () => {
      const token = Cookies.get('authTokens');
      if (!token) {
        setError("Non authentifié");
        return;
      }

      try {
        const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/utilisateurs_groupes/list-groups/", {
          headers: {
            "Authorization": `Bearer ${JSON.parse(token).access}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        
        // Vérification que data est un tableau
        if (Array.isArray(data)) {
          console.log("Groupes parents chargés:", data); // Pour le débogage
          setParentGroups(data);
        } else {
          console.error("Format de données inattendu:", data);
          setParentGroups([]); // Initialise avec un tableau vide en cas d'erreur
          setError("Format de données incorrect pour les groupes parents");
        }
      } catch (error) {
        console.error("Erreur lors du chargement des groupes parents:", error);
        setParentGroups([]); // Initialise avec un tableau vide en cas d'erreur
        setError("Impossible de charger la liste des groupes parents");
      }
    };

    if (isSubgroup) {
      fetchParentGroups();
    }
  }, [isSubgroup]);

  // Modifiez la partie du useEffect qui charge les utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      const token = Cookies.get('authTokens');
      if (!token) {
        setError("Non authentifié");
        return;
      }
  
      try {
        const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/list-all-users/", {
          headers: {
            "Authorization": `Bearer ${JSON.parse(token).access}`,
          },
        });
        
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
  
        const data = await response.json();
        if (data && data.utilisateurs) {
          console.log("Utilisateurs chargés:", data.utilisateurs); // Pour le débogage
          setAvailableUsers(data.utilisateurs);
        } else {
          console.error("Format de données inattendu:", data);
          setError("Format de données incorrect");
        }
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs:", error);
        setError("Impossible de charger la liste des utilisateurs");
      }
    };
  
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const token = Cookies.get('authTokens');
    if (!token) {
      setError("Non authentifié");
      setIsLoading(false);
      return;
    }

    const accessToken = JSON.parse(token).access;
    try {
      const url = isSubgroup
        ? "https://www.backend.lnb-intranet.globalitnet.org/utilisateurs_groupes/create-subgroup/"
        : "https://www.backend.lnb-intranet.globalitnet.org/utilisateurs_groupes/create-group/";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(isSubgroup ? subgroupData : formData),
      });

      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

      const newGroup = await response.json();

      // Si des utilisateurs ont été sélectionnés, les ajouter au groupe
      if (selectedUsers.length > 0) {
        await fetch(`https://www.backend.lnb-intranet.globalitnet.org/utilisateurs_groupes/add-members-to-group/${newGroup.id}/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ member_ids: selectedUsers }),
        });
      }

      router.push("/users-groupes");
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      setError("Erreur lors de la création du groupe");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <ComponentCard title={isSubgroup ? "Créer un sous-groupe" : "Créer un groupe"}>
          <div className="mb-8 space-y-4">
            {/* Bouton principal pour basculer entre groupe/sous-groupe */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setIsSubgroup(!isSubgroup)}
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
              >
                {isSubgroup ? "Créer un groupe principal" : "Créer un sous-groupe"}
              </button>

              {/* Barre d'outils avancée */}
              <div className="flex gap-2">
                <div className="relative group">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400"
                  >
                    Actions avancées
                    <span className="ml-2">▼</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-2 space-y-1">
                      <button
                        type="button"
                        onClick={() => {/* Logique pour fragmenter */}}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M2 7v8a2 2 0 002 2h2m12-12v8a2 2 0 01-2 2h-2" />
                        </svg>
                        Fragmenter le groupe
                      </button>

                      <button
                        type="button"
                        onClick={() => {/* Logique pour fusionner */}}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M16 7v8a2 2 0 01-2 2h-6" />
                        </svg>
                        Fusionner des groupes
                      </button>

                      <button
                        type="button"
                        onClick={() => {/* Logique pour lier */}}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 10-5.656-5.656l-1.102 1.101" />
                        </svg>
                        Lier des groupes
                      </button>

                      <button
                        type="button"
                        onClick={() => {/* Logique pour l'assignation auto */}}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Assignation automatique
                      </button>

                      <hr className="my-2 border-gray-200 dark:border-gray-700" />

                      <button
                        type="button"
                        onClick={() => {/* Logique pour retirer des membres */}}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                        </svg>
                        Retirer des membres
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bouton aide */}
                <button
                  type="button"
                  onClick={() => {/* Logique pour afficher l'aide */}}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Bandeau d'information si besoin */}
            {isSubgroup && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Vous créez un sous-groupe. Celui-ci sera rattaché au groupe parent sélectionné.
                </p>
              </div>
            )}
          </div>

          <div className="mb-6">
            <button
              onClick={() => setIsSubgroup(!isSubgroup)}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
            >
              {isSubgroup ? "Créer un groupe principal" : "Créer un sous-groupe"}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSubgroup && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Groupe parent *
                </label>
                <select
                  value={subgroupData.parent_group_id}
                  onChange={(e) => setSubgroupData({ ...subgroupData, parent_group_id: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                >
                  <option value="">Sélectionnez un groupe parent</option>
                  {Array.isArray(parentGroups) && parentGroups.length > 0 ? (
                    parentGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Aucun groupe parent disponible</option>
                  )}
                </select>
              </div>
            )}

            {/* Informations générales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  value={isSubgroup ? subgroupData.name : formData.name}
                  onChange={(e) => isSubgroup 
                    ? setSubgroupData({ ...subgroupData, name: e.target.value })
                    : setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={isSubgroup ? subgroupData.email : formData.email}
                  onChange={(e) => isSubgroup
                    ? setSubgroupData({ ...subgroupData, email: e.target.value })
                    : setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            {/* Autres champs du formulaire */}
            {/* ... Ajoutez les autres champs nécessaires ... */}

            {/* Sélection des membres */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Membres
              </label>
              {/* Modifiez la partie d'affichage des membres */}
              <div className="border border-gray-300 rounded-lg p-4 dark:border-gray-600">
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableUsers && availableUsers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {availableUsers.map((user) => (
                        <div key={user.id} className="flex items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                          <input
                            type="checkbox"
                            id={`user-${user.id}`}
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                              }
                            }}
                            className="rounded border-gray-300 dark:border-gray-600"
                          />
                          <label 
                            htmlFor={`user-${user.id}`} 
                            className="ml-2 text-sm text-gray-700 dark:text-gray-200 flex-1 cursor-pointer"
                          >
                            {user.prenom} {user.nom}
                            <span className="block text-xs text-gray-500 dark:text-gray-400">
                              @{user.username} • {user.email}
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                      Aucun utilisateur disponible
                    </div>
                  )}
                </div>
                {selectedUsers.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {selectedUsers.length} utilisateur{selectedUsers.length > 1 ? 's' : ''} sélectionné{selectedUsers.length > 1 ? 's' : ''}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.push("/users-groupes")}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Création en cours..." : "Créer"}
              </button>
            </div>
          </form>
        </ComponentCard>
      </div>
    </div>
  );
}