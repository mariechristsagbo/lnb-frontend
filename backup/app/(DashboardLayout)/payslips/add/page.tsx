"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ComponentCard from "@/components/common/ComponentCard";
import Cookies from "js-cookie";

interface User {
  id: number;
  nom: string;
  prenom: string;
  username: string;
}

type FileFormat = 'pdf' | 'excel' | 'word' | 'txt';

interface PayslipFormData {
  user_id: number;
  month: string;
  year: number;
  amount: number;
  file: File | null;
  format: FileFormat;
}

export default function AddPayslip() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState<PayslipFormData>({
    user_id: 0,
    month: "",
    year: new Date().getFullYear(),
    amount: 0,
    file: null,
    format: 'pdf'
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      const token = Cookies.get('authTokens');
      if (!token) {
        setError("Non authentifié");
        return;
      }

      try {
        const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/list-users/", {
          headers: {
            "Authorization": `Bearer ${JSON.parse(token).access}`,
          },
        });

        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);
        const data = await response.json();
        setUsers(data.utilisateurs || []);
      } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs:", error);
        setError("Impossible de charger la liste des utilisateurs");
      }
    };

    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const token = Cookies.get('authTokens');
    if (!token) {
      setError("Non authentifié");
      setIsLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('user_id', formData.user_id.toString());
      formDataToSend.append('month', formData.month);
      formDataToSend.append('year', formData.year.toString());
      formDataToSend.append('amount', formData.amount.toString());
      if (formData.file) {
        formDataToSend.append('file', formData.file);
      }

      const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/services/payslips/create/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${JSON.parse(token).access}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

      router.push("/payslips");
    } catch (error) {
      console.error("Erreur lors de la création de la fiche de paie:", error);
      setError("Erreur lors de la création de la fiche de paie");
    } finally {
      setIsLoading(false);
    }
  };

  const months = [
    { value: "01", label: "Janvier" },
    { value: "02", label: "Février" },
    { value: "03", label: "Mars" },
    { value: "04", label: "Avril" },
    { value: "05", label: "Mai" },
    { value: "06", label: "Juin" },
    { value: "07", label: "Juillet" },
    { value: "08", label: "Août" },
    { value: "09", label: "Septembre" },
    { value: "10", label: "Octobre" },
    { value: "11", label: "Novembre" },
    { value: "12", label: "Décembre" }
  ];

  const fileFormats = [
    { value: 'pdf', label: 'PDF', icon: '📄' },
    { value: 'excel', label: 'Excel', icon: '📊' },
    { value: 'word', label: 'Word', icon: '📝' },
    { value: 'txt', label: 'Texte', icon: '📋' }
  ];

  return (
    <div className="min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-2xl mx-auto">
        <ComponentCard title="Créer une nouvelle fiche de paie">
          {error && (
            <div className="mb-6 p-4 text-red-700 bg-red-100 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sélection de l'utilisateur */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Utilisateur *
              </label>
              <select
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: Number(e.target.value) })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="">Sélectionnez un utilisateur</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.prenom} {user.nom} ({user.username})
                  </option>
                ))}
              </select>
            </div>

            {/* Période */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Mois *
                </label>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
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
                  Année *
                </label>
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  required
                />
              </div>
            </div>

            {/* Montant */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Montant (FCFA) *
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>

            {/* Sélection du format */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Format du fichier *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {fileFormats.map((format) => (
                  <button
                    key={format.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, format: format.value as FileFormat })}
                    className={`p-4 border rounded-lg flex flex-col items-center justify-center gap-2 transition-all duration-200 ${
                      formData.format === format.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <span className="text-2xl">{format.icon}</span>
                    <span className="text-sm font-medium">{format.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={() => router.push("/payslips")}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isLoading ? "Création en cours..." : "Créer la fiche de paie"}
              </button>
            </div>
          </form>
        </ComponentCard>
      </div>
    </div>
  );
}