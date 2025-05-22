import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Suppression des imports non utilisés
// import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
// import Button from "@/components/ui/button";
import axios from "axios";
import Cookies from "js-cookie";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Search, 
  Plus, 
  Users, 
  User, 
  Clock, 
  LogIn, 
  Edit, 
  FileText,
  Filter,
  AlertCircle 
} from "lucide-react";

// Types et interfaces
interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
  }>;
}

interface _LineChartProps {
  data: ChartData;
}

interface Department {
  id: number;
  name: string;
  description?: string;
}

interface Service {
  id: number;
  name: string;
  description?: string;
}

interface BackendUser {
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
  role: string | null;
  position_ip: {
    ip: string;
    bogon: boolean;
  };
}

interface LastLoginUser {
  user_id: number;
  nom: string;
  prenom: string;
  last_login: string | null;
  ip_address: string | null;
}

interface RecentUser {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  date_creation: string;
}

interface Activity {
  id: number;
  user: string;
  action: string;
  timestamp: string;
}

// Formatage des dates
const formatDate = (dateString: string | null) => {
  if (!dateString) return "Jamais connecté";
  
  try {
    const date = parseISO(dateString);
    return format(date, "dd MMM yyyy à HH:mm", { locale: fr });
  } catch (error) {
    console.error("Erreur lors du formatage de la date:", error);
    return "Date invalide";
  }
};

// Composant principal
const UserStatistics: React.FC = () => {
  // États
  const [selectedTab, setSelectedTab] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [_showAddUserModal, _setShowAddUserModal] = useState(false);
  
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [lastLogins, setLastLogins] = useState<LastLoginUser[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Données temporaires pour les activités
  const activities: Activity[] = [
    { id: 1, user: "SOUNON Josué", action: "A modifié un utilisateur", timestamp: "Aujourd'hui, 10:30" },
    { id: 2, user: "NONWANON Eudes", action: "S'est connecté", timestamp: "Hier, 15:45" },
    { id: 3, user: "SAIZONOU Oscar Modeste", action: "A créé un document", timestamp: "Il y a 3 jours" },
  ];

  // Récupération des données
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const tokenCookie = Cookies.get("authTokens");
        if (!tokenCookie) {
          setError("Session expirée. Veuillez vous reconnecter.");
          setLoading(false);
          return;
        }
        
        const tokenData = JSON.parse(tokenCookie);
        const accessToken = tokenData.access;
        
        // Récupération parallèle des données
        try {
          const [usersResponse, lastLoginsResponse, recentUsersResponse] = await Promise.all([
            axios.get("https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/list-all-users/", {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }),
            axios.get("https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/sys-gestion/last-logins/", {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            }),
            axios.get("https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/sys-gestion/recent-users/?days=7", {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            })
          ]);
          
          if (usersResponse.data && usersResponse.data.utilisateurs) {
            setUsers(usersResponse.data.utilisateurs);
          } else {
            throw new Error("Format de données incorrect");
          }
          
          setLastLogins(lastLoginsResponse.data);
          setRecentUsers(recentUsersResponse.data);
        } catch (apiError) {
          console.error("Erreur API:", apiError);
          setError("Une erreur est survenue lors de la récupération des données.");
        }
        
      } catch (error) {
        console.error("Erreur générale:", error);
        setError("Impossible de charger les données utilisateurs.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Fonctions utilitaires
  const getRoleBadgeColor = (role: string | null) => {
    if (!role) return "bg-gray-100 text-gray-700";
    
    if (role.toLowerCase().includes("directeur")) {
      return "bg-blue-50 text-blue-700";
    } else if (role.toLowerCase().includes("chef")) {
      return "bg-emerald-50 text-emerald-700";
    } else {
      return "bg-amber-50 text-amber-700";
    }
  };

  const getActionIcon = (action: string) => {
    if (action.toLowerCase().includes("modifié")) {
      return <Edit className="w-4 h-4 mr-2 text-blue-600" />;
    } else if (action.toLowerCase().includes("connecté")) {
      return <LogIn className="w-4 h-4 mr-2 text-green-600" />;
    } else if (action.toLowerCase().includes("créé")) {
      return <FileText className="w-4 h-4 mr-2 text-amber-600" />;
    } else {
      return <Clock className="w-4 h-4 mr-2 text-gray-600" />;
    }
  };

  // Filtrage des utilisateurs
  const filteredUsers = users.filter((user) => {
    const fullName = `${user.nom} ${user.prenom}`.toLowerCase();
    const searchMatch = fullName.includes(searchQuery.toLowerCase()) || 
                        user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (roleFilter === "all") return searchMatch;
    
    if (roleFilter === "admin" && user.role && user.role.toLowerCase().includes("directeur")) 
      return searchMatch;
    
    if (roleFilter === "editor" && user.role && user.role.toLowerCase().includes("chef")) 
      return searchMatch;
    
    if (roleFilter === "user" && (!user.role || (!user.role.toLowerCase().includes("directeur") && !user.role.toLowerCase().includes("chef"))))
      return searchMatch;
    
    return false;
  });

  // Récupération de la dernière connexion
  const getLastLogin = (userId: number): string => {
    const userLogin = lastLogins.find(login => login.user_id === userId);
    return userLogin && userLogin.last_login ? formatDate(userLogin.last_login) : "Jamais connecté";
  };

  // Statistiques
  const activeUsersCount = lastLogins.filter(user => user.last_login !== null).length;
  const recentUsersCount = recentUsers.length;
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Statistiques d&apos;utilisation</CardTitle>
          <CardDescription>Vue d&apos;ensemble des activités utilisateurs</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
              <div className="flex items-center mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 mr-3">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Utilisateurs actifs</span>
              </div>
              <div className="flex items-baseline">
                <p className="text-2xl font-bold text-gray-800 mr-2">
                  {loading ? "..." : activeUsersCount}
                </p>
                <p className="text-sm text-gray-500">sur {users.length} comptes</p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
              <div className="flex items-center mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50 mr-3">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Utilisateurs totaux</span>
              </div>
              <div className="flex items-baseline">
                <p className="text-2xl font-bold text-gray-800 mr-2">
                  {loading ? "..." : users.length}
                </p>
                <p className="text-sm text-gray-500">comptes enregistrés</p>
              </div>
            </div>
            
            <div className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm">
              <div className="flex items-center mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-50 mr-3">
                  <Plus className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Nouveaux utilisateurs</span>
              </div>
              <div className="flex items-baseline">
                <p className="text-2xl font-bold text-gray-800 mr-2">
                  {loading ? "..." : recentUsersCount}
                </p>
                <p className="text-sm text-gray-500">ces 7 derniers jours</p>
              </div>
            </div>
          </div>
          
          {/* Onglets */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-6 -mb-px">
              <button 
                onClick={() => setSelectedTab("users")}
                className={`px-1 py-3 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === "users" 
                    ? "border-blue-600 text-blue-600" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Utilisateurs</span>
                </div>
              </button>
              <button 
                onClick={() => setSelectedTab("activities")}
                className={`px-1 py-3 border-b-2 font-medium text-sm transition-colors ${
                  selectedTab === "activities" 
                    ? "border-blue-600 text-blue-600" 
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Historique d&apos;activités</span>
                </div>
              </button>
            </nav>
          </div>
          
          {/* Contenu de l'onglet utilisateurs */}
          {selectedTab === "users" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-wrap gap-4 justify-between mb-6">
                <div className="flex flex-wrap gap-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Rechercher un utilisateur"
                      className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Filter className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      className="w-40 pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                    >
                      <option value="all">Tous les rôles</option>
                      <option value="admin">Directeur</option>
                      <option value="editor">Chef</option>
                      <option value="user">Utilisateur</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {loading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-100 rounded-md p-4 mb-6">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-red-800">Une erreur est survenue</h3>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Utilisateur
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Email / Téléphone
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Rôle
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Dernière connexion
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {Array.isArray(filteredUsers) && filteredUsers.length > 0 ? (
                          filteredUsers.map((user, index) => (
                            user && typeof user === 'object' && user.id != null ? (
                              <tr key={user.id || index} className="hover:bg-gray-50 transition-colors duration-150">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                                      <span className="text-gray-600 font-medium text-sm">
                                        {(user.nom && typeof user.nom === 'string' && user.nom.length > 0 ? user.nom.charAt(0) : (user.prenom && typeof user.prenom === 'string' && user.prenom.length > 0 ? user.prenom.charAt(0) : "?"))}
                                      </span>
                                    </div>
                                    <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{user.nom ?? "Nom inconnu"} {user.prenom ?? "Prénom inconnu"}</div>
                                      <div className="text-sm text-gray-500">{user.username ?? "—"}</div>
                                    </div>
                                  </div>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">{user.email ?? "—"}</div>
                                  {user.telephone && (
                                    <div className="text-sm text-gray-500">{user.telephone}</div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                    {user.role || "Utilisateur standard"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {getLastLogin(user.id)}
                                </td>
                              </tr>
                            ) : null
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-10">
                              <div className="flex flex-col items-center justify-center">
                                <div className="bg-gray-50 rounded-full p-3 mb-4">
                                  <Search className="h-6 w-6 text-gray-400" />
                                </div>
                                <p className="text-gray-500 text-sm font-medium">Aucun utilisateur ne correspond à votre recherche</p>
                                <p className="text-gray-400 text-sm mt-1">Essayez de modifier vos critères de recherche</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Contenu de l'onglet historique d'activités */}
          {selectedTab === "activities" && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-wrap gap-4 justify-between mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Rechercher une activité"
                    className="w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-md text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <button 
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-md text-sm font-medium inline-flex items-center gap-2 transition-colors duration-200"
                >
                  <FileText className="h-4 w-4" />
                  <span>Exporter les logs</span>
                </button>
              </div>
              
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-50">
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Utilisateur
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Date et heure
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Détails
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Array.isArray(activities) && activities.length > 0 ? (
                        activities.map((activity) => (
                          activity && typeof activity === 'object' && activity.id != null ? (
                            <tr key={activity.id} className="hover:bg-gray-50 transition-colors duration-150">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-9 w-9 bg-gray-100 rounded-full flex items-center justify-center">
                                    <User className="h-4 w-4 text-gray-500" />
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">{activity.user ?? "Utilisateur inconnu"}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  {typeof getActionIcon === 'function' ? getActionIcon(activity.action) : null}
                                  <span className="text-sm text-gray-800">{activity.action ?? "Action inconnue"}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {activity.timestamp ?? "Date inconnue"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                  onClick={() => console.log(`Voir détails de l'activité ${activity.id}`)}
                                >
                                  <FileText className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ) : null
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-10">
                            <div className="flex flex-col items-center justify-center">
                              <div className="bg-gray-50 rounded-full p-3 mb-4">
                                <Clock className="h-6 w-6 text-gray-400" />
                              </div>
                              <p className="text-gray-500 text-sm font-medium">Aucune activité ne correspond à votre recherche</p>
                              <p className="text-gray-400 text-sm mt-1">Essayez de modifier vos critères de recherche</p>
                            </div>
                          </td>
                        </tr>
                      )}

                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserStatistics;