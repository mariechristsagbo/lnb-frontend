"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import Cookies from "js-cookie";
import { groupService, userService, role } from "../apiService/groupService";

// Modifiez l'interface User pour correspondre au format de l'API

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  username: string;
}
interface GroupFormData {
  name: string;           // *
  email: string;          // *
  phone: string;          // *
  role: string;           
  bio: string;            // *
  adresse: string;        // * (ville uniquement)
  group_type: string;     // * (logique ou physique)
  department: string;     
  function: string;       
  project: string;        
  auto_assign: boolean;   
  role_id: number;        
  photo: File | string;   
  created_by: number;     
}

interface SubgroupFormData {
  parent_group_id: number;  // *
  name: string;            // *
  email: string;           // *
  phone: string;           // *
  role: string;            
  bio: string;             // *
  adresse: string;         // * (ville uniquement)
  department: string;      
  function: string;        
  project: string;         
  photo: File | string;    
  created_by: number;      // ID de l'utilisateur qui crée le sous-groupe
  role_id: number;
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
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState<GroupFormData>({
    name: "",
    email: "",
    phone: "",
    role: "",
    bio: "",
    adresse: "",
    group_type: "logique", // Valeur par défaut
    department: "",
    function: "",
    project: "",
    auto_assign: false,
    role_id: 1, // Valeur par défaut
    photo: "",
    created_by: 1 // À remplacer par l'ID de l'utilisateur connecté
  });
  
  const [subgroupData, setSubgroupData] = useState<SubgroupFormData>({
    parent_group_id: 0, // Sera mis à jour lors de la sélection du groupe parent
    name: "",
    email: "",
    phone: "",
    role: "",
    bio: "",
    adresse: "",
    department: "",
    function: "",
    project: "",
    photo: "",
    created_by: 0,
    role_id: 1,
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
  const [departments, setDepartments] = useState<Array<{id: number, name: string}>>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [hierarchy_levels, setHierarchy_levels] = useState<any[]>([]);

  const  baseUrl = 'https://www.backend.lnb-intranet.globalitnet.org/utilisateurs_groupes/'

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
      try {
        const data = await userService.getAllUsers();
        setAvailableUsers(data.utilisateurs);
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs:", error);
        setError("Impossible de charger la liste des utilisateurs");
      }
    };
    fetchUsers();
  }, []);

  //  useEffect(() => {
  //     async function fetchDepartments() {
  //       try {
  //         const data = await userService.getDepartments();
  //         setDepartments(data.departments);
  //       } catch (error) {
  //         console.error("Erreur lors du chargement des départements:", error);
  //         setError("Impossible de charger les départements");
  //       }
  //     }


  //     fetchDepartments();
  //   }, []);

    useEffect(() => {
      const fetchUserProfile = async () => {
        try {
          const userProfile = await userService.getUserProfile();
          console.log("Profil utilisateur chargé:", userProfile);
          
          // Stocker l'ID de l'utilisateur dans l'état
          setCurrentUserId(userProfile.utilisateur.id);
          console.log("ID de l'utilisateur 1:", userProfile.utilisateur.id), console.log("ID de l'utilisateur:", currentUserId);
        } catch (error) {
          console.error("Erreur lors du chargement du profil de l'utilisateur:", error);
          setError("Impossible de charger le profil de l'utilisateur");
        }
      };
      fetchUserProfile();
    }, []);

    useEffect(() => {
      const fetchRoles = async () => {
        try {
          const data = await role();
          console.log("Rôles chargés:", data);
          setDepartments(data?.departments);
          setRoles(data.roles);
          setHierarchy_levels(data.hierarchy_levels);
        } catch (error) {
          console.error("Erreur lors du chargement des rôles:", error);
          setError("Impossible de charger les rôles");
        }
      }
      fetchRoles();
    }, []);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
  
    try {
      if (!currentUserId) {
        throw new Error("ID utilisateur non disponible");
      }

      // Préparer les données pour l'envoi
      const formDataToSend = new FormData();
      
      // Créer une copie des données du formulaire et s'assurer que created_by est défini
      const formDataCopy = { ...formData, created_by: currentUserId };
      const subgroupDataCopy = { ...subgroupData, created_by: currentUserId };
      
      // Sélectionner les données à utiliser
      const data = isSubgroup ? subgroupDataCopy : formDataCopy;

      console.log("Données à envoyer:", data);
      
      // Ajouter tous les champs au FormData
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          // Convertir les booléens en chaînes
          const finalValue = typeof value === 'boolean' ? String(value) : value;
          formDataToSend.append(key, finalValue instanceof File ? finalValue : String(finalValue));
        }
      });
      
      // S'assurer que created_by est bien dans le FormData
      if (!formDataToSend.has('created_by')) {
        formDataToSend.append('created_by', String(currentUserId));
      }
      
      // Vérification finale du FormData
      console.log("=== VÉRIFICATION FORMDATA ===");
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ': ', pair[1]);
      }
  
      // Utiliser le service approprié pour créer le groupe ou sous-groupe
      const createAction = isSubgroup 
        ? groupService.createSubgroup
        : groupService.createGroup;
  
      const { id: groupId } = await createAction(formDataToSend);
  
      // Si des utilisateurs ont été sélectionnés, les ajouter au groupe
      if (selectedUsers.length > 0) {
        try {
          await groupService.addGroupMembers(groupId, selectedUsers);
        } catch (addMemberError) {
          console.error("Erreur lors de l'ajout des membres:", addMemberError);
          // On continue même si l'ajout des membres échoue, car le groupe a été créé
        }
      }
  
      // Afficher un message de succès
      alert(isSubgroup ? "Sous-groupe créé avec succès!" : "Groupe créé avec succès!");
      
      // Rediriger vers la liste des groupes
      router.push('/utilisateurs/users-groupes');
      
    } catch (error) {
      console.error("Erreur lors de la création du groupe:", error);
      setError(error instanceof Error ? error.message : "Une erreur inconnue est survenue");
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

          {/* <div className="mb-6">
            <button
              onClick={() => setIsSubgroup(!isSubgroup)}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400"
            >
              {isSubgroup ? "Créer un groupe principal" : "Créer un sous-groupe"}
            </button>
          </div> */}

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
                  onChange={(e) => setSubgroupData(prev => ({ ...prev, parent_group_id: Number(e.target.value) }))}
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
                    ? setSubgroupData(prev => ({ ...prev, name: e.target.value }))
                    : setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  placeholder="Nom du groupe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={isSubgroup ? subgroupData.email : formData.email}
                  onChange={(e) => isSubgroup
                    ? setSubgroupData(prev => ({ ...prev, email: e.target.value }))
                    : setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  placeholder="email@groupe.com"
                />
              </div>
            </div>

            {/* Champs supplémentaires */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  value={isSubgroup ? subgroupData.phone : formData.phone}
                  onChange={(e) => isSubgroup
                    ? setSubgroupData(prev => ({ ...prev, phone: e.target.value }))
                    : setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  placeholder="+33 1 23 45 67 89"
                />
              </div>

              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Rôle
                </label>
                <select
                  value={isSubgroup ? subgroupData.role_id : formData.role_id}
                  onChange={(e) => isSubgroup
                    ? setSubgroupData(prev => ({ ...prev, role_id: Number(e.target.value) }))
                    : setFormData({ ...formData, role_id: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Sélectionnez un rôle</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

            
              {!isSubgroup && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Type de groupe *
                  </label>
                  <select
                    value={formData.group_type}
                    onChange={(e) => setFormData({ ...formData, group_type: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  >
                    <option value="logique">Logique</option>
                    <option value="physique">Physique</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Département
                </label>
                <select
                  value={isSubgroup ? subgroupData.department : formData.department}
                  onChange={(e) => isSubgroup
                    ? setSubgroupData(prev => ({ ...prev, department: e.target.value }))
                    : setFormData({ ...formData, department: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Sélectionnez un département</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Fonction
                </label>
                <select
                  value={isSubgroup ? subgroupData.function : formData.function}
                  onChange={(e) => isSubgroup
                    ? setSubgroupData(prev => ({ ...prev, function: e.target.value }))
                    : setFormData({ ...formData, function: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="">Sélectionnez une fonction</option>
                  {hierarchy_levels.map((fonction) => (
                    <option key={fonction.id} value={fonction.id}>
                      {fonction.name}
                    </option>
                  ))}
                </select>
              </div>
             
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Projet
                </label>
                <input
                  type="text"
                  value={isSubgroup ? subgroupData.project : formData.project}
                  onChange={(e) => isSubgroup
                    ? setSubgroupData(prev => ({ ...prev, project: e.target.value }))
                    : setFormData({ ...formData, project: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Nom du projet"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Bio *
                </label>
                <textarea
                  value={isSubgroup ? subgroupData.bio : formData.bio}
                  onChange={(e) => isSubgroup
                    ? setSubgroupData(prev => ({ ...prev, bio: e.target.value }))
                    : setFormData({ ...formData, bio: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={3}
                  required
                  placeholder="Description du groupe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Photo du groupe
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (isSubgroup) {
                          setSubgroupData(prev => ({ ...prev, photo: file }));
                        } else {
                          setFormData({ ...formData, photo: file });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>

              {!isSubgroup && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="auto_assign"
                    checked={formData.auto_assign}
                    onChange={(e) => setFormData({ ...formData, auto_assign: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="auto_assign" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Attribution automatique des utilisateurs
                  </label>
                </div>
              )}
            </div>

            {/* Champs cachés avec valeurs par défaut */}
            <input type="hidden" name="role_id" value={formData.role_id} />
            <input type="hidden" name="created_by" value={formData.created_by} />

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