"use client";

import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons";
import Cookies from "js-cookie";

interface Dossier {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export default function DossiersPage() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [_showEditModal, setShowEditModal] = useState(false);
  const [selectedDossiers, setSelectedDossiers] = useState<number[]>([]);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  // Ajout d'un useEffect pour simuler le chargement des dossiers
  useEffect(() => {
    const fetchDossiers = async () => {
      setIsLoading(true);
      try {
        const token = Cookies.get("authTokens");
        if (!token) {
          setNotification({ type: "error", message: "Non authentifié" });
          setIsLoading(false);
          return;
        }
        const accessToken = JSON.parse(token).access;
        
        const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/documents/dossiers/", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        
        const data = await response.json();
        setDossiers(data);
      } catch (error) {
        console.error("Erreur lors du chargement des dossiers:", error);
        setNotification({ 
          type: "error", 
          message: "Impossible de charger les dossiers" 
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDossiers();
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

  const handleDeleteDossier = async (dossierId: number) => {
    const token = Cookies.get("authTokens");
    if (!token) {
      setNotification({ type: "error", message: "Non authentifié" });
      return;
    }
    const accessToken = JSON.parse(token).access;

    try {
      const response = await fetch(`https://www.backend.lnb-intranet.globalitnet.org/documents/dossiers/${dossierId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

      setDossiers(prev => prev.filter(dossier => dossier.id !== dossierId));
      setSelectedDossiers(prev => prev.filter(id => id !== dossierId));
      setNotification({ type: "success", message: "Dossier supprimé avec succès" });
    } catch (_error) {
      setNotification({ 
        type: "error", 
        message: "Erreur lors du traitement de la demande" 
      });
      console.error("Erreur détaillée:", _error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = Cookies.get("authTokens");
    if (!token) {
      setNotification({ type: "error", message: "Non authentifié" });
      return;
    }
    const accessToken = JSON.parse(token).access;

    try {
      const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/documents/dossiers/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

      const newDossier = await response.json();
      setDossiers(prev => [...prev, newDossier]);
      setShowAddModal(false);
      setNotification({ type: "success", message: "Dossier créé avec succès" });
      setFormData({ name: "", description: "" });
    } catch (_error) {
      setNotification({ 
        type: "error", 
        message: "Une erreur est survenue" 
      });
      console.error("Erreur détaillée:", _error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* En-tête */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
                  Gestion des dossiers
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Organisez et gérez vos dossiers de documents
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center justify-center px-4 py-2 
                           bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium 
                           rounded-lg transition-colors duration-200 shadow-sm"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Nouveau dossier
                </button>
                
                {selectedDossiers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowEditModal(true)}
                      disabled={selectedDossiers.length !== 1}
                      className={`inline-flex items-center justify-center px-4 py-2 
                                text-sm font-medium rounded-lg transition-colors duration-200
                                ${selectedDossiers.length === 1 
                                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm' 
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'}`}
                    >
                      <PencilIcon className="w-4 h-4 mr-2" />
                      Modifier
                    </button>
                    
                    <button
                      onClick={() => {
                        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce(s) dossier(s) ?')) {
                          selectedDossiers.forEach(id => handleDeleteDossier(id));
                        }
                      }}
                      className="inline-flex items-center justify-center px-4 py-2 
                              bg-red-600 hover:bg-red-700 text-white text-sm font-medium 
                              rounded-lg transition-colors duration-200 shadow-sm"
                    >
                      <TrashBinIcon className="w-4 h-4 mr-2" />
                      Supprimer ({selectedDossiers.length})
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notifications */}
          {notification && (
            <div className={`mx-6 mt-4 p-4 rounded-lg text-sm font-medium shadow-sm relative
                         ${notification.type === "success" 
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800" 
                            : "bg-red-50 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800"
                         }`}>
              <div className="flex items-center">
                <div className={`mr-3 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center
                              ${notification.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
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
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : dossiers.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-500 mb-4 dark:bg-slate-700 dark:text-slate-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Aucun dossier</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Commencez par créer un nouveau dossier pour organiser vos documents.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 inline-flex items-center justify-center px-4 py-2 
                       bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium 
                       rounded-lg transition-colors duration-200 shadow-sm"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Créer un dossier
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="w-full">
                <TableHeader>
                  <TableRow className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
                    <TableCell isHeader className="w-10 py-3 px-4">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          const allIds = dossiers.map(d => d.id);
                          setSelectedDossiers(e.target.checked ? allIds : []);
                        }}
                        checked={selectedDossiers.length === dossiers.length && dossiers.length > 0}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
                      />
                    </TableCell>
                    <TableCell isHeader className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-300">Nom du dossier</TableCell>
                    <TableCell isHeader className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-300">Description</TableCell>
                    <TableCell isHeader className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-300">Date de création</TableCell>
                    <TableCell isHeader className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-300">Dernière modification</TableCell>
                    <TableCell isHeader className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-300">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dossiers.map((dossier) => (
                    <TableRow 
                      key={dossier.id}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors duration-150"
                    >
                      <TableCell className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedDossiers.includes(dossier.id)}
                          onChange={() => {
                            const isSelected = selectedDossiers.includes(dossier.id);
                            setSelectedDossiers(
                              isSelected
                                ? selectedDossiers.filter(id => id !== dossier.id)
                                : [...selectedDossiers, dossier.id]
                            );
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
                        />
                      </TableCell>
                      <TableCell className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        {dossier.name}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        <div className="max-w-xs truncate" title={dossier.description}>
                          {dossier.description}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {new Date(dossier.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {new Date(dossier.updated_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => {
                              setSelectedDossiers([dossier.id]);
                              setShowEditModal(true);
                            }}
                            className="group p-1.5 rounded-full bg-amber-50 text-amber-600 hover:bg-amber-100 
                                     dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30 
                                     transition-colors duration-200"
                            title="Modifier ce dossier"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm('Êtes-vous sûr de vouloir supprimer ce dossier ?')) {
                                handleDeleteDossier(dossier.id);
                              }
                            }}
                            className="group p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 
                                     dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 
                                     transition-colors duration-200"
                            title="Supprimer ce dossier"
                          >
                            <TrashBinIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination placeholder - à implémenter si nécessaire */}
              <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                  <span>Affichage de {dossiers.length} dossiers</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal d'ajout */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="relative max-w-md w-full mx-4 md:mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 transform transition-all">
            {/* En-tête du modal */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Créer un nouveau dossier
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400 focus:outline-none"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Corps du modal */}
            <div className="px-6 py-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label 
                    htmlFor="dossier-name"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Nom du dossier <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="dossier-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label 
                    htmlFor="dossier-description"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Description <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <textarea
                    id="dossier-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full p-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    required
                  />
                </div>
                
                {/* Pied du modal */}
                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg shadow-sm dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
                  >
                    Créer le dossier
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}