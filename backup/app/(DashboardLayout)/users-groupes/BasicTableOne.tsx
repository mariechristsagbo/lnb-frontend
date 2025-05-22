"use client";

import React, { useEffect, useState } from "react";
import Link from 'next/link';
import Image from 'next/image';  // Ajout de l'import
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusIcon, TrashBinIcon, UserIcon as SearchIcon, UserIcon, PencilIcon } from "@/icons";
import Cookies from 'js-cookie';

interface Group {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  bio: string;
  status: string;
  adresse: string;
  created_at: string;
  updated_at: string;
  photo: string;
  department: string;
  function: string;
  project: string;
  linked_groups: number[];
  members: number[];
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    async function fetchGroups() {
      const token = Cookies.get('authTokens');
      if (!token) {
        setError("Non authentifié");
        return;
      }

      const accessToken = JSON.parse(token).access;
      try {
        const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/utilisateurs_groupes/list-groups/", {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        
        const data = await response.json();
        // Assurez-vous que data est un tableau
        setGroups(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erreur lors de la récupération des groupes:", error);
        setError("Impossible de charger les groupes.");
        // En cas d'erreur, initialisez avec un tableau vide
        setGroups([]);
      }
    }

    fetchGroups();
  }, []);

  const handleDeleteGroups = async (groupIds: number[]) => {
    const token = Cookies.get('authTokens');
    if (!token) {
      setError("Non authentifié");
      return;
    }

    const accessToken = JSON.parse(token).access;
    try {
      // Supprimer chaque groupe individuellement
      await Promise.all(groupIds.map(id => 
        fetch(`https://www.backend.lnb-intranet.globalitnet.org/utilisateurs_groupes/delete-group/${id}/`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        })
      ));

      setGroups(prev => prev.filter(group => !groupIds.includes(group.id)));
      setNotification({ type: "success", message: "Groupes supprimés avec succès." });
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setNotification({ type: "error", message: "Impossible de supprimer les groupes." });
    }
  };

  const filteredGroups = Array.isArray(groups) ? groups.filter(group => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      group.name.toLowerCase().includes(searchLower) ||
      group.email.toLowerCase().includes(searchLower) ||
      group.department.toLowerCase().includes(searchLower)
    );
  }) : [];

  return (
    <div className="min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-lg px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 text-white bg-red-600 rounded-lg shadow-md text-center animate-fade-in">
            {error}
          </div>
        )}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg shadow-md text-center transition-all duration-300 ${
            notification.type === "success" 
              ? "bg-green-600 text-white" 
              : "bg-red-600 text-white"
          }`}>
            {notification.message}
          </div>
        )}

        {/* Barre d'actions */}
        <div className="mb-8 flex flex-wrap gap-6 items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Groupes
            </h1>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un groupe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-72 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
              />
              <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>

          <div className="flex gap-4">
            <Link href="/users-groupes/create">
              <button className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg">
                <PlusIcon className="w-5 h-5 mr-2" />
                Nouveau groupe
              </button>
            </Link>
            
            {selectedGroups.length > 0 && (
              <button
                onClick={() => handleDeleteGroups(selectedGroups)}
                className="inline-flex items-center px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <TrashBinIcon className="w-5 h-5 mr-2" />
                Supprimer ({selectedGroups.length})
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-md">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableCell isHeader className="w-10">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      const allIds = groups.map(g => g.id);
                      setSelectedGroups(e.target.checked ? allIds : []);
                    }}
                    checked={selectedGroups.length === groups.length && groups.length > 0}
                    className="rounded border-gray-300"
                  />
                </TableCell>
                <TableCell isHeader>Groupe</TableCell>
                <TableCell isHeader>Email</TableCell>
                <TableCell isHeader>Département</TableCell>
                <TableCell isHeader>Rôle</TableCell>
                <TableCell isHeader>Membres</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGroups.map((group) => (
                <TableRow 
                  key={group.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-150"
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(group.id)}
                      onChange={() => {
                        const isSelected = selectedGroups.includes(group.id);
                        setSelectedGroups(
                          isSelected
                            ? selectedGroups.filter(id => id !== group.id)
                            : [...selectedGroups, group.id]
                        );
                      }}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {group.photo ? (
                          <Image
                            src={group.photo}
                            alt={`Photo de ${group.name}`}
                            width={40}
                            height={40}
                            className="rounded-full ring-2 ring-gray-200 dark:ring-gray-700"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center ring-2 ring-gray-200 dark:ring-gray-700">
                            <UserIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {group.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Projet: {group.project || "Non assigné"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{group.email}</TableCell>
                  <TableCell>{group.department || "Non assigné"}</TableCell>
                  <TableCell>{group.role}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <UserIcon className="w-4 h-4 text-gray-400" />
                      <span>{group.members.length}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      group.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {group.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/users-groupes/${group.id}`}>
                        <button 
                          className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 hover:shadow-md"
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
                      <Link href={`/users-groupes/${group.id}/edit`}>
                        <button
                          className="p-2 text-green-600 hover:text-green-800 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-300 hover:shadow-md"
                          title="Modifier"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                      </Link>
                      {group.linked_groups.length > 0 && (
                        <button
                          className="p-2 text-purple-600 hover:text-purple-800 rounded-full hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-300 hover:shadow-md"
                          title="Voir les groupes liés"
                        >
                          <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.828 10.172a4 4 0 010 5.656m-3.656-3.656a4 4 0 015.656 0m-5.656 5.656a4 4 0 010-5.656m3.656 3.656a4 4 0 01-5.656 0"
                          />
                          </svg>
                        </button>
                      )}
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