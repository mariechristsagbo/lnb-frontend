"use client";

import React, { useEffect, useState } from "react";
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, PencilIcon, TrashBinIcon, UserIcon } from "@/icons";
import Cookies from 'js-cookie';

interface Responsable {
  id: number;
  username: string;
  email: string;
}

interface Department {
  id: number;
  name: string;
  description: string;
  responsable: Responsable | string | null;
  functions: string[];
  services: string[];
  created_at: string;
  updated_at: string;
}

export default function DepartmentsPage() {
  const handleDeleteDepartments = async (departmentIds: number[]) => {
    const token = Cookies.get('authTokens');
    if (!token) {
      console.error("Token d'accès introuvable");
      setError("Non authentifié");
      return;
    }

    const accessToken = JSON.parse(token).access;
    try {
      const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/services/departments/", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ ids: departmentIds }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      setDepartments((prev) => prev.filter((d) => !departmentIds.includes(d.id)));
      setNotification({ type: "success", message: "Départements supprimés avec succès." });
    } catch (error) {
      console.error("Erreur lors de la suppression des départements:", error);
      setNotification({ type: "error", message: "Impossible de supprimer les départements." });
    }
  };
  const [departments, setDepartments] = useState<Department[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [, setShowEditModal] = useState(false);

  useEffect(() => {
    async function fetchDepartments() {
      const token = Cookies.get('authTokens');
      if (!token) {
        console.error("Token d'accès introuvable");
        setError("Non authentifié");
        return;
      }

      const accessToken = JSON.parse(token).access;
      console.log("Token d'accès trouvé. Tentative de récupération des départements...");
      try {
        const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/services/departments/", {
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
        console.log("Départements récupérés avec succès:", data.departments);
        setDepartments(data.departments);
      } catch (error) {
        console.error("Erreur lors de la récupération des départements:", error);
        setError("Impossible de charger les départements.");
      }
    }

    fetchDepartments();
  }, []);

  const filteredDepartments = departments.filter(department => {
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = department.name?.toLowerCase()?.includes(searchLower) || false;
    const descMatch = department.description?.toLowerCase()?.includes(searchLower) || false;
    return nameMatch || descMatch;
  });

  return (
    <div>
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full">
          {/* Barre d'actions */}
          <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Départements
              </h1>
              
              {/* Barre de recherche */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher un département..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <UserIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                <Link href="/departement/adddepartement">Nouveau département</Link>
              </button>
              
              {selectedDepartments.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowEditModal(true)}
                    disabled={selectedDepartments.length !== 1}
                    className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors
                      ${selectedDepartments.length === 1 
                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                  >
                    <PencilIcon className="w-5 h-5 mr-2" />
                    Modifier
                  </button>
                  
                  <button
                    onClick={() => {
                      if (window.confirm('Êtes-vous sûr de vouloir supprimer ces départements ?')) {
                        handleDeleteDepartments(selectedDepartments);
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <TrashBinIcon className="w-5 h-5 mr-2" />
                    Supprimer ({selectedDepartments.length})
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Notifications */}
          {error && (
            <div className="mb-4 p-4 text-white bg-red-600 rounded-md text-center">
              {error}
            </div>
          )}
          {notification && (
            <div
              className={`mb-4 p-4 rounded-md text-center ${
                notification.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
              }`}
            >
              {notification.message}
            </div>
          )}

          {/* Table modifiée */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] w-full">
            <div className="w-full overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="w-10">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          const allIds = departments.map(d => d.id);
                          setSelectedDepartments(e.target.checked ? allIds : []);
                        }}
                        checked={selectedDepartments.length === departments.length && departments.length > 0}
                        className="rounded border-gray-300"
                      />
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Nom
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Description
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Responsable
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Fonctions
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Services
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
                  {filteredDepartments.map((department) => (
                    <TableRow key={department.id}>
                      <TableCell className="px-5 py-4">
                        <input
                          type="checkbox"
                          checked={selectedDepartments.includes(department.id)}
                          onChange={() => {
                            const isSelected = selectedDepartments.includes(department.id);
                            setSelectedDepartments(
                              isSelected
                                ? selectedDepartments.filter(id => id !== department.id)
                                : [...selectedDepartments, department.id]
                            );
                          }}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">{department.name || "Sans nom"}</TableCell>
                      <TableCell className="px-5 py-4 text-start" data-tip={department.description || ""}>
                        {department.description && department.description.length > 20 
                          ? `${department.description.substring(0, 20)}...` 
                          : department.description || "Aucune description"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        {typeof department.responsable === "object" && department.responsable !== null 
                          ? department.responsable.username 
                          : department.responsable || "N/A"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start" data-tip={Array.isArray(department.functions) ? department.functions.join(", ") : ""}>
                        {Array.isArray(department.functions) && department.functions.length > 0
                          ? (department.functions.join(", ").length > 20 
                             ? `${department.functions.join(", ").substring(0, 20)}...` 
                             : department.functions.join(", "))
                          : "Aucune fonction"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start" data-tip={Array.isArray(department.services) ? department.services.join(", ") : ""}>
                        {Array.isArray(department.services) && department.services.length > 0
                          ? (department.services.join(", ").length > 20 
                             ? `${department.services.join(", ").substring(0, 20)}...` 
                             : department.services.join(", "))
                          : "Aucun service"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        {department.created_at ? new Date(department.created_at).toLocaleString() : "Date inconnue"}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <div className="flex items-center gap-2">
                          <Link href={`/departement/detailsdepartement/${department.id}`}>
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
    </div>
  );
}