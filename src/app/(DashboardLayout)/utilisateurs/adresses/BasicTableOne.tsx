"use client";

import React, { useEffect, useState, useMemo } from "react";
import Cookies from "js-cookie";

interface User {
  id: number;
  nom: string | null;
  prenom: string | null;
  email: string;
  adresse: string | null;
}

export default function AddressesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const token = Cookies.get('authTokens');
      if (!token) {
        setError("Non authentifié");
        setLoading(false);
        return;
      }

      const accessToken = JSON.parse(token).access;
      try {
        const response = await fetch("https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-gestion/list-all-users/", {
          headers: {
            "Authorization": `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) throw new Error(`Erreur HTTP: ${response.status}`);

        const data = await response.json();
        setUsers(data.utilisateurs || []);
      } catch (error) {
        setError("Impossible de charger les utilisateurs.");
        console.error("Erreur lors du fetch utilisateurs :", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase();
    return users.filter(u =>
      (u.nom?.toLowerCase().includes(searchLower) ?? false) ||
      (u.prenom?.toLowerCase().includes(searchLower) ?? false) ||
      (u.email?.toLowerCase().includes(searchLower) ?? false) ||
      (u.adresse?.toLowerCase().includes(searchLower) ?? false)
    );
  }, [users, search]);

  const itemsPerPage = 10;
  const total = filtered.length;
  const [page, setPage] = useState(1);
  const start = (page - 1) * itemsPerPage;
  const end = Math.min(start + itemsPerPage, total);
  const paginated = filtered.slice(start, end);
  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-green-600 mb-2">
            <i className="fas fa-address-book mr-2"></i>Adresses des Utilisateurs
          </h1>
          <p className="text-gray-600">Gestion et visualisation des adresses enregistrées</p>
        </header>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
              <input
                type="text"
                placeholder="Rechercher une adresse, ville ou utilisateur..."
                className="search-input pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:border-green-500 transition"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="hidden md:grid grid-cols-12 bg-gray-100 p-4 font-semibold text-gray-700 border-b">
            <div className="col-span-4">Utilisateur</div>
            <div className="col-span-6">Adresse</div>
            <div className="col-span-2">Email</div>
          </div>
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-8 text-center text-gray-400">Chargement...</div>
            ) : paginated.length === 0 ? (
              <div className="p-8 text-center text-gray-400">Aucun utilisateur trouvé</div>
            ) : (
              paginated.map(user => (
                <div
                  key={user.id}
                  className="md:grid grid-cols-12 p-4 hover:bg-green-50 transition items-center"
                >
                  <div className="col-span-4 font-semibold">
                    {user.prenom ?? ""} {user.nom ?? ""}
                  </div>
                  <div className="col-span-6">
                    {user.adresse ? (
                      <span
                        className="inline-block bg-green-100 border border-green-400 text-green-800 px-4 py-2 rounded-lg shadow-sm font-bold text-lg tracking-wide"
                        style={{
                          letterSpacing: "0.04em",
                          boxShadow: "0 2px 8px 0 rgba(16,185,129,0.10)",
                        }}
                      >
                        {user.adresse}
                      </span>
                    ) : (
                      <span className="text-gray-400">Aucune</span>
                    )}
                  </div>
                  <div className="col-span-2 text-sm text-gray-500">{user.email}</div>
                </div>
              ))
            )}
          </div>
          <div className="flex justify-between items-center p-4 border-t">
            <div className="text-sm text-gray-600">
              Affichage <span>{start + 1}</span>-<span>{end}</span> sur <span>{total}</span>
            </div>
            <div className="flex gap-1">
              <button
                className="pagination-btn px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              {[...Array(totalPages).keys()].slice(0, 5).map(i => (
                <button
                  key={i}
                  className={`pagination-btn px-3 py-1 border rounded ${page === i + 1 ? "bg-green-500 text-white" : "hover:bg-green-500 hover:text-white"}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              {totalPages > 5 && <span className="px-3 py-1">...</span>}
              {totalPages > 5 && (
                <button
                  className={`pagination-btn px-3 py-1 border rounded ${page === totalPages ? "bg-green-500 text-white" : "hover:bg-green-500 hover:text-white"}`}
                  onClick={() => setPage(totalPages)}
                >
                  {totalPages}
                </button>
              )}
              <button
                className="pagination-btn px-3 py-1 border rounded hover:bg-green-500 hover:text-white"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
        {error && (
          <div className="fixed top-4 right-4 bg-red-600 text-white p-4 rounded">{error}</div>
        )}
      </div>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      <style>{`
        .search-input:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
        }
        .pagination-btn:hover:not(.disabled) {
          background-color: #10b981;
          color: white;
        }
      `}</style>
    </div>
  );
}
