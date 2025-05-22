"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, TrashBinIcon, UserIcon } from "@/icons";
import Cookies from 'js-cookie';
import Link from 'next/link';

interface Function {
  id: number;
  name: string;
  description: string;
  department: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

export default function FunctionsPage() {
  const handleAddFunction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newFunction = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      department: formData.get("department") as string,
    };

    try {
      const token = Cookies.get('authTokens');
      if (!token) {
        setNotification({ type: "error", message: "Non authentifié" });
        return;
      }

      const accessToken = JSON.parse(token).access;
      const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/services/functions/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(newFunction),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const createdFunction = await response.json();
      setFunctions((prev) => [...prev, createdFunction]);
      setNotification({ type: "success", message: "Fonction ajoutée avec succès" });
      setShowAddModal(false);
    } catch (error) {
      console.error("Erreur lors de l'ajout de la fonction:", error);
      setNotification({ type: "error", message: "Impossible d'ajouter la fonction." });
    }
  };
  const [functions, setFunctions] = useState<Function[]>([]);

  const handleDeleteFunctions = async (functionIds: number[]) => {
    try {
      const token = Cookies.get('authTokens');
      if (!token) {
        setNotification({ type: "error", message: "Non authentifié" });
        return;
      }

      const accessToken = JSON.parse(token).access;
      for (const id of functionIds) {
        const response = await fetch(`https://www.backend.lnb-intranet.globalitnet.org/services/functions/${id}/`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
      }

      setFunctions((prev) => prev.filter((func) => !functionIds.includes(func.id)));
      setNotification({ type: "success", message: "Fonctions supprimées avec succès" });
    } catch (error) {
      console.error("Erreur lors de la suppression des fonctions:", error);
      setNotification({ type: "error", message: "Impossible de supprimer les fonctions." });
    }
  };
  const [_error, setError] = useState<string | null>(null);
  const [selectedFunctions, setSelectedFunctions] = useState<number[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [_notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Charger les fonctions
  useEffect(() => {
    async function fetchFunctions() {
      const token = Cookies.get('authTokens');
      if (!token) {
        console.error("Token d'accès introuvable");
        setError("Non authentifié");
        return;
      }

      const accessToken = JSON.parse(token).access;
      console.log("Token d'accès trouvé. Tentative de récupération des fonctions...");
      try {
        const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/services/functions/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log("Fonctions récupérées avec succès:", data.functions);
        setFunctions(data.functions);
      } catch (error) {
        console.error("Erreur lors de la récupération des fonctions:", error);
        setError("Impossible de charger les fonctions.");
      }
    }

    fetchFunctions();
  }, []);

  const filteredFunctions = functions.filter(func => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      (func?.name?.toLowerCase()?.includes(searchLower) ?? false) ||
      (func?.description?.toLowerCase()?.includes(searchLower) ?? false)
    );
  });

  return (
    <div>
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full">
          {/* Barre d'actions */}
          <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Fonctions
              </h1>
              
              {/* Barre de recherche */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher une fonction..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <UserIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                <Link href="/function/create/"> Nouvelle fonction</Link>
              </button>
              
              {selectedFunctions.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (window.confirm('Êtes-vous sûr de vouloir supprimer ces fonctions ?')) {
                        handleDeleteFunctions(selectedFunctions);
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <TrashBinIcon className="w-5 h-5 mr-2" />
                    Supprimer ({selectedFunctions.length})
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
                  <h2 className="text-xl font-bold">Nouvelle fonction</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleAddFunction} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Nom de la fonction
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Département
                    </label>
                    <select
                      name="department"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md"
                      required
                    >
                      <option value="">Sélectionner un département</option>
                      {/* Ajoutez vos options de département ici */}
                    </select>
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

          {/* Table modifiée */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableCell isHeader className="w-10">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        const allIds = functions.map(f => f.id);
                        setSelectedFunctions(e.target.checked ? allIds : []);
                      }}
                      checked={selectedFunctions.length === functions.length && functions.length > 0}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    ID
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Nom
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Description
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Département
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Date de création
                  </TableCell>
                  <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {filteredFunctions.map((func) => (
                  <TableRow key={func.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedFunctions.includes(func.id)}
                        onChange={() => {
                          const isSelected = selectedFunctions.includes(func.id);
                          setSelectedFunctions(
                            isSelected
                              ? selectedFunctions.filter(id => id !== func.id)
                              : [...selectedFunctions, func.id]
                          );
                        }}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">{func.id}</TableCell>
                    <TableCell className="px-5 py-4 text-start">{func.name || "Sans nom"}</TableCell>
                    <TableCell className="px-5 py-4 text-start" data-tip={func.description || ""}>
                      {func.description 
                        ? (func.description.length > 20 ? `${func.description.substring(0, 20)}...` : func.description)
                        : "Aucune description"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      {func.department && func.department.name ? func.department.name : "Non assigné"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      {func.created_at ? new Date(func.created_at).toLocaleString() : "Date inconnue"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-start">
                      <div className="flex items-center gap-2">
                        <Link href={`/function/${func.id}`}>
                          <button 
                            className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="Voir les détails"
                          >
                            <svg 
                              className="w-5 h-5" 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                              />
                              <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" 
                              />
                            </svg>
                          </button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}