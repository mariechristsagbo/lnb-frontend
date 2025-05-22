"use client";

// Suppression de useEffect car non utilisé
import React, { useState } from "react";
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
  const handleDeleteMedia = async (mediaId: number) => {
    const token = Cookies.get("authTokens");
    if (!token) {
      setNotification({ type: "error", message: "Non authentifié" }); // Remplacé setError
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
      setNotification({ type: "success", message: "Média supprimé avec succès" });
    } catch (error) { // Suppression du préfixe underscore et utilisation de error
      console.error("Erreur lors de la suppression:", error);
      setNotification({ 
        type: "error", 
        message: error instanceof Error ? error.message : "Erreur lors de la suppression du média" 
      });
    }
  };

  const [mediaList, setMediaList] = useState<Media[]>([]);
  // Suppression de la variable error non utilisée
  const [showAddModal, setShowAddModal] = useState(false);
  // Préfixé avec _ car utilisé dans le JSX mais pas dans la logique
  const [_showEditModal, setShowEditModal] = useState(false);
  const [selectedMedia, _setSelectedMedia] = useState<number[]>([]); // Préfixé avec _
  const [notification, setNotification] = useState<{ 
    type: "success" | "error"; 
    message: string 
  } | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    media_type: "",
    file: null as File | null,
  });

  // ...existing fetchMedia code...

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = Cookies.get("authTokens");
    if (!token) {
      setNotification({ type: "error", message: "Non authentifié" }); // Remplacé setError
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
    } catch (error) { // Suppression du préfixe underscore et utilisation de error
      console.error("Erreur lors de l'ajout:", error);
      setNotification({ 
        type: "error", 
        message: error instanceof Error ? error.message : "Erreur lors de l'ajout du média" 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="w-full max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        {/* Barre d'actions */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Médias
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Ajouter un média
            </button>
            
            {selectedMedia.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  disabled={selectedMedia.length !== 1}
                  className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors
                    ${selectedMedia.length === 1 
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                >
                  <PencilIcon className="w-5 h-5 mr-2" />
                  Modifier
                </button>
                
                <button
                  onClick={() => {
                    if (window.confirm('Êtes-vous sûr de vouloir supprimer ces médias ?')) {
                      handleDeleteMedia(selectedMedia[0]);
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <TrashBinIcon className="w-5 h-5 mr-2" />
                  Supprimer ({selectedMedia.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal d'ajout */}
        {showAddModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Ajouter un nouveau média</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleAddMedia} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Titre du média
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Type de média
                  </label>
                  <select
                    value={formData.media_type}
                    onChange={(e) => setFormData({ ...formData, media_type: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
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
                  <label className="block text-sm font-medium mb-1">
                    Fichier
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Ajouter
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notifications et messages d'erreur */}
        {notification && (
          <div
            className={`mb-4 p-4 rounded-md text-center ${
              notification.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* Table des médias */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableCell>Titre</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Fichier</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mediaList.map((media) => (
                <TableRow key={media.id}>
                  <TableCell>{media.title}</TableCell>
                  <TableCell>{media.media_type}</TableCell>
                  <TableCell>{media.file}</TableCell>
                  <TableCell>
                    <div>Actions</div> {/* Add action buttons here */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}