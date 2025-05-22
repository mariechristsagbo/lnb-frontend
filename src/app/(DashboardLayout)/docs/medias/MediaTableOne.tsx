"use client";

import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { PlusIcon, PencilIcon, TrashBinIcon } from "@/icons";
import Cookies from "js-cookie";

interface Media {
  id: number;
  title: string;
  media_type: string;
  file: string;
  uploaded_by_id: number;
  created_at: string;
  updated_at: string;
}

export default function MediaPage() {
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [_showEditModal, setShowEditModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<number[]>([]);
  const [notification, setNotification] = useState<{ 
    type: "success" | "error"; 
    message: string 
  } | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    media_type: "",
    file: null as File | null,
  });

  // Simulation du chargement des médias
  useEffect(() => {
    const fetchMedias = async () => {
      setIsLoading(true);
      try {
        const token = Cookies.get("authTokens");
        if (!token) {
          setNotification({ type: "error", message: "Non authentifié" });
          setIsLoading(false);
          return;
        }
        const accessToken = JSON.parse(token).access;
        
        const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/documents/media/", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        
        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        
        const data = await response.json();
        setMediaList(data);
      } catch (error) {
        console.error("Erreur lors du chargement des médias:", error);
        setNotification({ 
          type: "error", 
          message: "Impossible de charger les médias" 
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMedias();
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

  const handleDeleteMedia = async (mediaId: number) => {
    const token = Cookies.get("authTokens");
    if (!token) {
      setNotification({ type: "error", message: "Non authentifié" });
      return;
    }
    const accessToken = JSON.parse(token).access;

    try {
      const response = await fetch(`https://www.backend.lnb-intranet.globalitnet.org/documents/media/${mediaId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

      setMediaList((prev) => prev.filter((media) => media.id !== mediaId));
      setSelectedMedia(prev => prev.filter(id => id !== mediaId));
      setNotification({ type: "success", message: "Média supprimé avec succès" });
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setNotification({ 
        type: "error", 
        message: error instanceof Error ? error.message : "Erreur lors de la suppression du média" 
      });
    }
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = Cookies.get("authTokens");
    if (!token) {
      setNotification({ type: "error", message: "Non authentifié" });
      return;
    }
    const accessToken = JSON.parse(token).access;

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("media_type", formData.media_type);
      if (formData.file) {
        formDataToSend.append("file", formData.file);
      }

      const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/documents/media/upload/", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

      const newMedia = await response.json();
      setMediaList(prev => [...prev, newMedia]);
      setShowAddModal(false);
      setNotification({ type: "success", message: "Média ajouté avec succès" });
      setFormData({ title: "", media_type: "", file: null });
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      setNotification({ 
        type: "error", 
        message: error instanceof Error ? error.message : "Erreur lors de l'ajout du média" 
      });
    }
  };

  const getMediaTypeLabel = (type: string) => {
    switch (type) {
      case 'image': return 'Image';
      case 'video': return 'Vidéo';
      case 'audio': return 'Audio';
      case 'document': return 'Document';
      default: return type;
    }
  };

  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case 'image':
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'video':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'audio':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        );
      case 'document':
        return (
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const getFileNameFromPath = (path: string) => {
    // Extraire le nom du fichier à partir de l'URL ou du chemin
    const parts = path.split('/');
    return parts[parts.length - 1];
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
                  Médiathèque
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Gérez vos fichiers médias (images, vidéos, documents)
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
                  Ajouter un média
                </button>
                
                {selectedMedia.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowEditModal(true)}
                      disabled={selectedMedia.length !== 1}
                      className={`inline-flex items-center justify-center px-4 py-2 
                                text-sm font-medium rounded-lg transition-colors duration-200
                                ${selectedMedia.length === 1 
                                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm' 
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'}`}
                    >
                      <PencilIcon className="w-4 h-4 mr-2" />
                      Modifier
                    </button>
                    
                    <button
                      onClick={() => {
                        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce(s) média(s) ?')) {
                          selectedMedia.forEach(id => handleDeleteMedia(id));
                        }
                      }}
                      className="inline-flex items-center justify-center px-4 py-2 
                              bg-red-600 hover:bg-red-700 text-white text-sm font-medium 
                              rounded-lg transition-colors duration-200 shadow-sm"
                    >
                      <TrashBinIcon className="w-4 h-4 mr-2" />
                      Supprimer ({selectedMedia.length})
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
          ) : mediaList.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-500 mb-4 dark:bg-slate-700 dark:text-slate-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Aucun média</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Commencez par ajouter un nouveau média à votre médiathèque.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 inline-flex items-center justify-center px-4 py-2 
                       bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium 
                       rounded-lg transition-colors duration-200 shadow-sm"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Ajouter un média
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
                          const allIds = mediaList.map(m => m.id);
                          setSelectedMedia(e.target.checked ? allIds : []);
                        }}
                        checked={selectedMedia.length === mediaList.length && mediaList.length > 0}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
                      />
                    </TableCell>
                    <TableCell isHeader className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-300">Titre</TableCell>
                    <TableCell isHeader className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-300">Type</TableCell>
                    <TableCell isHeader className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-300">Fichier</TableCell>
                    <TableCell isHeader className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-300">Date d&apos;ajout</TableCell>
                    <TableCell isHeader className="py-3 px-4 text-sm font-medium text-slate-600 dark:text-slate-300">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mediaList.map((media) => (
                    <TableRow 
                      key={media.id}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors duration-150"
                    >
                      <TableCell className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedMedia.includes(media.id)}
                          onChange={() => {
                            const isSelected = selectedMedia.includes(media.id);
                            setSelectedMedia(
                              isSelected
                                ? selectedMedia.filter(id => id !== media.id)
                                : [...selectedMedia, media.id]
                            );
                          }}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700"
                        />
                      </TableCell>
                      <TableCell className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        {media.title}
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center">
                          {getMediaTypeIcon(media.media_type)}
                          <span className="ml-2 text-slate-700 dark:text-slate-300">
                            {getMediaTypeLabel(media.media_type)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        <div className="flex items-center">
                          <div className="max-w-[200px] truncate" title={media.file}>
                            {getFileNameFromPath(media.file)}
                          </div>
                          <a 
                            href={media.file} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {new Date(media.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => {
                              setSelectedMedia([media.id]);
                              setShowEditModal(true);
                            }}
                            className="group p-1.5 rounded-full bg-amber-50 text-amber-600 hover:bg-amber-100 
                                     dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30 
                                     transition-colors duration-200"
                            title="Modifier ce média"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (window.confirm('Êtes-vous sûr de vouloir supprimer ce média ?')) {
                                handleDeleteMedia(media.id);
                              }
                            }}
                            className="group p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 
                                     dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 
                                     transition-colors duration-200"
                            title="Supprimer ce média"
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
                  <span>Affichage de {mediaList.length} médias</span>
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
                  Ajouter un nouveau média
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
              <form onSubmit={handleAddMedia} className="space-y-4">
                <div>
                  <label 
                    htmlFor="media-title"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Titre du média <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="media-title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label 
                    htmlFor="media-type"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Type de média <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <select
                    id="media-type"
                    value={formData.media_type}
                    onChange={(e) => setFormData({ ...formData, media_type: e.target.value })}
                    className="w-full p-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    required
                  >
                    <option value="">Sélectionner un type</option>
                    <option value="image">Image</option>
                    <option value="video">Vidéo</option>
                    <option value="audio">Audio</option>
                    <option value="document">Document</option>
                  </select>
                </div>
                <div>
                  <label 
                    htmlFor="media-file"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Fichier <span className="text-red-500" aria-hidden="true">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="media-file"
                      type="file"
                      onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                      className="w-full p-2 rounded-md border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      required
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Formats supportés: JPG, PNG, PDF, MP3, MP4 (max. 10MB)
                  </p>
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
                    Ajouter
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