"use client"

// Suppression de useContext car non utilisé
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
// Suppression de AuthContext car non utilisé
import { HomeIcon, UsersIcon, DocumentIcon, BellIcon, FolderIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { EcommerceMetrics } from "@/components/admin/accueils/usercount";

// Nouveaux composants à créer
import UserStatistics from "@/components/admin/utilisateurs/UserStatistics";
import ContentManagement from "@/components/admin/contenue/ContentManagement";
import {NotificationsPanel} from "@/components/admin/notifications/NotificationsPanel";
import ResourceManagement from "@/components/admin/ressources/ResourceManagement";
import SecurityAudit from "@/components/admin/security/SecurityAudit";

// Ajoutez ces constantes pour les couleurs de sections en nuances de vert
const SECTION_COLORS = {
  ecommerce: {
    bg: "bg-green-700",
    hover: "hover:bg-green-800",
    text: "text-green-700",
    light: "bg-green-50",
  },
  users: {
    bg: "bg-green-600",
    hover: "hover:bg-green-700",
    text: "text-green-600",
    light: "bg-green-50",
  },
  content: {
    bg: "bg-emerald-700",
    hover: "hover:bg-emerald-800",
    text: "text-emerald-700",
    light: "bg-emerald-50",
  },
  notifications: {
    bg: "bg-teal-600",
    hover: "hover:bg-teal-700",
    text: "text-teal-600",
    light: "bg-teal-50",
  },
  resources: {
    bg: "bg-green-800",
    hover: "hover:bg-green-900",
    text: "text-green-800",
    light: "bg-green-50",
  },
  security: {
    bg: "bg-emerald-800",
    hover: "hover:bg-emerald-900",
    text: "text-emerald-800",
    light: "bg-emerald-50",
  },
};

export interface AuthContextProps {
  tokens: {
    access: string;
    refresh?: string;
  } | null;
  user: {
    id: number;
    prenom: string;
    nom: string;
    email: string;
  } | null;
  loading: boolean;
  departmentCount: number | null;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [tokens, setTokens] = useState(null);
  const [user, setUser] = useState(null);
  const [departmentCount, setDepartmentCount] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<keyof typeof SECTION_COLORS>("ecommerce");

  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔄 Initialisation...');
      
      // 1. Récupérer le token des cookies
      const storedTokens = Cookies.get('authTokens');
      console.log('🍪 Tokens trouvés:', storedTokens);

      if (!storedTokens) {
        console.log('❌ Aucun token trouvé');
        router.push('/auth/login');
        return;
      }

      try {
        // 2. Parser le token
        const parsedTokens = JSON.parse(storedTokens);
        setTokens(parsedTokens);
        console.log('✅ Tokens chargés:', parsedTokens);

        // 3. Charger les données utilisateur
        const response = await fetch('https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/user-profile/', {
          headers: {
            'Authorization': `Bearer ${parsedTokens.access}`,
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData.utilisateur); // Accéder à la propriété "utilisateur"
          console.log('👤 Utilisateur chargé:', userData.utilisateur);
        } else {
          console.log('❌ Erreur lors du chargement de l\'utilisateur:', response.status);
          if (response.status === 401) {
            Cookies.remove('authTokens');
            router.push('/auth/login');
          }
        }

        // 4. Charger le nombre de départements
        const departmentsResponse = await fetch('https://www.backend.lnb-intranet.globalitnet.org/services/departments/', {
          headers: {
            'Authorization': `Bearer ${parsedTokens.access}`,
          }
        });

        if (departmentsResponse.ok) {
          const departmentsData = await departmentsResponse.json();
          setDepartmentCount(departmentsData.departments.length);
          console.log('🏢 Nombre de départements chargé:', departmentsData.departments.length);
        } else {
          console.log('❌ Erreur lors du chargement du nombre de départements:', departmentsResponse.status);
        }
      } catch (error) {
        console.error('❌ Erreur:', error);
        Cookies.remove('authTokens');
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [router]);

  // Afficher le loader pendant le chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si pas de token ou d'utilisateur, rediriger
  if (!tokens || !user) {
    router.push('/auth/login');
    return null;
  }

  // Fonction pour gérer la navigation entre les sections
  const handleSectionChange = (section: keyof typeof SECTION_COLORS) => {
      setActiveSection(section);
  };

  return (
    <div className="container mx-auto p-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 transition-all duration-300">
        <h1 className={`text-2xl font-bold mb-6 ${SECTION_COLORS[activeSection].text}`}>
          Tableau de bord administrateur
        </h1>

        {/* Navigation */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 mb-8">
          {(["ecommerce", "users", "content", "notifications", "resources", "security"] as Array<keyof typeof SECTION_COLORS>).map((section) => (
            <button
              key={section}
              onClick={() => handleSectionChange(section)}
              className={`
                py-2 px-4 rounded-lg transition-all duration-200
                font-medium text-sm
                ${activeSection === section 
                  ? `${SECTION_COLORS[section].bg} text-white shadow-lg transform scale-105`
                  : `${SECTION_COLORS[section].light} ${SECTION_COLORS[section].text} ${SECTION_COLORS[section].hover}`
                }
                hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50 ${SECTION_COLORS[section].hover}
              `}
            >
              <div className="flex items-center justify-center space-x-2">
                {section === "ecommerce" && <HomeIcon className="w-4 h-4" />}
                {section === "users" && <UsersIcon className="w-4 h-4" />}
                {section === "content" && <DocumentIcon className="w-4 h-4" />}
                {section === "notifications" && <BellIcon className="w-4 h-4" />}
                {section === "resources" && <FolderIcon className="w-4 h-4" />}
                {section === "security" && <LockClosedIcon className="w-4 h-4" />}
                <span>
                  {section === "ecommerce" ? "Accueil" :
                  section === "users" ? "Utilisateurs" :
                  section === "content" ? "Contenu" :
                  section === "notifications" ? "Notifications" :
                  section === "resources" ? "Ressources" : "Sécurité"}
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className={`
          mt-6 p-4 rounded-lg transition-all duration-300
          ${SECTION_COLORS[activeSection].light}
          dark:bg-gray-800/50
        `}>
          {/* Contenu de la section Accueils */}
          {activeSection === "ecommerce" && (
            <div className="grid grid-cols-12 gap-4 md:gap-6">
              <div className="col-span-12">
                  <EcommerceMetrics departmentCount={departmentCount} />
              </div>
            </div>
          )}
          
          {/* Contenu de la section Utilisateurs */}
          {activeSection === "users" && (
            <div className="grid grid-cols-12 gap-4 md:gap-6">
              <div className="col-span-12">
                  <UserStatistics />
              </div>
            </div>
          )}
          
          {/* Contenu de la section Contenu */}
          {activeSection === "content" && (
            <div className="grid grid-cols-12 gap-4 md:gap-6">
              <div className="col-span-12">
                  <ContentManagement />
              </div>
            </div>
          )}
          
          {/* Contenu de la section Notifications */}
          {activeSection === "notifications" && (
            <div className="grid grid-cols-12 gap-4 md:gap-6">
              <div className="col-span-12">
                  <NotificationsPanel />
              </div>
            </div>
          )}
          
          {/* Contenu de la section Ressources */}
          {activeSection === "resources" && (
            <div className="grid grid-cols-12 gap-4 md:gap-6">
              <div className="col-span-12">
                  <ResourceManagement />
              </div>
            </div>
          )}
          
          {/* Contenu de la section Sécurité */}
          {activeSection === "security" && (
            <div className="grid grid-cols-12 gap-4 md:gap-6">
              <div className="col-span-12">
                  <SecurityAudit />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}