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
import { PlusIcon, PencilIcon, TrashBinIcon, UserIcon as SearchIcon } from "@/icons";
import Cookies from 'js-cookie';

interface Service {
  id: number;
  name: string;
  description: string;
  department: {
    id: number;
    name: string;
  } | null;
  function: {
    id: number;
    name: string;
  } | null;
  chef: {
    id: number;
    username: string;
  } | null;
  created_by: {
    id: number;
    username: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export default function ServicesPage() {
  const handleDeleteServices = async (serviceIds: number[]) => {
    const token = Cookies.get('authTokens');
    if (!token) {
      console.error("Token d'accès introuvable");
      setError("Non authentifié");
      return;
    }

    const accessToken = JSON.parse(token).access;
    try {
      const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/services/delete-services/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ service_ids: serviceIds }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      setServices((prevServices) =>
        prevServices.filter((service) => !serviceIds.includes(service.id))
      );
      setNotification({ type: "success", message: "Services supprimés avec succès." });
    } catch (error) {
      console.error("Erreur lors de la suppression des services:", error);
      setNotification({ type: "error", message: "Impossible de supprimer les services." });
    }
  };
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [_showAddModal, setShowAddModal] = useState(false);
  const [_showEditModal, setShowEditModal] = useState(false);
  const [_notification, setNotification] = useState<{ 
    type: "success" | "error"; 
    message: string 
  } | null>(null);

  // Charger les services
  useEffect(() => {
    async function fetchServices() {
      const token = Cookies.get('authTokens');
      if (!token) {
        console.error("Token d'accès introuvable");
        setError("Non authentifié");
        return;
      }

      const accessToken = JSON.parse(token).access;
      console.log("Token d'accès trouvé. Tentative de récupération des services...");
      try {
        const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/services/list-services/", {
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
        console.log("Services récupérés avec succès:", data.services);
        setServices(data.services);
      } catch (error) {
        console.error("Erreur lors de la récupération des services:", error);
        setError("Impossible de charger les services.");
      }
    }

    fetchServices();
  }, []);

  const filteredServices = services.filter(service => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      (service?.name?.toLowerCase()?.includes(searchLower) ?? false) ||
      (service?.description?.toLowerCase()?.includes(searchLower) ?? false)
    );
  });

  return (
    <div>
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full text-center">
          {error && (
            <div className="mb-4 p-4 text-white bg-red-600 rounded-md">
              {error}
            </div>
          )}
          <div className="flex flex-col gap-4 mb-6">
            {/* Barre d'actions principale */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Services
                </h1>
                
                {/* Barre de recherche */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Rechercher un service..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  <Link href="/services/addservice/"> Nouveau service </Link>
                </button>
                
                {selectedServices.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowEditModal(true)}
                      disabled={selectedServices.length !== 1}
                      className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors
                        ${selectedServices.length === 1 
                          ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                    >
                      <PencilIcon className="w-5 h-5 mr-2" />
                      Modifier
                    </button>
                    
                    <button
                      onClick={() => {
                        if (window.confirm('Êtes-vous sûr de vouloir supprimer ces services ?')) {
                          handleDeleteServices(selectedServices);
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <TrashBinIcon className="w-5 h-5 mr-2" />
                      Supprimer ({selectedServices.length})
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] w-full">
            <div className="w-full overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="w-10">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          const allIds = services.map(s => s.id);
                          setSelectedServices(e.target.checked ? allIds : []);
                        }}
                        checked={selectedServices.length === services.length && services.length > 0}
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
                      Fonction
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Chef
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Créé par
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
                  {filteredServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedServices.includes(service.id)}
                          onChange={() => {
                            const isSelected = selectedServices.includes(service.id);
                            setSelectedServices(
                              isSelected
                                ? selectedServices.filter(id => id !== service.id)
                                : [...selectedServices, service.id]
                            );
                          }}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">{service.id}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{service.name}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{service.description}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{service.department ? service.department.name : "Vide"}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{service.function ? service.function.name : "Vide"}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{service.chef ? service.chef.username : "Vide"}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{service.created_by ? service.created_by.username : "Vide"}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{new Date(service.created_at).toLocaleString()}</TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <div className="flex items-center gap-2">
                          <Link href={`/services/${service.id}`}>
                            <button 
                              className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
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