"use client";

import React, { useEffect, useState } from "react";
import Link from 'next/link';
import { PlusIcon, TrashBinIcon, UserIcon as SearchIcon } from "@/icons";
import Cookies from 'js-cookie';

interface Payslip {
  id: number;
  employee: string; // Keep this if the API sometimes returns 'employee'
  employee__username?: string; // Add this if the API returns 'employee__username'
  month: string;
  year: number;
  amount: number;
  created_at: string;
  updated_at: string;
  file?: string;
  user_id?: number; // Add user_id if it's part of the payslip data
}

// Define the User type
interface User {
  id: number;
  username: string;
  prenom: string;
  nom: string;
}

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayslips, setSelectedPayslips] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  // Nouveaux états pour l'édition et la suppression
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentPayslip, setCurrentPayslip] = useState<Payslip | null>(null);
  const [editFormData, setEditFormData] = useState({
    user_id: 0,
    month: "",
    year: new Date().getFullYear(),
    amount: 0,
    file: null as File | null,
    format: 'pdf' as FileFormat
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  // Types pour les formats de fichier
  type FileFormat = 'pdf' | 'excel' | 'word' | 'txt';

  useEffect(() => {
    async function fetchPayslips() {
      console.log("🔄 Début de la récupération des fiches de paie...");
      
      const token = Cookies.get('authTokens');
      if (!token) {
        console.error("❌ Authentification: Token non trouvé");
        setError("Non authentifié");
        setLoading(false);
        return;
      }

      const accessToken = JSON.parse(token).access;
      console.log("🔑 Token d'accès récupéré, longueur:", accessToken.length);
      
      try {
        console.log("📡 Envoi de la requête à l'API fiches de paie...");
        
        const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/services/payslips/", {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        console.log("📥 Réponse reçue - Statut:", response.status, response.statusText);
        
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        
        const data = await response.json();
        console.log("📊 Données des fiches de paie reçues:", data);

        // Afficher un exemple détaillé de la première fiche de paie
        if (Array.isArray(data) && data.length > 0) {
          console.log("📝 Exemple détaillé d'une fiche de paie:", {
            ...data[0],
            propriétés: Object.keys(data[0]).join(", ")
          });
        }

        console.log("📋 Structure des données:", {
          type: typeof data,
          isArray: Array.isArray(data),
          length: Array.isArray(data) ? data.length : "N/A",
          keys: data && typeof data === 'object' ? Object.keys(data) : "N/A",
          firstItem: Array.isArray(data) && data.length > 0 ? data[0] : "Aucun élément"
        });
        
        setPayslips(data);
        console.log("✅ Fiches de paie mises à jour dans l'état du composant");
      } catch (error) {
        console.error("❌ Erreur lors de la récupération des fiches de paie:", error);
        setError("Impossible de charger les fiches de paie.");
      } finally {
        setLoading(false);
        console.log("🏁 Fin de la récupération des fiches de paie");
      }
    }

    fetchPayslips();
  }, []);

  // Fermer automatiquement la notification après 5 secondes
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleDeletePayslips = async (payslipIds: number[]) => {
    const token = Cookies.get('authTokens');
    if (!token) {
      setError("Non authentifié");
      return;
    }

    const accessToken = JSON.parse(token).access;
    try {
      const response = await fetch(`https://www.backend.lnb-intranet.globalitnet.org/services/payslips/delete/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ ids: payslipIds }),
      });

      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

      setPayslips(prev => prev.filter(payslip => !payslipIds.includes(payslip.id)));
      setSelectedPayslips([]);
      setNotification({ type: "success", message: "Fiches de paie supprimées avec succès." });
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setNotification({ type: "error", message: "Impossible de supprimer les fiches de paie." });
    }
  };

  const downloadPayslip = async (payslipId: number) => {
    const token = Cookies.get('authTokens');
    if (!token) {
      setError("Non authentifié");
      return;
    }

    try {
      const response = await fetch(`https://www.backend.lnb-intranet.globalitnet.org/services/payslips/${payslipId}/`, {
        headers: {
          "Authorization": `Bearer ${JSON.parse(token).access}`,
        },
      });

      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      
      const data = await response.json();
      if (data.file) {
        window.open(data.file, '_blank');
      } else {
        setNotification({ 
          type: "error", 
          message: "Aucun fichier disponible pour cette fiche de paie" 
        });
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      setNotification({ 
        type: "error", 
        message: "Impossible de télécharger la fiche de paie" 
      });
    }
  };

  const filteredPayslips = payslips.filter(payslip => {
    if (!searchQuery) return true;
    // Add logic here to filter based on searchQuery, e.g., by employee name
    return payslip.employee.toLowerCase().includes(searchQuery.toLowerCase());
  }); // <-- Moved the closing parenthesis and semicolon here

  // Fonction pour récupérer les utilisateurs
  useEffect(() => {
    // Optimiser la fonction fetchUsers
    const fetchUsers = async () => {
      setIsLoadingUsers(true);
      try {
        console.log("Tentative de récupération des utilisateurs...");
        
        const token = Cookies.get("authTokens");
        if (!token) {
          setError("Non authentifié");
          return;
        }
        const accessToken = JSON.parse(token).access;
        
        const response = await fetch(
          "https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/list-all-users/",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Données utilisateurs reçues:", data);
        
        // La structure semble être { utilisateurs: Array(13) }
        if (data && data.utilisateurs && Array.isArray(data.utilisateurs)) {
          setUsers(data.utilisateurs);
        } else {
          setUsers([]); // Fallback si la structure attendue n'est pas présente
        }
        
      } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs:", error);
        setError("Impossible de charger la liste des utilisateurs");
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  // Fonction pour ouvrir la modale d'édition avec les données de la fiche sélectionnée
  const handleEditClick = (payslipId: number) => {
    const payslip = payslips.find(p => p.id === payslipId);
    if (!payslip) return;
    
    console.log("🖊️ Ouverture de la modale d'édition pour la fiche:", payslip);
    
    // Conversion du mois format numérique (01, 02...) vers format texte (janvier, fevrier...)
    const numericToTextMonthMap: Record<string, string> = {
      '01': 'janvier', '02': 'fevrier', '03': 'mars', '04': 'avril',
      '05': 'mai', '06': 'juin', '07': 'juillet', '08': 'aout',
      '09': 'septembre', '10': 'octobre', '11': 'novembre', '12': 'decembre'
    };
    
    // Déterminer le mois textuel à partir du mois numérique
    let textMonth = payslip.month;
    if (payslip.month && payslip.month.length <= 2) {
      textMonth = numericToTextMonthMap[payslip.month] || payslip.month;
    }
    
    console.log("📝 Données préchargées dans le formulaire:", {
      user_id: payslip.user_id || 0,
      month: textMonth,
      year: payslip.year,
      amount: payslip.amount
    });
    
    setCurrentPayslip(payslip);
    setEditFormData({
      user_id: payslip.user_id || 0,
      month: textMonth || "",
      year: payslip.year || new Date().getFullYear(),
      amount: payslip.amount || 0,
      file: null,
      format: 'pdf'
    });
    
    setShowEditModal(true);
  };

  // Fonction pour mettre à jour une fiche de paie
  const handleUpdatePayslip = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPayslip) {
      setNotification({ type: "error", message: "Aucune fiche sélectionnée" });
      return;
    }
    
    setIsUpdating(true);
    console.log("🔄 Début de la mise à jour de la fiche de paie...", editFormData);
    
    const token = Cookies.get("authTokens");
    if (!token) {
      setError("Non authentifié");
      setIsUpdating(false);
      return;
    }
    
    try {
      // Convertir les mois en format MM (01, 02, etc.)
      const monthMapping: Record<string, string> = {
        'janvier': '01', 'fevrier': '02', 'mars': '03', 'avril': '04',
        'mai': '05', 'juin': '06', 'juillet': '07', 'aout': '08',
        'septembre': '09', 'octobre': '10', 'novembre': '11', 'decembre': '12'
      };
      
      // Préparer les données pour l'API
      const formDataToSend = new FormData();
      formDataToSend.append('user_id', editFormData.user_id.toString());
      
      // Utiliser le format numérique du mois (MM) pour l'API
      const monthValue = monthMapping[editFormData.month] || editFormData.month;
      formDataToSend.append('month', monthValue);
      formDataToSend.append('year', editFormData.year.toString());
      formDataToSend.append('amount', editFormData.amount.toString());
      
      if (editFormData.file) {
        formDataToSend.append('file', editFormData.file);
        // Envoyer le format seulement si nécessaire selon l'API
        if (editFormData.format) {
          formDataToSend.append('format', editFormData.format);
        }
      }
      
      console.log(`📤 Envoi des données pour la mise à jour de la fiche ${currentPayslip.id}:`, {
        user_id: editFormData.user_id,
        month: monthValue,
        year: editFormData.year,
        amount: editFormData.amount,
        file: editFormData.file ? "Fichier joint" : "Pas de fichier"
      });
      
      const response = await fetch(
        `https://www.backend.lnb-intranet.globalitnet.org/services/payslips/${currentPayslip.id}/update/`,
        {
          method: "PUT", // Méthode HTTP pour la mise à jour
          headers: {
            "Authorization": `Bearer ${JSON.parse(token).access}`,
            // Ne pas ajouter Content-Type avec FormData, le navigateur l'ajoute automatiquement avec la boundary
          },
          body: formDataToSend,
        }
      );
      
      console.log("📥 Réponse reçue - Statut:", response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Erreur de la réponse API:", errorData);
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }
      
      const updatedPayslip = await response.json();
      console.log("✅ Fiche de paie mise à jour avec succès:", updatedPayslip);
      
      // Mettre à jour l'état local
      setPayslips(prevPayslips => 
        prevPayslips.map(payslip => 
          payslip.id === currentPayslip.id ? {...payslip, ...updatedPayslip} : payslip
        )
      );
      
      setNotification({ type: "success", message: "Fiche de paie mise à jour avec succès" });
      setShowEditModal(false);
      
    } catch (error) {
      console.error("❌ Erreur lors de la mise à jour de la fiche de paie:", error);
      setNotification({ 
        type: "error", 
        message: `Erreur lors de la mise à jour: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      });
    } finally {
      setIsUpdating(false);
      console.log("🏁 Fin de la tentative de mise à jour de la fiche de paie");
    }
  };

  // Fonction pour supprimer une fiche de paie spécifique
  const handleDeleteSinglePayslip = async (payslipId: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette fiche de paie?")) {
      return;
    }
    
    const token = Cookies.get('authTokens');
    if (!token) {
      setError("Non authentifié");
      return;
    }
    
    try {
      const response = await fetch(
        `https://www.backend.lnb-intranet.globalitnet.org/services/payslips/${payslipId}/delete/`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${JSON.parse(token).access}`,
          },
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
      }
      
      // Mettre à jour l'état local
      setPayslips(prevPayslips => prevPayslips.filter(payslip => payslip.id !== payslipId));
      setNotification({ type: "success", message: "Fiche de paie supprimée avec succès" });
      
    } catch (error) {
      console.error("Erreur lors de la suppression de la fiche de paie:", error);
    }
  };

  // Define months and fileFormats constants outside the return statement
  const months = [
    { value: 'janvier', label: 'Janvier' }, { value: 'fevrier', label: 'Février' }, { value: 'mars', label: 'Mars' },
    { value: 'avril', label: 'Avril' }, { value: 'mai', label: 'Mai' }, { value: 'juin', label: 'Juin' },
    { value: 'juillet', label: 'Juillet' }, { value: 'aout', label: 'Août' }, { value: 'septembre', label: 'Septembre' },
    { value: 'octobre', label: 'Octobre' }, { value: 'novembre', label: 'Novembre' }, { value: 'decembre', label: 'Décembre' }
  ];

  const fileFormats: { value: FileFormat; label: string; icon: string }[] = [
    { value: 'pdf', label: 'PDF', icon: '📄' }, { value: 'excel', label: 'Excel', icon: '📊' },
    { value: 'word', label: 'Word', icon: '📝' }, { value: 'txt', label: 'Texte', icon: '📜' }
  ];

  // Ajouter ces nouveaux états au début du composant
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsPayslip, setDetailsPayslip] = useState<Payslip | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Ajouter cette nouvelle fonction pour récupérer les détails d'une fiche de paie
  const handleShowDetails = async (payslipId: number) => {
    setIsLoadingDetails(true);
    
    const token = Cookies.get('authTokens');
    if (!token) {
      setError("Non authentifié");
      return;
    }

    try {
      console.log("📡 Récupération des détails de la fiche de paie:", payslipId);
      
      const response = await fetch(`https://www.backend.lnb-intranet.globalitnet.org/services/payslips/${payslipId}/`, {
        headers: {
          "Authorization": `Bearer ${JSON.parse(token).access}`,
        },
      });

      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
      
      const data = await response.json();
      console.log("📊 Détails reçus:", data);
      
      setDetailsPayslip(data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des détails:", error);
      setNotification({ 
        type: "error", 
        message: "Impossible de récupérer les détails de la fiche de paie" 
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-slate-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* En-tête */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Search and Action Buttons */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                  <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                </div>
  
                <Link href="/payslips/add">
                  <button className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Nouvelle fiche
                  </button>
                </Link>
  
                {selectedPayslips.length > 0 && (
                  <button
                    onClick={() => handleDeletePayslips(selectedPayslips)}
                    className="inline-flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 shadow-sm"
                  >
                    <TrashBinIcon className="w-4 h-4 mr-2" />
                    Supprimer ({selectedPayslips.length})
                  </button>
                )}
              </div>
            </div>
          </div>
  
          {/* Notifications */}
          {notification && (
            <div className={`mx-6 mt-4 p-4 rounded-lg text-sm font-medium shadow-sm relative ${notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800"
              : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800"
              }`}>
              <div className="flex items-center">
                <div className={`mr-3 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${notification.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
                  {notification.type === "success" ? (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                {notification.message}
              </div>
              <button
                onClick={() => setNotification(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                aria-label="Fermer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
  
          {/* État de chargement */}
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-500 mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">{error}</h3>
              <p className="text-slate-500 dark:text-slate-400">Veuillez réessayer plus tard ou contacter le support.</p>
            </div>
          ) : filteredPayslips.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-500 mb-4 dark:bg-slate-700 dark:text-slate-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              {searchQuery ? (
                <>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Aucun résultat trouvé</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Aucune fiche de paie ne correspond à votre recherche &quot;{searchQuery}&quot;.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Aucune fiche de paie</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Commencez par ajouter une nouvelle fiche de paie.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-left">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={selectedPayslips.length === filteredPayslips.length && filteredPayslips.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPayslips(filteredPayslips.map((payslip) => payslip.id));
                            } else {
                              setSelectedPayslips([]);
                            }
                          }}
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-left">
                      Employé
                    </th>
                    <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-left">
                      Période
                    </th>
                    <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-right">
                      Montant
                    </th>
                    <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-left">
                      Date de création
                    </th>
                    <th scope="col" className="px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredPayslips.map((payslip) => (
                    <tr key={payslip.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={selectedPayslips.includes(payslip.id)}
                          onChange={() => {
                            if (selectedPayslips.includes(payslip.id)) {
                              setSelectedPayslips(selectedPayslips.filter((id) => id !== payslip.id));
                            } else {
                              setSelectedPayslips([...selectedPayslips, payslip.id]);
                            }
                          }}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {payslip.employee__username || payslip.employee || "Non spécifié"} 
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-300">
                          {months.find(m => m.value === payslip.month)?.label} {payslip.year}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Intl.NumberFormat('fr-FR').format(payslip.amount)} FCFA
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-300">
                          {new Date(payslip.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-2">
                          {/* Bouton "Voir détails" */}
                          <button
                            onClick={() => handleShowDetails(payslip.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Voir détails"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          
                          {/* Bouton de téléchargement */}
                          <button
                            onClick={() => downloadPayslip(payslip.id)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Télécharger"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          
                          {/* Bouton de modification */}
                          <button
                            onClick={() => handleEditClick(payslip.id)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Modifier"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          
                          {/* Bouton de suppression */}
                          <button
                            onClick={() => handleDeleteSinglePayslip(payslip.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
  
      {/* Modale d'édition */}
      {showEditModal && currentPayslip && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl relative">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              aria-label="Fermer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <form onSubmit={handleUpdatePayslip} className="space-y-4">
              {/* Sélection de l'utilisateur */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Utilisateur *
                </label>
                <select
                  value={editFormData.user_id}
                  onChange={(e) => setEditFormData({ ...editFormData, user_id: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                  disabled={isLoadingUsers}
                >
                  <option value="">Sélectionnez un utilisateur</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.prenom} {user.nom} ({user.username})
                    </option>
                  ))}
                </select>
                {isLoadingUsers && (
                  <div className="mt-2 text-sm text-blue-500">Chargement des utilisateurs...</div>
                )}
              </div>
  
              {/* Période */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Mois *
                  </label>
                  <select
                    value={editFormData.month}
                    onChange={(e) => setEditFormData({ ...editFormData, month: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  >
                    <option value="">Sélectionnez un mois</option>
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
  
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Montant (FCFA) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editFormData.amount}
                    onChange={(e) => setEditFormData({ ...editFormData, amount: Number(e.target.value) })}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                  />
                </div>
              </div>
  
              {/* Téléchargement du fichier */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Remplacer le fichier (optionnel)
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-800 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Cliquez pour télécharger</span> ou glissez-déposez
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {editFormData.file ? editFormData.file.name : "Aucun nouveau fichier sélectionné"}
                      </p>
                    </div>
                    <input
                      id="dropzone-file"
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setEditFormData({ ...editFormData, file });
                      }}
                    />
                  </label>
                </div>
              </div>
  
              {/* Format du fichier */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Format du fichier
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {fileFormats.map(format => (
                    <div
                      key={format.value}
                      onClick={() => setEditFormData({ ...editFormData, format: format.value as FileFormat })}
                      className={`flex flex-col items-center p-3 border rounded-lg cursor-pointer transition-colors
                        ${editFormData.format === format.value
                        ? 'bg-blue-50 border-blue-500 dark:bg-blue-900/30 dark:border-blue-700'
                        : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800'}`}
                    >
                      <span className="text-2xl mb-1">{format.icon}</span>
                      <span className="text-xs font-medium">{format.label}</span>
                    </div>
                  ))}
                </div>
              </div>
  
              {/* Boutons d'action */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Mise à jour en cours...
                    </>
                  ) : "Mettre à jour"}
                </button>
              </div>
            </form>
          </div>
          </div>
        )}

      {/* Modale de détails */}
      {showDetailsModal && detailsPayslip && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl relative">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Détails de la fiche de paie
              </h2>
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                aria-label="Fermer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {isLoadingDetails ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">ID</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{detailsPayslip.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Employé</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {detailsPayslip.employee__username || detailsPayslip.employee || "Non spécifié"}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Mois</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {months.find(m => m.value === detailsPayslip.month)?.label || detailsPayslip.month}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Année</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{detailsPayslip.year}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Montant</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('fr-FR').format(detailsPayslip.amount)} FCFA
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date de création</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {new Date(detailsPayslip.created_at).toLocaleDateString()} 
                      {" "}
                      {new Date(detailsPayslip.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Date de mise à jour</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {new Date(detailsPayslip.updated_at).toLocaleDateString()} 
                      {" "}
                      {new Date(detailsPayslip.updated_at).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                
                {detailsPayslip.file && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Fichier</p>
                    <div className="flex items-center">
                      <a 
                        href={detailsPayslip.file} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Télécharger le fichier
                      </a>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setShowDetailsModal(false)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}