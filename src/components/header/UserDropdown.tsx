import axios from 'axios';
import Cookies from 'js-cookie';
import Image from "next/image";
import { useRouter } from 'next/navigation'; // Ajout du hook useRouter
import React, { useState, useEffect } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

interface UserData {
  username: string;
  nom: string;
  prenom: string;
  email: string;
  photo_profil?: string;
}

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter(); // Initialisation du router

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Récupération du token depuis les cookies
        const tokensCookie = Cookies.get('authTokens');
        const accessToken = tokensCookie ? JSON.parse(tokensCookie).access : null;
        if (!accessToken) {
          setError('Token d\'accès introuvable');
          console.error('Token d\'accès introuvable');
          return;
        }

        console.log("Token d'accès :", accessToken); // Pour déboguer

        const headers = {
          Authorization: `Bearer ${accessToken}`,
          'X-CSRFTOKEN': Cookies.get('csrftoken') || '',
        };

        console.log("Headers de la requête :", headers); // Pour déboguer

        const response = await axios.get('https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/user-profile/', { headers });

        if (response.data && response.data.utilisateur) {
          setUserData(response.data.utilisateur);
        } else {
          setError('Données utilisateur introuvables');
          console.error('Données utilisateur introuvables');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur :', error);
        setError('Erreur lors de la récupération des données utilisateur');
      }
    };

    fetchUserData();
  }, []);

  const toggleDropdown = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    setIsOpen(prev => !prev);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  // Nouvelle fonction pour gérer la déconnexion
  const handleLogout = () => {
    // Supprimer le token d'authentification
    Cookies.remove('authTokens');
    // Supprimer d'autres cookies si nécessaire
    Cookies.remove('csrftoken');
    
    // Rediriger vers la page de connexion
    router.push('/auth/login');
  };

  if (error) {
    console.error('Erreur:', error);
    return <div>Error: {error}</div>;
  }

  if (!userData) {
    console.log('Chargement des données utilisateur...');
    return <div>Loading...</div>;
  }

  // Helper function to get initials from name
  const getInitials = (firstName: string | null | undefined = "", lastName: string | null | undefined = ""): string => {
    const firstInitial = firstName?.charAt(0)?.toUpperCase() || "";
    const lastInitial = lastName?.charAt(0)?.toUpperCase() || "";
    
    if (firstInitial && lastInitial) {
      return `${firstInitial}${lastInitial}`;
    } else if (firstInitial) {
      return firstInitial;
    } else if (lastInitial) {
      return lastInitial;
    }
    
    // Valeur par défaut si aucun nom n'est disponible
    return "U";
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dark:text-gray-400 dropdown-toggle"
      >
        <span className="mr-3 overflow-hidden rounded-full h-11 w-11 flex items-center justify-center">
          {userData.photo_profil ? (
            <Image
              width={44}
              height={44}
              src={userData.photo_profil}
              alt={`${userData.prenom} ${userData.nom}`}
              placeholder="blur"
              blurDataURL="/images/user/avatar-placeholder.jpg"
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-500 to-yellow-600 text-white font-medium"
              style={{ 
                fontSize: '1.2rem',
              }}
            >
              {userData ? getInitials(userData.prenom, userData.nom) : "U"}
            </div>
          )}
        </span>

        <span className="block mr-1 font-medium text-theme-sm">
          {userData.username || "Not found"}
        </span>

        <svg
          className={`stroke-gray-500 dark:stroke-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
            {userData.nom || "Not found"} {userData.prenom || "Not found"}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {userData.email || "Not found"}
          </span>
        </div>

        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/admin/profile"
              className="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              {/* SVG ou autre contenu */}
              Profil
            </DropdownItem>
          </li>
        </ul>
        <ul className="flex flex-col gap-1 pt-3">
          <li>
            <DropdownItem
              onItemClick={handleLogout} 
              className="flex items-center gap-3 px-3 py-2 font-medium text-red-600 rounded-lg group text-theme-sm hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/10"
            >
              Déconnexion
            </DropdownItem>
          </li>
        </ul>
      </Dropdown>
    </div>
  );
}