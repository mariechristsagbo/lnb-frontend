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
import { PlusIcon, TrashBinIcon, UserIcon as SearchIcon } from "@/icons";
import Cookies from 'js-cookie';

interface Payslip {
  id: number;
  employee: string;
  month: string;
  year: number;
  amount: number;
  created_at: string;
  updated_at: string;
  file?: string;
}

export default function PayslipsPage() {
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayslips, setSelectedPayslips] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    async function fetchPayslips() {
      const token = Cookies.get('authTokens');
      if (!token) {
        setError("Non authentifié");
        return;
      }

      const accessToken = JSON.parse(token).access;
      try {
        const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/services/payslips/", {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        
        const data = await response.json();
        setPayslips(data);
      } catch (error) {
        console.error("Erreur lors de la récupération des fiches de paie:", error);
        setError("Impossible de charger les fiches de paie.");
      }
    }

    fetchPayslips();
  }, []);

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
      setNotification({ type: "success", message: "Fiches de paie supprimées avec succès." });
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setNotification({ type: "error", message: "Impossible de supprimer les fiches de paie." });
    }
  };

  const filteredPayslips = payslips.filter(payslip => {
    if (!searchQuery) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      payslip.employee.toLowerCase().includes(searchLower) ||
      payslip.month.toLowerCase().includes(searchLower) ||
      payslip.year.toString().includes(searchLower)
    );
  });

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
            notification.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}>
            {notification.message}
          </div>
        )}

        {/* Barre d'actions */}
        <div className="mb-8 flex flex-wrap gap-6 items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Fiches de paie
            </h1>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher une fiche de paie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-72 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
              />
              <SearchIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
          </div>

          <div className="flex gap-4">
            <Link href="/payslips/add">
              <button className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300 shadow-md hover:shadow-lg">
                <PlusIcon className="w-5 h-5 mr-2" />
                Nouvelle fiche de paie
              </button>
            </Link>
            
            {selectedPayslips.length > 0 && (
              <button
                onClick={() => handleDeletePayslips(selectedPayslips)}
                className="inline-flex items-center px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <TrashBinIcon className="w-5 h-5 mr-2" />
                Supprimer ({selectedPayslips.length})
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
                      const allIds = payslips.map(p => p.id);
                      setSelectedPayslips(e.target.checked ? allIds : []);
                    }}
                    checked={selectedPayslips.length === payslips.length && payslips.length > 0}
                    className="rounded border-gray-300"
                  />
                </TableCell>
                <TableCell isHeader>Utilisateur</TableCell>
                <TableCell isHeader>Mois</TableCell>
                <TableCell isHeader>Année</TableCell>
                <TableCell isHeader>Montant</TableCell>
                <TableCell isHeader>Date de création</TableCell>
                <TableCell isHeader>Actions</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayslips.map((payslip) => (
                <TableRow 
                  key={payslip.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors duration-150"
                >
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedPayslips.includes(payslip.id)}
                      onChange={() => {
                        const isSelected = selectedPayslips.includes(payslip.id);
                        setSelectedPayslips(
                          isSelected
                            ? selectedPayslips.filter(id => id !== payslip.id)
                            : [...selectedPayslips, payslip.id]
                        );
                      }}
                      className="rounded border-gray-300"
                    />
                  </TableCell>
                  <TableCell>{payslip.employee}</TableCell>
                  <TableCell>{payslip.month}</TableCell>
                  <TableCell>{payslip.year}</TableCell>
                  <TableCell>{payslip.amount.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</TableCell>
                  <TableCell>
                    {new Date(payslip.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {/* Bouton de détails */}
                      <Link href={`/payslips/${payslip.id}`}>
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

                      {/* Bouton de téléchargement */}
                      <button
                        onClick={async () => {
                          const token = Cookies.get('authTokens');
                          if (!token) {
                            setError("Non authentifié");
                            return;
                          }

                          try {
                            const response = await fetch(`https://www.backend.lnb-intranet.globalitnet.org/services/payslips/${payslip.id}/`, {
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
                        }}
                        className="p-2 text-green-600 hover:text-green-800 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-300 hover:shadow-md"
                        title="Télécharger la fiche de paie"
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
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>
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