"use client";

// Suppression de useEffect car non utilisé
import React, { useState } from "react";
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
  const handleDeleteDossier = async (dossierId: number) => {
    const token = Cookies.get("authTokens");
    if (!token) {
      setNotification({ type: "error", message: "Non authentifié" }); // Remplacé setError par setNotification
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
      setNotification({ type: "success", message: "Dossier supprimé avec succès" });
    } catch (_error) { // Ajout du préfixe underscore
      setNotification({ 
        type: "error", 
        message: "Erreur lors du traitement de la demande" 
      });
      console.error("Erreur détaillée:", _error);
    }
  };

  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  // Suppression de error car non utilisé
  const [showAddModal, setShowAddModal] = useState(false);
  // Renommé showEditModal car utilisé dans le JSX mais pas dans la logique
  const [_showEditModal, setShowEditModal] = useState(false);
  const [selectedDossiers, setSelectedDossiers] = useState<number[]>([]);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // ...existing code for fetchDossiers...

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = Cookies.get("authTokens");
    if (!token) {
      setNotification({ type: "error", message: "Non authentifié" }); // Remplacé setError par setNotification
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
    } catch (_error) { // Ajout du préfixe underscore
      setNotification({ 
        type: "error", 
        message: "Une erreur est survenue" 
      });
      console.error("Erreur détaillée:", _error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="w-full max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        {/* Barre d'actions */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dossiers
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Créer un dossier
            </button>
            
            {selectedDossiers.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEditModal(true)}
                  disabled={selectedDossiers.length !== 1}
                  className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors
                    ${selectedDossiers.length === 1 
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                >
                  <PencilIcon className="w-5 h-5 mr-2" />
                  Modifier
                </button>
                
                <button
                  onClick={() => {
                    if (window.confirm('Êtes-vous sûr de vouloir supprimer ces dossiers ?')) {
                      handleDeleteDossier(selectedDossiers[0]);
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <TrashBinIcon className="w-5 h-5 mr-2" />
                  Supprimer ({selectedDossiers.length})
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
                <h2 className="text-xl font-bold">Créer un nouveau dossier</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nom du dossier
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
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
                    Créer
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

        {/* Table des dossiers */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableCell isHeader>
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      const allIds = dossiers.map(d => d.id);
                      setSelectedDossiers(e.target.checked ? allIds : []);
                    }}
                    checked={selectedDossiers.length === dossiers.length && dossiers.length > 0}
                    className="rounded border-gray-300"
                  />
                </TableCell>
                <TableCell isHeader>Nom du dossier</TableCell>
                <TableCell isHeader>Description</TableCell>
                <TableCell isHeader>Date de création</TableCell>
                <TableCell isHeader>Dernière modification</TableCell>
                <TableCell isHeader>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dossiers.map((dossier) => (
                <TableRow key={dossier.id}>
                  <TableCell>
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
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell>{dossier.name}</TableCell>
                  <TableCell>{dossier.description}</TableCell>
                  <TableCell>{new Date(dossier.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(dossier.updated_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedDossiers([dossier.id]);
                          setShowEditModal(true);
                        }}
                        className="p-1 text-yellow-500 hover:text-yellow-600"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Êtes-vous sûr de vouloir supprimer ce dossier ?')) {
                            handleDeleteDossier(dossier.id);
                          }
                        }}
                        className="p-1 text-red-500 hover:text-red-600"
                      >
                        <TrashBinIcon className="w-5 h-5" />
                      </button>
                    </div>
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